import React, {useEffect, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import Label from "@/components/ui/label";
import Input from "@/components/ui/input";
import Employees from "@/components/main/subComponents/admin/employees";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import TauriApi from "@/lib/Tauri";
import AddEmployee from "@/components/main/subComponents/admin/addEmployee";
import {checkPermission} from "@/lib/utils";



export default function Admin(
	{
		userLogged,
		employees,
		setUsers
	}: {
		userLogged: UserLogged | {},
		employees: Users,
		setUsers: React.Dispatch<React.SetStateAction<Users | []>>
	}
) {
	
	const [permissions, setPermissions] = useState<StatePermissions | null>(null)
	
	useEffect(() => {
		if (!userLogged || Object.keys(userLogged).length === 0) {
			window.location.href = "/"
			return;
		}
		const user = userLogged as UserLogged;
		
		const ChangeHoursPermissions = [
			"WriteSelf",
			"WriteOthers",
			"ReadOthers",
			"EditHours"
		];
		
		const RelatoryPermissions = [
			"CreateReports"
		];
		
		for (const permission of ChangeHoursPermissions) {
			TauriApi.CheckPermissions(user, [permission as AppPermissions]).then((res) => {
				console.log(`Permission ${permission} is ${res}`)
				setPermissions((prev) => {
					return {
						...prev,
						[permission]: res
					}
				})
			})
		}
	}, [])
	
	const [searchTerm, setSearchTerm] = useState<string>("")
	
	const [selectedEmployee, setSelectedEmployee] = useState<IUsers | null>(null)
	const [selectedDate, setSelectedDate] = useState<string>("")
	
	const [relStartDate, setRelStartDate] = useState<string>("")
	const [relEndDate, setRelEndDate] = useState<string>("")
	
	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};
	
	// Filter employees based on search term
	const filteredEmployees = searchTerm
		? employees.filter(employee =>
			employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
		)
		: employees;
	
	async function GetUserData(employeeId: string) {
		const user = employees.find(employee => employee.id === employeeId)
		
		if (!user) return;
		
		setSelectedEmployee(user)
		return;
	}
	const createReports = checkPermission("CreateReports", permissions!);
	
	return (
		<div className="bg-background rounded-lg shadow-sm p-6">
			<h2 className="text-2xl font-bold mb-4">Administração</h2>
			<p className="text-muted-foreground">
				Administre o sistema aqui.
			</p>
			<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 w-fit">
				<Card className={"max-h-[1080px] min-w-[580px] overflow-y-auto custom-scrollbar"}>
					<CardHeader>
						<CardTitle>Pontos</CardTitle>
						<CardDescription>Verifique os Pontos de Funcionários</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 w-full">
							<Label htmlFor="search">
								Procurar por:
							</Label>
							<Input id="search" placeholder="E-mail ou Nome" value={searchTerm}
							       onChange={handleSearchChange}/>
						</div>
						<div className={"grid gap-4 w-full"}>
							<Employees
								selectedEmployee={selectedEmployee}
								filteredEmployees={filteredEmployees}
								selectedDate={selectedDate}
								setSelectedDate={setSelectedDate}
								setUsers={setUsers}
								GetData={GetUserData}
								Permissions={permissions}
							/>
						</div>
					</CardContent>
				</Card>
				<Card className={"h-fit min-w-[580px] overflow-y-auto custom-scrollbar"}>
					<CardHeader>
						<CardTitle>
							Gerenciamento
						</CardTitle>
						<CardDescription>Funções de Gerenciamento</CardDescription>
					</CardHeader>
					<CardContent className={"space-y-2"}>
						<div className={"flex flex-row justify-evenly items-center"}>
							<AddEmployee
								setUsers={setUsers}
							/>
							<Button variant={"secondary"}>Configurar Horários</Button>
							<Dialog>
								<DialogTrigger asChild>
									<Button aria-disabled={!createReports} variant={"secondary"}>Gerar Relatório</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>
											Gerar Relatório
										</DialogTitle>
									</DialogHeader>
									<div className={"grid gap-4"}>
										<Label htmlFor={"date"}>
											Data de Início
										</Label>
										<Input id={"date"} type={"date"} value={relStartDate}
										       onChange={(e) => setRelStartDate(e.target.value)}/>
										<Label htmlFor={"date"}>
											Data Final
										</Label>
										<Input id={"date"} type={"date"} value={relEndDate}
										       onChange={(e) => setRelEndDate(e.target.value)}/>
										<Button onClick={() => {
											if (relStartDate && relEndDate) {
												// Format dates to follow dd-mm-yyyy
												const startDate = new Date(relStartDate).toLocaleDateString();
												const endDate = new Date(relEndDate).toLocaleDateString();
												const entryTime = localStorage.getItem("HorarioEntrada");
												const exitTime = localStorage.getItem("HorarioSaida");
												const tolerance = localStorage.getItem("MinutosTolerancia");
												
												if (!entryTime || !exitTime || !tolerance) {
													alert("Por favor, configure os horários de entrada e saída e a tolerância antes de gerar o relatório.")
													return;
												}
												TauriApi.CreateReport(startDate, endDate, entryTime, exitTime, tolerance).then(() => {
													console.log("Relatório Gerado")
												})
											}
										}} variant={"secondary"}>Gerar</Button>
									</div>
								</DialogContent>
							</Dialog>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}