import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckInResultModal from '../CheckInResultModal';

describe('CheckInResultModal Component', () => {
  it('returns null if result prop is not provided', () => {
    const { container } = render(<CheckInResultModal result={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders green success state with attendee and booking details', () => {
    const mockResult = {
      status: 'SUCCESS',
      message: 'Ticket verified successfully',
      booking: {
        attendeeName: 'Jane Gatekeeper',
        bookingCode: 'EB-PASS44',
        eventTitle: 'Coldplay India',
        tierName: 'VIP',
        quantity: 2,
        venue: 'Main Stadium',
        checkedInAt: new Date().toISOString(),
      },
    };

    render(<CheckInResultModal result={mockResult} onClose={vi.fn()} />);

    expect(screen.getByText(/ENTRY GRANTED!/i)).toBeInTheDocument();
    expect(screen.getByText('Jane Gatekeeper')).toBeInTheDocument();
    expect(screen.getByText('EB-PASS44')).toBeInTheDocument();
    expect(screen.getByText('Coldplay India')).toBeInTheDocument();
  });

  it('renders duplicate alert banner when status is DUPLICATE', () => {
    const mockResult = {
      status: 'DUPLICATE',
      message: 'Ticket was already scanned at 10:30 AM',
    };

    render(<CheckInResultModal result={mockResult} onClose={vi.fn()} />);

    expect(screen.getByText(/DUPLICATE ENTRY DETECTED/i)).toBeInTheDocument();
    expect(screen.getByText('Ticket was already scanned at 10:30 AM')).toBeInTheDocument();
    expect(screen.getByText('Gatekeeper Security Alert')).toBeInTheDocument();
  });

  it('renders invalid / access denied banner when status is INVALID', () => {
    const mockResult = {
      status: 'INVALID',
      message: 'Invalid booking code',
    };

    render(<CheckInResultModal result={mockResult} onClose={vi.fn()} />);

    expect(screen.getByText(/ACCESS DENIED/i)).toBeInTheDocument();
    expect(screen.getByText('Invalid booking code')).toBeInTheDocument();
  });

  it('triggers onClose when Close button is clicked', () => {
    const onCloseMock = vi.fn();
    const mockResult = {
      status: 'SUCCESS',
      message: 'Verified',
    };

    render(<CheckInResultModal result={mockResult} onClose={onCloseMock} />);

    fireEvent.click(screen.getByText(/Done \/ Close/i));
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('triggers onScanNext when Scan Next Attendee button is clicked', () => {
    const onCloseMock = vi.fn();
    const onScanNextMock = vi.fn();
    const mockResult = {
      status: 'SUCCESS',
      message: 'Verified',
    };

    render(
      <CheckInResultModal
        result={mockResult}
        onClose={onCloseMock}
        onScanNext={onScanNextMock}
      />
    );

    fireEvent.click(screen.getByText(/Scan Next Attendee/i));
    expect(onCloseMock).toHaveBeenCalled();
    expect(onScanNextMock).toHaveBeenCalled();
  });
});
