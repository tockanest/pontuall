import React, {useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import Label from "@/components/ui/label";
import Input from "@/components/ui/input";
import Employees from "@/components/main/subComponents/admin/employees";

export default function Admin(
    {
        employees
    } : {
        employees: Users
    }
) {
    
    const [searchTerm, setSearchTerm] = useState<string>("")
    
    const [selectedEmployee, setSelectedEmployee] = useState<IUsers>(null)
    const [selectedDate, setSelectedDate] = useState<string>("")
    
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
        
        if(!user) return;
        
        setSelectedEmployee(user)
        return;
    }
    
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
                                GetData={GetUserData}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}