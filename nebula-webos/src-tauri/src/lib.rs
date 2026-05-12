// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn browser_go_back(app: tauri::AppHandle) {
    if let Some(webview) = app.get_webview_window("browser-view") {
        let _ = webview.eval("window.history.back()");
    }
}

#[tauri::command]
fn browser_go_forward(app: tauri::AppHandle) {
    if let Some(webview) = app.get_webview_window("browser-view") {
        let _ = webview.eval("window.history.forward()");
    }
}

#[tauri::command]
fn browser_reload(app: tauri::AppHandle) {
    if let Some(webview) = app.get_webview_window("browser-view") {
        let _ = webview.eval("window.location.reload()");
    }
}

#[tauri::command]
fn browser_navigate(app: tauri::AppHandle, url: String) {
    if let Some(webview) = app.get_webview_window("browser-view") {
        let js = format!("window.location.href = '{}'", url);
        let _ = webview.eval(&js);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/1.sql"),
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            SqlBuilder::default()
                .add_migrations("sqlite:nebula.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            greet,
            browser_go_back,
            browser_go_forward,
            browser_reload,
            browser_navigate
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
