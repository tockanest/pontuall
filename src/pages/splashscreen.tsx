"use client"

import React, {useEffect, useState} from "react"
import {Progress} from "@/components/ui/progress"
import {ClockIcon} from "@/components/component/icons";
import {Button} from "@/components/ui/button";
import Label from "@/components/ui/label";
import Input from "@/components/ui/input";
import Link from "next/link";

async function SetupStronghold(
    vaultName: string,
    password: string
) {
    const {Stronghold} = await import("@tauri-apps/plugin-stronghold");
    const {Client: StrongholdClient} = await import("@tauri-apps/plugin-stronghold");
    const {appDataDir} = await import("@tauri-apps/api/path");
    
    const vaultPath = `${await appDataDir()}/vault.hold`;
    const stronghold = await Stronghold.load(vaultPath, password);
    
    let client: StrongholdClient
    try {
        client = await stronghold.loadClient(vaultName);
    } catch (e) {
        client = await stronghold.createClient(vaultName);
    }
    
    return {
        stronghold,
        client,
    }
}

export default function Splashscreen() {
    const [currentStep, setCurrentStep] = useState(1)
    const [progress, setProgress] = useState(0)
    
    const [showSetup, setShowSetup] = useState(false)
    const [strongholdConfigured, setStrongholdConfigured] = useState(false)
    
    useEffect(() => {
        
        const StrongholdConfigured = localStorage.getItem("StrongholdConfigured")
        
        if (!StrongholdConfigured) {
            setStrongholdConfigured(false)
        } else {
            setStrongholdConfigured(true)
        }
        
        // if(typeof window !== "undefined") {
        //     TauriApi.ListenEvent("splashscreen:progress", (event) => {
        //         const newEvent = event.payload as [key: string, true]
        //         console.log(newEvent)
        //         // Main keys are "database" and "cache"
        //         switch(newEvent[0]) {
        //             case "database":
        //                 setCurrentStep(2)
        //                 break
        //             case "cache":
        //                 setCurrentStep(3)
        //                 break
        //             case "finish":
        //                 setCurrentStep(4)
        //                 break
        //         }
        //     })
        // }
    }, [
        strongholdConfigured
    ])
    
    useEffect(() => {
        setProgress(currentStep * 25);
        
    }, [currentStep, progress])
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
                                    {!showSetup && (
                                        <div className="text-center">
                                            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                                Bem Vindo ao Pontuall!
                                            </h1>
                                            <p className="mt-2 text-muted-foreground">
                                                O aplicativo de ponto mais completo do mercado.
                                            </p>
                                        </div>
                                    )}
                                    {!showSetup && (
                                        <div className="flex flex-col gap-4">
                                            <Button className="w-full" onClick={() => setShowSetup(true)}>
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
                                    )}
                                    {showSetup && (
                                        <div className="mt-8 space-y-6">
                                            <div className="text-center">
                                                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                                    Configuração do Aplicativo
                                                </h2>
                                                <p className="mt-2 text-muted-foreground">
                                                    Por favor, responda às seguintes informações para configurar o aplicativo.
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="name">Name</Label>
                                                    <Input id="name" placeholder="Enter your name"/>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input id="email" type="email" placeholder="Enter your email"/>
                                                </div>
                                                <Button className="w-full" onClick={() => setShowSetup(false)}>
                                                    Continue
                                                </Button>
                                            </div>
                                        </div>
                                    )}
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
                            <div className="w-full max-w-md">
                                <Progress value={progress} className="bg-muted"/>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    )
}