
export default class TauriApi {
    private static async command<T>(command: string, args: any): Promise<T> {
        const { invoke } = await import('@tauri-apps/api/core');
        return invoke(command, args);
    }
    
    public static async Connect(): Promise<any> {
        const {reader} = await this.command("connect_reader", {}) as {
            reader: string
        }
        return reader;
    }
    
    public static async ReadCard(blockNumber: number): Promise<string> {
        return this.command<string>("read_card", { blockNumber });
    }
    
    public static async CloseReader(): Promise<void> {
        return this.command<void>("cancel_read", {});
    }
    
    public static async GetReaderConnection() {
        return this.command<string>("get_connection", {});
    }
    
    // Get cache from AppData
    public static async GetCache(): Promise<string> {
        return this.command<unknown>("get_cache", {});
    }
    
    // Event listener for each window
    public static async ListenEvent(event: string, callback: (event: any) => void) {
        const { listen } = await import('@tauri-apps/api/event');
        return await listen(event, callback);
    }
}
