import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
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
import {ChevronRightIcon, ClockIcon, SpinnerIcon} from "@/components/component/icons";
import React, {useEffect, useState} from "react";
import TauriApi from "@/lib/Tauri";
import moment from "moment";

type HomePageProps = {
	users: Users
	setUsers: React.Dispatch<React.SetStateAction<Users>>
	clock: string
	userLogged: UserLogged | {}
	setPage: React.Dispatch<React.SetStateAction<Pages>>
}

export default function HomePage(
	{
		users,
		setUsers,
		clock,
		userLogged,
		setPage
	}: HomePageProps
) {
	
	const [openPunchDialog, setOpenPunchDialog] = useState<boolean>(false);
	const [noCardDialog, setNoCardDialog] = useState<boolean>(false);
	
	const [messageDialogOpen, setMessageDialogOpen] = useState<boolean>(false);
	const [dialogMessage, setDialogMessage] = useState<{
		message: string,
		type: string,
		showDefaultCancel?: boolean
		release?: string
	}>({message: "", type: ""});
	
	const [clockUser, setClockUser] = useState<IUsers | null>(null);
	
	async function GetApiTime() {
		
		const hour = new Date().toLocaleTimeString("pt-BR", {
			hour: "numeric",
			minute: "numeric",
			second: "numeric"
		});
		
		const date = new Date().toLocaleDateString("pt-BR", {
			year: "numeric",
			month: "numeric",
			day: "numeric"
		});
		
		const datetime = new Date().toLocaleString("pt-BR", {
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
			second: "numeric"
		});
		
		return {
			hour,
			date,
			datetime
		}
	}
	
	async function HandleCloseRead() {
		setClockUser(null);
		
		try {
			if (typeof window !== "undefined") {
				await TauriApi.CloseReader()
			}
		} catch (e: any) {
			console.log(e)
		}
	}
	
	async function HandleGetUser() {
		setOpenPunchDialog(true);
		
		try {
			if (typeof window !== "undefined") {
				const data = await TauriApi.ReadCard(5);
				if (data !== "") {
					const user = users.find(user => user.id === data);
					if (user) {
						setClockUser(user);
						await HandleClockIn(user);
					} else {
						setDialogMessage({
							message: `Usuário com id: ${data} não encontrado.`,
							type: "destroy"
						});
						setMessageDialogOpen(true);
						await HandleCloseRead();
					}
				} else {
					setDialogMessage({
						message: "Cartão não registrado.",
						type: "destroy"
					});
					setMessageDialogOpen(true);
					await HandleCloseRead();
				}
			}
		} catch (e: any) {
			console.log(e);
			setDialogMessage({
				message: "Erro ao tentar ler o cartão.",
				type: "destroy"
			});
		}
	}
	
	async function HandleClockIn(user: IUsers, skipValidation?: {
		type: "ClockLunchOut" | "ClockLunchReturn" | "ClockOut",
	}): Promise<void> {
		const time = await GetApiTime();
		
		const check = user.hour_data[time.date];
		
		if (skipValidation) {
			handleSkipValidation(skipValidation, user, time, check);
			return;
		}
		
		const {HorarioEntrada, MinutosTolerancia, HorarioSaida, HorarioSaidaFDS} = getLocalStorageValues();
		if (!HorarioEntrada || !MinutosTolerancia) {
			alert("Você não configurou o horário de entrada e a tolerância de minutos.");
			return;
		}
		
		handleRegularDayLogic(user, time, check, HorarioEntrada, MinutosTolerancia, HorarioSaida);
	}
	
	function handleRegularDayLogic(user: IUsers, time: {
		hour: string,
		date: string,
		datetime: string
	}, check: HourData, HorarioEntrada: string | null, MinutosTolerancia: string | null, HorarioSaida: string | null): void {
		if (!HorarioEntrada || !MinutosTolerancia || !HorarioSaida) {
			alert("Você não configurou o horário de entrada e a tolerância de minutos.");
			return;
		}
		
		const lunchTime = user.lunch_time?.split(":");
		const clockedLunchTime = (): string[] => {
			const clockedLunch = check?.lunch_break_out;
			return clockedLunch ? clockedLunch.split(":") : lunchTime!;
		}
		
		if (!check) {
			updateUserHourData(user, time, {}, "ClockIn");
			return
		} else if (Object.keys(check).length < 0) {
			updateUserHourData(user, time, check, "ClockIn");
			return;
		}
		
		function checkValue(check: HourData, key: keyof HourData): boolean {
			return Boolean(check[key] && (check[key] !== "N/A"));
		}
		
		switch (true) {
			case !checkValue(check, "clock_in"): {
				const HorarioEntradaDate = moment(`${HorarioEntrada}`, "HH:mm");
				const currentTime = moment(Date.now());
				
				// Check if the user is trying to clock in before the minimum time
				if (currentTime.isBefore(HorarioEntradaDate.subtract(parseInt(MinutosTolerancia), 'minutes'))) {
					// Show warning if it's too early to clock in
					setDialogMessage({
						message: `O ponto de entrada deve ser batido após as ${HorarioEntradaDate.format("HH:mm:ss")}`,
						type: "warning",
					});
					setMessageDialogOpen(true);
					return;
				}
				
				updateUserHourData(user, time, check, "ClockIn");
				break;
			}
			case !checkValue(check, "lunch_break_out"): {
				const lunch_time = user.lunch_time;
				if (!lunch_time) {
					setDialogMessage({
						message: `O horário de almoço não foi configurado para o usuário. Deseja bater o ponto de saída agora?`,
						type: "warning",
						release: "clock_out"
					});
					setMessageDialogOpen(true);
					return;
				}
				
				const MinLunchTimeDate = moment(`${user.lunch_time}`, "HH:mm");
				const currentTime = moment(Date.now());
				
				// Check if the user is trying to clock out before the minimum time
				if (currentTime.isBefore(MinLunchTimeDate.subtract(parseInt(MinutosTolerancia), 'minutes'))) {
					// Show warning if it's too early to clock out for lunch
					setDialogMessage({
						message: `O ponto de saída/retorno do almoço deve ser batido após as ${MinLunchTimeDate.format("HH:mm:ss")}`,
						type: "warning",
						release: "clock_out"
					});
					setMessageDialogOpen(true);
					return;
				} else if (currentTime.isAfter(MinLunchTimeDate)) {
					// Show warning if it's too late to clock out for lunch
					setDialogMessage({
						message: `O ponto de saída/retorno do almoço deve ser batido após às ${MinLunchTimeDate.format("HH:mm:ss")}`,
						type: "warning",
						release: "clock_out"
					});
					setMessageDialogOpen(true);
					return;
				}
				
				updateUserHourData(user, time, check, "ClockLunchOut");
				break;
			}
			case !checkValue(check, "lunch_break_return"): {
				const lunchStartTime = moment(clockedLunchTime().join(":"), "HH:mm");
				const MaxLunchTimeDate = lunchStartTime.clone().add(1, 'hour');
				
				const currentTime = moment(Date.now());
				
				// Calculate the maximum allowed time for lunch return, considering the tolerance
				const maxAllowedTimeForReturn = MaxLunchTimeDate.clone().add(parseInt(MinutosTolerancia) + 60, 'minutes');
				
				// Check if the user is trying to clock in after the maximum time
				if (currentTime.isAfter(maxAllowedTimeForReturn)) {
					// Show warning if it's too late to clock in after lunch
					setDialogMessage({
						message: `O ponto de retorno do almoço deve ser batido antes das ${maxAllowedTimeForReturn.format("HH:mm:ss")}`,
						type: "warning",
						release: "clock_out"
					});
					setMessageDialogOpen(true);
					return;
				} else if (currentTime.isBefore(lunchStartTime)) {
					// Show warning if it's too early to clock in after lunch
					setDialogMessage({
						message: `O ponto de retorno do almoço deve ser batido após as ${lunchStartTime.format("HH:mm:ss")}, deseja bater o retorno agora?`,
						type: "bypass-clock-lunch-return",
						showDefaultCancel: true
					});
					setMessageDialogOpen(true);
					return;
				}
				
				// Proceed with updating user hour data if it's time or past time to clock in after lunch
				updateUserHourData(user, time, check, "ClockLunchReturn");
				return;
			}
			case !checkValue(check, "clocked_out"): {
				const HorarioSaidaDate = moment(`${HorarioSaida}`, "HH:mm");
				const currentTime = moment(Date.now());
				
				console.log(HorarioSaidaDate.toString());
				console.log(currentTime.toString());
				// Ask if the user wants to clock out early
				if (currentTime.isBefore(HorarioSaidaDate)) {
					console.log("OK")
					// Calculate time left to clock out
					const timeLeft = HorarioSaidaDate.diff(currentTime);
					const duration = moment.duration(timeLeft);
					const hoursLeft = duration.hours();
					const minutesLeft = duration.minutes();
					const secondsLeft = duration.seconds();
					setDialogMessage({
						message: `Faltam ${hoursLeft} horas, ${minutesLeft} minutos e ${secondsLeft} segundos para bater o ponto de saída. Você deseja bater o ponto de saída agora?`,
						type: "bypass-clock-out",
						showDefaultCancel: true
					});
					setMessageDialogOpen(true);
					return;
				}
				
				updateUserHourData(user, time, check, "ClockOut");
				return;
			}
			default: {
				setDialogMessage({
					message: `Você já bateu todos os pontos de hoje.`,
					type: "info"
				});
				setMessageDialogOpen(true);
				return;
			}
		}
	}
	
	function handleSkipValidation(skipValidation: {
		type: "ClockLunchOut" | "ClockLunchReturn" | "ClockOut"
	}, user: IUsers, time: {
		hour: string,
		date: string,
		datetime: string
	}, check: any): void {
		TauriApi.UpdateUser(user.id, time.date, skipValidation.type, time.hour).then((bool) => {
			if (bool) {
				updateUserHourData(user, time, check, skipValidation.type);
				displaySuccessMessage(skipValidation.type);
			}
		});
	}
	
	function getLocalStorageValues(): {
		HorarioEntrada: string | null;
		MinutosTolerancia: string | null;
		HorarioSaida: string | null;
		HorarioSaidaFDS: string | null
	} {
		return {
			HorarioEntrada: localStorage.getItem("HorarioEntrada"),
			MinutosTolerancia: localStorage.getItem("MinutosTolerancia"),
			HorarioSaida: localStorage.getItem("HorarioSaida"),
			HorarioSaidaFDS: localStorage.getItem("HorarioSaidaFDS") ?? localStorage.getItem("HorarioSaida"),
		};
	}
	
	function updateUserHourData(user: IUsers, time: {
		hour: string,
		date: string,
		datetime: string
	}, check: any, type: "ClockLunchOut" | "ClockLunchReturn" | "ClockOut" | "ClockIn"): void {
		TauriApi.UpdateUser(user.id, time.date, type, time.hour).then((bool) => {
			if (bool) {
				displaySuccessMessage(type);
				setUsers(users.map((u) => {
					if (u.id === user.id) {
						return {
							...u,
							hour_data: {
								...u.hour_data,
								[time.date]: {
									...check,
									[type === "ClockIn" ? "clock_in" : type === "ClockOut" ? "clocked_out" : type === "ClockLunchOut" ? "lunch_break_out" : "lunch_break_return"]: time.hour
								}
							}
						}
					}
					return u;
				}));
			}
		})
	}
	
	function displaySuccessMessage(type: "ClockLunchOut" | "ClockLunchReturn" | "ClockOut" | "ClockIn"): void {
		let message = "";
		switch (type) {
			case "ClockIn":
				message = "Ponto de entrada registrado com sucesso.";
				break;
			case "ClockLunchOut":
				message = "Ponto de almoço registrado com sucesso.";
				break;
			case "ClockLunchReturn":
				message = "Ponto de retorno de almoço registrado com sucesso.";
				break;
			case "ClockOut":
				message = "Ponto de saída registrado com sucesso.";
				break;
		}
		setDialogMessage({message, type: "info"});
		setMessageDialogOpen(true);
	}
	
	
	const [hasPermissions, setHasPermissions] = useState<boolean>(false);
	
	useEffect(() => {
		if (!userLogged) return;
		
		// @ts-ignore
		TauriApi.CheckPermissions(userLogged, ["ReadOthers", "WriteOthers"]).then((check) => {
			setHasPermissions(check);
		})
	}, [userLogged])
	
	return (
		<>
			<Dialog open={messageDialogOpen}>
				<DialogContent className="max-w-md no-close">
					<DialogHeader>
						<DialogTitle>
							Aviso
						</DialogTitle>
						<DialogDescription>
							{dialogMessage.message}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						{
							[
								{
									name: "Confirmar",
									variant: "default",
									show: dialogMessage.type === "bypass-clock-out",
									release: dialogMessage.release ?? "",
									showDefaultCancel: dialogMessage.showDefaultCancel ?? false,
									onClick: () => {
										setDialogMessage({message: "", type: ""});
										setMessageDialogOpen(false);
										if (!clockUser) {
											console.error("No user to clock out.");
											return;
										}
										setOpenPunchDialog(false);
										HandleClockIn(clockUser, {type: "ClockOut"});
									}
								},
								{
									name: "Confirmar",
									variant: "default",
									show: dialogMessage.type === "bypass-clock-lunch-return",
									release: dialogMessage.release ?? "",
									showDefaultCancel: dialogMessage.showDefaultCancel ?? false,
									onClick: () => {
										setDialogMessage({message: "", type: ""});
										setMessageDialogOpen(false);
										if (!clockUser) {
											console.error("No user to clock out.");
											return;
										}
										setOpenPunchDialog(false);
										HandleClockIn(clockUser, {type: "ClockLunchReturn"});
									}
								},
								{
									name: "Fechar",
									variant: "destructive",
									show: dialogMessage.type === "destroy",
									release: dialogMessage.release ?? "",
									showDefaultCancel: false,
									onClick: () => {
										setOpenPunchDialog(false);
										setDialogMessage({message: "", type: ""});
										setMessageDialogOpen(false);
									}
								},
								{
									name: "Fechar",
									variant: "warning",
									show: dialogMessage.type === "warning",
									showDefaultCancel: false,
									release: dialogMessage.release ?? "",
									onClick: () => {
										setOpenPunchDialog(false);
										setDialogMessage({message: "", type: ""});
										setMessageDialogOpen(false);
									}
								},
								{
									name: "Fechar",
									variant: "default",
									show: dialogMessage.type === "info",
									release: dialogMessage.release ?? "",
									showDefaultCancel: false,
									onClick: () => {
										setOpenPunchDialog(false);
										setDialogMessage({message: "", type: ""});
										setMessageDialogOpen(false);
									}
								}
							].map((button, index) => (
								button.show && (
									<>
										{
											button.release !== "" && button.release === "clock_out" && (
												<Button
													variant="destructive"
													onClick={() => {
														setOpenPunchDialog(false);
														setDialogMessage({message: "", type: ""});
														setMessageDialogOpen(false);
														HandleClockIn(clockUser!, {type: "ClockOut"});
													}}
												>
													Ponto de Saída
												</Button>
											)
										}
										<Button
											key={index}
											variant={button.variant}
											onClick={button.onClick}
										>
											{button.name}
										</Button>
										{
											button.showDefaultCancel && (
												<Button
													variant="destructive"
													onClick={() => {
														setOpenPunchDialog(false);
														setDialogMessage({message: "", type: ""});
														setMessageDialogOpen(false);
													}}
												>
													Cancelar
												</Button>
											)
										}
									</>
								
								)
							))
						}
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<main className="flex-1 flex flex-col items-center justify-center gap-8 p-4 md:p-8">
				<div className="bg-card rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center gap-6">
					<div className="text-6xl font-bold">
						<span className="text-primary">{clock}</span>
					</div>
					<div className="flex gap-4">
						<Dialog open={openPunchDialog}>
							<DialogTrigger asChild>
								<Button
									onClick={() => {
										HandleGetUser()
									}}
									variant="default"
								>
									Bater Ponto
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-md no-close">
								<DialogHeader>
									<DialogTitle>
										Aproxime o Cartão do Leitor
									</DialogTitle>
									<DialogDescription>
										Para registrar o ponto, aproxime o cartão do leitor.
									</DialogDescription>
								</DialogHeader>
								<div className="flex items-center justify-center py-8">
									<SpinnerIcon className={"w-16 h-16 animate-spin"}/>
								</div>
								<DialogFooter>
									<DialogClose asChild>
										<Button
											onClick={() => {
												setOpenPunchDialog(false);
												HandleCloseRead();
											}}
											variant={"destructive"}
										>
											Cancelar
										</Button>
									</DialogClose>
									<Dialog open={noCardDialog}>
										<DialogTrigger asChild>
											<Button variant="outline" onClick={() => {
												setOpenPunchDialog(false);
												HandleCloseRead();
												setNoCardDialog(true);
											}}>Sem Cartão?</Button>
										</DialogTrigger>
										<DialogContent className={"no-close"}>
											<DialogHeader>
												Caso esteja sem cartão, selecione o seu usuário abaixo:
												<DialogDescription>
													Será necessário informar a senha ao selecionar o usuário.
												</DialogDescription>
											</DialogHeader>
											<div className="grid gap-4">
												{
													users.map((user, index) => (
														<Button
															key={index}
															onClick={() => {
															
															}}
															variant="default"
															className={"p-6 w-fit"}
														>
															<div className="flex items-center gap-2">
																<Avatar className="border">
																	<AvatarImage src="/placeholder-user.jpg"/>
																	<AvatarFallback>
																		{
																			user.name.charAt(0).toUpperCase()
																		}
																	</AvatarFallback>
																</Avatar>
																<div>
																	<div className="font-medium">
																		{user.name}
																	</div>
																</div>
															</div>
														</Button>
													))
												}
											</div>
											<DialogFooter>
												<Button onClick={() => {
													setNoCardDialog(false);
												}} variant="destructive">Fechar</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
									<Button variant="outline">Código Qr</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</div>
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>
							Pontos do Dia
						</CardTitle>
						<CardDescription>
							Lista de todos os pontos registrados hoje:
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 max-h-[256px] min-w-[256px] overflow-y-auto custom-scrollbar">
							{
								users.length > 0 ? users.map((user, index) => {
									
									const today = new Date().toLocaleDateString();
									if (!user.hour_data) return;
									
									const userData = user.hour_data[today];
									return (
										<div key={index}>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Avatar className="border">
														<AvatarImage src="/placeholder-user.jpg"/>
														<AvatarFallback>
															{
																user.name.charAt(0).toUpperCase()
															}
														</AvatarFallback>
													</Avatar>
													<div>
														<div className="font-medium">
															{user.name}
														</div>
														<div className="text-sm text-muted-foreground">
															{
																userData?.clock_in ?? "Não registrado"
															}
														</div>
													</div>
												</div>
												<Dialog>
													<DialogTrigger asChild>
														<Button variant="ghost" size="icon">
															<ChevronRightIcon className="w-4 h-4"/>
														</Button>
													</DialogTrigger>
													<DialogContent className="max-w-md">
														<DialogHeader>
															<DialogTitle className={"flex flex-row items-center"}>
																<ClockIcon className="w-6 h-6 mr-2"/>
																<span>
                                                                Pontuall
                                                            </span>
															</DialogTitle>
															<DialogDescription>
																Mais informações sobre o ponto registrado
															</DialogDescription>
														</DialogHeader>
														<div>
															<div className="grid gap-4">
																<div className="flex items-center gap-2">
																	<Avatar className="border">
																		<AvatarImage src="/placeholder-user.jpg"/>
																		<AvatarFallback>
																			{
																				user.name.charAt(0).toUpperCase()
																			}
																		</AvatarFallback>
																	</Avatar>
																	<div>
																		<div className="font-medium">
																			{user.name}
																		</div>
																		<div
																			className="text-sm text-muted-foreground">
																			{user.role}
																		</div>
																	</div>
																</div>
																<div className="grid gap-1">
																	<div className="flex items-center justify-between">
																		<div className="text-muted-foreground">
																			Ponto de Entrada:
																		</div>
																		<div>
																			{
																				userData?.clock_in ?? "Não registrado"
																			}
																		</div>
																	</div>
																	<div className="flex items-center justify-between">
																		<div className="text-muted-foreground">
																			Ponto de Saída:
																		</div>
																		<div>
																			{
																				userData?.clocked_out ?? "Não registrado"
																			}
																		</div>
																	</div>
																	{
																		hasPermissions && (
																			<>
																				<div
																					className="border-t border-muted my-2"/>
																				<div
																					className="flex items-center justify-between">
																					<div className="text-muted-foreground">
																						Total de Horas:
																					</div>
																					<div>
																						{
																							userData?.total_hours ?? "Não registrado"
																						}
																					</div>
																				</div>
																				<div
																					className="flex items-center justify-between">
																					<div className="text-muted-foreground">
																						Intervalo de Almoço (Saída):
																					</div>
																					<div>
																						{
																							userData?.lunch_break_out ?? "Não registrado"
																						}
																					</div>
																				</div>
																				<div
																					className="flex items-center justify-between">
																					<div
																						className="text-muted-foreground">
																						Intervalo de Almoço (Retorno):
																					</div>
																					<div>
																						{
																							userData?.lunch_break_return ?? "Não registrado"
																						}
																					</div>
																				</div>
																			</>
																		)
																	}
																
																</div>
															</div>
														</div>
														<DialogFooter>
															{
																hasPermissions && (
																	<div className={"flex gap-4"}>
																		<Button
																			onClick={() => {
																				setPage("admin")
																			}}
																			variant="default">
																			Editar
																		</Button>
																	</div>
																)
															}
														</DialogFooter>
													</DialogContent>
												</Dialog>
											</div>
										</div>
									)
								}) : (
									<div className="flex items-center justify-center gap-4">
										<ClockIcon className="w-8 h-8 text-muted"/>
										<span>
                                        Nenhum ponto registrado hoje
                                    </span>
									</div>
								)
							}
						</div>
					</CardContent>
				</Card>
			</main>
		</>
	)
}