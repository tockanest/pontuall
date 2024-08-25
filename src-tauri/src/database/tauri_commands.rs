use argon2::PasswordVerifier;
use hmac::{Hmac, Mac};
use mongodb::bson::doc;
use mongodb::Collection;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::Sha256;
use std::ops::Deref;
use std::str::FromStr;
use tauri::{AppHandle, Manager};

use crate::database::connect::SharedDatabase;
use crate::database::schemas::permission_verify::{PermissionAction, PermissionChecker};
use crate::database::schemas::user_schema::{InternalUserSchema, Permissions, PermissionsBitField};
use crate::misc::get::version_name;

/**
FILE NOTE:

This file contains the Tauri commands that are used to generate a login token and return the user log-in
status to the front-end.

This is intended to be used only when using the local database.
This will be refactored later to use the server-side authentication.

 */

#[tauri::command]
pub(crate) async fn user_login(
    email: String,
    password: String,
    app: AppHandle,
) -> Result<Value, String> {
    let db_connection = app.state::<SharedDatabase>();
    let db = db_connection.deref().read().await;
    let collection: Collection<InternalUserSchema> = db.collection("users_internal");

    let user = collection
        .find_one(doc! {"worker_data.email": email})
        .await
        .unwrap();
    if let Some(user) = user {
        if user.password == user.id && user.password == password {
            let version = &app.package_info().version;
            let named_version = version_name(version.to_string());
            let token = generate_token(
                user.clone().id,
                version.to_string(),
                named_version.clone(),
                named_version.to_string(),
            );

            // frontend expects: {user, token, message, code}
            Ok(json!({
                "user": user,
                "token": token,
                "message": "Login successful",
                "code": "200+718"
            }))
        } else if user.password != user.id {
            let parsed_hash = argon2::PasswordHash::new(&user.password).unwrap();
            let check = argon2::Argon2::default()
                .verify_password(password.as_ref(), &parsed_hash)
                .is_ok();

            if check {
                let version = &app.package_info().version;
                let named_version = version_name(version.to_string());
                let token = generate_token(
                    user.clone().id,
                    version.to_string(),
                    named_version.clone(),
                    named_version.to_string(),
                );

                // frontend expects: {user, token, message, code}
                Ok(json!({
                    "user": user,
                    "token": token,
                    "message": "Login successful",
                    "code": "200+718"
                }))
            } else {
                Err("Invalid password".to_string())
            }
        } else {
            Err("Invalid password".to_string())
        }
    } else {
        Err("User not found".to_string())
    }
}

type HmacSha256 = Hmac<Sha256>;

fn generate_token(
    user_id: String,
    app_version: String,
    version_name: String,
    version_signature: String,
) -> String {
    let timestamp = chrono::Utc::now().timestamp();

    // Convert id to numeric string
    let id = base64::encode(user_id.clone().as_bytes());

    // This is not the best way of doing this, we should not hard-code the secret
    // but since this is local, it's fine for now.
    // Will add support later to use the same password the user uses for stronghold
    let mut mac = HmacSha256::new_from_slice(b"PontuAll-c8542b78884cc588788c293ed46abd3a").unwrap();

    let message = format!(
        "{}{}{}{}{}",
        user_id.clone(),
        timestamp.clone(),
        app_version,
        version_name,
        version_signature
    );

    mac.update(message.as_bytes());

    let result = mac.finalize().into_bytes();
    // format the result to a string
    let hmac_string = result
        .iter()
        .map(|b| format!("{:02x}", b))
        .collect::<String>();
    let token = format!("{}.{}.{}", id, timestamp, hmac_string);
    token
}

#[tauri::command]
pub(crate) async fn check_permission(
    id: String,
    action: String,
    app: AppHandle,
) -> Result<bool, String> {
    // Convert the action string to an Action enum variant
    let action = PermissionAction::from_str(&action).map_err(|_| "Invalid action".to_string())?;

    // Convert the permissions string to PermissionsBitField
    let db_connection = app.state::<SharedDatabase>();
    let db = db_connection.deref().read().await;
    let collection: Collection<InternalUserSchema> = db.collection("users_internal");

    let user = collection.find_one(doc! {"id": id}).await.unwrap();
    let user = user.ok_or("User not found".to_string())?;

    let user_permissions = user.worker_data.permissions;

    // Perform the permission check
    let has_permission = PermissionChecker::check_permission(user_permissions, action);

    Ok(has_permission)
}
