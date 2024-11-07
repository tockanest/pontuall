import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    AlertLoop,
    ChevronRightIcon,
    ClockIcon,
    ConfirmCircle,
    ErrorCircle,
    InfoAlert,
    SpinnerIcon
} from "@/components/component/icons";
import React, {useEffect, useState} from "react";
import TauriApi from "@/lib/Tauri";
import {Separator} from "@/components/ui/separator";
import {HandleClockIn, HandleCloseRead, HandleGetUser} from "@/components/main/helpers/home";

type HomePageProps = {
    users: Users
    setUsers: React.Dispatch<React.SetStateAction<Users>>
    clock: string
    userLogged: UserLogged | {}
    setPage: React.Dispatch<React.SetStateAction<Pages>>
}

export default function HomePage(
    {
        users,
        setUsers,
        clock,
        userLogged,
        setPage
    }: HomePageProps
) {

    const [openPunchDialog, setOpenPunchDialog] = useState<boolean>(false);
    const [noCardDialog, setNoCardDialog] = useState<boolean>(false);

    const [messageDialogOpen, setMessageDialogOpen] = useState<boolean>(false);
    const [dialogMessage, setDialogMessage] = useState<{
        message: string,
        subMessage?: string[],
        type: string,
        showDefaultCancel?: boolean
        release?: string
    }>({message: "", type: ""});

    const [clockUser, setClockUser] = useState<IUsers | null>(null);


    const [hasPermissions, setHasPermissions] = useState<boolean>(false);

    useEffect(() => {
        if (!userLogged) return;

        // @ts-ignore
        TauriApi.CheckPermissions(userLogged, ["ReadOthers", "WriteOthers"]).then((check) => {
            setHasPermissions(check);
        })
    }, [userLogged])

    return (
        <>
            <Dialog open={messageDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className={"flex justify-start items-center space-x-2 select-none"}>
                            <ClockIcon className="w-6 h-6 text-primary"/>
                            <p>PontuAll</p>
                        </div>
                        <div className={"flex justify-center items-center mb-6"}>
                            {
                                dialogMessage.type === "success" ?
                                    <ConfirmCircle color={"#70E000"} className="w-16 h-16 text-success"/> :
                                    dialogMessage.type === "destroy" ?
                                        <ErrorCircle color={"#D00000"} className="w-16 h-16 text-destructive"/> :
                                        dialogMessage.type === "warning" ?
                                            <AlertLoop color={"#FFEA00"} className="w-16 h-16 text-warning"/> :
                                            dialogMessage.type === "info" ?
                                                <InfoAlert color={"#FB8500"} className="w-16 h-16 text-info"/> : ""
                            }
                        </div>
                        <DialogTitle className={"text-foreground text-center text-3xl"}>
                            {
                                dialogMessage.type === "success" ? "Sucesso!" :
                                    dialogMessage.type === "destroy" ? "Erro!" :
                                        dialogMessage.type === "warning" ? "Atenção!" :
                                            dialogMessage.type === "info" ? "Informação" : ""
                            }

                        </DialogTitle>
                        <DialogDescription className={"text-center text-foreground text-lg"}>
                            {dialogMessage.message}
                            <Separator className={"m-2"}/>
                            {
                                dialogMessage.subMessage && dialogMessage.subMessage.length > 0 && (
                                    dialogMessage.subMessage.map((message, index) => (
                                            <p key={index} className={"text-muted-foreground"}>
                                                {message}
                                            </p>
                                        )
                                    )
                                )
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        {
                            [
                                {
                                    name: "Confirmar",
                                    variant: "default",
                                    show: dialogMessage.type === "bypass-clock-out",
                                    release: dialogMessage.release ?? "",
                                    showDefaultCancel: dialogMessage.showDefaultCancel ?? false,
                                    onClick: () => {
                                        setDialogMessage({message: "", type: ""});
                                        setMessageDialogOpen(false);
                                        if (!clockUser) {
                                            console.error("No user to clock out.");
                                            return;
                                        }
                                        setOpenPunchDialog(false);
                                        HandleClockIn(
                                            clockUser,
                                            setMessageDialogOpen,
                                            setDialogMessage,
                                            users,
                                            setUsers,
                                            {type: "ClockOut"},
                                        );
                                    }
                                },
                                {
                                    name: "Confirmar",
                                    variant: "default",
                                    show: dialogMessage.type === "bypass-clock-lunch-return",
                                    release: dialogMessage.release ?? "",
                                    showDefaultCancel: dialogMessage.showDefaultCancel ?? false,
                                    onClick: () => {
                                        setDialogMessage({message: "", type: ""});
                                        setMessageDialogOpen(false);
                                        if (!clockUser) {
                                            console.error("No user to clock out.");
                                            return;
                                        }
                                        setOpenPunchDialog(false);
                                        HandleClockIn(
                                            clockUser,
                                            setMessageDialogOpen,
                                            setDialogMessage,
                                            users,
                                            setUsers,
                                            {type: "ClockLunchReturn"}
                                        );
                                    }
                                },
                                {
                                    name: "Fechar",
                                    variant: "destructive",
                                    show: dialogMessage.type === "destroy",
                                    release: dialogMessage.release ?? "",
                                    showDefaultCancel: false,
                                    onClick: () => {
                                        setOpenPunchDialog(false);
                                        setDialogMessage({message: "", type: ""});
                                        setMessageDialogOpen(false);
                                    }
                                },
                                {
                                    name: "Fechar",
                                    variant: "warning",
                                    show: dialogMessage.type === "warning",
                                    showDefaultCancel: false,
                                    release: dialogMessage.release ?? "",
                                    onClick: () => {
                                        setOpenPunchDialog(false);
                                        setDialogMessage({message: "", type: ""});
                                        setMessageDialogOpen(false);
                                    }
                                },
                                {
                                    name: "Fechar",
                                    variant: "default",
                                    show: dialogMessage.type === "info" || dialogMessage.type === "success",
                                    release: dialogMessage.release ?? "",
                                    showDefaultCancel: false,
                                    onClick: () => {
                                        setOpenPunchDialog(false);
                                        setDialogMessage({message: "", type: ""});
                                        setMessageDialogOpen(false);
                                    }
                                }
                            ].map((button, index) => (
                                button.show && (
                                    <div key={index} className={"flex justify-between w-[50%]"}>
                                        {
                                            button.release !== "" && button.release === "clock_out" && (
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => {
                                                        setOpenPunchDialog(false);
                                                        setDialogMessage({message: "", type: ""});
                                                        setMessageDialogOpen(false);
                                                        HandleClockIn(
                                                            clockUser!,
                                                            setMessageDialogOpen,
                                                            setDialogMessage,
                                                            users,
                                                            setUsers,
                                                            {type: "ClockOut"}
                                                        );
                                                    }}
                                                >
                                                    Ponto de Saída
                                                </Button>
                                            )
                                        }
                                        <Button
                                            key={index}
                                            variant={button.variant}
                                            onClick={button.onClick}
                                        >
                                            {button.name}
                                        </Button>
                                        {
                                            button.showDefaultCancel && (
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => {
                                                        setOpenPunchDialog(false);
                                                        setDialogMessage({message: "", type: ""});
                                                        setMessageDialogOpen(false);
                                                    }}
                                                >
                                                    Cancelar
                                                </Button>
                                            )
                                        }
                                    </div>
                                )
                            ))
                        }
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <main className="flex-1 flex flex-col items-center justify-center gap-8 p-4 md:p-8">
                <div className="bg-card rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center gap-6">
                    <div className="text-6xl font-bold">
                        <span className="text-primary">{clock}</span>
                    </div>
                    <div className="flex gap-4">
                        <Dialog open={openPunchDialog}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => {
                                        HandleGetUser(
                                            setOpenPunchDialog,
                                            users,
                                            setClockUser,
                                            setMessageDialogOpen,
                                            setDialogMessage,
                                            setUsers,
                                        )
                                    }}
                                    variant="default"
                                >
                                    Bater Ponto
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md no-close">
                                <DialogHeader>
                                    <DialogTitle>
                                        Aproxime o Cartão do Leitor
                                    </DialogTitle>
                                    <DialogDescription>
                                        Para registrar o ponto, aproxime o cartão do leitor.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex items-center justify-center py-8">
                                    <SpinnerIcon color={"#ffffff"} className={"w-16 h-16 animate-spin"}/>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button
                                            onClick={() => {
                                                setOpenPunchDialog(false);
                                                HandleCloseRead(setClockUser);
                                            }}
                                            variant={"destructive"}
                                        >
                                            Cancelar
                                        </Button>
                                    </DialogClose>
                                    <Dialog open={noCardDialog}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" onClick={() => {
                                                setOpenPunchDialog(false);
                                                HandleCloseRead(setClockUser);
                                                setNoCardDialog(true);
                                            }}>Sem Cartão?</Button>
                                        </DialogTrigger>
                                        <DialogContent className={"no-close"}>
                                            <DialogHeader>
                                                Caso esteja sem cartão, selecione o seu usuário abaixo:
                                                <DialogDescription>
                                                    Será necessário informar a senha ao selecionar o usuário.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4">
                                                {
                                                    users
                                                        .sort((a, b) => a.name.localeCompare(b.name))
                                                        .map((user, index) => (
                                                            <Button
                                                                key={index}
                                                                onClick={() => {

                                                                }}
                                                                variant="default"
                                                                className={"p-6 w-fit"}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="border">
                                                                        <AvatarImage src="/placeholder-user.jpg"/>
                                                                        <AvatarFallback>
                                                                            {
                                                                                user.name.charAt(0).toUpperCase()
                                                                            }
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {user.name}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Button>
                                                        ))
                                                }
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={() => {
                                                    setNoCardDialog(false);
                                                }} variant="destructive">Fechar</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="outline">Código Qr</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>
                            Pontos do Dia
                        </CardTitle>
                        <CardDescription>
                            Lista de todos os pontos registrados hoje:
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 max-h-[256px] min-w-[256px] overflow-y-auto custom-scrollbar">
                            {
                                users.length > 0 ? users.map((user, index) => {

                                    const today = new Date().toLocaleDateString();
                                    if (!user.hour_data) return;

                                    const userData = user.hour_data[today];
                                    return (
                                        <div key={index}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="border">
                                                        <AvatarImage src="/placeholder-user.jpg"/>
                                                        <AvatarFallback>
                                                            {
                                                                user.name.charAt(0).toUpperCase()
                                                            }
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">
                                                            {user.name}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {
                                                                userData?.clock_in ?? "Não registrado"
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <ChevronRightIcon className="w-4 h-4"/>
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle className={"flex flex-row items-center"}>
                                                                <ClockIcon className="w-6 h-6 mr-2"/>
                                                                <span>
                                                                Pontuall
                                                            </span>
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                Mais informações sobre o ponto registrado
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div>
                                                            <div className="grid gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="border">
                                                                        <AvatarImage src="/placeholder-user.jpg"/>
                                                                        <AvatarFallback>
                                                                            {
                                                                                user.name.charAt(0).toUpperCase()
                                                                            }
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {user.name}
                                                                        </div>
                                                                        <div
                                                                            className="text-sm text-muted-foreground">
                                                                            {user.role}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid gap-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="text-muted-foreground">
                                                                            Ponto de Entrada:
                                                                        </div>
                                                                        <div>
                                                                            {
                                                                                userData?.clock_in ?? "Não registrado"
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="text-muted-foreground">
                                                                            Ponto de Saída:
                                                                        </div>
                                                                        <div>
                                                                            {
                                                                                userData?.clocked_out ?? "Não registrado"
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    {
                                                                        hasPermissions && (
                                                                            <>
                                                                                <div
                                                                                    className="border-t border-muted my-2"/>
                                                                                <div
                                                                                    className="flex items-center justify-between">
                                                                                    <div className="text-muted-foreground">
                                                                                        Total de Horas:
                                                                                    </div>
                                                                                    <div>
                                                                                        {
                                                                                            userData?.total_hours ?? "Não registrado"
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                                <div
                                                                                    className="flex items-center justify-between">
                                                                                    <div className="text-muted-foreground">
                                                                                        Intervalo de Almoço (Saída):
                                                                                    </div>
                                                                                    <div>
                                                                                        {
                                                                                            userData?.lunch_break_out ?? "Não registrado"
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                                <div
                                                                                    className="flex items-center justify-between">
                                                                                    <div
                                                                                        className="text-muted-foreground">
                                                                                        Intervalo de Almoço (Retorno):
                                                                                    </div>
                                                                                    <div>
                                                                                        {
                                                                                            userData?.lunch_break_return ?? "Não registrado"
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        )
                                                                    }

                                                                </div>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            {
                                                                hasPermissions && (
                                                                    <div className={"flex gap-4"}>
                                                                        <Button
                                                                            onClick={() => {
                                                                                setPage("admin")
                                                                            }}
                                                                            variant="default">
                                                                            Editar
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            }
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <div className="flex items-center justify-center gap-4">
                                        <ClockIcon className="w-8 h-8 text-muted"/>
                                        <span>
                                        Nenhum ponto registrado hoje
                                    </span>
                                    </div>
                                )
                            }
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    )
}