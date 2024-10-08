use pcsc::*;

use crate::acr122u::utils::errors::ReaderError;

//Create a connection to the card reader, check if it's acr122u and keep the connection alive to be used later
pub(crate) fn reader<'buf>() -> Result<(Context, String), ReaderError> {
    let ctx = match Context::establish(Scope::User) {
        Ok(ctx) => ctx,
        Err(err) => return Err(ReaderError::PcscError(err)),
    };

    let mut readers_buf = [0; 2048];
    let mut readers = ctx
        .list_readers(&mut readers_buf)
        .map_err(ReaderError::PcscError)?;

    let reader = readers
        .next()
        .ok_or(ReaderError::NoReadersFound)?
        .to_str()
        .map_err(|_| ReaderError::UnsupportedReader("Invalid reader name".to_string()))?
        .to_owned();

    // Check if the reader is ACR122
    if !reader.contains("ACR122") {
        return Err(ReaderError::UnsupportedReader(reader));
    }

    //Return the context and reader_name
    Ok((ctx, reader))
}

pub(crate) fn disconnect(ctx: Context) -> Result<(), ReaderError> {
    match ctx.release() {
        Ok(_) => Ok(()),
        Err((_, err)) => Err(ReaderError::PcscError(err)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_connect() {
        let result = reader().unwrap();
        match result {
            (ctx, reader) => {
                println!("Connection successful. Reader: {}", reader);
                disconnect(ctx).unwrap();
            }
        }
    }

    #[test]
    fn test_disconnect() {
        let ctx = reader().unwrap();
        let result = disconnect(ctx.0);
        match result {
            Ok(_) => println!("Disconnection successful."),
            Err(_) => panic!("Unexpected error occurred."),
        }
    }
}
