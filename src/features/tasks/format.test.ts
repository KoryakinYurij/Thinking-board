import { describe, expect, it, vi } from 'vitest'
import { formatDate, getDueState, isDueSoon, isOverdue } from './format'

describe('task date formatting and urgency', () => {
  it('formats date-only values without shifting them across time zones', () => {
    expect(formatDate('2026-03-19')).toBe('Mar 19')
  })

  it('detects overdue, today, and soon states for active tasks', () => {
    const now = new Date(2026, 2, 19, 9, 0, 0)

    expect(getDueState('2026-03-18', false, now)).toMatchObject({
      tone: 'overdue',
      isUrgent: true,
    })
    expect(getDueState('2026-03-19', false, now)).toMatchObject({
      tone: 'today',
      isUrgent: true,
    })
    expect(getDueState('2026-03-21', false, now)).toMatchObject({
      tone: 'soon',
      isUrgent: true,
    })
  })

  it('removes urgency from completed tasks that still have due dates', () => {
    const now = new Date(2026, 2, 19, 9, 0, 0)

    expect(getDueState('2026-03-18', true, now)).toMatchObject({
      tone: 'complete',
      isUrgent: false,
    })
  })

  it('keeps due-soon and overdue helpers aligned to local date boundaries', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 19, 9, 0, 0))

    expect(isDueSoon('2026-03-22')).toBe(true)
    expect(isDueSoon('2026-03-23')).toBe(false)
    expect(isOverdue('2026-03-18')).toBe(true)
    expect(isOverdue('2026-03-19')).toBe(false)

    vi.useRealTimers()
  })
})
