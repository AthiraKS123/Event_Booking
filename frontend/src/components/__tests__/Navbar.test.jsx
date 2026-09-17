import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../Navbar';

describe('Navbar Component', () => {
  it('renders guest navigation when unauthenticated', () => {
    render(
      <MemoryRouter>
        <Navbar currentUser={null} onLogout={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('EventBook')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('My Active Holds')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Portal')).not.toBeInTheDocument();
  });

  it('renders user details, holds, and ticket links when logged in', () => {
    const mockUser = {
      name: 'Alice Wonder',
      role: 'user',
    };

    render(
      <MemoryRouter>
        <Navbar currentUser={mockUser} onLogout={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Alice Wonder')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('My Active Holds')).toBeInTheDocument();
    expect(screen.getByText('My Tickets')).toBeInTheDocument();
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });

  it('renders Admin Portal link when user role is admin', () => {
    const mockAdmin = {
      name: 'Admin Arya',
      role: 'admin',
    };

    render(
      <MemoryRouter>
        <Navbar currentUser={mockAdmin} onLogout={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('calls onLogout callback when logout button is clicked', () => {
    const onLogoutMock = vi.fn();
    const mockUser = { name: 'Alice', role: 'user' };

    render(
      <MemoryRouter>
        <Navbar currentUser={mockUser} onLogout={onLogoutMock} />
      </MemoryRouter>
    );

    const logoutBtn = screen.getByTitle('Logout');
    fireEvent.click(logoutBtn);
    expect(onLogoutMock).toHaveBeenCalled();
  });
});
