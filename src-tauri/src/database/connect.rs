use keyring::Entry;
use mongodb::options::{ClientOptions, ServerApi, ServerApiVersion};
use mongodb::{Client, Database};
use std::error::Error;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::sync::RwLock;

pub(crate) type SharedDatabase = Arc<RwLock<Database>>;

#[derive(Clone, Debug)]
pub(crate) struct SharedDatabases {
    pub(crate) mongo_db: Option<Arc<Mutex<Option<SharedDatabase>>>>,
    pub(crate) sled_db: Option<Arc<Mutex<sled::Db>>>,
    pub(crate) is_online: Arc<AtomicBool>,
}

pub(crate) async fn mongo_db_connection() -> Result<SharedDatabase, Box<dyn Error>> {
    let mongo_db_uri = Entry::new("PontuAll", "mongodb_uri").unwrap();
    let uri = mongo_db_uri.get_password().unwrap_or_else(|_| "PontuAll: Could not find MongoDb at the KeyRing.".to_string());

    let app_name_get = Entry::new("PontuAll", "app_name").unwrap();
    let app_name = app_name_get.get_password().unwrap_or_else(|_| "PontuAll".to_string());

    let mut client_options =
        ClientOptions::parse(uri.as_str()).await?;

    // Set the server_api field of the client_options object to set the version of the Stable API on the client
    let server_api = ServerApi::builder().version(ServerApiVersion::V1).build();
    client_options.server_api = Some(server_api);
    // Get a handle to the cluster
    let client = Client::with_options(client_options)?;

    let database = client.database(format!("pontuall_{0}", app_name).as_str());

    Ok(Arc::new(RwLock::new(database)))
}

fn create_sled() -> Result<sled::Db, Box<dyn Error>> {
    let db_path = dirs::config_dir().unwrap().join("PontuAll").join("database");

    // Ensure the directory exists
    if !db_path.exists() {
        std::fs::create_dir_all(&db_path)?;
    }

    let sled_db = sled::open(&db_path).expect("Failed to open SLED Database.");
    Ok(sled_db)
}

pub(crate) async fn create_db_connections() -> Result<SharedDatabases, Box<dyn Error>> {
    let get_sled_db = create_sled();
    let sled_db = get_sled_db?;

    let mut databases = SharedDatabases {
        mongo_db: None,
        sled_db: Some(Arc::new(Mutex::new(sled_db))),
        is_online: Arc::new(AtomicBool::new(true)),
    };

    let mongo_db = match mongo_db_connection().await {
        Ok(mongo) => Some(mongo),
        Err(_) => {
            println!("MongoDB connection failed, starting offline.");
            None
        }
    };


    databases.mongo_db = Some(Arc::new(Mutex::new(mongo_db.clone())));
    databases.is_online = Arc::new(AtomicBool::new(mongo_db.is_some()));

    Ok(databases)
}


#[cfg(test)]
mod tests {
    use crate::database::connect::create_db_connections;

    #[tokio::test]
    async fn test_db() {
        let db = create_db_connections();
        println!("Ok")
    }

    // #[tokio::test]
    // async fn flush_sled() {
    //     let db = create_db_connections().await.unwrap();
    //     let get_sled = db.sled_db;
    //     let mutex_sled = get_sled.clone().unwrap();
    //
    //     let db = mutex_sled.lock().unwrap();
    //     db.clear().unwrap();
    //     println!("Sled cleared.")
    // }
}