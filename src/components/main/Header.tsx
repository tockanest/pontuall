import Link from "next/link";
import {AlertLoop, ClockIcon, SettingsIcon} from "@/components/component/icons";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import React, {SetStateAction, useEffect, useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";

import Label from "@/components/ui/label"
import Input from "@/components/ui/input"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import TauriApi from "@/lib/Tauri";

export default function Header(
    {
        userLogged,
        setUserLogged,
        setPage,
        version
    }: {
        userLogged: UserLogged | {},
        setUserLogged: React.Dispatch<SetStateAction<UserLogged | {}>>,
        setPage: React.Dispatch<SetStateAction<Pages>>
        version: {
            version: string,
            versionName: string
        }
    }
) {

    const [loginError, setLoginError] = useState<string>("");
    const [isOffline, setIsOffline] = useState<boolean>(false);

    const [loginInfo, setLoginInfo] = useState<{
        email: string,
        password: string
    }>({email: "", password: ""})

    async function HandleLogin() {
        // Check if any of the fields are empty
        if (!loginInfo.email || !loginInfo.password) {
            return;
        }


        // Call the login function
        const {userLogged, token, message, code} = await TauriApi.LoginUser(loginInfo.email, loginInfo.password);

        // If the user is logged, set the state
        if (Object.keys(userLogged).length > 0) {
            setUserLogged(userLogged);
            localStorage.setItem("token", token);
        } else {
            setLoginError(message);
        }

    }

    const [hasPermission, setHasPermission] = useState<boolean>(false);
    useEffect(() => {
        if (!userLogged || Object.keys(userLogged).length === 0) return;

        const backendChecks = async () => {
            const allowedPermissions = [
                "WriteOthers",
                "Supervisor",
                "Administrator"
            ]

            let checkAdmin = false;
            for (const permission of allowedPermissions) {
                const check = await TauriApi.CheckPermissions(userLogged as UserLogged, [permission as AppPermissions]);
                console.log(`Permission ${permission} is ${check}`)
                if (check) {
                    checkAdmin = true;
                }
            }

            return checkAdmin;
        }

        backendChecks().then((checks) => {
            setHasPermission(checks);
        });

    }, [userLogged])

    useEffect(() => {
        TauriApi.ListenEvent("status:offline", (event) => {
            const newEvent = event.payload as boolean;
            setIsOffline(newEvent);
        })
    }, [])


    return (
        <header className="flex items-center justify-between h-16 px-6 border-b border-muted">
            <Link onClick={() => setPage("home")} className="flex items-center gap-2 text-lg font-semibold" href={"#"}>
                <ClockIcon className="w-6 h-6"/>
                <span>
                        Pontuall
                </span>
            </Link>
            <div className="flex items-center gap-4">
                {
                    isOffline && (
                        <TooltipProvider>
                            <TooltipTrigger>
                                <div className={"bg-red-600 w-6 h-fit rounded-md flex items-center justify-center"}>
                                    <AlertLoop color={"#D00000"} className="w-16 h-16 text-warning"/>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <span className={"text-xs"}>
                                    O aplicativo não conseguiu se conectar à internet, algumas funcionalidades podem não estar disponíveis.
                                </span>
                            </TooltipContent>
                        </TooltipProvider>
                    )
                }
                {
                    Object.keys(userLogged).length > 0 ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <Avatar className="border">
                                        <AvatarImage src={
                                            (userLogged as UserLogged).image || "/placeholder-user.jpg"
                                        }/>
                                        <AvatarFallback>
                                            {(userLogged as UserLogged).name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel className={"flex flex-row items-center select-none"}>
                                    <Avatar className="border w-8 h-8 mr-1.5">
                                        <AvatarImage src={
                                            (userLogged as UserLogged).image || "/placeholder-user.jpg"
                                        }/>
                                        <AvatarFallback>
                                            {(userLogged as UserLogged).name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {(userLogged as UserLogged).name}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem
                                    onClick={() => setPage("profile")}
                                    className={"cursor-pointer"}
                                >
                                    Meu Perfil
                                </DropdownMenuItem>
                                {
                                    hasPermission && (
                                        <>
                                            <DropdownMenuItem
                                                onClick={() => setPage("admin")}
                                                className={"cursor-pointer"}
                                            >
                                                Administração
                                            </DropdownMenuItem>
                                        </>
                                    )
                                }
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem
                                    onClick={() => {
                                        void (0)
                                    }}
                                    className={"cursor-pointer"}
                                >
                                    Sair
                                </DropdownMenuItem>

                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline">Login</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Login</DialogTitle>
                                    <DialogDescription className={"flex flex-col"}>
                                        Insira suas credenciais para acessar o sistema.
                                        {
                                            loginError && (
                                                <span className="text-red-500">
                                                    {loginError}
                                                </span>
                                            )
                                        }
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">E-mail</Label>
                                        <Input onChange={(e) => {
                                            setLoginInfo({
                                                ...loginInfo,
                                                email: e.target.value
                                            })
                                        }} id="email" type="email" placeholder="m@example.com" required
                                               value={loginInfo.email}/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Senha</Label>
                                        <Input onChange={(e) => {
                                            setLoginInfo({...loginInfo, password: e.target.value})
                                        }} id="password" type="password" required value={loginInfo.password}/>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => {
                                        HandleLogin()
                                    }}>Login</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )
                }
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Avatar className="border flex justify-center items-center">
                                <SettingsIcon className="w-5 h-5"/>
                                <span className="sr-only">Configurações</span>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            className={"cursor-pointer"}
                            onClick={() => setPage("configuration")}
                        >
                            Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem
                            className={"cursor-pointer"}
                            onClick={() => setPage("about")}
                        >
                            Sobre
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className={"cursor-pointer"}
                            onClick={() => setPage("help")}
                        >
                            Ajuda
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem
                            className={"select-none"}
                        >
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className={"text-sm"}>
                                            Versão: {version.version}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span className={"text-xs"}>
                                            {version.versionName}
                                        </span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}