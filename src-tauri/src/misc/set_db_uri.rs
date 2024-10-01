use keyring::Entry;

#[tauri::command]
pub(crate) fn insert_uri(uri: String) -> Result<(), String> {
    let entry = Entry::new("PontuAll", "mongodb_uri")
        .unwrap_or_else(|e| panic!("Error: {}", e));
    // Insert the uri into the keyring
    entry.set_password(uri.as_str())
        .unwrap_or_else(|e| panic!("Error: {}", e));

    Ok(())
}


// Test
#[cfg(test)]
mod tests {
    use crate::misc::set_db_uri::insert_uri;

    #[test]
    fn test_insert_uri() {
        let uri = "mongodb://localhost:27017".to_string();
        assert_eq!(insert_uri(uri), Ok(()));
    }
}