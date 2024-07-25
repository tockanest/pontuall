// Declare global

declare global {
    
    type HourData = {
        clock_in: string,
        lunch_break: string,
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
        status?: string
    }
    
    type Users = IUsers[]
    
    type UserLogged = {
        name: string,
        image: string,
        role: string,
        permissions: string[]
    }
    
    type Pages = "home" | "configuration" | "profile" | "about" | "help" | "admin"
    
}