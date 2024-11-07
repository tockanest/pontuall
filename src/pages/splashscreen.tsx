"use client"

import React, {useEffect, useState} from "react"
import {Progress} from "@/components/ui/progress"
import {ClockIcon} from "@/components/component/icons";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import TauriApi from "@/lib/Tauri";
import HoursSetup from "@/components/splashscreen/HoursSetup";
import MongoDbSetup from "@/components/splashscreen/MongoDbSetup";

async function SetupDatabase(
    appName: string,
    uri?: string,
) {
    try {
        await TauriApi.SetupDatabase(appName, uri || "mongodb://localhost:27017",);
        return true
    } catch (e: any) {
        console.log(e)
        throw new Error(e);
    }
}

async function Setup(
    setBackendSetup: (value: boolean) => void,
    appName: string,
    uri?: string,
) {
    try {
        const setupDb = await SetupDatabase(appName, uri);

        if (setupDb) {
            setBackendSetup(true);
        }

        return true
    } catch (e: any) {
        throw new Error(e);
    }
}

export default function Splashscreen() {
    const [currentStep, setCurrentStep] = useState(1)
    const [progress, setProgress] = useState(0)

    const [setupStep, setSetupStep] = useState(0)
    const [AppConfigured, setAppConfigured] = useState(false)

    const [firstUser, setFirstUser] = useState<FirstUser>({
        id: "",
        username: "",
        password: "",
        registered_at: "",
        worker_data: {
            name: "",
            role: "",
            email: "",
            phone: "",
            permissions: {
                flags: ""
            }
        }
    })

    const [mongoDbUri, setMongoDbUri] = useState<string>("")
    const [appName, setAppName] = useState<string>("")

    const [horarioEntrada, setHorarioEntrada] = useState<string>("")
    const [minutosTolerancia, setMinutosTolerancia] = useState<number>(0)
    const [horarioSaida, setHorarioSaida] = useState<string>("")
    const [horarioSaidaFDS, setHorarioSaidaFDS] = useState<string>("")

    // Step 4 is the final step, where the app sets up the cache and finishes the setup
    const [backendSetup, setBackendSetup] = useState(false);

    useEffect(() => {
        // Assuming localStorage or another mechanism check if setup has already been completed
        if (localStorage.getItem("AppConfigured") === "true") {
            setBackendSetup(true)
            return;
        }
    }, []);

    useEffect(() => {
        if (backendSetup && typeof window !== "undefined") {
            localStorage.setItem("AppConfigured", "true");
            setAppConfigured(true);

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
                        break
                }
            })

            const syncUnlisten = TauriApi.ListenEvent("sync:users", (event) => {
                console.log(event)
            })

            return () => {
                unlisten.then(f => f());
                syncUnlisten.then(f => f());
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
                !AppConfigured ? (
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
                                        // Step 1 is the first step of the setup, where the main user sets the hour for entry, lunch break, return from lunch break, and clock out
                                        setupStep === 1 && HoursSetup({
                                            horarioEntrada,
                                            setHorarioEntrada,
                                            minutosTolerancia,
                                            setMinutosTolerancia,
                                            horarioSaida,
                                            setHorarioSaida,
                                            horarioSaidaFDS,
                                            setHorarioSaidaFDS,
                                            setSetupStep
                                        })
                                    }
                                    {
                                        setupStep === 2 && MongoDbSetup({
                                            mongoDbUri,
                                            appName,
                                            setAppName,
                                            setMongoDbUri,
                                            setSetupStep,
                                            setBackendSetup,
                                            Setup
                                        })
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