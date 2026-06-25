use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, WebviewUrl, WebviewWindowBuilder,
};

/// 메인(풀화면) 설정 창을 열거나 포커스한다. 위젯의 ⚙ 버튼에서 호출.
#[tauri::command]
fn open_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
        return Ok(());
    }

    WebviewWindowBuilder::new(&app, "main", WebviewUrl::App("index.html".into()))
        .title("페이틱 · 설정")
        .inner_size(420.0, 720.0)
        .min_inner_size(360.0, 560.0)
        .resizable(true)
        .decorations(true)
        .always_on_top(false)
        .center()
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![open_settings_window])
        .setup(|app| {
            // 위젯 창을 모든 작업공간(스페이스)에 표시하고 확실히 띄운다
            if let Some(widget) = app.get_webview_window("widget") {
                let _ = widget.set_visible_on_all_workspaces(true);
                let _ = widget.set_always_on_top(true);
                let _ = widget.show();
                let _ = widget.set_focus();
            }

            // 트레이 메뉴: 위젯 표시 / 설정 / 종료
            let show_i = MenuItem::with_id(app, "show", "위젯 보이기", true, None::<&str>)?;
            let settings_i = MenuItem::with_id(app, "settings", "설정 열기", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &settings_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("페이틱 · 실시간 월급 카운터")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("widget") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "settings" => {
                        let _ = open_settings_window(app.clone());
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
