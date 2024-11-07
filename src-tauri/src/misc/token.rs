use crate::database::connect::SharedDatabases;
use crate::database::helpers::set_app_connection::set_offline;
use crate::database::schemas::user_schema::InternalUserSchema;
use crate::misc::get::version_name;
use base64::{engine::general_purpose, Engine as _};
use hmac::{Hmac, Mac};
use mongodb::bson::doc;
use mongodb::Collection;
use sha2::Sha256;
use std::ops::Deref;
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Manager};

type HmacSha256 = Hmac<Sha256>;

#[tauri::command]
pub(crate) async fn verify(token: String, app: AppHandle) -> Result<InternalUserSchema, String> {
    // Separate the token into its parts, they are separated by a dot
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err("Invalid token".to_string());
    }

    // Get the id, timestamp, and signature
    let id = general_purpose::STANDARD.decode(parts[0])
        .unwrap()
        .into_iter()
        .map(char::from)
        .collect::<String>();
    let timestamp = parts[1];
    let signature = parts[2];

    // Timestamp comparison (3 days = 259200 seconds)
    let compare = chrono::Utc::now().timestamp() - timestamp.parse::<i64>().unwrap();
    if compare > 259200 {
        return Err("Token expired".to_string());
    }

    let version_name = version_name(app.package_info().version.to_string());
    // Construct the message for verification
    let message = format!(
        "{}{}{}{}{}",
        id,
        timestamp,
        app.package_info().version,
        version_name.clone(),
        version_name
    );

    // Compute the HMAC of the message
    let mut mac = HmacSha256::new_from_slice(b"PontuAll-c8542b78884cc588788c293ed46abd3a").unwrap();
    mac.update(message.as_bytes());

    let signature_bytes =
        hex::decode(signature).map_err(|_| "Failed to decode signature".to_string())?;

    // Verify the signature
    match mac.verify_slice(&signature_bytes) {
        Ok(_) => {
            // Signature verification succeeded
            // Fetch and return the user schema from the database
            let db_connection = app.state::<SharedDatabases>();
            let db = db_connection.deref();

            if db.is_online.load(Ordering::SeqCst) {
                // Attempt to connect to MongoDB
                match db.mongo_db {
                    Some(ref get_mongo_db) => {
                        let get_mongo_db = get_mongo_db.lock().await;
                        let mongo_db = get_mongo_db.clone().expect("Could not get a MongoDb instance");
                        let mongo_db = mongo_db.read().await;
                        let collection: Collection<InternalUserSchema> = mongo_db.collection("users_internal");

                        match collection.find_one(doc! {"id": &id}).await {
                            Ok(Some(user)) => Ok(user),
                            Ok(None) => Err("User not found".to_string()),
                            Err(_) => {
                                // If MongoDB query fails, set app to offline and return error
                                set_offline(app.clone()).await;
                                Err("Database error. App is now offline.".to_string())
                            }
                        }
                    }
                    None => {
                        set_offline(app.clone()).await;
                        Err("Failed to connect to MongoDB. App is now offline.".to_string())
                    }
                }
            } else {
                Err("App is currently offline.".to_string())
            }
        }
        Err(_) => Err("Signature verification failed".to_string()),
    }
}


