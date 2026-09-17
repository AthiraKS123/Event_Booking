import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import MyHoldsPage from './pages/MyHoldsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F9] text-[#2A081C] font-sans pb-16">
      <Navbar currentUser={currentUser} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Routes>
          {/* Public User Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventDetailPage currentUser={currentUser} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={setCurrentUser} />} />
          <Route path="/register" element={<RegisterPage onLoginSuccess={setCurrentUser} />} />

          {/* Admin Auth Routes */}
          <Route path="/admin/login" element={<LoginPage onLoginSuccess={setCurrentUser} />} />
          <Route path="/admin/register" element={<RegisterPage onLoginSuccess={setCurrentUser} />} />

          {/* Protected User Routes */}
          <Route
            path="/my-holds"
            element={
              <ProtectedRoute currentUser={currentUser}>
                <MyHoldsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-tickets"
            element={
              <ProtectedRoute currentUser={currentUser}>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Base Route Redirect */}
          <Route
            path="/admin"
            element={
              !currentUser ? (
                <Navigate to="/admin/login" replace />
              ) : currentUser.role === 'admin' ? (
                <Navigate to="/admin/events" replace />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute currentUser={currentUser} requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
