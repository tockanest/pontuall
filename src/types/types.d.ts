declare global {
    type HourData = {
        clock_in: string,
        lunch_break_out: string,
        lunch_break_return: string,
        clocked_out: string,
        total_hours: string
    }

    interface IUsers {
        id: string,
        name: string,
        email?: string,
        image: string,
        role: string,
        hour_data: {
            [key: string]: HourData
        }
        status?: string,
        lunch_time?: string
    }

    interface CachedUsers {
        [name: string]: IUsers
    }

    type Users = IUsers[]

    type UserLogged = {
        id: string,
        name: string,
        image: string,
        role: string,
        permissions: string
    }

    type FirstUser = {
        id: string,
        username: string,
        password: string,
        registered_at: string,
        worker_data: {
            name: string,
            role: string,
            email: string,
            phone: string,
            permissions: {
                flags: string
            }
        }
    }

    type InternalUser = {
        _id: {
            $oid: string
        },
        id: string,
        username: string,
        password: string,
        registered_at: string,
        worker_data: {
            name: string,
            role: string,
            email: string,
            phone: string,
            permissions: {
                flags: string
            },
        }
    }

    type Pages = "home" | "configuration" | "profile" | "about" | "help" | "admin"
    type AppPermissions =
        "ReadSelf"
        | "ReadOthers"
        | "WriteSelf"
        | "WriteOthers"
        | "DeleteSelf"
        | "DeleteOthers"
        | "EditHours"
        | "EditHierarchy"
        | "CreateReports"
        | "SuperUser"
        | "SuperVisor"
        | "Administrator"

    type StatePermissions = {
        [key: string]: boolean
    }

    type IDialogMessage = {
        message: string,
        type: string,
        showDefaultCancel?: boolean
        release?: string
    }
}

export {}