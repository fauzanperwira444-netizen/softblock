import accountCircle from '@material-symbols/svg-400/outlined/account_circle.svg?raw'
import add from '@material-symbols/svg-400/outlined/add.svg?raw'
import alternateEmail from '@material-symbols/svg-400/outlined/alternate_email.svg?raw'
import arrowBack from '@material-symbols/svg-400/outlined/arrow_back.svg?raw'
import arrowForward from '@material-symbols/svg-400/outlined/arrow_forward.svg?raw'
import badge from '@material-symbols/svg-400/outlined/badge.svg?raw'
import calendarToday from '@material-symbols/svg-400/outlined/calendar_today.svg?raw'
import calendarTodayFill from '@material-symbols/svg-400/outlined/calendar_today-fill.svg?raw'
import check from '@material-symbols/svg-400/outlined/check.svg?raw'
import checkCircle from '@material-symbols/svg-400/outlined/check_circle.svg?raw'
import checklist from '@material-symbols/svg-400/outlined/checklist.svg?raw'
import checklistFill from '@material-symbols/svg-400/outlined/checklist-fill.svg?raw'
import chevronLeft from '@material-symbols/svg-400/outlined/chevron_left.svg?raw'
import chevronRight from '@material-symbols/svg-400/outlined/chevron_right.svg?raw'
import close from '@material-symbols/svg-400/outlined/close.svg?raw'
import cloudDone from '@material-symbols/svg-400/outlined/cloud_done.svg?raw'
import cloudOff from '@material-symbols/svg-400/outlined/cloud_off.svg?raw'
import syncProblem from '@material-symbols/svg-400/outlined/sync_problem.svg?raw'
import dashboard from '@material-symbols/svg-400/outlined/dashboard.svg?raw'
import dashboardFill from '@material-symbols/svg-400/outlined/dashboard-fill.svg?raw'
import del from '@material-symbols/svg-400/outlined/delete.svg?raw'
import edit from '@material-symbols/svg-400/outlined/edit.svg?raw'
import error from '@material-symbols/svg-400/outlined/error.svg?raw'
import eventBusy from '@material-symbols/svg-400/outlined/event_busy.svg?raw'
import folder from '@material-symbols/svg-400/outlined/folder.svg?raw'
import folderFill from '@material-symbols/svg-400/outlined/folder-fill.svg?raw'
import inbox from '@material-symbols/svg-400/outlined/inbox.svg?raw'
import info from '@material-symbols/svg-400/outlined/info.svg?raw'
import key from '@material-symbols/svg-400/outlined/key.svg?raw'
import linkOff from '@material-symbols/svg-400/outlined/link_off.svg?raw'
import lock from '@material-symbols/svg-400/outlined/lock.svg?raw'
import lockClock from '@material-symbols/svg-400/outlined/lock_clock.svg?raw'
import lockReset from '@material-symbols/svg-400/outlined/lock_reset.svg?raw'
import login from '@material-symbols/svg-400/outlined/login.svg?raw'
import logout from '@material-symbols/svg-400/outlined/logout.svg?raw'
import mail from '@material-symbols/svg-400/outlined/mail.svg?raw'
import markEmailRead from '@material-symbols/svg-400/outlined/mark_email_read.svg?raw'
import markEmailUnread from '@material-symbols/svg-400/outlined/mark_email_unread.svg?raw'
import password from '@material-symbols/svg-400/outlined/password.svg?raw'
import powerSettingsNew from '@material-symbols/svg-400/outlined/power_settings_new.svg?raw'
import refresh from '@material-symbols/svg-400/outlined/refresh.svg?raw'
import remove from '@material-symbols/svg-400/outlined/remove.svg?raw'
import schedule from '@material-symbols/svg-400/outlined/schedule.svg?raw'
import sell from '@material-symbols/svg-400/outlined/sell.svg?raw'
import sync from '@material-symbols/svg-400/outlined/sync.svg?raw'
import taskAlt from '@material-symbols/svg-400/outlined/task_alt.svg?raw'
import taskAltFill from '@material-symbols/svg-400/outlined/task_alt-fill.svg?raw'
import update from '@material-symbols/svg-400/outlined/update.svg?raw'
import verified from '@material-symbols/svg-400/outlined/verified.svg?raw'
import viewKanban from '@material-symbols/svg-400/outlined/view_kanban.svg?raw'
import visibility from '@material-symbols/svg-400/outlined/visibility.svg?raw'
import visibilityOff from '@material-symbols/svg-400/outlined/visibility_off.svg?raw'
import warning from '@material-symbols/svg-400/outlined/warning.svg?raw'
import wifiOff from '@material-symbols/svg-400/outlined/wifi_off.svg?raw'

// Ikon diimpor per berkas agar bundel hanya memuat glyph yang dipakai (font ikon penuh ~4 MB).
const raw = {
  account_circle: accountCircle,
  add,
  alternate_email: alternateEmail,
  arrow_back: arrowBack,
  arrow_forward: arrowForward,
  badge,
  calendar_today: calendarToday,
  'calendar_today-fill': calendarTodayFill,
  check,
  check_circle: checkCircle,
  checklist,
  'checklist-fill': checklistFill,
  chevron_left: chevronLeft,
  chevron_right: chevronRight,
  close,
  cloud_done: cloudDone,
  cloud_off: cloudOff,
  sync_problem: syncProblem,
  dashboard,
  'dashboard-fill': dashboardFill,
  delete: del,
  edit,
  error,
  event_busy: eventBusy,
  folder,
  'folder-fill': folderFill,
  inbox,
  info,
  key,
  link_off: linkOff,
  lock,
  lock_clock: lockClock,
  lock_reset: lockReset,
  login,
  logout,
  mail,
  mark_email_read: markEmailRead,
  mark_email_unread: markEmailUnread,
  password,
  power_settings_new: powerSettingsNew,
  refresh,
  remove,
  schedule,
  sell,
  sync,
  task_alt: taskAlt,
  'task_alt-fill': taskAltFill,
  update,
  verified,
  view_kanban: viewKanban,
  visibility,
  visibility_off: visibilityOff,
  warning,
  wifi_off: wifiOff,
} as const

export type IconName = keyof typeof raw

export const iconPaths = Object.fromEntries(
  Object.entries(raw).map(([name, svg]) => [name, /\sd="([^"]+)"/.exec(svg)?.[1] ?? '']),
) as Record<IconName, string>
