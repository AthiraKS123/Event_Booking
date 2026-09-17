import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';
import client from '../../api/client';

vi.mock('../../api/client');

describe('RegisterPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders registration form inputs', () => {
    render(
      <MemoryRouter>
        <RegisterPage onLoginSuccess={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Create an Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Arya Dev')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. user@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('At least 6 characters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register Account/i })).toBeInTheDocument();
  });

  it('submits registration form successfully and saves session', async () => {
    const onLoginSuccessMock = vi.fn();
    const mockUser = { id: 'u2', name: 'John Doe', email: 'john@example.com', role: 'user' };

    client.post.mockResolvedValueOnce({
      data: {
        accessToken: 'mock_register_token_123',
        user: mockUser,
      },
    });

    render(
      <MemoryRouter>
        <RegisterPage onLoginSuccess={onLoginSuccessMock} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. Arya Dev'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. user@example.com'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /Register Account/i }));

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith('/auth/register', {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'user',
      });
      expect(localStorage.getItem('accessToken')).toBe('mock_register_token_123');
      expect(onLoginSuccessMock).toHaveBeenCalledWith(mockUser);
    });
  });

  it('displays error alert when registration is rejected', async () => {
    client.post.mockRejectedValueOnce({
      response: {
        data: { message: 'User with this email already exists' },
      },
    });

    render(
      <MemoryRouter>
        <RegisterPage onLoginSuccess={vi.fn()} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. Arya Dev'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. user@example.com'), { target: { value: 'exists@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /Register Account/i }));

    await waitFor(() => {
      expect(screen.getByText('User with this email already exists')).toBeInTheDocument();
    });
  });
});
