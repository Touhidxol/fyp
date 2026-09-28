import React from 'react'
import { useLocation } from 'react-router-dom'

const titles = {
    '/': ['Dashboard', 'A look at where things stand today'],
    '/dashboard': ['Dashboard', 'A look at where things stand today'],
    '/notebook': ['Notebooks', 'Rooms for your documents, chats, and tests'],
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

const Navbar = () => {
    const location = useLocation()
    const isNotebookDetail = location.pathname.startsWith('/notebook/')
    const [title, subtitle] = titles[location.pathname] ||
        (isNotebookDetail ? ['Notebook', 'Documents, chat, and generated tests'] : ['Aptura', ''])

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

                <div className="streak-badge">
                    <span>🔥</span>
                    <span className="num">12</span> day streak
                </div>

                <div className="avatar">RA</div>
            </div>
        </header>
    )
}

export default Navbar