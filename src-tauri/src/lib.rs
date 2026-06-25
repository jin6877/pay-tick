use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            // 위젯 창을 모든 작업공간(스페이스)에 표시하고 확실히 띄운다
            if let Some(widget) = app.get_webview_window("widget") {
                let _ = widget.set_visible_on_all_workspaces(true);
                let _ = widget.set_always_on_top(true);
                let _ = widget.show();
                let _ = widget.set_focus();
            }

            // 트레이 메뉴: 위젯 보이기 / 종료
            // (설정은 위젯 안에서 ⚙ 버튼으로 인라인 진입 -> 별도 창을 만들지 않아 멀티윈도우 버그 없음)
            let show_i = MenuItem::with_id(app, "show", "위젯 보이기", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

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
