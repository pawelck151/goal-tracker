import { logoutAction } from '@/actions/auth'
import SidebarNav from './SidebarNav'

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-stone-50 border-r border-stone-200 flex flex-col flex-shrink-0">
      <div className="px-4 py-5 border-b border-stone-200">
        <span className="text-sm font-semibold text-stone-900 tracking-tight">
          Goal Tracker
        </span>
      </div>

      <SidebarNav />

      <div className="px-4 py-4 border-t border-stone-200">
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Wyloguj
          </button>
        </form>
      </div>
    </aside>
  )
}
