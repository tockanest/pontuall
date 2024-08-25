export default class TauriApi {
    private static async command<T>(command: string, args: any): Promise<T> {
        const {invoke} = await import('@tauri-apps/api/core');
        return invoke(command, args);
    }
    
    /**
     * ------------------------------------------------------------------------------------------
     * These commands are used to interact with the card reader.
     * Things like reading the card, connecting to the reader, etc.
     * ------------------------------------------------------------------------------------------
     */
    
    public static async Connect() {
        const {reader} = await this.command("connect_reader", {}) as {
            reader: string
        }
        return reader;
    }
    
    public static async ReadCard(blockNumber: number): Promise<string> {
        return this.command<string>("read_card", {blockNumber});
    }
    
    public static async CloseReader(): Promise<void> {
        return this.command<void>("cancel_read", {});
    }
    
    public static async GetReaderConnection() {
        return this.command<string>("get_connection", {});
    }
    
    public static async GenerateUserId(): Promise<string> {
        return this.command<string>("gen_id", {});
    }
    
    public static async WriteCard(blockNumber: number, data: string): Promise<boolean> {
        return this.command<boolean>("write_card", {blockNumber, data});
    }
    
    public static async InsertNewUser(
        id: string,
        name: string,
        email: string,
        role: string,
        lunch_time: string,
        phone: string,
        permissions_str: string,
    ) {
        return this.command<boolean>("insert_new_user", {
            id,
            name,
            email,
            role,
            lunchTime: lunch_time,
            permissionsStr: permissions_str,
            phone
        });
    }
    
    public static async UpdateUser(
        id: string,
        day: string,
        keyToUpdate: "ClockIn" | "ClockLunchOut" | "ClockLunchReturn" | "ClockOut",
        value: string,
    ) {
        return this.command<boolean>("update_cache_hour_data", {
            id,
            day,
            keyToUpdate,
            value
        });
    }
    
    public static async LoginUser(
        email: string,
        password: string,
    ) {
        try {
            const {user, token, message, code} = await this.command<{
                user: InternalUser,
                token: string,
                message: string,
                code: string
            }>("user_login", {
                email,
                password
            });
            
            const userLogged: UserLogged = {
                id: user.id,
                name: user.worker_data.name,
                image: user.worker_data.name,
                role: user.worker_data.role,
                permissions: user.worker_data.permissions.flags
            }

            return {userLogged, token, message, code};
        } catch (e: any) {
            return {
                userLogged: {},
                token: "",
                message: e
            }
        }
    }
    
    public static async VerifyToken(token: string) {
        return this.command<InternalUser>("verify", {token});
    }
    
    private static async VerifyPermissions(id: string, action: string) {
        return this.command<boolean>("check_permission", {id, action})
    }
    
    public static async CheckPermissions(
        userLogged: UserLogged,
        actions: Permissions[]
    ) {
        if (!userLogged || Object.keys(userLogged).length === 0) return false;
        
        let frontendCheck = false;
        actions.forEach((action) => {
            // @ts-ignore
            if (userLogged.permissions.includes(action)) {
                frontendCheck = true;
            }
        });
        
        const backendChecks = await Promise.all(actions.map(async (action) => {
            // @ts-ignore
            return await TauriApi.VerifyPermissions(userLogged.id, action);
        }));
        
        // Determine if any backend check returned true
        let backendCheck = backendChecks.some(check => check);
        
        return frontendCheck && backendCheck;
    }
    
    /**
     * ------------------------------------------------------------------------------------------
     *
     */
    
    public static async CreateReport(
        dateStart: string,
        dateEnd: string,
        entryTime: string,
        exitTime: string,
        tolerance: string
    ) {
        const users = await this.GetCache();
        return this.command<void>("create_excel_relatory", {dateStart, dateEnd, entryTime, exitTime, tolerance, users});
    }
    
    /**
     * ------------------------------------------------------------------------------------------
     * These commands are used to get metadata from the app.
     * Things like the app version, name, etc.
     * ------------------------------------------------------------------------------------------
     */
    
    public static async GetAppName(): Promise<string> {
        const {getName} = await import("@tauri-apps/api/app");
        return await getName();
    }
    
    public static async GetAppVersion(): Promise<{
        version: string,
        versionName: string
    }> {
        const {getVersion} = await import("@tauri-apps/api/app");
        const version = await getVersion();
        const versionName = await this.command<string>("version_name", {version});
        
        return {
            version,
            versionName
        }
    }
    
    /**
     * ------------------------------------------------------------------------------------------
     * From here on you'll find commands for the Setup,
     * these commands should only be called on the setup page or in really specific conditions,
     * and because of that you SHOULD NOT call these commands in the main app.
     * ------------------------------------------------------------------------------------------
     */
    
    
    // Get cache from AppData
    public static async GetCache() {
        return this.command<CachedUsers>("get_cache", {});
    }
    
    // This command is called ONCE at the splashscreen window to set up the app.
    public static async SetupApp(): Promise<void> {
        return this.command<void>("complete_setup", {task: "finish_frontend"});
    }
    
    // Event listener for each window
    public static async ListenEvent(event: string, callback: (event: any) => void) {
        const {listen} = await import('@tauri-apps/api/event');
        return await listen(event, callback);
    }
}
