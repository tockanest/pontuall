use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use tokio::task;


use crate::cache::set::get_users_and_cache;
use crate::database::connect::create_db_connection;

pub(crate) struct SetupState {
    pub frontend_task: bool,
    pub backend_task: bool,
}

async fn setup(app: AppHandle) -> Result<(), ()> {
    let db_connection = create_db_connection().await.unwrap();
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


        // Check if webview main already exists
        if app.get_webview_window("main").is_none() {
            println!("Creating main window");
            // This creates the main window dynamically to prevent authentication issues.
            // If the main window gets created and there's no token, the app might just not work.
            WebviewWindowBuilder::new(&app, "main".to_string(), WebviewUrl::default())
                .title("PontuAll")
                .center()
                .maximized(true)
                .visible(true)
                .build()
                .unwrap_or_else(|e| panic!("Error: {}", e));
        } else {
            // If the main window already exists, just show it
            let main_window = app.get_webview_window("main").unwrap();
            main_window.maximize().unwrap();
            main_window.center().unwrap();
            main_window.show().unwrap();
        }

        let splash_window = app.get_webview_window("splashscreen").unwrap_or_else(|| {
            panic!("Could not find the splashscreen window");
        });
        splash_window.close().unwrap();
    }

    Ok(())
}
