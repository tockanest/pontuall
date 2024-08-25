use mongodb::{Client, Database};
use std::error::Error;
use std::sync::Arc;
use tokio::sync::RwLock;

pub(crate) type SharedDatabase = Arc<RwLock<Database>>;

pub(crate) async fn create_db_connection(uri: &str) -> Result<SharedDatabase, Box<dyn Error>> {
    let client = match Client::with_uri_str(uri).await {
        Ok(client) => client,
        Err(e) => {
            return Err(Box::new(e));
        }
    };

    let database = client.database("pontuall-dev");

    Ok(Arc::new(RwLock::new(database)))
}
