// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![warn(unused_extern_crates)]
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};
use tauri::Manager;

use crate::acr122u::tauri_commands::{
    cancel_read, cancel_write, connect_reader, get_connection, read_card, write_card, ReadState,
    WriteState,
};
use crate::cache::get::get_cache;
use crate::cache::insert::{gen_id, insert_new_user};
use crate::cache::update::update_cache_hour_data;
use crate::database::tauri_commands::{check_permission, user_login};
use crate::excel::create::create_excel_relatory;
use crate::misc::get::version_name;
use crate::misc::set_db_uri::insert_uri;
use crate::misc::setup::{complete_setup, SetupState};
use crate::misc::token::verify;

mod acr122u;
mod cache;
mod database;
mod excel;
mod misc;

fn main() {
    let cancel_flag = Arc::new(AtomicBool::new(false));
    let read_in_progress = Arc::new(Mutex::new(false));
    let read_state = Arc::new(ReadState {
        cancel_flag,
        read_in_progress,
    });

    let write_state_cancel_flag = Arc::new(AtomicBool::new(false));
    let write_state = Arc::new(WriteState {
        cancel_flag: write_state_cancel_flag,
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let windows = app.webview_windows();

            windows
                .values()
                .next()
                .expect("Sorry, no window found")
                .set_focus()
                .expect("Can't Bring Window to Focus");
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .manage(read_state)
        .manage(write_state)
        .manage(Mutex::new(SetupState {
            frontend_task: false,
            backend_task: false,
        }))
        .invoke_handler(tauri::generate_handler![
            // NFC READER
            connect_reader,
            read_card,
            write_card,
            cancel_write,
            cancel_read,
            get_connection,
            // Local Cache
            gen_id,
            get_cache,
            insert_new_user,
            update_cache_hour_data,
            // Setup / System related
            complete_setup,
            insert_uri,
            version_name,
            // Relatories
            create_excel_relatory,
            // Login
            user_login,
            verify,
            // Permissions
            check_permission
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
