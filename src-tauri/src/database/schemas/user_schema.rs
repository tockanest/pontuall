use std::collections::HashMap;

use bitflags::bitflags;
use serde::{Deserialize, Serialize};

#[derive(Default, Clone, Copy, Debug, Serialize, Deserialize)]
pub struct PermissionsBitField {
    pub flags: Permissions,
}

bitflags! {
    #[repr(transparent)]
    #[derive(Default, Clone, Copy, Debug, Serialize, Deserialize)]
    pub(crate) struct Permissions: u64 {
        const ReadSelf = 1 << 0;
        const ReadOthers = 1 << 1;
        const WriteSelf = 1 << 2;
        const WriteOthers = 1 << 3;
        const DeleteSelf = 1 << 4;
        const DeleteOthers = 1 << 5;
        const EditHours = 1 << 6;
        const EditHierarchy = 1 << 7;
        const SuperVisor = Self::ReadSelf.bits() | Self::ReadOthers.bits() | Self::WriteSelf.bits() | Self::WriteOthers.bits() | Self::EditHours.bits();
        const Admin = Self::SuperVisor.bits() | Self::DeleteSelf.bits() | Self::DeleteOthers.bits() | Self::EditHierarchy.bits();
    }
}

/** Internal User Schema */
/** This Schema is used to store the user data that's sensitive, such as password, phone and permissions */
/** Mostly used for login and actions that require reading or writing to the database */
#[derive(Serialize, Deserialize, Debug, Clone)]
pub(crate) struct WorkerData {
    pub(crate) first_name: String,
    pub(crate) last_name: String,
    pub(crate) role: String,
    pub(crate) email: Option<String>,
    pub(crate) phone: Option<String>,
    pub(crate) permissions: PermissionsBitField,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub(crate) struct InternalUserSchema {
    pub id: String,
    pub username: String,
    pub password: String,
    pub worker_data: WorkerData,
}

/** External User Schema */
/** This Schema is used to store the user data that's not sensitive, such as email, name and work-related data */
#[derive(Serialize, Deserialize, Debug, Clone)]
pub(crate) struct HourData {
    pub(crate) clock_in: String,
    pub(crate) lunch_break: String,
    pub(crate) clocked_out: String,
    pub(crate) total_hours: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub(crate) struct UserExternal {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) email: Option<String>,
    pub(crate) image: Option<String>,
    pub(crate) role: String,
    pub(crate) hour_data: Option<HashMap<String, HourData>>,
    pub(crate) status: Option<String>,
}