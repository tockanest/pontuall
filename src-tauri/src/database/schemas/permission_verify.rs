use crate::database::schemas::user_schema::{Permissions, PermissionsBitField};

pub(crate) enum PermissionAction {
    Read,
    Write,
    Delete,
    EditHours,
    EditHierarchy,
    SuperVisor,
    Admin,
}

impl PermissionAction {
    fn to_permission_bitfield(&self) -> PermissionsBitField {
        match self {
            PermissionAction::Admin => PermissionsBitField {
                flags: Permissions::Admin,
            },
            PermissionAction::SuperVisor => PermissionsBitField {
                flags: Permissions::SuperVisor,
            },
            PermissionAction::Read => PermissionsBitField {
                flags: Permissions::ReadSelf,
            },
            PermissionAction::Write => PermissionsBitField {
                flags: Permissions::WriteSelf,
            },
            PermissionAction::Delete => PermissionsBitField {
                flags: Permissions::DeleteSelf,
            },
            PermissionAction::EditHours => PermissionsBitField {
                flags: Permissions::EditHours,
            },
            PermissionAction::EditHierarchy => PermissionsBitField {
                flags: Permissions::EditHierarchy,
            },
        }
    }
}

pub struct PermissionChecker;

impl PermissionChecker {
    pub fn check_permission(
        user_permissions: PermissionsBitField,
        action: PermissionAction,
    ) -> bool {
        let action_permission = action.to_permission_bitfield();
        user_permissions.flags.contains(action_permission.flags)
    }
}