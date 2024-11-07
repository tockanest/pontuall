use crate::database::connect::SharedDatabases;
use crate::database::helpers::set_app_connection::set_offline;
use crate::database::schemas::user_schema::{HourData, UserExternal};
use mongodb::bson::doc;
use mongodb::error::ErrorKind;
use mongodb::Collection;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::ops::Deref;
use std::str::FromStr;
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize)]
pub(crate) enum UpdateKey {
    ClockIn,
    ClockLunchOut,
    ClockLunchReturn,
    ClockOut,
}

impl FromStr for UpdateKey {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "clock_in" => Ok(UpdateKey::ClockIn),
            "clock_lunch_out" => Ok(UpdateKey::ClockLunchOut),
            "clock_lunch_return" => Ok(UpdateKey::ClockLunchReturn),
            "clock_out" => Ok(UpdateKey::ClockOut),
            _ => Err(()),
        }
    }
}

#[tauri::command]
pub(crate) async fn update_cache_hour_data(
    app: AppHandle,
    id: String,
    day: String,
    key_to_update: UpdateKey,
    value: String,
) -> Result<bool, String> {
    let cache_path = get_cache_path()?;
    let mut users_map = load_users_cache(&cache_path)?;
    let db_connection = app.state::<SharedDatabases>();
    let db = db_connection.deref();
    println!("id: {}", id);
    let user = get_user(&mut users_map, &id)?;
    let hour_data = user.hour_data.as_mut().ok_or("Hour data not found")?;

    let day_data = hour_data.entry(day.clone()).or_insert_with(|| {
        HourData {
            clock_in: "N/A".to_string(),
            lunch_break_out: "N/A".to_string(),
            lunch_break_return: "N/A".to_string(),
            clocked_out: "N/A".to_string(),
            total_hours: "N/A".to_string(),
        }
    });

    update_hour_data(day_data, key_to_update, value.clone());

    if db.is_online.load(Ordering::SeqCst) {
        update_mongo_db(app.clone(), db, &id, hour_data).await?;
    } else {
        update_sled_db(db, &id, hour_data).await?;
    }

    save_users_cache(&cache_path, &users_map)?;

    Ok(true)
}

fn get_cache_path() -> Result<std::path::PathBuf, String> {
    let mut cache_path = dirs::cache_dir().ok_or("Failed to get cache path")?;
    cache_path.push("PontuAll/cache/users/users.json");
    Ok(cache_path)
}

fn load_users_cache(cache_path: &std::path::PathBuf) -> Result<HashMap<String, UserExternal>, String> {
    let users_json = std::fs::read_to_string(cache_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&users_json).map_err(|e| e.to_string())
}

fn get_user<'a>(
    users_map: &'a mut HashMap<String, UserExternal>,
    id: &str,
) -> Result<&'a mut UserExternal, String> {
    // Iterate over the mutable reference to users_map
    users_map.iter_mut()
        .find(|(_, user)| user.id == id) // Search for user by its internal `id`
        .map(|(_, user)| user)           // Map result to mutable user reference
        .ok_or_else(|| "User not found".to_string()) // Return error if user not found
}

fn update_hour_data(day_data: &mut HourData, key_to_update: UpdateKey, value: String) {
    match key_to_update {
        UpdateKey::ClockIn => day_data.clock_in = value,
        UpdateKey::ClockLunchOut => day_data.lunch_break_out = value,
        UpdateKey::ClockLunchReturn => day_data.lunch_break_return = value,
        UpdateKey::ClockOut => day_data.clocked_out = value,
    }
}

async fn update_mongo_db(
    app: AppHandle,
    db: &SharedDatabases,
    id: &str,
    hour_data: &HashMap<String, HourData>,
) -> Result<(), String> {
    let filter = doc! { "id": id };
    let bson_hour_data = mongodb::bson::to_bson(hour_data).map_err(|e| e.to_string())?;
    let update = doc! { "$set": { "hour_data": bson_hour_data } };

    let get_db = db.mongo_db.as_ref().ok_or("MongoDB connection unavailable")?;
    let get_db = get_db.lock().await;
    let mongo_db = get_db.clone().expect("Could not get a MongoDb instance");
    let mongo_db = mongo_db.read().await;

    let collection: Collection<UserExternal> = mongo_db.collection("users_external");

    let result = collection.update_one(filter, update).await.map_err(|e| {
        if let ErrorKind::Io(io_error) = *e.kind {
            // Handle I/O error, potentially signaling offline mode
            return format!("Failed to update the database due to I/O error: {}", io_error);
        }
        // Handle other errors
        format!("Database error: {}", e)
    });

    if let Err(err_message) = result {
        set_offline(app.clone()).await;
        return Err(err_message);
    }

    Ok(())
}


async fn update_sled_db(db: &SharedDatabases, id: &str, hour_data: &HashMap<String, HourData>) -> Result<(), String> {
    let sled_db = db.sled_db.as_ref().ok_or("Sled database unavailable")?;
    let serialized_user_data = bincode::serialize(hour_data).map_err(|e| format!("Failed to serialize user data: {}", e))?;

    let db_mutex = sled_db.lock().await;
    db_mutex.insert(id.as_bytes(), serialized_user_data).map_err(|e| e.to_string())?;
    db_mutex.flush().map_err(|e| e.to_string())?;
    Ok(())
}

fn save_users_cache(cache_path: &std::path::PathBuf, users_map: &HashMap<String, UserExternal>) -> Result<(), String> {
    let users_json = serde_json::to_string(users_map).map_err(|e| e.to_string())?;
    std::fs::write(cache_path, users_json).map_err(|e| e.to_string())?;
    Ok(())
}
