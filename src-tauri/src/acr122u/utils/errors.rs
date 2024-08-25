use std::fmt;

use pcsc::Error;
use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};

#[derive(Debug)]
pub enum ReaderError {
    UnsupportedReader(String),
    PcscError(Error),
    NoReadersFound,
    CardError(String, Error),
    OperationCancelled(String),
}

impl fmt::Display for ReaderError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            ReaderError::UnsupportedReader(ref reader) => {
                write!(f, "Unsupported reader: {}", reader)
            }
            ReaderError::PcscError(ref err) => write!(f, "PCSC error: {}", err),
            ReaderError::NoReadersFound => write!(f, "No readers found"),
            ReaderError::CardError(ref card, ref err) => {
                write!(f, "Card error: {}, {}", card, err)
            }
            ReaderError::OperationCancelled(ref operation) => {
                write!(f, "Operation cancelled: {}", operation)
            }
        }
    }
}

impl From<Error> for ReaderError {
    fn from(err: Error) -> ReaderError {
        ReaderError::PcscError(err)
    }
}

impl Serialize for ReaderError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match *self {
            ReaderError::UnsupportedReader(ref reader) => {
                let mut state = serializer.serialize_struct("ReaderError", 2)?;
                state.serialize_field("error", "Unsupported Reader")?;
                state.serialize_field("reader", reader)?;
                state.end()
            }
            ReaderError::PcscError(ref err) => {
                let mut state = serializer.serialize_struct("ReaderError", 2)?;
                state.serialize_field("error", "PCSC Error")?;
                state.serialize_field("message", &err.to_string())?;
                state.end()
            }
            ReaderError::NoReadersFound => {
                let mut state = serializer.serialize_struct("ReaderError", 1)?;
                state.serialize_field("error", "No Readers Found")?;
                state.end()
            }
            ReaderError::CardError(ref card, ref err) => {
                let mut state = serializer.serialize_struct("ReaderError", 3)?;
                state.serialize_field("error", "Card Error")?;
                state.serialize_field("card", card)?;
                state.serialize_field("message", &err.to_string())?;
                state.end()
            }
            ReaderError::OperationCancelled(ref operation) => {
                let mut state = serializer.serialize_struct("ReaderError", 2)?;
                state.serialize_field("error", "Operation Cancelled")?;
                state.serialize_field("operation", operation)?;
                state.end()
            }
        }
    }
}
