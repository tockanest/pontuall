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
import {ChevronRightIcon, ClockIcon, SpinnerIcon} from "@/components/component/icons";
import React from "react";

type HomePageProps = {
    users: Users
    clock: string
    hasLoggedUserAndIsAdmin: () => boolean
}

export default function HomePage(
    {
        users,
        clock,
        hasLoggedUserAndIsAdmin
    }: HomePageProps
) {
    
    const today = new Date().toLocaleDateString();
    
    return (
        <main className="flex-1 flex flex-col items-center justify-center gap-8 p-4 md:p-8">
            <div className="bg-card rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center gap-6">
                <div className="text-6xl font-bold">
                    <span className="text-primary">{clock}</span>
                </div>
                <div className="flex gap-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="default">
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
                                <SpinnerIcon className={"w-16 h-16 animate-spin"}/>
                            </div>
                            <DialogFooter>
                                <DialogClose>
                                    <Button variant={"destructive"}>
                                        Cancelar
                                    </Button>
                                </DialogClose>
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
                                const userData = user.hour_data[today]
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
                                                                    hasLoggedUserAndIsAdmin() && (
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
                                                                                    Intervalo de Almoço:
                                                                                </div>
                                                                                <div>
                                                                                    {
                                                                                        userData?.lunch_break ?? "Não registrado"
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
                                                            hasLoggedUserAndIsAdmin() && (
                                                                <div className={"flex gap-4"}>
                                                                    <Button variant="destructive">
                                                                        Excluir
                                                                    </Button>
                                                                    <Button variant="default">
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
    )
}