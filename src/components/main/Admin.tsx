import TauriApi from "@/lib/Tauri";
import React, {useEffect, useState} from "react";
import Employees from "@/components/main/subComponents/admin/employees";
import AddEmployee from "@/components/main/subComponents/admin/addEmployee";
import {FileText, Search, Settings, Users} from 'lucide-react';
import {toast} from "@/hooks/use-toast";
import {checkPermission} from "@/lib/utils";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import Label from "@/components/ui/label";
import Input from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Checkbox} from "@/components/ui/checkbox";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";

interface AdminProps {
	userLogged: UserLogged | Record<string, never>;
	employees: Users;
	setUsers: React.Dispatch<React.SetStateAction<Users | []>>;
}

enum Keys {
	ClockIn = "ClockIn",
	ClockLunchOut = "ClockLunchOut",
	ClockLunchReturn = "ClockLunchReturn",
	ClockOut = "ClockOut"
}

export default function Admin({userLogged, employees, setUsers}: AdminProps) {
	const [permissions, setPermissions] = useState<StatePermissions | null>(null);
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [selectedEmployee, setSelectedEmployee] = useState<IUsers | null>(null);
	const [selectedDate, setSelectedDate] = useState<string>("");
	const [relStartDate, setRelStartDate] = useState<string>("");
	const [relEndDate, setRelEndDate] = useState<string>("");
	const [showMassChangeDialog, setShowMassChangeDialog] = useState(false);
	const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
	const [massChangeSearchTerm, setMassChangeSearchTerm] = useState<string>("");
	const [massChangeHourData, setMassChangeHourData] = useState<HourData>({
		clock_in: "",
		lunch_break_out: "",
		lunch_break_return: "",
		clocked_out: "",
		total_hours: ""
	});
	
	useEffect(() => {
		if (!userLogged || Object.keys(userLogged).length === 0) {
			window.location.href = "/";
			return;
		}
		const user = userLogged as UserLogged;
		
		const allPermissions = [
			"WriteSelf", "WriteOthers", "ReadOthers", "EditHours", "CreateReports"
		];
		
		allPermissions.forEach(permission => {
			TauriApi.CheckPermissions(user, [permission as AppPermissions]).then((res) => {
				setPermissions(prev => ({...prev, [permission]: res}));
			});
		});
	}, [userLogged]);
	
	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};
	
	const filteredEmployees = searchTerm
		? employees.filter(employee =>
			employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
		)
		: employees;
	
	const filteredMassChangeEmployees = massChangeSearchTerm
		? employees.filter(employee =>
			employee.name.toLowerCase().includes(massChangeSearchTerm.toLowerCase()) ||
			employee.email?.toLowerCase().includes(massChangeSearchTerm.toLowerCase())
		)
		: employees;
	
	async function GetUserData(employeeId: string) {
		const user = employees.find(employee => employee.id === employeeId);
		if (user) setSelectedEmployee(user);
	}
	
	const createReports = checkPermission("CreateReports", permissions!);
	const today = new Date().toLocaleDateString("pt-BR");
	
	const formatTimeWithSeconds = (time: string) => {
		return time ? `${time}:00` : "N/A";
	};
	
	const handleMassChange = async () => {
		const modifiedKeys = Object.keys(massChangeHourData).filter(key => massChangeHourData[key as keyof HourData] !== "");
		
		if (modifiedKeys.length === 0) {
			toast({
				title: "Nenhuma alteração",
				description: "Nenhum dado foi modificado para atualização.",
				variant: "destructive",
			});
			return;
		}
		
		const updatePromises = selectedEmployees.map(async (employeeId) => {
			const employee = employees.find(emp => emp.id === employeeId);
			if (!employee) return false;
			
			const updatedHourData: HourData = {
				clock_in: "N/A",
				lunch_break_out: "N/A",
				lunch_break_return: "N/A",
				clocked_out: "N/A",
				total_hours: "N/A"
			};
			
			Object.keys(updatedHourData).forEach(key => {
				if (massChangeHourData[key as keyof HourData]) {
					updatedHourData[key as keyof HourData] = formatTimeWithSeconds(massChangeHourData[key as keyof HourData]);
				}
			});
			
			const employeeUpdates = Object.keys(updatedHourData).map(async (key) => {
				let keyToUpdate: Keys;
				switch (key) {
					case "clock_in":
						keyToUpdate = Keys.ClockIn;
						break;
					case "lunch_break_out":
						keyToUpdate = Keys.ClockLunchOut;
						break;
					case "lunch_break_return":
						keyToUpdate = Keys.ClockLunchReturn;
						break;
					case "clocked_out":
						keyToUpdate = Keys.ClockOut;
						break;
					default:
						return true; // Skip total_hours
				}
				
				try {
					return await TauriApi.UpdateUser(employeeId, today, keyToUpdate, updatedHourData[key as keyof HourData]);
				} catch (e) {
					console.error(e);
					return false;
				}
			});
			
			const results = await Promise.all(employeeUpdates);
			return results.every(Boolean);
		});
		
		const updateResults = await Promise.all(updatePromises);
		
		if (updateResults.every(Boolean)) {
			setUsers(prev => prev.map(user => {
				if (selectedEmployees.includes(user.id)) {
					return {
						...user,
						hour_data: {
							...user.hour_data,
							[today]: {
								clock_in: formatTimeWithSeconds(massChangeHourData.clock_in),
								lunch_break_out: formatTimeWithSeconds(massChangeHourData.lunch_break_out),
								lunch_break_return: formatTimeWithSeconds(massChangeHourData.lunch_break_return),
								clocked_out: formatTimeWithSeconds(massChangeHourData.clocked_out),
								total_hours: "N/A" // Assuming total_hours is calculated elsewhere
							}
						}
					};
				}
				return user;
			}));
			
			toast({
				title: "Atualização bem-sucedida",
				description: "Os dados foram atualizados com sucesso para todos os funcionários selecionados.",
			});
		} else {
			toast({
				title: "Erro na atualização",
				description: "Ocorreu um erro ao atualizar os dados de alguns funcionários.",
				variant: "destructive",
			});
		}
		
		setShowMassChangeDialog(false);
	};
	
	const toggleAllEmployees = (checked: boolean) => {
		if (checked) {
			setSelectedEmployees(filteredMassChangeEmployees.map(emp => emp.id));
		} else {
			setSelectedEmployees([]);
		}
	};
	
	return (
		<div className="bg-background rounded-lg shadow-sm p-6 space-y-6">
			<div>
				<h2 className="text-3xl font-bold">Administração</h2>
				<p className="text-muted-foreground mt-2">
					Gerencie o sistema e os funcionários aqui.
				</p>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card className="h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
					<CardHeader>
						<CardTitle className="flex items-center"><Users className="mr-2"/> Pontos</CardTitle>
						<CardDescription>Verifique os Pontos de Funcionários</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
							<div className="w-full sm:w-1/2 relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
								<Input
									id="search"
									placeholder="Procurar por e-mail ou nome"
									value={searchTerm}
									onChange={handleSearchChange}
									className="pl-10"
								/>
							</div>
							<Button variant="secondary" onClick={() => setShowMassChangeDialog(true)}>
								Mudança em Massa
							</Button>
						</div>
						<Employees
							selectedEmployee={selectedEmployee}
							filteredEmployees={filteredEmployees}
							selectedDate={selectedDate}
							setSelectedDate={setSelectedDate}
							setUsers={setUsers}
							GetData={GetUserData}
							Permissions={permissions}
						/>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center"><Settings className="mr-2"/> Gerenciamento</CardTitle>
						<CardDescription>Funções de Gerenciamento</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							<AddEmployee setUsers={setUsers}/>
							<Button variant="secondary">Configurar Horários</Button>
							<Dialog>
								<DialogTrigger asChild>
									<Button disabled={!createReports} variant="secondary" className="w-full">
										<FileText className="mr-2"/> Gerar Relatório
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Gerar Relatório</DialogTitle>
									</DialogHeader>
									<div className="space-y-4">
										<div>
											<Label htmlFor="startDate">Data de Início</Label>
											<Input
												id="startDate"
												type="date"
												value={relStartDate}
												onChange={(e) => setRelStartDate(e.target.value)}
											/>
										</div>
										<div>
											<Label htmlFor="endDate">Data Final</Label>
											<Input
												id="endDate"
												type="date"
												value={relEndDate}
												onChange={(e) => setRelEndDate(e.target.value)}
											/>
										</div>
										<Button onClick={() => {
											if (relStartDate && relEndDate) {
												const startDate = new Date(relStartDate).toLocaleDateString();
												const endDate = new Date(relEndDate).toLocaleDateString();
												const entryTime = localStorage.getItem("HorarioEntrada");
												const exitTime = localStorage.getItem("HorarioSaida");
												const tolerance = localStorage.getItem("MinutosTolerancia");
												
												if (!entryTime || !exitTime || !tolerance) {
													toast({
														title: "Configuração incompleta",
														description: "Por favor, configure os horários de entrada e saída e a tolerância antes de gerar o relatório.",
														variant: "destructive",
													});
													return;
												}
												TauriApi.CreateReport(startDate, endDate, entryTime, exitTime, tolerance).then(() => {
													toast({
														title: "Relatório Gerado",
														description: "O relatório foi gerado com sucesso.",
													});
												});
											}
										}} variant="secondary">Gerar</Button>
									</div>
								</DialogContent>
							</Dialog>
						</div>
					</CardContent>
				</Card>
			</div>
			
			<Dialog open={showMassChangeDialog} onOpenChange={setShowMassChangeDialog}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Selecionar Funcionários para Mudança em Massa</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
							<Input
								placeholder="Procurar funcionários"
								value={massChangeSearchTerm}
								onChange={(e) => setMassChangeSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<div className="max-h-[400px] overflow-y-auto border rounded-md">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[50px]">
											<Checkbox
												checked={selectedEmployees.length === filteredMassChangeEmployees.length}
												onCheckedChange={toggleAllEmployees}
												aria-label="Select all employees"
											/>
										</TableHead>
										<TableHead>Nome</TableHead>
										<TableHead>Data</TableHead>
										<TableHead>Entrada</TableHead>
										<TableHead>Saída Almoço</TableHead>
										<TableHead>Retorno Almoço</TableHead>
										<TableHead>Saída</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredMassChangeEmployees.map((employee) => (
										<TableRow key={employee.id}>
											<TableCell>
												<Checkbox
													checked={selectedEmployees.includes(employee.id)}
													onCheckedChange={(checked) => {
														setSelectedEmployees(prev =>
															checked
																? [...prev, employee.id]
																: prev.filter(id => id !== employee.id)
														);
													}}
													aria-label={`Select ${employee.name}`}
												/>
											</TableCell>
											<TableCell>{employee.name}</TableCell>
											<TableCell>{today}</TableCell>
											<TableCell>{employee.hour_data[today]?.clock_in || "N/A"}</TableCell>
											<TableCell>{employee.hour_data[today]?.lunch_break_out || "N/A"}</TableCell>
											<TableCell>{employee.hour_data[today]?.lunch_break_return || "N/A"}</TableCell>
											<TableCell>{employee.hour_data[today]?.clocked_out || "N/A"}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="massClockIn">Entrada</Label>
								<Input
									id="massClockIn"
									type="time"
									value={massChangeHourData.clock_in}
									onChange={(e) => setMassChangeHourData(prev => ({...prev, clock_in: e.target.value}))}
									className="text-foreground bg-background border-input"
								/>
							</div>
							<div>
								<Label htmlFor="massLunchOut">Saída Almoço</Label>
								<Input
									id="massLunchOut"
									type="time"
									value={massChangeHourData.lunch_break_out}
									onChange={(e) => setMassChangeHourData(prev => ({...prev, lunch_break_out: e.target.value}))}
									className="text-foreground bg-background border-input"
								/>
							</div>
							<div>
								<Label htmlFor="massLunchReturn">Retorno Almoço</Label>
								<Input
									id="massLunchReturn"
									type="time"
									value={massChangeHourData.lunch_break_return}
									onChange={(e) => setMassChangeHourData(prev => ({...prev, lunch_break_return: e.target.value}))}
									className="text-foreground bg-background border-input"
								/>
							</div>
							<div>
								<Label htmlFor="massClockOut">Saída</Label>
								<Input
									id="massClockOut"
									type="time"
									value={massChangeHourData.clocked_out}
									onChange={(e) => setMassChangeHourData(prev => ({...prev, clocked_out: e.target.value}))}
									className="text-foreground bg-background border-input"
								/>
							</div>
						</div>
					</div>
					<Button onClick={handleMassChange}>Iniciar Mudança em Massa</Button>
				</DialogContent>
			</Dialog>
		</div>
	);
}