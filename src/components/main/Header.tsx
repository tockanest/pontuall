import Link from "next/link";
import {ClockIcon, SettingsIcon} from "@/components/component/icons";
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
import React, {SetStateAction, useState} from "react";
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

export default function Header(
    {
        userLogged,
        setPage
    }: {
        userLogged: UserLogged | {},
        setPage: React.Dispatch<SetStateAction<Pages>>
    }
) {
    
    const [loginInfo, setLoginInfo] = useState<{
        email: string,
        password: string
    }>({email: "", password: ""})
    
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
                                    (userLogged as UserLogged).permissions.includes("admin") && (
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
                                    <DialogDescription>
                                        Insira suas credenciais para acessar o sistema.
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
                                    <Button type="submit">Login</Button>
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
                            <span className={"text-sm"}>Versão 2.0.0</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}