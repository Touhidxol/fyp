import React from 'react'
import { NavLink } from 'react-router-dom'

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
}

const links = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/notebooks', label: 'Notebooks', icon: 'notebook' },
    { to: '/create-test', label: 'Create Test', icon: 'create' },
    { to: '/tests', label: 'Tests', icon: 'tests' },
    { to: '/exam', label: 'Exam', icon: 'exam' },
    { to: '/results', label: 'Results', icon: 'results' },
]

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-brand-mark">Æ</div>
                <div className="sidebar-brand-text">
                    <strong>Aptura</strong>
                    <span>Academic Intelligence</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
                    >
                        {icons[link.icon]}
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <strong>Study streak</strong>
                12 days running
            </div>
        </aside>
    )
}

export default Sidebar