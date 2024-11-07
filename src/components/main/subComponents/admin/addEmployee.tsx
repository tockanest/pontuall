import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {SpinnerIcon, SuccessCircle} from "@/components/component/icons";
import Label from "@/components/ui/label";
import Input from "@/components/ui/input";
import React, {useEffect, useState} from "react";
import TauriApi from "@/lib/Tauri";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {ChevronDownIcon} from "@radix-ui/react-icons";
import {Checkbox} from "@/components/ui/checkbox";

export default function AddEmployee(
    {setUsers}: { setUsers: React.Dispatch<React.SetStateAction<Users | []>> }
) {

    const [openNewUserModal, setOpenNewUserModal] = useState<boolean>(false)
    const [cardApproach, setCardApproach] = useState<boolean>(false)
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        role: "",
        lunch_time: "",
        phone: ""
    })

    const [permissionsDropdown, setPermissionsDropdown] = useState<boolean>(false)
    const [modifiesOthers, setModifiesOthers] = useState<boolean>(false)
    const [selfDelete, setSelfDelete] = useState<boolean>(false)
    const [deletesOthers, setDeletesOthers] = useState<boolean>(false)
    const [editHours, setEditHours] = useState<boolean>(false)
    const [editPermissions, setEditPermissions] = useState<boolean>(false)
    const [createReports, setCreateReports] = useState<boolean>(false)
    const [supervisor, setSupervisor] = useState<boolean>(false)
    const [administrator, setAdministrator] = useState<boolean>(false)

    const [success, setSuccess] = useState<boolean>(false)

    async function HandleReadCard() {
        try {
            if (typeof window !== "undefined") {
                // This is following the standard I set for my old company's Mifare 1k Classic cards.
                // Modify this to fit your needs.
                // If you're not using Mifare 1k Classic cards, you'll need to modify the rust backend to read your card.
                const blocks = {
                    "name": 5,
                    "surname": 6,
                    "phone": 8,
                }

                let name = "";
                let surname = "";
                let phone = "";

                // Read card using blocks
                for (const [key, value] of Object.entries(blocks)) {
                    const data = await TauriApi.ReadCard(value)
                    switch (key) {
                        case "name":
                            // Replace all null bytes, spaces and new lines
                            const nameData = data.replaceAll(/\0/g, "").replaceAll(/\s/g, "").replaceAll(/\n/g, "")
                            // Trim the data to 16 bytes max
                            name = nameData.substring(0, 16)
                        case "surname":
                            const surnameData = data.replaceAll(/\0/g, "").replaceAll(/\n/g, "")
                            surname = surnameData.substring(0, 16)
                            break;
                        case "phone":
                            const phoneData = data.replaceAll(/\0/g, "").replaceAll(/\s/g, "").replaceAll(/\n/g, "")
                            phone = phoneData.substring(0, 16)
                            break;
                    }
                }
                // Cut the name and surname to 16 bytes max.
                // Sorry, most of the time you'll need to adjust this to fit your needs.
                // Mifare Classic cards only support 16 bytes per block.
                const nameData = (name + " " + surname).substring(0, 16)

                setNewUser({
                    name: nameData,
                    email: "",
                    role: "",
                    lunch_time: "",
                    phone: phone
                })

            }
        } catch (e: any) {
            console.log(e)
        }
    }

    async function HandleCloseRead() {
        try {
            if (typeof window !== "undefined") {
                await TauriApi.CloseReader()
            }
        } catch (e: any) {
            console.log(e)
        }
    }

    async function HandleAddEmployee(
        name: string,
        email: string,
        role: string,
        lunch_time: string,
        phone: string,
        permissions = {
            modifiesOthers,
            selfDelete,
            deletesOthers,
            editHours,
            editPermissions,
            createReports,
            supervisor,
            administrator
        }
    ) {
        try {
            if (typeof window !== "undefined") {
                const id = await TauriApi.GenerateUserId()
                // await TauriApi.WriteCard(5, id)

                const set_permissions = [
                    {
                        permission: "ReadSelf",
                        value: true
                    },
                    {
                        permission: "ReadOthers",
                        value: true
                    },
                    {
                        permission: "WriteSelf",
                        value: true
                    },
                    {
                        permission: "WriteOthers",
                        value: permissions.modifiesOthers
                    },
                    {
                        permission: "DeleteSelf",
                        value: permissions.selfDelete
                    },
                    {
                        permission: "DeleteOthers",
                        value: permissions.deletesOthers
                    },
                    {
                        permission: "EditHours",
                        value: permissions.editHours
                    },
                    {
                        permission: "EditHierarchy",
                        value: permissions.editPermissions
                    },
                    {
                        permission: "CreateReports",
                        value: permissions.createReports
                    },
                    {
                        permission: "Supervisor",
                        value: permissions.supervisor
                    },
                    {
                        permission: "Administrator",
                        value: permissions.administrator
                    }
                ]
                // Get what permissions are enabled and join their names into a single string
                const permissions_str = set_permissions
                    .filter((permission) => permission.value)
                    .map((permission) => permission.permission)
                    .join(",")

                const newUser = await TauriApi.InsertNewUser(
                    id,
                    name,
                    email,
                    role,
                    lunch_time,
                    phone,
                    permissions_str
                )

                if (newUser) {
                    await TauriApi.GetCache().then((data) => {
                        const users = Object.entries(data).map(([key, value]) => {
                            return {
                                ...value
                            }
                        }) as Users
                        setUsers(users)
                    })

                    setCardApproach(true)
                    const write = await TauriApi.WriteCard(5, id)
                    if (write) {
                        setCardApproach(false)
                        setSuccess(true)
                    }
                }


            }
        } catch (e: any) {
            console.log(e)
        }
    }

    useEffect(() => {
        // Set all other permissions to false
        if (administrator) {
            const permissions = [
                setModifiesOthers,
                setSelfDelete,
                setDeletesOthers,
                setEditHours,
                setEditPermissions,
                setCreateReports,
                setSupervisor
            ]

            permissions.forEach((permission) => permission(false))
        } else if (supervisor) {
            const permissions = [
                setModifiesOthers,
                setSelfDelete,
                setDeletesOthers,
                setEditHours,
                setEditPermissions,
                setCreateReports,
                setAdministrator
            ]

            permissions.forEach((permission) => permission(false))
        }
    }, [administrator, supervisor])

    return (
        <Dialog open={openNewUserModal}>
            <DialogTrigger asChild>
                <Button
                    variant={"secondary"}
                    onClick={() => setOpenNewUserModal(!openNewUserModal)}
                >Adicionar Funcionário</Button>
            </DialogTrigger>
            <DialogContent className={"no-close"}>
                <DialogHeader>
                    <DialogTitle>
                        Adicionar Funcionário
                    </DialogTitle>
                    <DialogDescription>
                        Insira ou aproxime o cartão para importar os dados.
                    </DialogDescription>
                </DialogHeader>
                <div className={"grid gap-4"}>
                    {cardApproach && (
                        <>
                            <div className="flex flex-col items-center justify-center py-8">
                                Aproxime o cartão do leitor.
                                <SpinnerIcon className={"w-16 h-16 animate-spin mt-2"}/>
                            </div>
                        </>
                    )}
                    <Label htmlFor={"name"}>
                        Nome
                    </Label>
                    <Input
                        id={"name"} type={"text"} placeholder={"Nome do Funcionário"}
                        value={newUser.name}
                        max={24}
                        onChange={(e) => {
                            if (e.target.value.length > 24) return;
                            setNewUser({...newUser, name: e.target.value})
                        }}
                    />
                    <Label htmlFor={"email"}>
                        E-mail
                    </Label>
                    <Input id={"email"} type={"email"}
                           value={newUser.email}
                           placeholder={"E-mail do Funcionário"}
                           onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    />
                    <Label htmlFor={"role"}>
                        Cargo
                    </Label>
                    <Input
                        id={"role"} type={"text"} placeholder={"Cargo do Funcionário"}
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    />
                    <Label htmlFor={"lunch_time"}>
                        Horário de Almoço
                    </Label>
                    <Input
                        id={"lunch_time"} type={"time"}
                        value={newUser.lunch_time}
                        onChange={(e) => setNewUser({...newUser, lunch_time: e.target.value})}
                    />
                    <Label htmlFor={"phone"}>
                        Número de Celular
                    </Label>
                    <Input
                        id={"phone"} type={"number"}
                        value={newUser.phone}
                        placeholder={"Número de Celular"}
                        onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    />
                    <Label htmlFor={"permissions"}>
                        Permissões do Funcionário
                    </Label>
                    <DropdownMenu
                        open={permissionsDropdown}
                        onOpenChange={() => setPermissionsDropdown(!permissionsDropdown)}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={"outline"} className="flex items-center gap-2 w-fit min-w-[250px]"
                            >
                                <span>Selecione as Permissões</span>
                                <ChevronDownIcon className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[250px] p-2"
                            onCloseAutoFocus={(event) => event.preventDefault()}
                        >
                            {
                                [
                                    {
                                        name: "Modifica Outros",
                                        state: modifiesOthers,
                                        setState: setModifiesOthers
                                    },
                                    {
                                        name: "Deleta Próprio",
                                        state: selfDelete,
                                        setState: setSelfDelete
                                    },
                                    {
                                        name: "Deleta Outros",
                                        state: deletesOthers,
                                        setState: setDeletesOthers
                                    },
                                    {
                                        name: "Edita Horas",
                                        state: editHours,
                                        setState: setEditHours
                                    },
                                    {
                                        name: "Edita Permissões",
                                        state: editPermissions,
                                        setState: setEditPermissions
                                    },
                                    {
                                        name: "Cria Relatórios",
                                        state: createReports,
                                        setState: setCreateReports
                                    },
                                    {
                                        name: "Supervisor",
                                        state: supervisor,
                                        setState: setSupervisor
                                    },
                                    {
                                        name: "Administrador",
                                        state: administrator,
                                        setState: setAdministrator
                                    }
                                ].map((permission) => (
                                    <DropdownMenuCheckboxItem
                                        key={permission.name}
                                        className={"gap-2"}
                                        onSelect={(event) => event.preventDefault()}
                                        disabled=
                                            {
                                                administrator && permission.name !== "Administrador" ||
                                                supervisor && permission.name !== "Supervisor"
                                            }
                                    >
                                        <Checkbox
                                            checked={permission.state}
                                            onCheckedChange={() => permission.setState(!permission.state)}
                                        />
                                        <span>{permission.name}</span>
                                    </DropdownMenuCheckboxItem>
                                ))
                            }
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {
                    success && (
                        <div className={"flex flex-row justify-center items-center"}>
                            <SuccessCircle className={"w-8 h-8"}/>
                            <p className={"text-green-500"}>Funcionário Adicionado com Sucesso!</p>
                        </div>
                    )
                }
                <div className={"flex flex-row justify-evenly"}>
                    <Button
                        variant={"default"}
                        disabled={
                            !newUser.name ||
                            !newUser.email ||
                            !newUser.role ||
                            !newUser.lunch_time ||
                            !newUser.phone
                        }
                        onClick={() => {
                            HandleAddEmployee(
                                newUser.name,
                                newUser.email,
                                newUser.role,
                                newUser.lunch_time,
                                newUser.phone
                            ).then(() => {
                                console.log("Ok")
                            })
                        }}
                    >Adicionar</Button>
                    <Button
                        variant={"secondary"}
                        onClick={() => {
                            setCardApproach(true)
                            HandleReadCard().then(() => {
                                setCardApproach(false)
                            })
                        }}
                    >Importar</Button>
                    <Button
                        variant={"destructive"}
                        onClick={() => {
                            if (cardApproach) {
                                HandleCloseRead()
                                setCardApproach(false)
                            }
                            setNewUser({
                                name: "",
                                email: "",
                                role: "",
                                lunch_time: "",
                                phone: ""
                            })
                            setOpenNewUserModal(!openNewUserModal)
                        }}
                    >
                        Cancelar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}