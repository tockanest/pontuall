import Label from "@/components/ui/label";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger} from "@/components/ui/dialog";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import Input from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import React, {useEffect, useState} from "react";
import TauriApi from "@/lib/Tauri";
import {checkPermission} from "@/lib/utils";

type EmployeesProps = {
    filteredEmployees: Users,
    setSelectedDate: React.Dispatch<React.SetStateAction<string>>,
    selectedDate: string,
    selectedEmployee: IUsers | null,
    setUsers: React.Dispatch<React.SetStateAction<Users | []>>
    GetData: (id: string) => void,
    Permissions: StatePermissions | null
}

export default function Employees(
    {
        filteredEmployees,
        setSelectedDate,
        selectedDate,
        selectedEmployee,
        setUsers,
        GetData,
        Permissions
    }: EmployeesProps
) {

    const [enableEdit, setEnableEdit] = useState(true);
    const [hourData, setHourData] = useState<HourData>({
        clock_in: "",
        lunch_break_out: "",
        lunch_break_return: "",
        clocked_out: "",
        total_hours: ""
    });
    const [updateMessage, setUpdateMessage] = useState<{
        type: string,
        message: string
    }>({
        type: "",
        message: ""
    });
    const [sortedDates, setSortedDates] = useState<string[]>([]);
    const [editUserModal, setEditUserModal] = useState(false);

    useEffect(() => {
        if (selectedEmployee && selectedDate !== "") {
            setHourData(selectedEmployee.hour_data[selectedDate])
        }
    }, [selectedDate])

    async function HandleEdit() {
        // Check the keys that were modified
        const modifiedKeys = Object.keys(hourData).filter((key) => {
            // @ts-ignore
            return selectedEmployee!.hour_data[selectedDate][key] !== hourData[key]
        });

        // Validate if keys are valid
        if (modifiedKeys.length === 0) {
            return
        }

        // Check if the values modified are empty and if they are, set as N/A
        modifiedKeys.forEach((key) => {
            // @ts-ignore
            if (hourData[key] === "") {
                // @ts-ignore
                hourData[key] = "N/A"
            }
        });

        enum Keys {
            ClockIn = "ClockIn",
            ClockLunchOut = "ClockLunchOut",
            ClockLunchReturn = "ClockLunchReturn",
            ClockOut = "ClockOut"
        }

        let updatedBools: boolean[] = [];
        for (const key of modifiedKeys) {
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
                    keyToUpdate = Keys.ClockIn;
                    break;
            }

            try {
                //@ts-ignore: This works, trust me. It's just a type error.
                const update = await TauriApi.UpdateUser(selectedEmployee!.id, selectedDate, keyToUpdate, hourData[key])
                updatedBools.push(update)
            } catch (e) {
                console.error(e)
                updatedBools.push(false)
            }
        }

        // Check if all updates were successful
        if (updatedBools.every((bool) => bool)) {
            // Update the cache
            setUsers((prev) => {
                return prev.map((user) => {
                    if (user.id === selectedEmployee!.id) {
                        return {
                            ...user,
                            hour_data: {
                                ...user.hour_data,
                                [selectedDate]: hourData
                            }
                        }
                    }
                    return user
                })
            })

            const readableKeys = {
                "clock_in": "Entrada",
                "lunch_break_out": "Horário de Almoço - Saída",
                "lunch_break_return": "Horário de Almoço - Retorno",
                "clocked_out": "Saída"
            }

            const keys = modifiedKeys.map((key) => {
                //@ts-ignore: This works, trust me. It's just a type error.
                return readableKeys[key]
            })

            // Set a message with the keys that were updated
            setUpdateMessage({
                type: "success",
                message: `Dados atualizados com sucesso: ${keys.join(", ")}`
            })
            setEnableEdit(true);
        } else {
            setUpdateMessage({
                type: "error",
                message: `Algum dos dados não puderam ser atualizados.`
            })
        }
    }

    const editPerms = checkPermission("WriteSelf", Permissions!) &&
        checkPermission("EditHours", Permissions!) &&
        checkPermission("WriteOthers", Permissions!) &&
        checkPermission("ReadOthers", Permissions!);

    const editHierarchy = checkPermission("EditHierarchy", Permissions!);

    useEffect(() => {
        if (selectedEmployee) {
            const sortedDates = Object.keys(selectedEmployee.hour_data)
                .map(date => {
                    const [day, month, year] = date.split('/');
                    return new Date(`${year}-${month}-${day}T00:00:00`);
                })
                // @ts-ignore: This works, trust me.
                .sort((a, b) => a - b)
                .map(date => {
                    const day = String(date.getUTCDate()).padStart(2, '0');
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const year = date.getUTCFullYear();
                    return `${day}/${month}/${year}`;
                })
                .filter(date => date !== "Invalid Date")
                .reverse();
            setSortedDates(sortedDates);
        }
    }, [selectedEmployee])

    return (
        <>
            <Label htmlFor={"worker-list"}>
                Funcionários
                {
                    filteredEmployees.length > 0 && ` (${filteredEmployees.length})`
                }
            </Label>
            {
                filteredEmployees.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum funcionário encontrado.</p>
                ) : (
                    filteredEmployees
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((employee, index) => (
                            <div key={employee.id}>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button key={employee.id} onClick={() => {
                                            GetData(employee.id)
                                        }}
                                                className="bg-muted rounded-lg p-4 flex items-center justify-between w-[500px] max-w-[580px]">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="border">
                                                    <AvatarImage src="/placeholder-user.jpg"/>
                                                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className={"flex flex-col items-start"}>
                                                    <div className="font-medium">{employee.name}</div>
                                                    <div
                                                        className="text-sm text-muted-foreground">{employee.role}</div>
                                                </div>
                                            </div>
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent onInteractOutside={() => {
                                        // Reset data
                                        setSelectedDate("")
                                        setUpdateMessage({
                                            type: "",
                                            message: ""
                                        })
                                        setHourData({
                                            clock_in: "",
                                            lunch_break_out: "",
                                            lunch_break_return: "",
                                            clocked_out: "",
                                            total_hours: ""
                                        })
                                    }}>
                                        <DialogHeader>
                                            <div className="flex items-center gap-4">
                                                <Avatar className="border">
                                                    <AvatarImage src="/placeholder-user.jpg"/>
                                                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className={"flex flex-col items-start"}>
                                                    <div className="font-medium">{employee.name}</div>
                                                    <div
                                                        className="text-sm text-muted-foreground">{employee.role}</div>
                                                </div>
                                            </div>
                                        </DialogHeader>
                                        {
                                            !selectedEmployee ? (
                                                <p className={"text-muted-foreground"}>
                                                    Nada encontrado. . .
                                                </p>
                                            ) : (
                                                <div key={index} className="grid gap-4 w-full mt-2">
                                                    <Label htmlFor={"date-selector"}>
                                                        Selecione a data
                                                    </Label>
                                                    <Select onValueChange={(value) => setSelectedDate(value)}>
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder="Selecione uma Data"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {
                                                                sortedDates.length === 0 ? (
                                                                    <SelectItem value={"Nenhum Dado Encontrado"}>
                                                                        Nenhum Dado Encontrado
                                                                    </SelectItem>
                                                                ) : sortedDates.map((date, index) => (
                                                                    <SelectItem value={date} key={index}>
                                                                        {date}
                                                                    </SelectItem>
                                                                ))
                                                            }
                                                        </SelectContent>
                                                    </Select>
                                                    {
                                                        updateMessage.type !== "" && (
                                                            <div
                                                                className={`p-2 rounded-lg bg-${updateMessage.type} text-white`}>
                                                                {updateMessage.message}
                                                            </div>
                                                        )
                                                    }
                                                    {
                                                        selectedDate !== "" && (
                                                            <Card
                                                                className={"max-h-[256px] min-w-[256px] overflow-y-auto custom-scrollbar"}>
                                                                <CardHeader>
                                                                    <CardTitle className={"font-normal text-xl"}>
                                                                        Pontos Batidos
                                                                    </CardTitle>
                                                                    <CardDescription>
                                                                        Dia {selectedDate}
                                                                    </CardDescription>
                                                                </CardHeader>
                                                                <CardContent className="space-y-2">
                                                                    <div key={selectedDate}
                                                                         className="grid gap-2">
                                                                        <div>
                                                                            <Label htmlFor="clock-in">
                                                                                Entrada
                                                                            </Label>
                                                                            <Input id="clock-in"
                                                                                   readOnly={enableEdit}
                                                                                   onChange={(e) => {
                                                                                       setHourData({
                                                                                           ...hourData,
                                                                                           clock_in: e.target.value
                                                                                       })
                                                                                   }}
                                                                                   value={
                                                                                       hourData.clock_in
                                                                                   }/>
                                                                        </div>
                                                                        <div>
                                                                            <Label
                                                                                htmlFor="lunch-break">
                                                                                Horário de Almoço - Saída
                                                                            </Label>
                                                                            <Input id="lunch-break"
                                                                                   readOnly={enableEdit}
                                                                                   onChange={(e) => {
                                                                                       setHourData({
                                                                                           ...hourData,
                                                                                           lunch_break_out: e.target.value
                                                                                       })
                                                                                   }}
                                                                                   value={hourData.lunch_break_out}/>
                                                                        </div>
                                                                        <div>
                                                                            <Label htmlFor="lunch-break">
                                                                                Horário de Almoço - Retorno
                                                                            </Label>
                                                                            <Input id="lunch-break"
                                                                                   readOnly={enableEdit}
                                                                                   onChange={(e) => {
                                                                                       setHourData({
                                                                                           ...hourData,
                                                                                           lunch_break_return: e.target.value
                                                                                       })
                                                                                   }}
                                                                                   value={hourData.lunch_break_return}/>
                                                                        </div>
                                                                        <div>
                                                                            <Label htmlFor="clock-out">
                                                                                Saída
                                                                            </Label>
                                                                            <Input id="clock-out"
                                                                                   readOnly={enableEdit}
                                                                                   onChange={(e) => {
                                                                                       setHourData({
                                                                                           ...hourData,
                                                                                           clocked_out: e.target.value
                                                                                       })
                                                                                   }}
                                                                                   value={hourData.clocked_out}/>
                                                                        </div>
                                                                        <div>
                                                                            <Label htmlFor="total-hours">
                                                                                Total de Horas
                                                                            </Label>
                                                                            <Input id="total-hours"
                                                                                   readOnly
                                                                                   value={hourData.total_hours}/>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        )
                                                    }
                                                </div>
                                            )
                                        }
                                        <DialogFooter>
                                            <div className={"flex gap-4"}>
                                                <Button
                                                    variant="destructive"
                                                    disabled={selectedDate === "" || !editPerms}
                                                >
                                                    Excluir
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    disabled={selectedDate === "" || !editPerms}
                                                    onClick={() => {
                                                        setEnableEdit(!enableEdit)
                                                    }}
                                                >
                                                    Editar
                                                </Button>
                                                {
                                                    !enableEdit && (
                                                        <Button
                                                            variant="primary"
                                                            onClick={() => {
                                                                // Check what was modified and what wasn't
                                                                HandleEdit()
                                                            }}
                                                        >
                                                            Salvar
                                                        </Button>
                                                    )
                                                }
                                                <Button disabled={!editPerms} variant="default">
                                                    Editar Usuário
                                                </Button>
                                            </div>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        ))
                )
            }
            <Dialog open={editUserModal} onOpenChange={(open) => setEditUserModal(open)}>
                <DialogContent>
                    <DialogHeader>
                        <CardHeader>
                            <CardTitle>Editar Usuário</CardTitle>
                        </CardHeader>
                    </DialogHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            <div>
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" type="text" placeholder={selectedEmployee?.name}/>
                            </div>
                            <div>
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" type="email" placeholder={selectedEmployee?.email}/>
                            </div>
                            <div>
                                <Label htmlFor="role">Cargo</Label>
                                <Input id="role" type="text" placeholder={selectedEmployee?.role}/>
                            </div>
                            <div>
                                <Label htmlFor="lunch-time">Horário de Almoço</Label>
                                <Input id="lunch-time" type="text" placeholder={selectedEmployee?.lunch_time}/>
                            </div>
                            <div>
                                <Label htmlFor="phone">Telefone</Label>
                                <Input id="phone" type="text" placeholder=""/>
                            </div>
                            <div>
                                <Label htmlFor="permissions">Permissões</Label>
                                <Input id="permissions" type="text" placeholder=""/>
                            </div>
                        </div>
                    </CardContent>
                </DialogContent>
            </Dialog>
        </>
    )
}