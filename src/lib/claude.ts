import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export interface TaskItem {
  date: string
  title: string
  order: number
}

export async function generateTasks(
  title: string,
  category: string,
  description: string,
  startDate: Date,
  deadline: Date
): Promise<TaskItem[]> {
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const prompt = `Goal: ${title}
Category: ${category}
Description: ${description}
Start date: ${fmt(startDate)}
Deadline: ${fmt(deadline)}

Break this goal into daily micro-tasks (one task per day, max 30 minutes each).
Return a JSON array only — no markdown, no explanation:
[{ "date": "YYYY-MM-DD", "title": "...", "order": 1 }, ...]
Only include dates between ${fmt(startDate)} and ${fmt(deadline)} inclusive.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected Claude response type')

  return parseTasksJson(block.text)
}

export function parseTasksJson(text: string): TaskItem[] {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array found in Claude response')
  return JSON.parse(match[0]) as TaskItem[]
}
