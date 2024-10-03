import Label from "@/components/ui/label";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import Input from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import React, {useState} from "react";
import {Check, X} from "lucide-react";

type FirstUserProps = {
	firstUser: FirstUser,
	setFirstUser: React.Dispatch<React.SetStateAction<FirstUser>>,
	setSetupStep: React.Dispatch<React.SetStateAction<number>>
}

interface PasswordRequirement {
	regex: RegExp
	message: string
}

export default function FirstUser(
	{
		firstUser,
		setFirstUser,
		setSetupStep
	}: FirstUserProps
) {
	
	const [showTooltip, setShowTooltip] = useState(false)
	
	const passwordRequirements: PasswordRequirement[] = [
		{regex: /.{10,}/, message: "At least 10 characters long"},
		{regex: /[A-Z]/, message: "At least one uppercase letter"},
		{regex: /[a-z]/, message: "At least one lowercase letter"},
		{regex: /[0-9]/, message: "At least one number"},
		{regex: /[^A-Za-z0-9]/, message: "At least one special character"},
	]
	
	// Fucking hate Typescript sometimes.
	function checkEmptyKeys(): boolean {
		return Object.keys(firstUser).some(key => {
			//@ts-expect-error
			if (typeof firstUser[key] === "object" && firstUser[key] !== null) {
				//@ts-expect-error
				return Object.keys(firstUser[key]).some(k => {
					//@ts-expect-error
					return firstUser[key][k] === ""
				})
			}
			//@ts-expect-error
			return firstUser[key] === ""
		})
	}
	
	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFirstUser({
			...firstUser,
			password: e.target.value
		})
	}
	
	return (
		<div className="mt-8 space-y-6">
			<div className="text-center">
				<h2 className="text-2xl font-bold tracking-tight text-foreground">
					Usuário Administrador
				</h2>
				<p className="mt-2 text-muted-foreground">
					O primeiro usuário é o administrador do sistema, podendo configurar e gerenciar o aplicativo com total
					liberdade.
				</p>
			</div>
			<div className="flex flex-col gap-4">
				<div className={"grid gap-2"}>
					<Label htmlFor={"username"}>
						Nome do Usuário
					</Label>
					<Input
						id="password"
						type="password"
						placeholder="Enter your password"
						value={
							firstUser.password
						}
						onChange={handlePasswordChange}
						onFocus={() => setShowTooltip(true)}
						onBlur={() => setShowTooltip(false)}
						className="pr-10"
					/>
				
				</div>
				<div className={"grid gap-2"}>
					<Label htmlFor={"password"}>
						Senha
					</Label>
					<TooltipProvider>
						<Tooltip open={showTooltip}>
							<TooltipTrigger asChild>
								<div className="relative">
									<Input
										id="password"
										type="password"
										placeholder="Enter your password"
										value={firstUser.password}
										onChange={handlePasswordChange}
										onFocus={() => setShowTooltip(true)}
										onBlur={() => setShowTooltip(false)}
										className="pr-10"
									/>
									{firstUser.password && (
										<span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {passwordRequirements.every(req => req.regex.test(firstUser.password)) ? (
	                  <Check className="h-5 w-5 text-green-500"/>
                  ) : (
	                  <X className="h-5 w-5 text-red-500"/>
                  )}
                </span>
									)}
								</div>
							</TooltipTrigger>
							<TooltipContent side="right" className="w-80">
								<div className="space-y-2">
									<h3 className="font-semibold">Password must have:</h3>
									<ul className="space-y-1">
										{passwordRequirements.map((req, index) => (
											<li key={index} className="flex items-center space-x-2">
												{req.regex.test(firstUser.password) ? (
													<Check className="h-4 w-4 text-green-500"/>
												) : (
													<X className="h-4 w-4 text-red-500"/>
												)}
												<span>{req.message}</span>
											</li>
										))}
									</ul>
								</div>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				<div className="flex gap-4 items-center">
					<Button onClick={() => setSetupStep(1)}>Voltar</Button>
					<Button onClick={() => {
						
						setSetupStep(3)
					}} disabled={
						checkEmptyKeys()
					}>Continuar</Button>
				</div>
			</div>
		</div>
	)
}