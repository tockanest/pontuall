use std::ffi::CString;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use pcsc::*;

use crate::acr122u::card::utils::authenticate::{authenticate_14443_3, KeyType};
use crate::acr122u::utils::errors::ReaderError;

pub(crate) async fn write_block(
    ctx: Context,
    reader: String,
    block_number: u16,
    data: Vec<u8>,
    block_size: Option<u16>,
    cancel_flag: &Arc<AtomicBool>,
) -> Result<bool, ReaderError> {
    let reader = CString::new(reader).map_err(|_| ReaderError::UnsupportedReader("Invalid reader name".to_string())).unwrap();
    let block_size = block_size.unwrap_or(16);

    if data.len() < block_size as usize || data.len() % block_size as usize != 0 {
        return Err(ReaderError::CardError("Data length must be a multiple of block size.".to_string(), Error::InvalidParameter));
    }

    if data.len() > block_size as usize {
        let p = data.len() / block_size as usize;
        let mut commands = Vec::new();

        for i in 0..p {
            let mut block = block_number + 1;

            // Check if block number is 7, 11, 15 and etc, if it is, add +1
            if block % 4 == 3 {
                block += 1;
            }

            let start = i * block_size as usize;
            let end = (i + 1) * block_size as usize;

            let size = if end < data.len() {
                block_size
            } else {
                (data.len() - i * block_size as usize) as u8 as u16
            };

            commands.push(write_block(ctx.clone(), reader.clone().into_string().unwrap(), block, data[start..end].to_vec(), Some(block_size), cancel_flag));
        }

        let responses = futures::future::join_all(commands).await.into_iter().map(|c| c.map_err(|e| e)).collect::<Result<Vec<_>, _>>()?;

        for response in responses {
            if !response {
                return Err(ReaderError::CardError("Write failed.".to_string(), Error::InvalidParameter));
            }
        }

        Ok(true)
    } else {
        let mut reader_states = vec![
            ReaderState::new(reader, State::UNAWARE)
        ];

        let mut last_event_count = reader_states[0].event_count();

        loop {
            if cancel_flag.load(Ordering::Relaxed) {
                return Err(ReaderError::OperationCancelled("Read Card".to_string()));
            }

            ctx.get_status_change(None, &mut reader_states).map_err(ReaderError::PcscError)?;

            loop {
                if cancel_flag.load(Ordering::Relaxed) {
                    return Err(ReaderError::OperationCancelled("Read Card".to_string()));
                }

                ctx.get_status_change(None, &mut reader_states).map_err(ReaderError::PcscError)?;

                for reader_state in &mut reader_states {
                    if reader_state.event_count() != last_event_count {
                        if reader_state.event_state().contains(State::CHANGED) {
                            if reader_state.event_state().contains(State::PRESENT) {
                                let mut card = ctx.connect(reader_state.name(), ShareMode::Shared, Protocols::ANY).map_err(ReaderError::PcscError)?;

                                {
                                    let tx = card.transaction().map_err(ReaderError::PcscError)?;

                                    // Get the card tag type: TAG_ISO_14443_3 is Mifare, TAG_ISO_14443_4 is FeliCa
                                    let status = tx.status2_owned().map_err(ReaderError::PcscError)?;
                                    let atr = status.atr();
                                    return if atr.starts_with(&[0x3B, 0x8F, 0x80, 0x01, 0x80, 0x4F]) {
                                        let packet_header: Vec<u8> = vec![
                                            0xff, // Class
                                            0xd6, // INS
                                            0x00, // P1
                                            block_number as u8, // P2
                                            block_size as u8, // Lc
                                        ];

                                        let packet = [packet_header, data].concat();
                                        let mut response_buf = [0; 128]; // Adjust the size as needed
                                        authenticate_14443_3(&tx, block_number as u8, KeyType::A)?;
                                        let response = tx.transmit(&packet, &mut response_buf).map_err(ReaderError::PcscError)?;

                                        if response.len() < 2 {
                                            return Err(ReaderError::CardError("Invalid response length.".to_string(), Error::InvalidValue));
                                        }

                                        // Get the error response from the card
                                        let error_code = response[0];
                                        println!("Error code: {}", error_code);

                                        //Status code is of UINT16BE type
                                        let status_code = ((response[response.len() - 2] as u16) << 8) | response[response.len() - 1] as u16;

                                        if status_code != 0x9000 {
                                            return Err(ReaderError::CardError(format!("Write failed with code: {}", status_code), Error::InvalidParameter));
                                        }

                                        Ok(true)
                                    } else {
                                        Err(ReaderError::CardError("Unsupported card type.".to_string(), Error::CardUnsupported))
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
    use std::sync::atomic::AtomicBool;

    use crate::acr122u::reader::connect::reader;

    use super::*;

    async fn test_write_single() {
        let (ctx, reader) = reader().unwrap();
        let cancel_flag = Arc::new(AtomicBool::new(false));

        let mut buffer = vec![0; 16];
        let data = "Hello, World!";
        let data_len = data.len();
        let copy_len = std::cmp::min(data_len, buffer.len());
        buffer[..copy_len].copy_from_slice(&data.as_bytes()[..copy_len]);

        let result = write_block(ctx, reader, 4, buffer, Option::from(16), &cancel_flag).await.unwrap_or_else(|e| panic!("{:?}", e));

        assert_eq!(result, true);
    }

    #[tokio::test]
    async fn test_write_multiple() {
        // Block 4
        let mut block_four = vec![0; 16];
        let block_four_data = "123456789123456";
        let block_four_data_len = block_four_data.len();
        let block_four_copy_len = std::cmp::min(block_four_data_len, block_four.len());
        block_four[..block_four_copy_len].copy_from_slice(&block_four_data.as_bytes()[..block_four_copy_len]);

        // Block 5
        let mut block_five = vec![0; 16];
        let block_five_data = "Nixyan";
        let block_five_data_len = block_five_data.len();
        let block_five_copy_len = std::cmp::min(block_five_data_len, block_five.len());
        block_five[..block_five_copy_len].copy_from_slice(&block_five_data.as_bytes()[..block_five_copy_len]);

        // Block 6
        let mut block_six = vec![0; 16];
        let block_six_data = "Tockawaffle";
        let block_six_data_len = block_six_data.len();
        let block_six_copy_len = std::cmp::min(block_six_data_len, block_six.len());
        block_six[..block_six_copy_len].copy_from_slice(&block_six_data.as_bytes()[..block_six_copy_len]);

        // Block 8
        let mut block_eight = vec![0; 16];
        let block_eight_data = "xxxxxxxxxxx";
        let block_eight_data_len = block_eight_data.len();
        let block_eight_copy_len = std::cmp::min(block_eight_data_len, block_eight.len());
        block_eight[..block_eight_copy_len].copy_from_slice(&block_eight_data.as_bytes()[..block_eight_copy_len]);


        let (ctx, reader) = reader().unwrap();
        let cancel_flag = Arc::new(AtomicBool::new(false));

        let blocks = vec![
            (4, block_four),
            (5, block_five),
            (6, block_six),
            (8, block_eight),
        ];

        let mut commands = Vec::new();
        for (block_number, data) in blocks {
            commands.push(write_block(ctx.clone(), reader.clone(), block_number, data, Option::from(16), &cancel_flag));
        }

        let responses = futures::future::join_all(commands).await.into_iter().map(|c| c.map_err(|e| e)).collect::<Result<Vec<_>, _>>().unwrap();

        for response in responses {
            assert_eq!(response, true);
        }
    }
}