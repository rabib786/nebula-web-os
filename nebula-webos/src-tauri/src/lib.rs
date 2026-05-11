// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let minimize = CustomMenuItem::new("minimize".to_string(), "Minimize");
    let maximize = CustomMenuItem::new("maximize".to_string(), "Maximize/Restore");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let window_menu = Menu::new().add_submenu(Submenu::new(
        "Window",
        Menu::new()
            .add_native_item(MenuItem::Minimize)
            .add_native_item(MenuItem::Zoom)
            .add_item(maximize.clone())
            .add_item(quit.clone()),
    ));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .menu(window_menu)
        .on_menu_event(|event| {
            let window = event.window();
            match event.menu_item_id() {
                "minimize" => {
                    let _ = window.minimize();
                }
                "maximize" => {
                    let is_maximized = window.is_maximized().unwrap_or(false);
                    if is_maximized {
                        let _ = window.unmaximize();
                    } else {
                        let _ = window.maximize();
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
