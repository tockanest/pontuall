use keyring::Entry;
use mongodb::options::{ClientOptions, ServerApi, ServerApiVersion};
use mongodb::{Client, Database};
use std::error::Error;
use std::sync::Arc;
use tokio::sync::RwLock;

pub(crate) type SharedDatabase = Arc<RwLock<Database>>;

pub(crate) async fn create_db_connection() -> Result<SharedDatabase, Box<dyn Error>> {
    let mongo_db_uri = Entry::new("PontuAll", "mongodb_uri").unwrap();
    let uri = mongo_db_uri.get_password().unwrap_or_else(|_| "PontuAll: Could not find MongoDb at the KeyRing.".to_string());
    println!("URI: {}", uri);
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
