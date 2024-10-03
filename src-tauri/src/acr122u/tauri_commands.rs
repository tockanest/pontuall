use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use pcsc::Context;
use serde::Serialize;
use tauri::ipc::InvokeError;
use tauri::State;

use crate::acr122u::card::read::read_block;
use crate::acr122u::card::write::write_block;
use crate::acr122u::reader::connect::reader;
use crate::acr122u::utils::errors::ReaderError;

/// This will be used by the backend to keep the connection alive and pass the Context to other functions.
pub(crate) struct FullReaderResult {
    pub(crate) ctx: Context,
    pub(crate) reader: String,
}

/// This will be used by the frontend to keep track of the cancel flag.
#[derive(Default)]
pub(crate) struct ReadState {
    pub(crate) cancel_flag: Arc<AtomicBool>,
    pub(crate) read_in_progress: Arc<Mutex<bool>>,
}

#[derive(Default)]
pub(crate) struct WriteState {
    pub(crate) cancel_flag: Arc<AtomicBool>,
}

/// FrontEnd expects a JSON object with a single field "reader" containing the reader name.
#[derive(Serialize)]
pub(crate) struct ReaderResult {
    pub(crate) reader: String,
}

/** Functions for Commands */

/// Connects to the reader, sets the Context and Reader name to the Backend struct and Reader name to the FrontEnd struct.
///
/// This function does not take any arguments, but it needs to be called first to set the Context and Reader name.
/// If not called first, everything else will fail miserably.
///
/// # Returns
///
/// * `Ok(FullReaderResult)` - If the connection is successful.
/// * `Err(ReaderError)` - If an error occurs during the connection.
fn connect() -> Result<FullReaderResult, ReaderError> {
    match reader() {
        Ok((ctx, reader)) => Ok(FullReaderResult { ctx, reader }),
        Err(e) => Err(e),
    }
}

/// Validates the given PC/SC context.
///
/// # Arguments
///
/// * `context` - A reference to the PC/SC context.
///
/// # Returns
///
/// * `true` if the context is valid.
/// * `false` if the context is invalid.
fn validate_context(context: &Context) -> bool {
    match context.is_valid() {
        Ok(_valid) => true,
        Err(_) => false,
    }
}

/// Reads data from a specified block on the card.
///
/// # Arguments
///
/// * `block_number` - The block number to read from.
/// * `state` - The state containing the cancel flag.
///
/// # Returns
///
/// * `Ok(Vec<u8>)` - The data read from the block.
/// * `Err(ReaderError)` - If an error occurs during the read operation.
async fn mcp_read(block_number: u16, state: Arc<ReadState>) -> Result<Vec<u8>, ReaderError> {
    // Use the FullReaderResult struct to get the Context and Reader name
    let connect = match connect() {
        Ok(result) => result,
        Err(e) => {
            return Err(e);
        }
    };

    let context = connect.ctx.clone();

    if validate_context(&context) {
        let reader_name = connect.reader;
        let read = read_block(
            context,
            reader_name,
            block_number,
            &state.cancel_flag,
            None,
            None,
            None,
        )
            .await?;
        Ok(read)
    } else {
        Err(ReaderError::PcscError(pcsc::Error::InvalidHandle))
    }
}

/** Actual Commands */

/// Connects to the reader and returns the reader name.
///
/// # Returns
///
/// * `Ok(ReaderResult)` - If the connection is successful.
/// * `Err(InvokeError)` - If an error occurs during the connection.
#[tauri::command]
pub(crate) fn connect_reader() -> Result<ReaderResult, InvokeError> {
    let result = connect().map_err(|e| InvokeError::from(e))?;
    Ok(ReaderResult {
        reader: result.reader,
    })
}

