import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { updateSettings } from '@/actions/settings'

const TIMEZONES = [
  'Europe/Warsaw',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
]

const inputClass =
  'w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 mb-8">
        Ustawienia
      </h1>

      <form
        action={updateSettings}
        className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 flex flex-col gap-5"
      >
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            defaultValue={user.email}
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Email poranny
            </label>
            <input
              type="time"
              name="morningTime"
              defaultValue={user.morningTime}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Email wieczorny
            </label>
            <input
              type="time"
              name="eveningTime"
              defaultValue={user.eveningTime}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Strefa czasowa
          </label>
          <select name="timezone" defaultValue={user.timezone} className={inputClass}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
        >
          Zapisz ustawienia
        </button>
      </form>
    </div>
  )
}
