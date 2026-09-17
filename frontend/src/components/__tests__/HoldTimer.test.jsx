import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HoldTimer from '../HoldTimer';

describe('HoldTimer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders formatted time correctly for remaining minutes and seconds', () => {
    // 5 minutes in the future
    const fiveMinutesLater = new Date(Date.now() + 300 * 1000).toISOString();

    render(<HoldTimer expiresAt={fiveMinutesLater} />);

    expect(screen.getByText(/Hold Expires in:/i)).toBeInTheDocument();
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('shows urgent styling when less than 2 minutes remain', () => {
    // 90 seconds in the future
    const urgentTime = new Date(Date.now() + 90 * 1000).toISOString();

    const { container } = render(<HoldTimer expiresAt={urgentTime} />);

    expect(screen.getByText('01:30')).toBeInTheDocument();
    const timerDiv = container.firstChild;
    expect(timerDiv.className).toContain('bg-amber-100');
    expect(timerDiv.className).toContain('text-amber-900');
  });

  it('calls onExpire callback when timer reaches zero', () => {
    const onExpireMock = vi.fn();
    // 2 seconds in the future
    const nearExpiry = new Date(Date.now() + 2 * 1000).toISOString();

    render(<HoldTimer expiresAt={nearExpiry} onExpire={onExpireMock} />);

    expect(screen.getByText('00:02')).toBeInTheDocument();

    // Advance timers by 2 seconds
    vi.advanceTimersByTime(2000);

    expect(onExpireMock).toHaveBeenCalled();
  });
});
