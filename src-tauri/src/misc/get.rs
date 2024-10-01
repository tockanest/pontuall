#[tauri::command]
pub(crate) fn version_name(version: String) -> String {
    match version {
        version if version == "0.1.0" => "Yttrium".to_string(),
        _ => "noname".to_string(),
    }
}
