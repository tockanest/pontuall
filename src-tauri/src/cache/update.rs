use std::collections::HashMap;
use std::ops::Deref;
use std::str::FromStr;

use crate::database::connect::SharedDatabase;
use crate::database::schemas::user_schema::{HourData, UserExternal};
use mongodb::bson::doc;
use mongodb::Collection;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

/// This function should not be called if there isn't a cache file.
/// First use the "set" module to create the cache file and populate it.
///
/// Updates the cache for a user by their ID.
///
/// # Arguments
///
/// * `db` - A shared database connection.
/// * `id` - The ID of the user to update.
/// * `key_to_update` - The key to update in the user's data.
/// * `value` - The new value for the specified key.
///
/// # Returns
///
/// * `Result<(), String>` - Returns `Ok(())` if the update is successful, otherwise returns an error message.
pub(crate) async fn update_cache_by_id(
    db: SharedDatabase,
    id: String,
    key_to_update: String,
    value: String,
) -> Result<(), String> {
    let mut cache_path = dirs::cache_dir();

    if let Some(ref mut cache_path) = cache_path {
        cache_path.push("PontuAll/cache/users");
        cache_path.push("users.json");

        if cache_path.exists() {
            let users_json = std::fs::read_to_string(&cache_path).unwrap();
            let mut users_map: HashMap<String, UserExternal> =
                serde_json::from_str(&users_json).unwrap_or_else(|_| HashMap::new());
            let db = db.read().await;
            let collection: Collection<UserExternal> = db.collection("users_external");

            if key_to_update == "hour_data" {
                return Err(
                    "Please use the update_cache_hour_data function to update the hour data"
                        .to_string(),
                );
            }

            let user_option = users_map.iter_mut().find(|(_, user)| user.id == id);

            let user = match user_option {
                Some((_, user)) => user,
                None => return Err("User not found".to_string()),
            };
            match key_to_update.as_str() {
                "name" => user.name = value.clone(),
                "email" => user.email = Some(value.clone()),
                "image" => user.image = Some(value.clone()),
                "role" => user.role = value.clone(),
                "status" => user.status = Some(value.clone()),
                _ => return Err("Invalid key to update".to_string()),
            }

            let filter = doc! { "id": id };
            let update = doc! { "$set": { key_to_update: &value } };

            let _ = collection.update_one(filter, update).await.unwrap();

            let users_json = serde_json::to_string(&users_map).unwrap();
            std::fs::write(cache_path, users_json).unwrap();

            Ok(())
        } else {
            Err("Cache file not found".to_string())
        }
    } else {
        Err("Failed to get cache path".to_string())
    }
}

/// Enum representing the keys that can be updated in the hour data.
#[derive(Serialize, Deserialize)]
pub(crate) enum UpdateKey {
    ClockIn,
    ClockLunchOut,
    ClockLunchReturn,
    ClockOut,
}

impl FromStr for UpdateKey {
    type Err = ();

    /// Converts a string to an `UpdateKey` enum.
    ///
    /// # Arguments
    ///
    /// * `s` - The string to convert.
    ///
    /// # Returns
    ///
    /// * `Result<UpdateKey, ()>` - Returns the corresponding `UpdateKey` enum or an error if the string is invalid.
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

/// This function should not be called if there isn't a cache file.
/// First use the "set" module to create the cache file and populate it.
/// This function updates the hour data of a user.
/// If the day is not set on DB or cache, it will be created.
/// To prevent double entries, we're updating the cache file and the database together.
///
/// Updates the hour data for a user by their ID and day.
///
/// # Arguments
///
/// * `db` - A shared database connection.
/// * `id` - The ID of the user to update.
/// * `day` - The day to update in "dd/mm/yyyy" format.
/// * `key_to_update` - The key to update in the hour data.
/// * `value` - The new value for the specified key.
///
/// # Returns
///
/// * `Result<(), String>` - Returns `Ok(())` if the update is successful, otherwise returns an error message.
#[tauri::command]
pub(crate) async fn update_cache_hour_data(
    app: AppHandle,
    id: String,
    day: String,
    key_to_update: UpdateKey,
    value: String,
) -> Result<bool, String> {
    let mut cache_path = dirs::cache_dir();

    if let Some(ref mut cache_path) = cache_path {
        cache_path.push("PontuAll/cache/users");
        cache_path.push("users.json");

        if cache_path.exists() {
            let users_json = std::fs::read_to_string(&cache_path).unwrap();
            let mut users_map: HashMap<String, UserExternal> =
                serde_json::from_str(&users_json).unwrap();
            let db_connection = app.state::<SharedDatabase>();
            let db = db_connection.deref().read().await;

            let collection: Collection<UserExternal> = db.collection("users_external");

            let user_option = users_map.iter_mut().find(|(_, user)| user.id == id);
            let user = match user_option {
                Some((_, user)) => user,
                None => return Err("User not found".to_string()),
            };

            let hour_data = user.hour_data.as_mut().unwrap();

            let day_option = hour_data
                .iter_mut()
                .find(|(day_key, _)| day_key.contains(&day));
            match day_option {
                Some((_, day_data)) => {
                    // Update existing day data
                    match key_to_update {
                        UpdateKey::ClockIn => day_data.clock_in = value,
                        UpdateKey::ClockLunchOut => day_data.lunch_break_out = value,
                        UpdateKey::ClockLunchReturn => day_data.lunch_break_return = value,
                        UpdateKey::ClockOut => day_data.clocked_out = value,
                    }

                    let filter = doc! { "id": id };
                    let bson_hour_data = mongodb::bson::to_bson(&hour_data).unwrap();
                    let update = doc! { "$set": { "hour_data": bson_hour_data } };

                    let _ = collection.update_one(filter, update).await.unwrap();

                    let users_json = serde_json::to_string(&users_map).unwrap();
                    std::fs::write(cache_path, users_json).unwrap();

                    Ok(true)
                }
                None => {
                    // Insert new day data
                    let hour_data = user.hour_data.as_mut().unwrap();
                    let mut new_hour_data = HourData {
                        clock_in: "N/A".to_string(),
                        lunch_break_out: "N/A".to_string(),
                        lunch_break_return: "N/A".to_string(),
                        clocked_out: "N/A".to_string(),
                        total_hours: "N/A".to_string(),
                    };

                    match key_to_update {
                        UpdateKey::ClockIn => new_hour_data.clock_in = value,
                        UpdateKey::ClockLunchOut => new_hour_data.lunch_break_out = value,
                        UpdateKey::ClockLunchReturn => new_hour_data.lunch_break_return = value,
                        UpdateKey::ClockOut => new_hour_data.clocked_out = value,
                    }

                    hour_data.insert(day, new_hour_data);

                    let filter = doc! { "id": id };
                    let bson_hour_data = mongodb::bson::to_bson(&hour_data).unwrap();
                    let update = doc! { "$set": { "hour_data": bson_hour_data } };

                    let _ = collection.update_one(filter, update).await.unwrap();

                    let users_json = serde_json::to_string(&users_map).unwrap();
                    std::fs::write(cache_path, users_json).unwrap();

                    Ok(true)
                }
            }
        } else {
            Err("Cache file not found".to_string())
        }
    } else {
        Err("Failed to get cache path".to_string())
    }
}
