use crate::cache::get::get_cache;
use crate::database::connect::{mongo_db_connection, SharedDatabases};
use crate::database::schemas::user_schema::{HourData, UserExternal};
use bincode;
use mongodb::bson::doc;
use mongodb::error::ErrorKind;
use mongodb::Collection;
use std::collections::HashMap;
use std::error::Error;
use std::ops::Deref;
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Emitter, Manager};

// Then refactor your sync_database function
pub(crate) async fn sync_database(app: AppHandle) -> Result<(), Box<dyn Error>> {
    // Access the shared databases
    let get_db = app.state::<SharedDatabases>();
    let db = get_db.deref();

    // Send event to splash screen that synchronization is starting
    app.emit("sync_event", "Synchronization in progress. Please do not close the app.")?;
    let db_clone = db.clone();

    // First, check if you are back online and can connect to MongoDB
    if db_clone.is_online.load(Ordering::SeqCst) {
        if let Some(mongo_db) = &db.mongo_db {
            let users = get_cache();  // Get cache (HashMap<String, UserExternal>)
            let mongo_db = mongo_db.lock().await;
            let mongo_db = mongo_db.clone().expect("Could not get a MongoDb instance");
            let mongo_db_lock = mongo_db.as_ref().read().await;
            let users_collection: Collection<UserExternal> = mongo_db_lock.collection("users_external");

            for (_name, user_external) in users {
                let sled_db = &db.sled_db;
                let sled_db_lock = sled_db.clone().unwrap();
                let db = sled_db_lock.lock().await; // Also lock the sled_db here

                let id = user_external.id.clone();

                match db.get(id.as_bytes()) {
                    Ok(Some(value)) => {


                        // Deserialize the data as HashMap<String, HourData> since it was serialized that way
                        let hour_data: HashMap<String, HourData> = bincode::deserialize(&value)
                            .map_err(|e| format!("Failed to deserialize hour_data: {}", e))?;

                        let filter = doc! {"id": &id};

                        // Synchronize the data in MongoDB
                        let user = users_collection.find_one(filter.clone()).await?;

                        let user = user.ok_or("User not found".to_string())?;

                        // Update the hour_data field only
                        let bson_hour_data = mongodb::bson::to_bson(&hour_data.clone()).map_err(|e| format!("Got error: {}", e.to_string()))?;

                        let update = doc! {"$set": {"hour_data":bson_hour_data}};

                        // Save the updated user back to MongoDB
                        let update_result = users_collection.update_one(
                            filter,
                            update,
                        ).await.map_err(|e| {
                            if let ErrorKind::Io(io_error) = *e.kind {
                                // Handle I/O error, potentially signaling offline mode
                                return format!("Failed to update the database due to I/O error: {}", io_error);
                            }
                            // Handle other errors
                            format!("Database error: {}", e)
                        });

                        if let Err(err_message) = update_result {
                            println!("Error: {}", err_message);
                            return Err(Box::from(err_message));
                        }

                        // After successful update, clean the sled database for this user
                        db.remove(id.as_bytes())?;
                        db.flush()?;
                        println!("Synchronized and cleaned data for user with id {}", id);
                    }
                    Ok(None) => {}
                    Err(e) => {
                        eprintln!("Error accessing Sled DB: {}", e);
                    }
                }
            }
        } else {
            // Create the MongoDB connection since there's none available
            let mongo_db = match mongo_db_connection().await {
                Ok(mongo) => {
                    // Wrap the newly created MongoDB connection in Arc<Mutex<SharedDatabase>>
                    Some(mongo)
                }
                Err(_) => {
                    println!("MongoDB connection failed, starting offline.");
                    None
                }
            };

            // If a new MongoDB connection was established, update db.mongo_db
            if let Some(new_mongo_db) = mongo_db {
                // Lock the current state of mongo_db and assign the new connection
                if let Some(existing_mongo_db) = &db.mongo_db {
                    let mut db_lock = existing_mongo_db.lock().await;
                    *db_lock = Option::from(new_mongo_db);
                }
            }

            // Call this function again since the database wasn't available.
            Box::pin(
                sync_database(app.clone())
            ).await.expect("Error: ")
        }
    } else {
        eprintln!("Still offline, skipping synchronization.");
    }

    // Send event to indicate that synchronization has finished
    app.emit("sync_event", "Synchronization completed successfully.")?;

    Ok(())
}