/// Reads data from a specified block on the card.
///
/// # Arguments
///
/// * `block_number` - The block number to read from.
/// * `state` - The state containing the cancel flag.
///
/// # Returns
///
/// * `Ok(String)` - The data read from the block as a UTF-8 string.
/// * `Err(InvokeError)` - If an error occurs during the read operation.
#[tauri::command]
pub(crate) async fn read_card(
    block_number: u16,
    state: State<'_, Arc<ReadState>>,
) -> Result<String, InvokeError> {
    let cancel_flag = state.cancel_flag.clone();
    cancel_flag.store(false, Ordering::SeqCst);

    let read_in_progress = Arc::clone(&state.read_in_progress);

    // Ensure that only one read operation can be in progress at a time
    {
        let mut in_progress = read_in_progress.lock().unwrap();
        if *in_progress {
            println!("Read already in progress.");
            return Err(InvokeError::from(ReaderError::CardError(
                "Read already in progress.".to_string(),
                pcsc::Error::ServerTooBusy,
            )));
        }
        *in_progress = true;
    } // MutexGuard is dropped here to release the lock

    let state_clone = state.inner().clone();

    let result = mcp_read(block_number, state_clone).await;
    let mut in_progress = read_in_progress.lock().unwrap(); // Re-acquire the lock to ensure we're modifying the most up-to-date state
    *in_progress = false; // Ensure this line executes regardless of success or failure

    match result {
        Ok(data) => {
            let data = String::from_utf8(data);
            match data {
                Ok(data) => Ok(data),
                Err(e) => Err(InvokeError::from(ReaderError::CardError(
                    e.to_string(),
                    pcsc::Error::UnknownError,
                ))),
            }
        }
        Err(e) => Err(InvokeError::from(e)),
    }
}

/// Cancels the read operation.
///
/// # Arguments
///
/// * `state` - The state containing the cancel flag.
///
/// # Returns
///
/// * `Ok(())` - If the cancel operation is successful.
#[tauri::command]
pub(crate) fn cancel_read(state: State<'_, Arc<ReadState>>) -> Result<(), InvokeError> {
    state.cancel_flag.store(true, Ordering::SeqCst);
    Ok(())
}

/// Cancels the write operation.
///
/// # Arguments
///
/// * `state` - The state containing the cancel flag.
///
/// # Returns
///
/// * `Ok(())` - If the cancel operation is successful.
#[tauri::command]
pub(crate) fn cancel_write(state: State<'_, Arc<WriteState>>) -> Result<(), InvokeError> {
    state.cancel_flag.store(true, Ordering::SeqCst);
    Ok(())
}

/// Writes data to a specified block on the card.
///
/// # Arguments
///
/// * `block_number` - The block number to write to.
/// * `data` - The data to write.
/// * `state` - The state containing the cancel flag.
///
/// # Returns
///
/// * `Ok(())` - If the write operation is successful.
/// * `Err(ReaderError)` - If an error occurs during the write operation.
async fn mcp_write(
    block_number: u16,
    data: String,
    state: Arc<WriteState>,
) -> Result<(), ReaderError> {
    // Use the FullReaderResult struct to get the Context and Reader name
    let connect = match connect() {
        Ok(result) => result,
        Err(e) => {
            return Err(e);
        }
    };

    let context = connect.ctx.clone();

    if validate_context(&context) {
        let reader_name = connect.reader;

        let mut buffer = vec![0; 16];
        let data_len = data.len();
        let copy_len = std::cmp::min(data_len, buffer.len());
        buffer[..copy_len].copy_from_slice(&data.as_bytes()[..copy_len]);

        let result = write_block(
            context,
            reader_name,
            block_number,
            buffer,
            Option::from(16),
            &state.cancel_flag,
        )
            .await
            .unwrap_or_else(|e| panic!("{:?}", e));

        if result {
            Ok(())
        } else {
            Err(ReaderError::CardError(
                "Write failed.".to_string(),
                pcsc::Error::CardNotAuthenticated,
            ))
        }
    } else {
        Err(ReaderError::PcscError(pcsc::Error::InvalidHandle))
    }
}

/// Writes data to a specified block on the card.
///
/// # Arguments
///
/// * `block_number` - The block number to write to.
/// * `data` - The data to write.
/// * `state` - The state containing the cancel flag.
///
/// # Returns
///
/// * `Ok(())` - If the write operation is successful.
/// * `Err(InvokeError)` - If an error occurs during the write operation.
#[tauri::command]
pub(crate) async fn write_card(
    block_number: u16,
    data: String,
    state: State<'_, Arc<WriteState>>,
) -> Result<bool, InvokeError> {
    let cancel_flag = state.cancel_flag.clone();
    cancel_flag.store(false, Ordering::Relaxed);

    let state_clone = state.inner().clone();

    let result = mcp_write(block_number, data, state_clone).await;
    match result {
        Ok(_) => Ok(true),
        Err(e) => Err(InvokeError::from(e)),
    }
}

/// Gets the connection to the reader and returns the reader name.
///
/// # Returns
///
/// * `Ok(String)` - The reader name if the connection is successful.
/// * `Err(ReaderError)` - If an error occurs during the connection.
#[tauri::command]
pub(crate) fn get_connection() -> Result<String, ReaderError> {
    match connect() {
        Ok(result) => Ok(result.reader),
        Err(e) => Err(e),
    }
}
