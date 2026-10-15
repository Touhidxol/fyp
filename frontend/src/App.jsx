import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import './App.css'

import AuthProvider from './context/AuthProvider'
import ProtectedLayout from './components/ProtectedLayout'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Notebooks from './pages/Notebooks'
import NotebookDetail from './pages/NotebookDetail'
import CreateTest from './pages/CreateTest'
import Tests from './pages/Tests'
import Exam from './pages/Exam'
import Results from './pages/Results'

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Everything below needs a logged-in user */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notebooks" element={<Notebooks />} />
            <Route path="/notebooks/:id" element={<NotebookDetail />} />
            <Route path="/create-test" element={<CreateTest />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/results" element={<Results />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App