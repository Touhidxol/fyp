import React, { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { initials } from '../utils/format'

const icons = {
    dashboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
    ),
    notebook: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            <path d="M8 3v18" />
            <path d="M12 8h4" />
            <path d="M12 12h4" />
        </svg>
    ),
    create: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2.5" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
        </svg>
    ),
    exam: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
        </svg>
    ),
    results: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20V10" />
            <path d="M12 20V4" />
            <path d="M20 20v-7" />
        </svg>
    ),
    tests: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
    ),
    more: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="12" r="1.2" />
            <circle cx="12" cy="12" r="1.2" />
            <circle cx="19" cy="12" r="1.2" />
        </svg>
    ),
}

// Add future pages here.
// primary: true  → eligible for the mobile bottom bar (first 4 are used)
// everything else automatically goes into the mobile "More" sheet
const links = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', primary: true },
    { to: '/notebooks', label: 'Notebooks', icon: 'notebook', primary: true },
    { to: '/tests', label: 'Tests', icon: 'tests', primary: true },
    { to: '/results', label: 'Results', icon: 'results', primary: true },
    { to: '/create-test', label: 'Create Test', icon: 'create' },
    { to: '/exam', label: 'Exam', icon: 'exam' },
]

const MAX_BAR = 5 // bottom bar slots, including "More"
const needsMore = links.length > MAX_BAR
const barLinks = needsMore
    ? links.filter((l) => l.primary).slice(0, MAX_BAR - 1)
    : links
const moreLinks = links.filter((l) => !barLinks.includes(l))

const Sidebar = () => {
    const { user, logout } = useAuth()
    const location = useLocation()

    // The sheet is "open" only for the path it was opened on,
    // so it closes itself on any navigation (including browser back).
    const [openPath, setOpenPath] = useState(null)
    const open = openPath === location.pathname
    const close = () => setOpenPath(null)

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') setOpenPath(null)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open])

    const moreActive = moreLinks.some((l) => location.pathname.startsWith(l.to))

    return (
        <>
            {/* Desktop + tablet rail */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-mark">Æ</div>
                    <div className="sidebar-brand-text">
                        <strong>PrepZeno</strong>
                        <span>Academic Intelligence</span>
                    </div>
                </div>

                <div className="sidebar-section-label">Menu</div>
                <nav className="sidebar-nav">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            title={link.label}
                            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
                        >
                            {icons[link.icon]}
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer" title={user?.email}>
                    <div className="avatar">{initials(user?.name)}</div>
                    <div className="sidebar-user">
                        <strong>{user?.name}</strong>
                        <span>{user?.email}</span>
                    </div>
                </div>
            </aside>

            {/* Phone: bottom bar */}
            <nav className="bottom-nav" aria-label="Main navigation">
                {barLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => 'bottom-link' + (isActive ? ' active' : '')}
                    >
                        {icons[link.icon]}
                        <span>{link.label}</span>
                    </NavLink>
                ))}

                {moreLinks.length > 0 && (
                    <button
                        type="button"
                        className={'bottom-link' + (moreActive || open ? ' active' : '')}
                        onClick={() => setOpenPath(open ? null : location.pathname)}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                    >
                        {icons.more}
                        <span>More</span>
                    </button>
                )}
            </nav>

            {/* Phone: "More" sheet */}
            <div className={'sheet-backdrop' + (open ? ' open' : '')} onClick={close} />
            <div
                className={'sheet' + (open ? ' open' : '')}
                role="dialog"
                aria-modal="true"
                aria-label="More navigation"
                inert={!open}
            >
                <div className="sheet-handle" />
                <div className="sheet-title">More</div>

                <div className="sheet-grid">
                    {moreLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => 'sheet-link' + (isActive ? ' active' : '')}
                        >
                            {icons[link.icon]}
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </div>

                <div className="sheet-user">
                    <div className="avatar">{initials(user?.name)}</div>
                    <div className="sidebar-user">
                        <strong>{user?.name}</strong>
                        <span>{user?.email}</span>
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                            close()
                            logout()
                        }}
                    >
                        Log out
                    </button>
                </div>
            </div>
        </>
    )
}

export default Sidebar