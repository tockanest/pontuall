"use client"

import React, {useEffect, useState} from "react"
import {Progress} from "@/components/ui/progress"
import {ClockIcon} from "@/components/component/icons";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";
import {Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import TauriApi from "@/lib/Tauri";

async function SetupDatabase(
    uri?: string
) {
    try {
        const {Store} = await import("@tauri-apps/plugin-store");
        let mongo_uri = uri || "mongodb://localhost:27017";

        const store = new Store(`config.cfg`);

        // On windows, it stores at %APPDATA%/Roaming/PontuAll/config.cfg
        await store.set("mongo_uri", mongo_uri);
        await store.save();

        return true
    } catch (e: any) {
        throw new Error(e);
    }
}

async function Setup(
    vaultName: string,
    password: string,
    setBackendSetup: (value: boolean) => void,
    uri?: string,
) {
    try {
        await SetupDatabase(uri);

        setBackendSetup(true);

        return true
    } catch (e: any) {
        throw new Error(e);
    }
}

export default function Splashscreen() {
    const [currentStep, setCurrentStep] = useState(1)
    const [progress, setProgress] = useState(0)

    const [setupStep, setSetupStep] = useState(0)
    const [strongholdConfigured, setStrongholdConfigured] = useState(false)

    // Step 1
    const [vaultName, setVaultName] = useState<string>("")
    const [vaultPassword, setVaultPassword] = useState<string>("")

    // Step 2
    const [mongoDbUri, setMongoDbUri] = useState<string>("")

    // Step 3 is where you set data for the clock in and clock out times
    const [horarioEntrada, setHorarioEntrada] = useState<string>("")
    const [minutosTolerancia, setMinutosTolerancia] = useState<number>(0)
    const [horarioSaida, setHorarioSaida] = useState<string>("")
    const [horarioSaidaFDS, setHorarioSaidaFDS] = useState<string>("")

    // Step 4 is the final step, where the app sets up the cache and finishes the setup
    const [backendSetup, setBackendSetup] = useState(false);

    useEffect(() => {
        localStorage.setItem("appReady", "false");
        // Assuming localStorage or another mechanism check if setup has already been completed
        if (localStorage.getItem("StrongholdConfigured")) {
            setStrongholdConfigured(true);
            TauriApi.SetupApp();
            setBackendSetup(true)
        }
    }, []);

    useEffect(() => {
        console.log(backendSetup)
        if (backendSetup && typeof window !== "undefined") {
            localStorage.setItem("StrongholdConfigured", "true");
            setStrongholdConfigured(true);

            TauriApi.SetupApp();

            const unlisten = TauriApi.ListenEvent("splashscreen:progress", (event) => {
                const newEvent = event.payload as [key: string, true]

                switch (newEvent[0]) {
                    case "database":
                        setCurrentStep(2)
                        setProgress(30)
                        break
                    case "cache":
                        setCurrentStep(3)
                        setProgress(60)
                        break
                    case "finish":
                        setCurrentStep(4)
                        setProgress(100)
                        localStorage.setItem("appReady", "true")
                        break
                }
            })

            return () => {
                unlisten.then(f => f());
            };
        }
    }, [backendSetup])

    useEffect(() => {

        const values = [
            horarioEntrada,
            minutosTolerancia,
            horarioSaida
        ];

        // Check if a value is set, and if it is, create the localStorage item
        if (values.every(value => value !== "")) {
            localStorage.setItem("HorarioEntrada", horarioEntrada);
            localStorage.setItem("MinutosTolerancia", minutosTolerancia.toString());
            localStorage.setItem("HorarioSaida", horarioSaida);
            localStorage.setItem("HorarioSaidaFDS", horarioSaidaFDS);
        }

    }, [
        horarioEntrada,
        minutosTolerancia,
        horarioSaida,
        horarioSaidaFDS
    ])

    return (
        <>
            {
                !strongholdConfigured ? (
                    <>
                        <div
                            className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-[#f0f0f0] to-[#e0e0e0] dark:from-[#1a1a1a] dark:to-[#121212]">
                            <div className="relative w-full max-w-md px-4 sm:px-6 lg:px-8">

                                <div className="animate-fade-out">
                                    <ClockIcon className="mx-auto h-16 w-16 text-primary"/>
                                </div>

                                <div className="mt-8 space-y-6">
                                    {
                                        setupStep === 0 && (
                                            <>
                                                <div className="text-center">
                                                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                                        Bem Vindo ao Pontuall!
                                                    </h1>
                                                    <p className="mt-2 text-muted-foreground">
                                                        O aplicativo de ponto mais completo do mercado.
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-4">
                                                    <Button className="w-full" onClick={() => setSetupStep(1)}>
                                                        Começar
                                                    </Button>
                                                    <Link
                                                        href="#"
                                                        className="inline-flex w-full justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                                        prefetch={false}
                                                    >
                                                        Saiba mais
                                                    </Link>
                                                </div>
                                            </>
                                        )
                                    }
                                    {
                                        setupStep === 1 && (
                                            <div className="mt-8 space-y-6">
                                                <div className="text-center">
                                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                                        Configuração de Horários
                                                    </h2>
                                                    <p className="mt-2 text-muted-foreground">
                                                        Os horários de entrada e saída são necessários para o
                                                        funcionamento do aplicativo.
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-4">
                                                    <div className={"grid gap-2"}>
                                                        <Label htmlFor={"horarioEntrada"}>
                                                            Horário de Entrada
                                                        </Label>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Input
                                                                        id={"horarioEntrada"}
                                                                        type={"time"}
                                                                        placeholder={"00:00:00"}
                                                                        value={horarioEntrada}
                                                                        onChange={(e) => setHorarioEntrada(e.target.value + ":00")}
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent
                                                                    className={"text-center text-clip max-w-[500px]"}>
                                                                    O horário de entrada é o horário em que os funcionários
                                                                    devem bater o ponto.
                                                                    <TooltipArrow className={"TooltipArrow"}/>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                    <div className={"grid gap-2"}>
                                                        <Label htmlFor={"minTolerancia"}>
                                                            Minutos de Tolerância
                                                        </Label>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Input
                                                                        id={"minTolerancia"}
                                                                        type={"number"}
                                                                        max={60}
                                                                        placeholder={"10"}
                                                                        value={minutosTolerancia}
                                                                        onChange={(e) => setMinutosTolerancia(parseInt(e.target.value))}
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent
                                                                    className={"text-center text-clip max-w-[500px]"}>
                                                                    Os minutos de tolerância são os minutos que o
                                                                    funcionário
                                                                    pode atrasar sem ser penalizado. Normalmente o máximo
                                                                    tolerado é de 10 minutos.
                                                                    <TooltipArrow className={"TooltipArrow"}/>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                    <div className={"grid gap-2"}>
                                                        <Label htmlFor={"horarioSaida"}>
                                                            Horário de Saída
                                                        </Label>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Input
                                                                        id={"horarioSaida"}
                                                                        type={"time"}
                                                                        placeholder={"00:00:00"}
                                                                        value={horarioSaida}
                                                                        onChange={(e) => setHorarioSaida(e.target.value + ":00")}
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent
                                                                    className={"text-center text-clip max-w-[500px]"}>
                                                                    O horário de saída é o horário em que os funcionários
                                                                    devem bater o ponto quando a jornada de trabalho
                                                                    termina.
                                                                    <TooltipArrow className={"TooltipArrow"}/>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                    <div className={"grid gap-2"}>
                                                        <Label htmlFor={"horarioSaidaFDS"}>
                                                            Horário de Saída - Finais de Semana
                                                        </Label>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Input
                                                                        id={"horarioSaidaFDS"}
                                                                        type={"time"}
                                                                        placeholder={"00:00:00"}
                                                                        value={horarioSaidaFDS}
                                                                        onChange={(e) => {
                                                                            // Prefix a: 00 to the time
                                                                            setHorarioSaidaFDS(e.target.value + ":00")
                                                                        }}
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent
                                                                    className={"text-center text-clip max-w-[500px]"}>
                                                                    Este horário é opcional, caso não seja preenchido, o
                                                                    horário de saída padrão será utilizado.
                                                                    <TooltipArrow className={"TooltipArrow"}/>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                    <div className="flex gap-4 items-center">
                                                        <Button onClick={() => setSetupStep(1)}>Voltar</Button>
                                                        <Button onClick={() => {
                                                            setSetupStep(2)
                                                        }} disabled={
                                                            horarioEntrada === "" || minutosTolerancia === 0 || horarioSaida === ""
                                                        }>Continuar</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    {
                                        setupStep === 2 && (
                                            <div className="mt-8 space-y-6">
                                                <div className="text-center">
                                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                                        Configuração do Banco de Dados
                                                    </h2>
                                                    <p className="mt-2 text-muted-foreground">
                                                        Por favor, responda às seguintes informações para configurar o
                                                        banco de dados.
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-4">
                                                    <div className={"grid gap-2"}>
                                                        <Label htmlFor={"mongoDbUri"}>
                                                            URI do MongoDB
                                                        </Label>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Input
                                                                        id={"mongoDbUri"}
                                                                        placeholder={"URI do MongoDB"}
                                                                        value={mongoDbUri}
                                                                        onChange={(e) => setMongoDbUri(e.target.value)}
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent
                                                                    className={"text-center text-clip max-w-[500px]"}>
                                                                    A URI do MongoDB é o endereço de conexão com o banco de
                                                                    dados MongoDB.
                                                                    <TooltipArrow className={"TooltipArrow"}/>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                    <div className="flex gap-4 items-center">
                                                        <Button onClick={() => setSetupStep(1)}>Voltar</Button>
                                                        <Button onClick={() => {
                                                            Setup(vaultName, vaultPassword, setBackendSetup, mongoDbUri)
                                                        }}>Finalizar</Button>
                                                        <p className={"text-muted-foreground text-sm italic"}>
                                                            * Caso esteja utilizando um banco de dados local, pule esta
                                                            etapa.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-screen bg-background">
                        <div className="flex flex-col items-center space-y-6">
                            <ClockIcon className="w-16 h-16 text-primary"/>
                            <div className="text-2xl font-bold">
                                {currentStep === 1 && "Iniciando Aplicativo..."}
                                {currentStep === 2 && "Carregando banco de dados..."}
                                {currentStep === 3 && "Carregando cache..."}
                                {currentStep === 4 && "Finalizando..."}
                            </div>
                            <div className="w-full min-w-[300px] max-w-md">
                                <Progress value={progress} className="bg-muted"/>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    )
}