import type { UserRole } from '@/types/UserItem'

export const managerRoles: UserRole[] = ['MANAGER', 'MANAGER_PRIMARY', 'MANAGER_SENIOR']

export const isManagerRole = (role?: string | null): role is UserRole => {
  return managerRoles.includes(role as UserRole)
}
