import React, {useEffect, useState} from "react";
import Header from "@/components/main/Header";
import HomePage from "@/components/main/Home";
import Settings from "@/components/main/Settings";
import TauriApi from "@/lib/Tauri";
import Admin from "@/components/main/Admin";


export default function Pontuall() {
    
    const [userLogged, setUserLogged] = useState<UserLogged | {}>({})
    
    const [users, setUsers] = useState<Users | []>([])
    
    const [clock, setClock] = useState<string>("")
    
    const [page, setPage] = useState<Pages>("home")
    
    const [theme, setTheme] = useState<"deepsea" | "midnight" | "pastel">("midnight");
    const [hourFormat, setHourFormat] = useState<"HH:MM" | "HH:MM:SS">("HH:MM")
    const [dateFormat, setDateFormat] = useState<"12" | "24">("24")
    const [timezone, setTimezone] = useState<string>("America/Sao_Paulo")
    
    useEffect(() => {
        const storedTheme = (checkLocalStorage("theme") as "deepsea" | "midnight" | "pastel") ?? "midnight";
        setTheme(storedTheme);
        
        const storedHourFormat = (checkLocalStorage("hour-format") as "HH:MM" | "HH:MM:SS") ?? "HH:MM";
        const storedDateFormat = (checkLocalStorage("date-format") as "12" | "24") ?? "24";
        const storedTimezone = (checkLocalStorage("timezone") as string) ?? "America/Sao_Paulo";
        
        setHourFormat(storedHourFormat);
        setDateFormat(storedDateFormat);
        setTimezone(storedTimezone);
        
        TauriApi.Connect().then(console.log).catch(console.error)
    }, []);
    
    useEffect(() => {
        const updateClock = () => {
            const browserLocale = navigator.language;
            const date = new Date().toLocaleString(browserLocale, {
                hour: "numeric",
                minute: "numeric",
                second: hourFormat === "HH:MM:SS" ? "numeric" : undefined,
                hour12: dateFormat === "12",
                timeZone: timezone || "America/Sao_Paulo",
            });
            setClock(date);
        };
        
        updateClock();
        const intervalId = setInterval(updateClock, 1000);
        
        return () => clearInterval(intervalId);
    }, [hourFormat, dateFormat, timezone]);
    
    function checkLocalStorage(key: string) {
        return localStorage.getItem(key) ? localStorage.getItem(key) : ""
    }
    
    const hasLoggedUserAndIsAdmin = () => {
        return Object.keys(userLogged).length > 0 && (userLogged as UserLogged).permissions.includes("admin")
    }
    
    useEffect(() => {
        TauriApi.GetCache().then((data) => {
            // Convert the JSON data to an array of objects
            const users = Object.entries(data).map(([key, value]) => {
                return {
                    name: key,
                    ...value
                }
            }) as Users
            
            setUsers(users)
        })
        
        setUserLogged({
            name: "John Doe",
            image: "/placeholder-user.jpg",
            role: "Desenvolvedor",
            permissions: ["admin"]
        } as UserLogged)
    }, [])
    
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header userLogged={userLogged} setPage={setPage}/>
            {
                page === "home" && (
                    <HomePage users={users} clock={clock} hasLoggedUserAndIsAdmin={hasLoggedUserAndIsAdmin}/>) ||
                page === "configuration" && (
                    <Settings
                        userLogged={userLogged}
                        theme={theme}
                        setTheme={setTheme}
                        hourFormat={hourFormat}
                        setHourFormat={setHourFormat}
                        dateFormat={dateFormat}
                        setDateFormat={setDateFormat}
                        timezone={timezone}
                        setTimezone={setTimezone}
                    />
                ) ||
                page === "admin" && (
                    <Admin
                        employees={users}
                    />
                ) || null
            }
        </div>
    )
}


