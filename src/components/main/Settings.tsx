import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import React, {useState} from "react";
import Label from "@/components/ui/label";
import {allTimezones, useTimezoneSelect} from "react-timezone-select"
import {Button} from "@/components/ui/button";
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
import {SpinnerIcon} from "@/components/component/icons";
import TauriApi from "@/lib/Tauri";

const labelStyle = "original"
const timezones = {
    ...allTimezones,
}

type SettingsProps = {
    timezone: string
    dateFormat: "12" | "24"
    userLogged: UserLogged | {}
    hourFormat: "HH:MM" | "HH:MM:SS"
    theme: "deepsea" | "midnight" | "pastel"
    setTimezone: React.Dispatch<React.SetStateAction<string>>
    setDateFormat: React.Dispatch<React.SetStateAction<"12" | "24">>
    setHourFormat: React.Dispatch<React.SetStateAction<"HH:MM" | "HH:MM:SS">>
    setTheme: React.Dispatch<React.SetStateAction<"deepsea" | "midnight" | "pastel">>
}

export default function Settings(
    {
        userLogged,
        theme,
        setTheme,
        hourFormat,
        setHourFormat,
        dateFormat,
        setDateFormat,
        timezone,
        setTimezone
    }: SettingsProps
) {
    
    const {options, parseTimezone} = useTimezoneSelect({labelStyle, timezones})
    const [cardData, setCardData] = useState<{ block: number, data: string }[]>([]);
    const [reader, setReader] = useState<string>("");
    const [open, setOpen] = useState(false);
    
    async function HandleReadCard() {
        try {
            if (typeof window !== "undefined") {
                const readableBlocks = [4, 5, 6, 8]
                for (const block of readableBlocks) {
                    const data = await TauriApi.ReadCard(block)
                    setCardData((prev) => [...prev, {block, data}])
                }
            }
        } catch (e: any) {
            console.log(e)
        }
    }
    
    async function HandleCloseRead() {
        setCardData([])
        
        try {
            if (typeof window !== "undefined") {
                await TauriApi.CloseReader()
            }
        } catch (e: any) {
            console.log(e)
        }
    }
    
    async function HandleReaderConnectivityTest() {
        try {
            if (typeof window !== "undefined") {
                const reader = await TauriApi.GetReaderConnection()
                if (reader !== "") {
                    setReader(reader)
                }
            }
        } catch (e: any) {
            console.log(e)
        }
    }
    
    return (
        <div className="bg-background rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">Configurações</h2>
            <p className="text-muted-foreground">
                Aqui você pode configurar o app.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Geral</CardTitle>
                        <CardDescription>Configurações Gerais do App</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <Label htmlFor="theme">Tema</Label>
                            <Select
                                defaultValue={theme}
                                onValueChange={(value) => {
                                    // Set the theme
                                    document.documentElement.setAttribute("data-theme", value)
                                    localStorage.setItem("theme", value)
                                    setTheme(value as "deepsea" | "midnight" | "pastel")
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um Tema"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="midnight">Meia-Noite</SelectItem>
                                    <SelectItem value="deepsea">Mar Profundo</SelectItem>
                                    <SelectItem value="pastel">Pastel</SelectItem>
                                    <SelectItem value="daylight">Claro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor={"date-format"}>Formato de Horário</Label>
                            <Select
                                defaultValue={dateFormat}
                                onValueChange={(value) => {
                                    localStorage.setItem("date-format", value)
                                    setDateFormat(value as "12" | "24")
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um Formato"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="24">24 Horas</SelectItem>
                                    <SelectItem value="12">12 Horas (AM-PM)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor={"hour-format"}>Formato de Hora</Label>
                            <Select
                                defaultValue={hourFormat}
                                onValueChange={(value) => {
                                    localStorage.setItem("hour-format", value)
                                    setHourFormat(value as "HH:MM" | "HH:MM:SS")
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um Formato"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="HH:MM">HH:MM</SelectItem>
                                    <SelectItem value="HH:MM:SS">HH:MM:SS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor={"timezone"}>Fuso Horário</Label>
                            <Select
                                defaultValue={timezone}
                                onValueChange={(value) => {
                                    const tz = parseTimezone(value)
                                    localStorage.setItem("timezone", tz.value)
                                    setTimezone(tz.value)
                                }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um Fuso Horário"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {options.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Leitor NFC</CardTitle>
                        <CardDescription>Configure seu Leitor NFC</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className={"flex flex-row"}>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        onClick={async () => {
                                            await HandleReaderConnectivityTest();
                                        }}
                                        variant={"secondary"}
                                        className={"min-w-fit w-[145px] max-w-[145px] mr-2"}
                                    >
                                        Verificar Conexão
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Teste de Conectividade
                                        </DialogTitle>
                                    </DialogHeader>
                                    {
                                        reader === "" ? (
                                            <DialogDescription>
                                                Não foi possível conectar ao leitor.
                                            </DialogDescription>
                                        ) : (
                                            <DialogDescription>
                                                Conectado ao leitor <strong>{reader}</strong>.
                                            </DialogDescription>
                                        )
                                    }
                                </DialogContent>
                            </Dialog>
                            <Dialog modal open={open}>
                                <DialogTrigger asChild>
                                    <Button onClick={async () => {
                                        setOpen(true)
                                        await HandleReadCard();
                                    }} variant={"secondary"} className={"min-w-fit w-[145px] max-w-[145px] mr-2"}>
                                        Testar Leitor
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className={"no-close"} onInteractOutside={() => {
                                    setOpen(false)
                                    HandleCloseRead()
                                }}>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Informações do Cartão
                                        </DialogTitle>
                                        <DialogDescription>
                                            {
                                                cardData.length === 0 ? "Aproxime o cartão do leitor." : "Cartão lido com sucesso."
                                            }
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className={"space-y-2"}>
                                        {
                                            cardData.length === 0 && (
                                                <div className="flex items-center justify-center py-8">
                                                    <SpinnerIcon className={"w-16 h-16 animate-spin"}/>
                                                </div>
                                            )
                                        }
                                        {cardData.map((data) => (
                                                <div key={data.block}>
                                                    <p>
                                                        Bloco: <strong>{data.block}</strong>
                                                    </p>
                                                    <p>
                                                        Dados: <strong>{
                                                        // Remove null characters
                                                        data.data.replace(/\0/g, "")
                                                    }</strong>
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button onClick={() => {
                                                if (cardData.length === 0) {
                                                    HandleCloseRead()
                                                } else {
                                                    setCardData([])
                                                }
                                                setOpen(false)
                                            }} variant={"destructive"}>
                                                Fechar
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}