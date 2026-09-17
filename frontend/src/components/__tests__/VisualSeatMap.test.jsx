import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisualSeatMap from '../VisualSeatMap';

describe('VisualSeatMap Component', () => {
  const mockTier = {
    _id: 'tier_1',
    name: 'VIP Gold',
    totalSeats: 10,
    availableSeats: 8,
    price: 150,
    occupiedSeats: ['A5', 'B5'],
  };

  it('renders seat map header with tier name and capacity', () => {
    render(<VisualSeatMap tier={mockTier} onSelectionChange={vi.fn()} />);

    expect(screen.getByText(/Visual Seat Map: VIP Gold Tier/i)).toBeInTheDocument();
    expect(screen.getByText(/8 of 10 seats available/i)).toBeInTheDocument();
  });

  it('toggles seat selection when an available seat is clicked', () => {
    const onSelectionChangeMock = vi.fn();
    render(<VisualSeatMap tier={mockTier} onSelectionChange={onSelectionChangeMock} />);

    const seatA1 = screen.getByTitle('Seat A1 (₹150)');
    fireEvent.click(seatA1);

    expect(onSelectionChangeMock).toHaveBeenCalledWith(['A1']);

    // Clicking again deselects it
    fireEvent.click(seatA1);
    expect(onSelectionChangeMock).toHaveBeenCalledWith([]);
  });

  it('does not allow selecting occupied seats', () => {
    const onSelectionChangeMock = vi.fn();
    render(<VisualSeatMap tier={mockTier} onSelectionChange={onSelectionChangeMock} />);

    const occupiedSeat = screen.getByTitle('Seat A5 is booked/held');
    expect(occupiedSeat).toBeDisabled();
    fireEvent.click(occupiedSeat);

    expect(onSelectionChangeMock).not.toHaveBeenCalledWith(['A5']);
  });

  it('renders sold out message when available seats is 0', () => {
    const soldOutTier = {
      _id: 'tier_2',
      name: 'Sold Out Tier',
      totalSeats: 10,
      availableSeats: 0,
      price: 100,
    };

    render(<VisualSeatMap tier={soldOutTier} onSelectionChange={vi.fn()} />);

    expect(screen.getByText(/This tier is currently sold out/i)).toBeInTheDocument();
  });

  it('selects best seats when clicking Auto-Pick Best 2', () => {
    const onSelectionChangeMock = vi.fn();
    render(<VisualSeatMap tier={mockTier} onSelectionChange={onSelectionChangeMock} />);

    const pickBestBtn = screen.getByText(/Auto-Pick Best 2/i);
    fireEvent.click(pickBestBtn);

    expect(onSelectionChangeMock).toHaveBeenCalledWith(['A1', 'A2']);
  });
});
