use pcsc::{Error, Transaction};
use crate::acr122u::utils::errors::ReaderError;

pub(crate) enum KeyType {
    A = 0x60,
    B = 0x61,
}

/// This function authenticates the card for reading.
///
/// Returns a Result with an empty tuple if successful, or a ReaderError if not.
pub(crate) fn authenticate_14443_3(
    tx: &Transaction,
    block_number: u8,
    key_type: KeyType,
) -> Result<(), ReaderError> {
    let key_type = key_type as u8;

    let command = [
        0xff,
        0x86,
        0x00,
        0x00,
        0x05,
        0x01,
        0x00,
        block_number,
        key_type,
        0x00,
    ];

    let mut response_buf = [0; 512]; // Adjust the size as needed

    let response = tx.transmit(&command, &mut response_buf).map_err(ReaderError::PcscError)?;

    if response.len() >= 2 {
        let sw1 = response[response.len() - 2];
        let sw2 = response[response.len() - 1];

        if sw1 == 0x90 && sw2 == 0x00 {
            Ok(())
        } else {
            //Return error
            return Err(ReaderError::CardError("Authentication Failed.".to_string(), Error::CardNotAuthenticated));
        }
    } else {
        //Return error
        return Err(ReaderError::CardError("Invalid response.".to_string(), Error::CardNotAuthenticated));
    }
}