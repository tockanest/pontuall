import React, {useEffect, useState} from "react";
import Header from "@/components/main/Header";
import HomePage from "@/components/main/Home";
import Settings from "@/components/main/Settings";
import TauriApi from "@/lib/Tauri";
import Admin from "@/components/main/Admin";

export default function Pontuall() {
	
	const [userLogged, setUserLogged] = useState<UserLogged | {}>({})
	
	const [users, setUsers] = useState<Users | []>([])
	
	const [page, setPage] = useState<Pages>("home")
	
	const [clock, setClock] = useState<string>("")
	const [theme, setTheme] = useState<"deepsea" | "midnight" | "pastel">("midnight");
	const [hourFormat, setHourFormat] = useState<"HH:MM" | "HH:MM:SS">("HH:MM")
	const [dateFormat, setDateFormat] = useState<"12" | "24">("24")
	const [timezone, setTimezone] = useState<string>("America/Sao_Paulo")
	
	const [version, setVersion] = useState<{
		version: string,
		versionName: string
	}>({
		version: "",
		versionName: ""
	})
	
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
		
		TauriApi.GetCache().then((data) => {
			// Convert the JSON data to an array of objects
			const users = Object.entries(data).map(([key, value]) => {
				return {
					...value
				}
			}) as Users
			
			setUsers(users)
		})
		
		TauriApi.GetAppVersion().then((v) => setVersion(v))
		const getToken = localStorage.getItem("token");
		if (getToken) {
			TauriApi.VerifyToken(getToken).then((user) => {
				const userLogged: UserLogged = {
					id: user.id,
					name: user.worker_data.name,
					image: user.worker_data.name,
					role: user.worker_data.role,
					permissions: user.worker_data.permissions.flags
				}
				
				setUserLogged(userLogged)
			}).catch((e) => {
				console.log(e)
			})
		}
	}, [])
	
	return (
		<div className="flex flex-col min-h-screen bg-background">
			<Header
				setUserLogged={setUserLogged}
				userLogged={userLogged}
				setPage={setPage}
				version={version}
			/>
			{
				page === "home" && (
					<HomePage
						setPage={setPage}
						userLogged={userLogged}
						users={users}
						setUsers={setUsers}
						clock={clock}
					/>
				) ||
				page === "configuration" && (
					<Settings
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
						userLogged={userLogged}
						employees={users}
						setUsers={setUsers}
					/>
				) || null
			}
		</div>
	)
}


