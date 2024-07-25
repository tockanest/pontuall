import Label from "@/components/ui/label";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger} from "@/components/ui/dialog";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import Input from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import React from "react";

type EmployeesProps = {
    filteredEmployees: Users,
    setSelectedDate: React.Dispatch<React.SetStateAction<string>>,
    selectedDate: string,
    selectedEmployee: IUsers,
    GetData: (id: string) => void,
    
}

export default function Employees(
    {
        filteredEmployees,
        setSelectedDate,
        selectedDate,
        selectedEmployee,
        GetData
    }: EmployeesProps
) {
    return (
        <>
            <Label htmlFor={"worker-list"}>
                Funcionários
            </Label>
            {
                filteredEmployees.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum funcionário encontrado.</p>
                ) : (
                    filteredEmployees.map((employee, index) => (
                        <div key={employee.id}>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button key={employee.id} onClick={(e) => {
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
                                    setSelectedDate("")
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
                                        !selectedEmployee || selectedEmployee === {} ? (
                                            <p className={"text-muted-foreground"}>
                                                Nada encontrado. . .
                                            </p>
                                        ) : (
                                            <div key={index} className="grid gap-4 w-full mt-2">
                                                <Label htmlFor={"date-selector"}>
                                                    Selecione a data
                                                </Label>
                                                <Select
                                                    onValueChange={(value) => setSelectedDate(value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue
                                                            placeholder="Selecione uma Data"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {
                                                            Object.keys(selectedEmployee.hour_data).length === 0 ? (
                                                                <SelectItem value={"Nenhum Dado Encontrado"}>
                                                                    Nenhum Dado Encontrado
                                                                </SelectItem>
                                                            ) : Object.keys(selectedEmployee.hour_data).map((date, index) => {
                                                                return (
                                                                    <SelectItem
                                                                        value={date}
                                                                        key={index}
                                                                    >
                                                                        {date}
                                                                    </SelectItem>
                                                                )
                                                            })
                                                        }
                                                    </SelectContent>
                                                </Select>
                                                {
                                                    selectedDate !== "" && (
                                                        <Card
                                                            className={"max-h-[256px] min-w-[256px] overflow-y-auto custom-scrollbar"}>
                                                            <CardHeader>
                                                                <CardTitle
                                                                    className={"font-normal text-xl"}>Pontos
                                                                    Batidos</CardTitle>
                                                                <CardDescription>no
                                                                    Dia {selectedDate}</CardDescription>
                                                            </CardHeader>
                                                            <CardContent className="space-y-2">
                                                                <div key={selectedDate}
                                                                     className="grid gap-2">
                                                                    <div>
                                                                        <Label
                                                                            htmlFor="clock-in">Entrada</Label>
                                                                        <Input id="clock-in"
                                                                               readOnly
                                                                               value={selectedEmployee.hour_data[selectedDate].clock_in}/>
                                                                    </div>
                                                                    <div>
                                                                        <Label
                                                                            htmlFor="lunch-break">Horário
                                                                            de Almoço</Label>
                                                                        <Input id="lunch-break"
                                                                               readOnly
                                                                               value={selectedEmployee.hour_data[selectedDate].lunch_break}/>
                                                                    </div>
                                                                    <div>
                                                                        <Label
                                                                            htmlFor="clock-out">Saída</Label>
                                                                        <Input id="clock-out"
                                                                               readOnly
                                                                               value={selectedEmployee.hour_data[selectedDate].clocked_out}/>
                                                                    </div>
                                                                    <div>
                                                                        <Label
                                                                            htmlFor="total-hours">Total
                                                                            de Horas</Label>
                                                                        <Input id="total-hours"
                                                                               readOnly
                                                                               value={selectedEmployee.hour_data[selectedDate].total_hours}/>
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
                                            <Button variant="destructive">
                                                Excluir
                                            </Button>
                                            <Button variant="default">
                                                Editar
                                            </Button>
                                        </div>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ))
                )
            }
        </>
    )
}