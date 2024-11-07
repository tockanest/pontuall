import Label from "@/components/ui/label";
import {Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import Input from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import React from "react";

type HoursSetupProps = {
    horarioEntrada: string,
    setHorarioEntrada: (value: string) => void,
    minutosTolerancia: number,
    setMinutosTolerancia: (value: number) => void,
    horarioSaida: string,
    setHorarioSaida: (value: string) => void,
    horarioSaidaFDS: string,
    setHorarioSaidaFDS: (value: string) => void,
    setSetupStep: (value: number) => void
}

export default function HoursSetup(
    {
        horarioEntrada,
        setHorarioEntrada,
        minutosTolerancia,
        setMinutosTolerancia,
        horarioSaida,
        setHorarioSaida,
        horarioSaidaFDS,
        setHorarioSaidaFDS,
        setSetupStep
    }: HoursSetupProps
) {
    return (
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