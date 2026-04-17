import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  return new Anthropic()
}

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

  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY)
  console.log('[claude] generateTasks start', {
    title,
    category,
    startDate: fmt(startDate),
    deadline: fmt(deadline),
    hasApiKey: hasKey,
  })
  if (!hasKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const t0 = Date.now()
  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })
  console.log('[claude] response received', {
    ms: Date.now() - t0,
    stop_reason: message.stop_reason,
    input_tokens: message.usage?.input_tokens,
    output_tokens: message.usage?.output_tokens,
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected Claude response type')

  const tasks = parseTasksJson(block.text)
  console.log('[claude] parsed tasks', { count: tasks.length })
  return tasks
}

export function parseTasksJson(text: string): TaskItem[] {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array found in Claude response')
  return JSON.parse(match[0]) as TaskItem[]
}
