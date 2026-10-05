// Canonical role helpers — frontend uses the backend's role values (DONOR/NGO/ADMIN)
// as the single source of truth. These helpers centralize labels and dashboard routing.

export type Role = 'DONOR' | 'NGO' | 'ADMIN';

export const ROLE_LABELS: Record<Role, string> = {
  DONOR: 'Donor',
  NGO: 'NGO / Charity',
  ADMIN: 'Admin',
};

export const DASHBOARD_PATH: Record<Role, string> = {
  DONOR: '/donor',
  NGO: '/ngo',
  ADMIN: '/admin',
};

export function isRole(role: string | undefined, expected: Role): boolean {
  return (role || '').toUpperCase() === expected;
}

export function dashboardFor(role: string | undefined): string {
  const r = (role || '').toUpperCase() as Role;
  return DASHBOARD_PATH[r] || '/auth';
}
