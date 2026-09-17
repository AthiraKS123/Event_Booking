import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import client from '../../api/client';

vi.mock('../../api/client');

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders email, password inputs and sign-in button', () => {
    render(
      <MemoryRouter>
        <LoginPage onLoginSuccess={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Sign In to EventBook')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. user@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument();
  });

  it('handles successful login and stores token in localStorage', async () => {
    const onLoginSuccessMock = vi.fn();
    const mockUser = { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'user' };

    client.post.mockResolvedValueOnce({
      data: {
        accessToken: 'mock_jwt_token_xyz',
        user: mockUser,
      },
    });

    render(
      <MemoryRouter>
        <LoginPage onLoginSuccess={onLoginSuccessMock} />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('e.g. user@example.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });

    fireEvent.change(emailInput, { target: { value: 'alice@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith('/auth/login', {
        email: 'alice@test.com',
        password: 'password123',
      });
      expect(localStorage.getItem('accessToken')).toBe('mock_jwt_token_xyz');
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockUser);
      expect(onLoginSuccessMock).toHaveBeenCalledWith(mockUser);
    });
  });

  it('displays error alert when login fails', async () => {
    client.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Invalid email or password' },
      },
    });

    render(
      <MemoryRouter>
        <LoginPage onLoginSuccess={vi.fn()} />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
});
