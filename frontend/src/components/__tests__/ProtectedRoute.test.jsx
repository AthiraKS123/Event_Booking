import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

describe('ProtectedRoute Component', () => {
  it('redirects unauthenticated user to /login', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute currentUser={null}>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page Target</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Target')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('redirects non-admin user to / when requireAdmin is true', () => {
    const regularUser = { name: 'Bob', role: 'user' };

    render(
      <MemoryRouter initialEntries={['/admin-only']}>
        <Routes>
          <Route
            path="/admin-only"
            element={
              <ProtectedRoute currentUser={regularUser} requireAdmin={true}>
                <div>Admin Portal Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>Home Page Target</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Page Target')).toBeInTheDocument();
    expect(screen.queryByText('Admin Portal Dashboard')).not.toBeInTheDocument();
  });

  it('renders children when user is authorized', () => {
    const adminUser = { name: 'Arya', role: 'admin' };

    render(
      <MemoryRouter initialEntries={['/admin-only']}>
        <Routes>
          <Route
            path="/admin-only"
            element={
              <ProtectedRoute currentUser={adminUser} requireAdmin={true}>
                <div>Admin Portal Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Portal Dashboard')).toBeInTheDocument();
  });
});
