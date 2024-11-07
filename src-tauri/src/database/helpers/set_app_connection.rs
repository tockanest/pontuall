use crate::database::connect::SharedDatabases;
use std::ops::Deref;
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Emitter, Manager};

pub(crate) async fn set_offline(app: AppHandle) {
    let db_connection = app.state::<SharedDatabases>();
    let db = db_connection.deref().clone();  // Clone for safety

    // Set the `is_online` flag to false in a thread-safe manner
    db.is_online.store(false, Ordering::SeqCst);  // Atomic operation to set the flag

    app.manage(db);  // Re-manage the updated state

    app.emit("status:offline", true).unwrap();  // Notify frontend
}