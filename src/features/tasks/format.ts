export function shiftDate(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

type DueTone = 'none' | 'overdue' | 'today' | 'soon' | 'upcoming' | 'complete'

type DueState = {
  tone: DueTone
  label: string
  detail: string
  isUrgent: boolean
}

function parseDateValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day, 12)
  }

  return new Date(value)
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(parseDateValue(value))
}

export function truncate(value: string, length: number) {
  if (value.length <= length) {
    return value
  }

  return `${value.slice(0, length).trimEnd()}…`
}

export function isDueSoon(value: string | null) {
  if (!value) {
    return false
  }

  const due = startOfDay(parseDateValue(value))
  const now = startOfDay(new Date())
  const diff = due.getTime() - now.getTime()

  return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000
}

export function isOverdue(value: string | null, completed = false) {
  if (!value || completed) {
    return false
  }

  const due = startOfDay(parseDateValue(value))
  const now = startOfDay(new Date())

  return due.getTime() < now.getTime()
}

export function getDueState(
  value: string | null,
  completed = false,
  now = new Date(),
): DueState {
  if (!value) {
    return {
      tone: 'none',
      label: 'No deadline',
      detail: 'No date',
      isUrgent: false,
    }
  }

  if (completed) {
    return {
      tone: 'complete',
      label: 'Finished',
      detail: `Was due ${formatDate(value)}`,
      isUrgent: false,
    }
  }

  const due = startOfDay(parseDateValue(value))
  const today = startOfDay(now)
  const dayDiff = Math.round(
    (due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  )

  if (dayDiff < 0) {
    const daysLate = Math.abs(dayDiff)
    return {
      tone: 'overdue',
      label: 'Overdue',
      detail: daysLate === 1 ? '1 day late' : `${daysLate} days late`,
      isUrgent: true,
    }
  }

  if (dayDiff === 0) {
    return {
      tone: 'today',
      label: 'Due today',
      detail: formatDate(value),
      isUrgent: true,
    }
  }

  if (dayDiff <= 3) {
    return {
      tone: 'soon',
      label: 'Due soon',
      detail: dayDiff === 1 ? '1 day left' : `${dayDiff} days left`,
      isUrgent: true,
    }
  }

  return {
    tone: 'upcoming',
    label: 'Scheduled',
    detail: formatDate(value),
    isUrgent: false,
  }
}
