import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const titles = {
    '/': ['Dashboard', 'A look at where things stand today'],
    '/dashboard': ['Dashboard', 'A look at where things stand today'],
    '/notebooks': ['Notebooks', 'Rooms for your documents, chats, and tests'],
    '/create-test': ['Create Test', 'Set the shape of your next test'],
    '/tests': ['Tests', 'Every test generated across your notebooks'],
    '/exam': ['Exam', 'Stay focused — you can do this'],
    '/results': ['Results', 'How your last attempts scored'],
}

const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
})

const initials = (name = '') =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('') || '?'

const Navbar = () => {
    const location = useLocation()
    const { user, logout } = useAuth()

    const isNotebookDetail = location.pathname.startsWith('/notebooks/')
    const [title] = titles[location.pathname] ||
        (isNotebookDetail ? ['Notebook', ''] : ['Aptura', ''])

    return (
        <header className="topbar">
            <div className="topbar-title">
                <h2>{title}</h2>
                <span className="topbar-date">{today}</span>
            </div>

            <div className="topbar-actions">
                <label className="topbar-search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                    </svg>
                    <input type="text" placeholder="Search notes, tests…" />
                </label>

                <div className="avatar" title={user?.email}>{initials(user?.name)}</div>
                <button className="btn btn-secondary btn-sm" onClick={logout}>Log out</button>
            </div>
        </header>
    )
}

export default Navbar