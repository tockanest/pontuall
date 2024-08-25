use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use futures::TryFutureExt;
use pcsc::*;

use crate::acr122u::card::utils::authenticate::{authenticate_14443_3, KeyType};
use crate::acr122u::utils::errors::ReaderError;

/// When accessing a Mifare Classic 1K card blocks with this library, blocks are numbered as follows:
///
///      sector 0:
///         block 0 – manufacturer data (read only)
///         block 1 – data block
///         block 2 – data block
///         block 3 – sector trailer
///      sector 1:
///         block 4 – data block
///         block 5 – data block
///         block 6 – data block
///         block 7 – sector trailer
///      sector 2:
///         block 8 – data block
///         block 9 – data block
///         block 10 – data block
///         block 11 – sector trailer
/// And so on. Be careful when accessing the blocks, as the sector trailer contains the access bits and the key A and key B. Overwriting the sector trailer can make the card unreadable.
///
/// Reads data from a specified block on a card.
///
/// # Arguments
///
/// * `ctx` - The PC/SC context.
/// * `reader` - The name of the reader.
/// * `block_number` - The block number to read from.
/// * `cancel_flag` - A flag to cancel the operation.
/// * `length` - The length of data to read (optional).
/// * `block_size` - The size of each block (optional).
/// * `packet_size` - The size of each packet (optional).
///
/// # Returns
///
/// * `Ok(Vec<u8>)` - The data read from the block.
/// * `Err(ReaderError)` - If an error occurs during the read operation.
///
/// # Errors
///
/// This function will return an error if:
/// * The reader name is invalid.
/// * The read operation fails.
/// * The card type is unsupported.
/// * The operation is cancelled.
///
/// # Examples
///
/// ```
/// let (ctx, reader) = reader().unwrap();
/// let cancel_flag = Arc::new(AtomicBool::new(false));
/// let result = read_block(ctx, reader, 4, &cancel_flag, None, None, None).await;
/// match result {
///     Ok(data) => println!("Data: {:?}", data),
///     Err(e) => println!("Error: {:?}", e),
/// }
/// ```
pub async fn read_block(
    ctx: Context,
    reader: String,
    block_number: u16,
    cancel_flag: &Arc<AtomicBool>,
    length: Option<u16>,
    block_size: Option<u16>,
    packet_size: Option<u16>,
) -> Result<Vec<u8>, ReaderError> {
    let reader = std::ffi::CString::new(reader)
        .map_err(|_| ReaderError::UnsupportedReader("Invalid reader name".to_string()))?;

    let length = length.unwrap_or(16);
    let packet_size = packet_size.unwrap_or(16);
    let block_size = block_size.unwrap_or(4);

    if length > packet_size {
        // Math.ceil(length / packet_size)
        let p = (length as f32 / packet_size as f32).ceil() as u16;
        let mut commands = Vec::new();

        //for (let i = 0; i < p; i++)
        for i in 0..p {
            let block = block_number + (i * packet_size) / block_size;

            let size = if (i + 1) * packet_size < length {
                packet_size
            } else {
                length - i * packet_size
            };

            commands.push(read_block(
                ctx.clone(),
                reader.clone().into_string().unwrap(),
                block,
                cancel_flag,
                Some(size),
                Some(block_size),
                Some(packet_size),
            ));
        }

        let responses = futures::future::join_all(commands)
            .await
            .into_iter()
            .map(|c| c.map_err(|e| e))
            .collect::<Result<Vec<_>, _>>()?;

        let mut data = Vec::new();
        for response in responses {
            data.extend_from_slice(&response);
        }

        Ok(data)
    } else {
        let mut reader_states = vec![ReaderState::new(reader, State::UNAWARE)];

        let mut last_event_count = reader_states[0].event_count();

        loop {
            ctx.get_status_change(None, &mut reader_states)
                .map_err(ReaderError::PcscError)?;

            loop {
                ctx.get_status_change(None, &mut reader_states)
                    .map_err(ReaderError::PcscError)?;

                for reader_state in &mut reader_states {
                    if reader_state.event_count() != last_event_count {
                        if reader_state.event_state().contains(State::CHANGED) {
                            if reader_state.event_state().contains(State::PRESENT) {
                                let mut card = ctx
                                    .connect(reader_state.name(), ShareMode::Shared, Protocols::ANY)
                                    .map_err(ReaderError::PcscError)?;

                                {
                                    if cancel_flag.load(Ordering::SeqCst) {
                                        println!("Operation cancelled at card connection.");
                                        return Err(ReaderError::OperationCancelled(
                                            "Read Card".to_string(),
                                        ));
                                    }

                                    let tx = card.transaction().map_err(ReaderError::PcscError)?;

                                    // Get the card tag type: TAG_ISO_14443_3 is Mifare, TAG_ISO_14443_4 is FeliCa
                                    let status =
                                        tx.status2_owned().map_err(ReaderError::PcscError)?;
                                    let atr = status.atr();
                                    return if atr.starts_with(&[0x3B, 0x8F, 0x80, 0x01, 0x80, 0x4F])
                                    {
                                        let packet = [
                                            0xff,
                                            0xb0,
                                            ((block_number >> 8) & 0xff) as u8, // High byte of block_number
                                            (block_number & 0xff) as u8, // Low byte of block_number
                                            length as u8,
                                        ];

                                        //First let's authenticate the card
                                        authenticate_14443_3(&tx, block_number as u8, KeyType::A)
                                            .map_err(|e| e)?;

                                        let mut response_buf = [0; 128]; // Adjust the size as needed
                                        let response = tx
                                            .transmit(&packet, &mut response_buf)
                                            .map_err(ReaderError::PcscError)?;

                                        if response.len() < 2 {
                                            return Err(ReaderError::CardError(
                                                "Invalid response.".to_string(),
                                                Error::InvalidParameter,
                                            ));
                                        }

                                        //Status code is of UINT16BE type
                                        let status_code = ((response[response.len() - 2] as u16)
                                            << 8)
                                            | response[response.len() - 1] as u16;

                                        if status_code != 0x9000 {
                                            return Err(ReaderError::CardError(
                                                "Read failed.".to_string(),
                                                Error::InvalidParameter,
                                            ));
                                        }

                                        Ok(response[0..response.len() - 2].to_vec())
                                    } else {
                                        Err(ReaderError::CardError(
                                            "Unsupported card type.".to_string(),
                                            Error::CardUnsupported,
                                        ))
                                    };
                                }
                            }
                            // Sync the current state to the event state after handling the event
                            reader_state.sync_current_state();
                        }

                        last_event_count = reader_state.event_count();
                    }
                }

                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::acr122u::reader::connect::reader;

    use super::*;

    /// Tests the `read_block` function.
    ///
    /// This test connects to a reader, reads data from a specified block, and prints the data.
    /// It verifies that the data is read successfully and converts it to a readable format.
    #[tokio::test]
    async fn test_read_block() {
        let (ctx, reader) = reader().unwrap();
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let result = read_block(ctx, reader, 4, &cancel_flag, None, None, None);

        match result.await {
            Ok(data) => {
                // Convert the data to a hex
                let data_str = data
                    .iter()
                    .map(|b| format!("{:02X}", b))
                    .collect::<Vec<String>>()
                    .join(" ");
                // Convert the hex to readable text
                let data_text = data_str
                    .split_whitespace()
                    .map(|s| {
                        let byte = u8::from_str_radix(s, 16).unwrap();
                        if byte.is_ascii_alphanumeric() {
                            byte as char
                        } else {
                            '.'
                        }
                    })
                    .collect::<String>();
                println!("Data: {}", data_text);
            }
            Err(e) => {
                println!("{:?}", e);
            }
        }
    }
}
