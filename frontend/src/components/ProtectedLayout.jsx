import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const ProtectedLayout = () => {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) return <div className="screen-center">Loading…</div>

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }

    return (
        <div className="app">
            <div className="shell">
                <Sidebar />
                <div className="content">
                    <Navbar />
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default ProtectedLayout