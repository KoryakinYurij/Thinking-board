export function shiftDate(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
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

  const due = new Date(value)
  const now = new Date()
  const diff = due.getTime() - now.getTime()

  return diff > 0 && diff <= 72 * 60 * 60 * 1000
}
