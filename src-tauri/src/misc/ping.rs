use crate::database::connect::SharedDatabases;
use crate::database::sync::sync_database;
use std::ops::Deref;
use std::sync::atomic::Ordering;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::sleep;

// Function to ping the domain and return if successful or not
async fn ping_domain() -> Result<(), String> {
    let client = reqwest::Client::new();
    let response = client.get("https://example.com") // Change this to your preferred domain
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    if response.status().is_success() {
        Ok(())
    } else {
        Err(format!("Failed to ping domain: received status {}", response.status()))
    }
}

// Loop that checks if the app is online
pub(crate) async fn check_connection_loop(app: AppHandle) {
    let get_db = app.state::<SharedDatabases>();
    let db = get_db.deref();

    loop {
        // Check the `is_online` flag
        if !db.is_online.load(Ordering::SeqCst) {
            println!("Offline: Checking for connection...");

            let mut success = false;

            // Retry pinging for up to 1 minute (12 attempts every 5 seconds)
            for _ in 0..12 {
                match ping_domain().await {
                    Ok(_) => {
                        success = true;
                        break;
                    }
                    Err(e) => {
                        println!("Ping failed: {}", e);
                        // Wait for 5 seconds before retrying
                        sleep(Duration::from_secs(5)).await;
                    }
                }
            }

            // If ping succeeds, emit the event to trigger sync
            if success {
                println!("Connection restored. Triggering synchronization.");

                // Emit sync event to frontend
                app.emit("sync_event", "Synchronization in progress. Please do not close the app.")
                    .expect("Failed to send event");

                db.is_online.store(true, Ordering::SeqCst);

                // Call your sync_database function to sync data
                if let Err(e) = sync_database(app.clone()).await {
                    println!("Error during synchronization: {}", e);
                }
            } else {
                println!("Failed to reconnect after 1 minute of attempts.");
            }
        }

        // Sleep for some time before checking again (e.g., 1 minute)
        sleep(Duration::from_secs(60)).await;
    }
}
