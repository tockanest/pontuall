import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const checkPermission = (permission: AppPermissions, Permissions: StatePermissions) => Permissions ? Permissions.Administrator || Permissions[permission] : false;
