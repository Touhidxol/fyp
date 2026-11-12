import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const ExamLayout = () => {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) return <div className="screen-center">Loading…</div>

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }

    return (
        <div className="exam-shell">
            <header className="exam-bar">
                <div className="sidebar-brand-mark">Æ</div>
                <strong>PrepZeno</strong>
                <span className="exam-bar-tag">Exam in progress</span>
            </header>
            <Outlet />
        </div>
    )
}

export default ExamLayout