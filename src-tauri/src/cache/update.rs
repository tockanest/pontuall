use std::collections::HashMap;
use std::str::FromStr;

use mongodb::bson::doc;
use mongodb::Collection;

use crate::database::connect::SharedDatabase;
use crate::database::schemas::user_schema::{HourData, UserExternal};

/// This function should not be called if there isn't a cache file.
/// First use the "set" module to create the cache file and populate it.
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
            let mut users_map: HashMap<String, UserExternal> = serde_json::from_str(&users_json).unwrap_or_else(|_| {
                HashMap::new()
            });
            let db = db.read().await;
            let collection: Collection<UserExternal> = db.collection("users_external");

            if key_to_update == "hour_data" {
                return Err("Please use the update_cache_hour_data function to update the hour data".to_string());
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
                _ => return Err("Invalid key to update".to_string())
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

enum UpdateKey {
    ClockIn,
    ClockLunch,
    ClockOut,
}

impl FromStr for UpdateKey {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "clock_in" => Ok(UpdateKey::ClockIn),
            "clock_lunch" => Ok(UpdateKey::ClockLunch),
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
pub(crate) async fn update_cache_hour_data(
    db: SharedDatabase,
    id: String,
    day: String,
    key_to_update: UpdateKey,
    value: String,
) -> Result<(), String> {
    let mut cache_path = dirs::cache_dir();

    if let Some(ref mut cache_path) = cache_path {
        cache_path.push("PontuAll/cache/users");
        cache_path.push("users.json");

        if cache_path.exists() {
            let users_json = std::fs::read_to_string(&cache_path).unwrap();
            let mut users_map: HashMap<String, UserExternal> = serde_json::from_str(&users_json).unwrap();
            let db = db.read().await;
            let collection: Collection<UserExternal> = db.collection("users_external");

            let user_option = users_map.iter_mut().find(|(_, user)| user.id == id);
            let user = match user_option {
                Some((_, user)) => user,
                None => return Err("User not found".to_string()),
            };

            let hour_data = user.hour_data.as_mut().unwrap();

            let day_option = hour_data.iter_mut().find(|(day_key, _)| day_key.contains(&day));
            return match day_option {
                Some((_, day_data)) => {
                    // Update existing day data
                    match key_to_update {
                        UpdateKey::ClockIn => day_data.clock_in = value,
                        UpdateKey::ClockLunch => day_data.lunch_break = value,
                        UpdateKey::ClockOut => day_data.clocked_out = value,
                    }

                    let filter = doc! { "id": id };
                    let bson_hour_data = mongodb::bson::to_bson(&hour_data).unwrap();
                    let update = doc! { "$set": { "hour_data": bson_hour_data } };

                    let _ = collection.update_one(filter, update).await.unwrap();

                    let users_json = serde_json::to_string(&users_map).unwrap();
                    std::fs::write(cache_path, users_json).unwrap();

                    Ok(())
                }
                None => {
                    // Insert new day data
                    let hour_data = user.hour_data.as_mut().unwrap();
                    let mut new_hour_data = HourData {
                        clock_in: "00:00".to_string(),
                        lunch_break: "00:00".to_string(),
                        clocked_out: "00:00".to_string(),
                        total_hours: "00:00".to_string(),
                    };

                    match key_to_update {
                        UpdateKey::ClockIn => new_hour_data.clock_in = value,
                        UpdateKey::ClockLunch => new_hour_data.lunch_break = value,
                        UpdateKey::ClockOut => new_hour_data.clocked_out = value,
                    }

                    hour_data.insert(day, new_hour_data);

                    let filter = doc! { "id": id };
                    let bson_hour_data = mongodb::bson::to_bson(&hour_data).unwrap();
                    let update = doc! { "$set": { "hour_data": bson_hour_data } };

                    let _ = collection.update_one(filter, update).await.unwrap();

                    let users_json = serde_json::to_string(&users_map).unwrap();
                    std::fs::write(cache_path, users_json).unwrap();

                    Ok(())
                }
            };
        } else {
            Err("Cache file not found".to_string())
        }
    } else {
        Err("Failed to get cache path".to_string())
    }
}

#[cfg(test)]
mod tests {
    use crate::cache::update::{update_cache_by_id, update_cache_hour_data, UpdateKey};
    use crate::database::connect::create_db_connection;

    #[tokio::test]
    async fn test_update_cache_by_id() {
        let db = create_db_connection("mongodb://localhost:27017").await.unwrap();
        let id = "c720dcda-6f70-4c42-8fb2-cd25482d8d75".to_string(); // I don't know who you are, Hilary Oxtoby, but I hope you're okay
        let key_to_update = "role".to_string();
        let value = "System Admin".to_string();

        let result = update_cache_by_id(db, id, key_to_update, value).await;
        assert_eq!(result, Ok(()));
    }

    #[tokio::test]
    async fn test_update_cache_hour_data() {
        let db = create_db_connection("mongodb://localhost:27017").await.unwrap();
        let id = "c720dcda-6f70-4c42-8fb2-cd25482d8d75".to_string();
        let day = "25/07/2024".to_string();
        let key_to_update = UpdateKey::ClockLunch;
        let value = "13:00".to_string();

        let result = update_cache_hour_data(db, id, day, key_to_update, value).await;
        assert_eq!(result, Ok(()));
    }
}
