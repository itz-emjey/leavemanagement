export const ROLES = {
  ADMIN: 1,
  MANAGER: 2,
  EMPLOYEE: 3,
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_NAMES = {
  [ROLES.ADMIN]: 'admin',
  [ROLES.MANAGER]: 'manager',
  [ROLES.EMPLOYEE]: 'employee',
} as const;
