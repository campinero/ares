import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { NAV, NAV_GROUPS } from '@/nav'
import { KeyHint } from '@/components/ui'

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <nav
      aria-label="Case modules"
      className={cn(
        'flex shrink-0 flex-col overflow-y-auto border-r border-line bg-abyss/70 transition-[width] duration-200',
        collapsed ? 'w-[52px]' : 'w-[188px]',
      )}
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.id} className="pb-1">
          {!collapsed ? (
            <div className="px-3 pt-3 pb-1 text-[9px] font-semibold tracking-[0.18em] text-ink-4 uppercase">
              {group.label}
            </div>
          ) : (
            <div className="mx-3 my-2 h-px bg-line" />
          )}
          {NAV.filter((item) => item.group === group.id).map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                title={collapsed ? item.label : item.description}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2.5 px-3 py-[7px] text-[12px] transition-colors',
                    isActive ? 'bg-cyan/10 text-cyan' : 'text-ink-3 hover:bg-panel-2 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? <span className="absolute inset-y-0 left-0 w-[2px] bg-cyan" /> : null}
                    <Icon className="size-3.5 shrink-0" />
                    {!collapsed ? (
                      <>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.shortcut ? (
                          <span className="opacity-0 transition-opacity group-hover:opacity-100">
                            <KeyHint combo={item.shortcut} />
                          </span>
                        ) : null}
                      </>
                    ) : null}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
