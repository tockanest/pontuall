import Label from "@/components/ui/label";
import {Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import Input from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import React from "react";

type MongoDbSetupProps = {
    appName: string,
    setAppName: React.Dispatch<React.SetStateAction<string>>,
    mongoDbUri: string,
    setMongoDbUri: React.Dispatch<React.SetStateAction<string>>,
    setSetupStep: React.Dispatch<React.SetStateAction<number>>,
    setBackendSetup: (value: boolean) => void
    Setup: (setBackendSetup: (value: boolean) => void, appName: string, mongoDbUri: string) => void
}

export default function MongoDbSetup(
    {
        appName,
        setAppName,
        mongoDbUri,
        setMongoDbUri,
        setSetupStep,
        setBackendSetup,
        Setup
    }: MongoDbSetupProps
) {
    return (
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
                    <Label htmlFor={"companyName"}>
                        Nome da Aplicação
                    </Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Input
                                    id={"companyName"}
                                    placeholder={"Nome da Aplicação"}
                                    value={appName}
                                    onChange={(e) => setAppName(e.target.value)}
                                />
                            </TooltipTrigger>
                            <TooltipContent
                                className={"text-center text-clip max-w-[500px]"}>
								<span>
									O nome da aplicação é o nome da sua empresa ou do
									projeto. Preferencialmente, utilize um nome curto e
									sem espaços.
								</span><br/>
                                <span>
									Exemplo: pontuall
								</span>
                                <TooltipArrow className={"TooltipArrow"}/>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
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
								<span>
									A URI do MongoDB é o endereço de conexão com o banco de dados MongoDB.
								</span><br/>
                                <span>
									Exemplo: mongodb://localhost:27017/
								</span>
                                <TooltipArrow className={"TooltipArrow"}/>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="flex gap-4 items-center">
                    <Button onClick={() => setSetupStep(1)}>Voltar</Button>
                    <Button onClick={() => {
                        Setup(setBackendSetup, appName, mongoDbUri)
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