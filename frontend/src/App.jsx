import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import './App.css'

import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'

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
      <div className="app">
        <div className="shell">
          <Sidebar />

          <div className="content">
            <Navbar />

            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/notebooks" element={<Notebooks />} />
              <Route path="/notebooks/:id" element={<NotebookDetail />} />
              <Route path="/create-test" element={<CreateTest />} />
              <Route path="/tests" element={<Tests />} />
              <Route path="/exam" element={<Exam />} />
              <Route path="/results" element={<Results />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App