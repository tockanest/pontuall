use crate::database::connect::SharedDatabase;
use crate::database::schemas::user_schema::InternalUserSchema;
use crate::misc::get::version_name;
use base64::{engine::general_purpose, Engine as _};
use hmac::{Hmac, Mac};
use mongodb::bson::doc;
use mongodb::Collection;
use sha2::Sha256;
use std::ops::Deref;

use tauri::{AppHandle, Manager};

type HmacSha256 = Hmac<Sha256>;

#[tauri::command]
pub(crate) async fn verify(token: String, app: AppHandle) -> Result<InternalUserSchema, String> {
    // Separate the token into its parts, they are separated by a dot
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err("Invalid token".to_string());
    }

    // Get the id, timestamp, and signature
    let id = general_purpose::STANDARD.decode(parts[0])
        .unwrap()
        .into_iter()
        .map(char::from)
        .collect::<String>();
    let timestamp = parts[1];
    let signature = parts[2];

    // Timestamp was made using "chrono::Utc::now().timestamp()", we'll use it to compare if 3 days have passed, and if they did, reset the token
    let compare = chrono::Utc::now().timestamp() - timestamp.parse::<i64>().unwrap();

    if compare > 259200 {
        return Err("Token expired".to_string());
    }

    let version_name = version_name(app.package_info().version.to_string());
    // Construct the message for verification
    let message = format!(
        "{}{}{}{}{}",
        id,
        timestamp,
        app.package_info().version,
        version_name.clone(),
        version_name
    );

    // Compute the HMAC of the message
    let mut mac = HmacSha256::new_from_slice(b"PontuAll-c8542b78884cc588788c293ed46abd3a").unwrap();
    mac.update(message.as_bytes());

    let signature_bytes =
        hex::decode(signature).map_err(|_| "Failed to decode signature".to_string())?;

    // Verify the signature
    match mac.verify_slice(&signature_bytes) {
        Ok(_) => {
            // Signature verification succeeded
            // Proceed to fetch and return the user schema from the database
            let db_connection = app.state::<SharedDatabase>();
            let db = db_connection.deref().read().await;
            let collection: Collection<InternalUserSchema> = db.collection("users_internal");

            let user = collection.find_one(doc! {"id": id}).await.unwrap();
            match user {
                Some(user) => Ok(user),
                None => Err("User not found".to_string()),
            }
        }
        Err(_) => Err("Signature verification failed".to_string()),
    }
}
