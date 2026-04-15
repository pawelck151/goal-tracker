import { describe, it, expect } from 'vitest'
import { parseTasksJson } from './claude'

describe('parseTasksJson', () => {
  it('parses a clean JSON array', () => {
    const input = '[{"date":"2024-01-01","title":"Task 1","order":1}]'
    const result = parseTasksJson(input)
    expect(result).toEqual([{ date: '2024-01-01', title: 'Task 1', order: 1 }])
  })

  it('extracts JSON array embedded in surrounding text', () => {
    const input = 'Here are your tasks:\n[{"date":"2024-01-01","title":"Task 1","order":1}]\nEnjoy!'
    const result = parseTasksJson(input)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Task 1')
  })

  it('throws when no JSON array is found', () => {
    expect(() => parseTasksJson('No array here')).toThrow('No JSON array found')
  })
})
