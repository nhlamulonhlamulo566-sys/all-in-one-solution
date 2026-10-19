export const APP_ROLES = ['super_admin', 'admin', 'staff'] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function isStaffRole(role: AppRole) {
  return role === 'staff' || role === 'admin' || role === 'super_admin';
}

export function isAdministratorRole(role: AppRole) {
  return role === 'admin' || role === 'super_admin';
}
