use std::collections::HashMap;

use futures::StreamExt;
use mongodb::bson::doc;
use mongodb::Collection;


use crate::database::connect::SharedDatabase;
use crate::database::schemas::user_schema::UserExternal;

// Import StreamExt for async iteration

/// Caches user data by serializing it to JSON and writing it to a file.
///
/// # Arguments
///
/// * `users` - A vector of `UserExternal` objects to be cached.
///
/// # Returns
///
/// * `Result<(), Box<dyn std::error::Error>>` - Returns `Ok(())` if the caching is successful, otherwise returns an error.
fn cache_users(users: Vec<UserExternal>) -> Result<(), Box<dyn std::error::Error>> {
    let mut users_map = HashMap::new();
    for user in users {
        users_map.insert(user.name.clone(), user);
    }

    let users_json = serde_json::to_string(&users_map)?;
    let mut cache_path = dirs::cache_dir();

    if let Some(ref mut cache_path) = cache_path {
        cache_path.push("PontuAll/cache/users");
        std::fs::create_dir_all(&cache_path)?;
        cache_path.push("users.json");
        std::fs::write(cache_path, users_json)?;
    }

    Ok(())
}

/// Retrieves user data from the database and caches it.
///
/// # Arguments
///
/// * `db` - A shared database connection.
///
/// # Returns
///
/// * `()` - This function does not return a value.
pub(crate) async fn get_users_and_cache(db: SharedDatabase) {
    let db = db.read().await;
    let collection: Collection<UserExternal> = db.collection("users_external");

    let cursor = collection
        .find(doc! {})
        .await
        .expect("Failed to execute find");

    let users: Vec<UserExternal> = cursor
        .map(|doc| {
            let doc: UserExternal = doc.unwrap();
            doc
        })
        .collect()
        .await;

    cache_users(users).unwrap();
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use futures::StreamExt;
    use mongodb::bson::doc;
    use mongodb::{bson, Collection};
    use rand::distributions::Alphanumeric;
    use rand::prelude::ThreadRng;
    use rand::{thread_rng, Rng};
    use serde_json::json;
    use tauri::utils::config::parse::parse_json;
    use uuid::Uuid;

    use crate::cache::set::cache_users;
    use crate::database::connect::create_db_connection;
    use crate::database::schemas::user_schema::{HourData, UserExternal};

    /// Generates random hour data for testing purposes.
    ///
    /// # Arguments
    ///
    /// * `rng` - A mutable reference to a random number generator.
    ///
    /// # Returns
    ///
    /// * `HourData` - A struct containing randomly generated hour data.
    fn generate_random_hour_data(rng: &mut impl Rng) -> HourData {
        let mut rng_clone = rng; // Clone the RNG for local use

        // Helper function to generate random time strings
        fn random_time(rng: &mut impl Rng) -> String {
            let hour: u8 = rng.gen_range(9..18);
            let minute: u8 = rng.gen_range(0..60);
            format!("{:02}:{:02}", hour, minute)
        }

        // Generate random total hours worked as a string
        fn random_total_hours(rng: &mut impl Rng) -> String {
            let hours: u8 = rng.gen_range(1..10);
            let minutes: u8 = rng.gen_range(0..60);
            format!("{}:{:02}", hours, minutes)
        }

        HourData {
            clock_in: random_time(&mut rng_clone),
            lunch_break_out: random_time(&mut rng_clone),
            lunch_break_return: random_time(&mut rng_clone),
            clocked_out: random_time(&mut rng_clone),
            total_hours: random_total_hours(&mut rng_clone),
        }
    }

    /// Generates a random map of date strings to `HourData` for testing purposes.
    ///
    /// # Returns
    ///
    /// * `HashMap<String, HourData>` - A map containing randomly generated hour data keyed by date strings.
    fn generate_random_data_map() -> HashMap<String, HourData> {
        let mut map = HashMap::new();
        let mut rng = rand::thread_rng();

        // Generate a random number of entries
        let num_entries = rng.gen_range(1..=10);

        for _ in 0..num_entries {
            // Generate a random day of the current month
            let random_day = rng.gen_range(1..=31); // Generates a random day between 1 and 31
                                                    // If random_day is not a two-digit number, pad it with a 0
            let key = format!("{:02}/07/2024", random_day);
            // Generate a random HourData instance
            let hour_data = generate_random_hour_data(&mut rng);

            map.insert(key, hour_data);
        }

        map
    }

    /// Inserts mock users into the database for testing purposes.
    #[tokio::test]
    async fn insert_users() {
        let db = create_db_connection("mongodb://localhost:27017")
            .await
            .unwrap();
        let db = db.read().await;
        let mock_users = json!(
            [{"name":"Hilary Oxtoby","email":"hoxtoby0@godaddy.com","role":"Biostatistician II","id":"b5111161-2801-4cd9-aa71-bd1723ae2df5"},
            {"name":"Simone Bettanay","email":"sbettanay1@tumblr.com","role":"Account Representative I","id":"a1e04865-b905-4bf5-84bb-89d8c20f7539"},
            {"name":"Lorette Denham","email":"ldenham2@zdnet.com","role":"Physical Therapy Assistant","id":"8b8430e9-7ec0-43a8-bbca-235ad9288479"},
            {"name":"Rabbi MacGorley","email":"rmacgorley3@skyrock.com","role":"Registered Nurse","id":"a7d9143c-604e-4219-b431-023e93f28ab8"},
            {"name":"Deva Lannin","email":"dlannin4@scribd.com","role":"Accounting Assistant I","id":"e53489b6-2289-4431-92f2-e1e701ca1163"},
            {"name":"Beryle Elles","email":"belles5@businessinsider.com","role":"Software Test Engineer IV","id":"2a48f92a-49d2-42e9-8f65-b94fc30710d7"},
            {"name":"Paxton Videler","email":"pvideler6@dyndns.org","role":"Pharmacist","id":"7ab9433a-6fec-441a-9517-23984677ddfe"},
            {"name":"Olympe Mourge","email":"omourge7@sitemeter.com","role":"Administrative Officer","id":"4edd3dfc-5058-4970-bfb1-36e6de4965f3"},
            {"name":"Immanuel Gallacher","email":"igallacher8@hp.com","role":"VP Quality Control","id":"b734e363-fa95-4bd6-8e4f-96f8ac475b39"},
            {"name":"Selina Prydie","email":"sprydie9@dyndns.org","role":"Financial Advisor","id":"1030fd51-4c74-47aa-ada4-c5e14423f865"},
            {"name":"Willa Boullen","email":"wboullena@phoca.cz","role":"Help Desk Technician","id":"41005c42-1596-4f86-87f3-64655a97a7e0"},
            {"name":"Brigit Tweddle","email":"btweddleb@nymag.com","role":"Assistant Professor","id":"b6d32993-a38e-442c-ae47-2483462f6cc3"},
            {"name":"Dolph Cobleigh","email":"dcobleighc@networksolutions.com","role":"Product Engineer","id":"6fd700d6-0570-46c0-a78a-d50e0a030e2b"},
            {"name":"Dayna Ewols","email":"dewolsd@cpanel.net","role":"Developer IV","id":"9c1d1a5c-172a-49a1-899b-86c8c95679f4"},
            {"name":"Puff Allot","email":"pallote@51.la","role":"Software Consultant","id":"4ffb9be1-1fdb-4c0a-8fab-f2380e1d4a79"}]
        );

        // Insert the randomly generated hour_data into the mock_users
        let users: Vec<UserExternal> = mock_users
            .as_array()
            .unwrap()
            .iter()
            .map(|user| {
                let mut user: UserExternal = serde_json::from_value(user.clone()).unwrap();
                let hour_data = generate_random_data_map();
                user.id = Uuid::new_v4().to_string();
                user.hour_data = Some(hour_data);
                user.image = None;
                user.lunch_time = None;
                user
            })
            .collect();

        // Insert mock users into the database
        let collection: Collection<UserExternal> = db.collection("users_external");
        collection.insert_many(users).await.unwrap();
    }

    /// Tests the `cache_users` function by retrieving users from the database and caching them.
    #[tokio::test]
    async fn test_cache_users() {
        let db = create_db_connection("mongodb://localhost:27017")
            .await
            .unwrap();
        let db = db.read().await;
        let collection: Collection<UserExternal> = db.collection("users_external");

        let cursor = collection
            .find(doc! {})
            .await
            .expect("Failed to execute find");

        let users: Vec<UserExternal> = cursor
            .map(|doc| {
                let doc: UserExternal = doc.unwrap();
                doc
            })
            .collect()
            .await;

        cache_users(users).unwrap();
    }
}
