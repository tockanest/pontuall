import Label from "@/components/ui/label";
import {Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import Input from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import React from "react";

type MongoDbSetupProps = {
	mongoDbUri: string,
	setMongoDbUri: (value: string) => void,
	setSetupStep: (value: number) => void,
	setBackendSetup: (value: boolean) => void
	Setup: (setBackendSetup: (value: boolean) => void, mongoDbUri?: string) => void
}

export default function MongoDbSetup(
	{
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
					Setup(setBackendSetup, mongoDbUri)
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