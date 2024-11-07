use std::collections::HashMap;

use crate::database::schemas::user_schema::UserExternal;

#[tauri::command]
pub(crate) fn get_cache() -> HashMap<String, UserExternal> {
    let mut cache_path = dirs::cache_dir();

    if let Some(ref mut cache_path) = cache_path {
        cache_path.push("PontuAll/cache/users");
        cache_path.push("users.json");

        if cache_path.exists() {
            let users_json = std::fs::read_to_string(cache_path).unwrap();
            let users_map: HashMap<String, UserExternal> =
                serde_json::from_str(&users_json).unwrap();
            users_map
        } else {
            HashMap::new()
        }
    } else {
        panic!("Failed to get cache path");
    }
}

#[cfg(test)]
mod tests {
    use crate::cache::get::get_cache;

    #[test]
    fn test_get_cache() {
        let cache = get_cache();
        println!("{:?}", cache);
    }
}
