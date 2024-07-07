// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

mod commands;
mod config;
mod state;

use commands::*;


fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            connect,
            get_screen,
            get_tasks,
            run_task,
            get_deploy_analyze_result,
            reload_resources,
            start_battle_analyzer,
            get_connected,
            disconnected,
            get_copilots,
            run_copilot,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
