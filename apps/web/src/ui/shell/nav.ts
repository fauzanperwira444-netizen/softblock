import type { IconName } from '../kit/icons'

type NavItem = { to: string; label: string; icon: IconName; iconAktif: IconName }

// Lima tujuan navigasi primer (J-01), tanpa badge.
export const NAV_UTAMA: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', iconAktif: 'dashboard-fill' },
  { to: '/projek', label: 'Projek', icon: 'folder', iconAktif: 'folder-fill' },
  { to: '/task', label: 'Task', icon: 'task_alt', iconAktif: 'task_alt-fill' },
  { to: '/todo', label: 'To-do', icon: 'checklist', iconAktif: 'checklist-fill' },
  { to: '/kalender', label: 'Kalender', icon: 'calendar_today', iconAktif: 'calendar_today-fill' },
]
