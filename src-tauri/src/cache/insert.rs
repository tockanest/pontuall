use futures::AsyncReadExt;
use mongodb::Collection;
use rand::{distributions::Alphanumeric, Rng};
use std::collections::HashMap;
use std::ops::Deref;
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Manager};

use crate::database::connect::SharedDatabases;
use crate::database::schemas::user_schema::{
    InternalUserSchema, PermissionsBitField, UserExternal, WorkerData,
};

#[tauri::command]
pub(crate) async fn insert_new_user(
    app: AppHandle,
    id: String,
    name: String,
    email: Option<String>,
    role: String,
    lunch_time: String,
    permissions_str: String,
    phone: Option<String>,
) -> Result<bool, String> {
    let mut cache_path = dirs::cache_dir();

    let permissions: PermissionsBitField = permissions_str
        .parse()
        .map_err(|_| "Invalid permissions string".to_string())?;

    if let Some(ref mut cache_path) = cache_path {
        cache_path.push("PontuAll/cache/users");
        cache_path.push("users.json");

        if cache_path.exists() {
            let users_json = std::fs::read_to_string(&cache_path).unwrap();
            let mut users_map: HashMap<String, UserExternal> =
                serde_json::from_str(&users_json).unwrap_or_else(|_| HashMap::new());
            let get_db_connection = app.state::<SharedDatabases>();
            let db_connection = get_db_connection.deref();

            let db_clone = db_connection.clone();

            if db_clone.is_online.load(Ordering::SeqCst) {
                let get_db = db_clone.mongo_db.unwrap();
                let get_db = get_db.lock().await;
                let mongo_db = get_db.clone().expect("Could not get a MongoDb instance");
                let db = mongo_db.read().await;
                let collection: Collection<UserExternal> = db.collection("users_external");

                // Search if there is already a user with the same email or id
                let user_option = users_map
                    .iter_mut()
                    .find(|(_, user)| user.email == email || user.id == id);

                if user_option.is_some() {
                    return Err("User already exists".to_string());
                }

                let user = UserExternal {
                    id: id.clone(),
                    name,
                    email,
                    role,
                    lunch_time: Some(lunch_time),
                    image: None,
                    status: None,
                    hour_data: Option::from(HashMap::new()),
                };

                collection.insert_one(user.clone()).await.unwrap();
                users_map.insert(user.name.clone(), user.clone());

                let users_json = serde_json::to_string(&users_map).unwrap();
                std::fs::write(cache_path, users_json).unwrap();

                let worker_data: WorkerData = WorkerData {
                    name: user.name,
                    role: user.role,
                    email: user.email,
                    phone,
                    permissions,
                };

                let internal_user: InternalUserSchema = InternalUserSchema {
                    id: id.clone(),
                    username: worker_data.clone().name,
                    password: id,
                    registered_at: chrono::Utc::now().to_string(),
                    worker_data,
                };

                let collection: Collection<InternalUserSchema> = db.collection("users_internal");
                collection.insert_one(internal_user).await.unwrap();

                Ok(true)
            } else {
                // Will always return false since there's no way to login into an offline app.
                Ok(false)
            }
        } else {
            Err("Cache file not found".to_string())
        }
    } else {
        Err("Failed to get cache path".to_string())
    }
}

#[tauri::command]
pub(crate) fn gen_id() -> String {
    let id: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(16)
        .map(char::from)
        .collect();
    id
}
