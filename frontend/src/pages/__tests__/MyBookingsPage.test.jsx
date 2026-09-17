import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyBookingsPage from '../MyBookingsPage';
import client from '../../api/client';

vi.mock('../../api/client');

describe('MyBookingsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  it('renders booking cards and download PDF buttons', async () => {
    const mockBookings = [
      {
        _id: 'b1',
        bookingCode: 'EB-TEST55',
        totalAmount: 300,
        tierName: 'VIP',
        quantity: 2,
        status: 'confirmed',
        isCheckedIn: false,
        event: {
          title: 'Coldplay Live Concert',
          venue: 'DY Patil Stadium',
          dateTime: new Date(Date.now() + 86400000).toISOString(),
        },
      },
    ];

    client.get.mockResolvedValueOnce({
      data: { bookings: mockBookings },
    });

    render(
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Coldplay Live Concert')).toBeInTheDocument();
      expect(screen.getByText('EB-TEST55')).toBeInTheDocument();
      expect(screen.getByText(/Ready for Gate Check-In/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download Official PDF Ticket/i })).toBeInTheDocument();
    });
  });

  it('downloads PDF ticket when clicking Download Official PDF Ticket button', async () => {
    const mockBookings = [
      {
        _id: 'b1',
        bookingCode: 'EB-TEST55',
        totalAmount: 300,
        tierName: 'VIP',
        quantity: 2,
        status: 'confirmed',
        isCheckedIn: false,
        event: {
          title: 'Coldplay Live Concert',
          venue: 'DY Patil Stadium',
          dateTime: new Date().toISOString(),
        },
      },
    ];

    client.get.mockResolvedValueOnce({
      data: { bookings: mockBookings },
    });

    client.get.mockResolvedValueOnce({
      data: new Uint8Array([1, 2, 3]),
    });

    render(
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Coldplay Live Concert')).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Download Official PDF Ticket/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(client.get).toHaveBeenCalledWith('/bookings/b1/pdf', {
        responseType: 'blob',
      });
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('renders checked in badge when ticket is already used', async () => {
    const mockBookings = [
      {
        _id: 'b2',
        bookingCode: 'EB-USED99',
        totalAmount: 150,
        tierName: 'General',
        quantity: 1,
        status: 'confirmed',
        isCheckedIn: true,
        checkedInAt: new Date().toISOString(),
        event: {
          title: 'Indie Rock Night',
          venue: 'Club Echo',
          dateTime: new Date().toISOString(),
        },
      },
    ];

    client.get.mockResolvedValueOnce({
      data: { bookings: mockBookings },
    });

    render(
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Checked In at Gate/i)).toBeInTheDocument();
    });
  });
});
