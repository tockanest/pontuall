use std::fmt::{Display, Formatter};
use std::str::FromStr;

use crate::database::schemas::user_schema::{Permissions, PermissionsBitField};

pub(crate) enum PermissionAction {
    ReadSelf,
    ReadOthers,
    WriteSelf,
    WriteOthers,
    DeleteSelf,
    DeleteOthers,
    EditHours,
    EditHierarchy,
    CreateReports,
    SuperUser,
    Supervisor,
    Administrator,
}

impl PermissionAction {
    pub(crate) fn to_permission_bitfield(&self) -> PermissionsBitField {
        match self {
            PermissionAction::ReadSelf => PermissionsBitField {
                flags: Permissions::ReadSelf,
            },
            PermissionAction::ReadOthers => PermissionsBitField {
                flags: Permissions::ReadOthers,
            },
            PermissionAction::WriteSelf => PermissionsBitField {
                flags: Permissions::WriteSelf,
            },
            PermissionAction::WriteOthers => PermissionsBitField {
                flags: Permissions::WriteOthers,
            },
            PermissionAction::DeleteSelf => PermissionsBitField {
                flags: Permissions::DeleteSelf,
            },
            PermissionAction::DeleteOthers => PermissionsBitField {
                flags: Permissions::DeleteOthers,
            },
            PermissionAction::EditHours => PermissionsBitField {
                flags: Permissions::EditHours,
            },
            PermissionAction::EditHierarchy => PermissionsBitField {
                flags: Permissions::EditHierarchy,
            },
            PermissionAction::CreateReports => PermissionsBitField {
                flags: Permissions::CreateReports,
            },
            PermissionAction::SuperUser => PermissionsBitField {
                flags: Permissions::SuperUser,
            },
            PermissionAction::Supervisor => PermissionsBitField {
                flags: Permissions::Supervisor,
            },
            PermissionAction::Administrator => PermissionsBitField {
                flags: Permissions::Administrator,
            },
        }
    }
}

impl FromStr for PermissionAction {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "ReadSelf" => Ok(PermissionAction::ReadSelf),
            "ReadOthers" => Ok(PermissionAction::ReadOthers),
            "WriteSelf" => Ok(PermissionAction::WriteSelf),
            "WriteOthers" => Ok(PermissionAction::WriteOthers),
            "DeleteSelf" => Ok(PermissionAction::DeleteSelf),
            "DeleteOthers" => Ok(PermissionAction::DeleteOthers),
            "EditHours" => Ok(PermissionAction::EditHours),
            "EditHierarchy" => Ok(PermissionAction::EditHierarchy),
            "CreateReports" => Ok(PermissionAction::CreateReports),
            "SuperUser" => Ok(PermissionAction::SuperUser),
            "Supervisor" => Ok(PermissionAction::Supervisor),
            "Administrator" => Ok(PermissionAction::Administrator),
            _ => Err(()),
        }
    }
}

impl FromStr for PermissionsBitField {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut flags = Permissions::default();
        for permissions in s.split(",") {
            flags |= match permissions {
                "ReadSelf" => Permissions::ReadSelf,
                "ReadOthers" => Permissions::ReadOthers,
                "WriteSelf" => Permissions::WriteSelf,
                "WriteOthers" => Permissions::WriteOthers,
                "DeleteSelf" => Permissions::DeleteSelf,
                "DeleteOthers" => Permissions::DeleteOthers,
                "EditHours" => Permissions::EditHours,
                "EditHierarchy" => Permissions::EditHierarchy,
                "CreateReports" => Permissions::CreateReports,
                "SuperUser" => Permissions::SuperUser,
                "Supervisor" => Permissions::Supervisor,
                "Administrator" => Permissions::Administrator,
                _ => return Err(()),
            };
        }
        Ok(Self { flags })
    }
}

impl Display for PermissionsBitField {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        let mut permissions = Vec::new();
        if self.flags.contains(Permissions::ReadSelf) {
            permissions.push("ReadSelf");
        }
        if self.flags.contains(Permissions::WriteSelf) {
            permissions.push("WriteSelf");
        }
        if self.flags.contains(Permissions::DeleteSelf) {
            permissions.push("DeleteSelf");
        }
        if self.flags.contains(Permissions::EditHours) {
            permissions.push("EditHours");
        }
        if self.flags.contains(Permissions::EditHierarchy) {
            permissions.push("EditHierarchy");
        }
        if self.flags.contains(Permissions::CreateReports) {
            permissions.push("CreateReports");
        }
        if self.flags.contains(Permissions::SuperUser) {
            permissions.push("SuperUser");
        }
        if self.flags.contains(Permissions::Supervisor) {
            permissions.push("Supervisor");
        }
        if self.flags.contains(Permissions::Administrator) {
            permissions.push("Administrator");
        }
        write!(f, "{}", permissions.join(","))
    }
}

pub(crate) struct PermissionChecker;

impl PermissionChecker {
    pub fn check_permission(
        user_permissions: PermissionsBitField,
        action: PermissionAction,
    ) -> bool {
        let action_permissions = action.to_permission_bitfield();
        user_permissions.flags.contains(action_permissions.flags)
    }
}
