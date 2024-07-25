// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{Arc, Mutex};
use std::sync::atomic::AtomicBool;

use tauri::{AppHandle, Emitter, Manager, State};
use tauri::async_runtime::spawn;
use tokio::task;
use tokio::time::{Duration, sleep};

use crate::acr122u::tauri_commands::{cancel_read, connect_reader, get_connection, read_card, ReadState};
use crate::cache::get::get_cache;
use crate::cache::set::get_users_and_cache;
use crate::database::connect::create_db_connection;

mod acr122u;
mod database;
mod cache;

struct SetupState {
    frontend_task: bool,
    backend_task: bool,
}

async fn setup(app: AppHandle) -> Result<(), ()> {
    sleep(Duration::from_secs(5)).await;
    let db_connection = create_db_connection("mongodb://localhost:27017").await.unwrap();

    let splash_window = app.get_webview_window("splashscreen").unwrap();
    println!("Emitting 'database' progress"); // Add debug log
    splash_window.emit("splashscreen:progress", ("database", true)).unwrap();

    get_users_and_cache(db_connection).await;
    println!("Emitting 'cache' progress"); // Add debug log
    splash_window.emit("splashscreen:progress", ("cache", true)).unwrap();

    sleep(Duration::from_secs(2)).await;
    splash_window.emit("splashscreen:progress", ("finish", true)).unwrap();

    sleep(Duration::from_secs(3)).await;

    // Use a blocking task if `complete_setup` or its parameters are not `Send`
    task::spawn_blocking(move || {
        let runtime = tokio::runtime::Runtime::new().unwrap();
        runtime.block_on(complete_setup(
            app.clone(),
            app.state::<Mutex<SetupState>>(),
            "finish_backend".to_string(),
        ))
    }).await.unwrap().unwrap();

    Ok(())
}

#[tauri::command]
async fn complete_setup(
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

fn main() {
    let cancel_flag = Arc::new(AtomicBool::new(false));
    let read_in_progress = Arc::new(std::sync::Mutex::new(false));
    let read_state = Arc::new(ReadState {
        cancel_flag,
        read_in_progress,
    });

    tauri::Builder::default()
        .plugin(
            tauri_plugin_stronghold::Builder::new(|password| {
                // Hash the password here with e.g. argon2, blake2b or any other secure algorithm
                // Here is an example implementation using the `rust-argon2` crate for hashing the password
                use argon2::{Config, hash_raw, Variant, Version};
                use rand::Rng;

                let mut rng = rand::thread_rng();

                let config = Config {
                    lanes: 4,
                    mem_cost: 10_000,
                    time_cost: 10,
                    variant: Variant::Argon2id,
                    version: Version::Version13,
                    ..Default::default()
                };
                let salt: Vec<u8> = (0..16).map(|_| rng.gen()).collect();
                let key =
                    hash_raw(password.as_ref(), &salt, &config).expect("failed to hash password");

                key.to_vec()
            })
                .build(),
        )
        .manage(read_state)
        .manage(Mutex::new(SetupState {
            frontend_task: false,
            backend_task: false,
        }))
        .invoke_handler(tauri::generate_handler![
            connect_reader,
            read_card,
            cancel_read,
            get_connection,
            get_cache
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
