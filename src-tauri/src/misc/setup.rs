use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager, State, Wry};
use tauri_plugin_store::{with_store, StoreCollection};
use tokio::task;
use tokio::time::sleep;

use crate::cache::set::get_users_and_cache;
use crate::database::connect::create_db_connection;

pub(crate) struct SetupState {
    pub frontend_task: bool,
    pub backend_task: bool,
}

async fn setup(app: AppHandle) -> Result<(), ()> {
    let app_clone = app.clone();
    let stores = app_clone.state::<StoreCollection<Wry>>();

    // Path is: %APPDATA%/Roaming/PontuAll/config.cfg
    let path = dirs::config_dir().unwrap().join("PontuAll/config.cfg");
    let mongo_db_uri = with_store(app.clone(), stores, path, |store| {
        let uri = store.get("mongo_uri").unwrap().clone();
        Ok(uri)
    })
    .unwrap_or_else(|_| {
        panic!("Failed to get MongoDB URI from config file");
    });

    let db_connection = create_db_connection(mongo_db_uri.as_str().unwrap())
        .await
        .unwrap();
    app.manage(db_connection.clone());

    let splash_window = app.get_webview_window("splashscreen").unwrap();
    app.emit("splashscreen:progress", ("database", true))
        .unwrap();

    get_users_and_cache(db_connection).await;
    splash_window
        .emit("splashscreen:progress", ("cache", true))
        .unwrap();

    splash_window
        .emit("splashscreen:progress", ("finish", true))
        .unwrap();

    // Use a blocking task if `complete_setup` or its parameters are not `Send`
    task::spawn_blocking(move || {
        let runtime = tokio::runtime::Runtime::new().unwrap();
        runtime.block_on(complete_setup(
            app.clone(),
            app.state::<Mutex<SetupState>>(),
            "finish_backend".to_string(),
        ))
    })
    .await
    .unwrap()?;

    Ok(())
}

#[tauri::command]
pub(crate) async fn complete_setup(
    app: AppHandle,
    state: State<'_, Mutex<SetupState>>,
    task: String,
) -> Result<(), ()> {
    let mut state_lock = state.lock().unwrap();

    match task.as_str() {
        "finish_frontend" => {
            state_lock.frontend_task = true;

            // Start the backend setup using tokio::spawn
            task::spawn(setup(app.clone()));
        }
        "finish_backend" => {
            state_lock.backend_task = true;
        }
        _ => {}
    }

    if state_lock.backend_task && state_lock.frontend_task {
        let splash_window = app.get_webview_window("splashscreen").unwrap();
        let main_window = app.get_webview_window("main").unwrap();
        splash_window.close().unwrap();
        main_window.show().unwrap();
    }

    Ok(())
}
