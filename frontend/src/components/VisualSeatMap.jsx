import React, { useState, useEffect, useMemo } from 'react';
import { Check, Lock, Sparkles, X, AlertTriangle } from 'lucide-react';

const ALL_ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

const VisualSeatMap = ({ tier, onSelectionChange }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Dynamically compute rows and layout based on tier.totalSeats
  const { totalSeats, availableSeats, seatsPerRow, rows, seatLayout, occupiedSeats } = useMemo(() => {
    if (!tier) {
      return { totalSeats: 0, availableSeats: 0, seatsPerRow: 6, rows: [], seatLayout: [], occupiedSeats: new Set() };
    }

    const total = tier.totalSeats || 10;
    const available = tier.availableSeats !== undefined ? tier.availableSeats : total;
    const soldCount = Math.max(0, total - available);

    // Determine seats per row (e.g. 5, 6, 8, or 10 based on total capacity)
    let perRow = 6;
    if (total <= 10) perRow = 5;
    else if (total <= 24) perRow = 6;
    else if (total <= 48) perRow = 8;
    else perRow = 10;

    const numRows = Math.ceil(total / perRow);
    const activeRows = ALL_ROW_LETTERS.slice(0, numRows);

    // Build the list of all seats in this tier
    const allSeatIds = [];
    let seatCount = 0;
    for (let r = 0; r < activeRows.length && seatCount < total; r++) {
      const rowLetter = activeRows[r];
      for (let s = 1; s <= perRow && seatCount < total; s++) {
        allSeatIds.push(`${rowLetter}${s}`);
        seatCount++;
      }
    }

    // Determine which seats are occupied/sold
    const occupied = new Set(tier.occupiedSeats || []);
    let count = occupied.size;

    // If available is 0, mark 100% of seats as occupied
    if (available === 0) {
      allSeatIds.forEach((id) => occupied.add(id));
    } else {
      // Occupy remaining sold seats from back to front
      for (let i = allSeatIds.length - 1; i >= 0 && count < soldCount; i--) {
        const id = allSeatIds[i];
        if (!occupied.has(id)) {
          occupied.add(id);
          count++;
        }
      }
    }

    // Group seats by row for layout rendering
    const layout = activeRows.map((rowLetter) => ({
      row: rowLetter,
      seats: allSeatIds.filter((id) => id.startsWith(rowLetter)),
    }));

    return {
      totalSeats: total,
      availableSeats: available,
      seatsPerRow: perRow,
      rows: activeRows,
      seatLayout: layout,
      occupiedSeats: occupied,
    };
  }, [tier]);

  // Reset selected seats when tier changes
  useEffect(() => {
    setSelectedSeats([]);
    if (onSelectionChange) onSelectionChange([]);
  }, [tier]);

  const toggleSeat = (seatId) => {
    if (occupiedSeats.has(seatId) || availableSeats === 0) return;

    let updated;
    if (selectedSeats.includes(seatId)) {
      updated = selectedSeats.filter((s) => s !== seatId);
    } else {
      if (selectedSeats.length >= availableSeats) {
        alert(`Only ${availableSeats} seat(s) available in this tier.`);
        return;
      }
      if (selectedSeats.length >= 10) {
        alert('You can select a maximum of 10 seats per booking.');
        return;
      }
      updated = [...selectedSeats, seatId];
    }

    setSelectedSeats(updated);
    if (onSelectionChange) {
      onSelectionChange(updated);
    }
  };

  const handleClear = () => {
    setSelectedSeats([]);
    if (onSelectionChange) onSelectionChange([]);
  };

  const handleSelectBest = (count = 2) => {
    if (availableSeats === 0) return;

    const toPick = Math.min(count, availableSeats);
    const autoPicked = [];

    // Find all seat IDs in order from front to back
    const allSeatIds = seatLayout.flatMap((l) => l.seats);

    for (const seatId of allSeatIds) {
      if (!occupiedSeats.has(seatId) && autoPicked.length < toPick) {
        autoPicked.push(seatId);
      }
    }

    setSelectedSeats(autoPicked);
    if (onSelectionChange) onSelectionChange(autoPicked);
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-[#EBE5DC] shadow-xs space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE5DC] pb-4">
        <div>
          <h4 className="text-sm font-bold text-[#1C2434] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#DE5D3B]" />
            Visual Seat Map: {tier?.name || 'General'} Tier
          </h4>
          <p className="text-xs text-[#676C75]">
            {availableSeats === 0 ? (
              <span className="text-red-600 font-bold">This tier is currently sold out.</span>
            ) : (
              <span>
                Capacity: <strong className="text-[#DE5D3B]">{availableSeats} of {totalSeats} seats available</strong>
              </span>
            )}
          </p>
        </div>

        {availableSeats > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectBest(2)}
              className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#FDF2EC] text-[11px] font-bold text-[#DE5D3B] border border-[#DE5D3B]/20 transition-all cursor-pointer shadow-xs"
            >
              ⚡ Auto-Pick Best 2
            </button>
            {selectedSeats.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[11px] font-bold text-red-700 border border-red-200 transition-all cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sold Out Banner if 0 seats available */}
      {availableSeats === 0 && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>All {totalSeats} seats in this tier have been held or purchased. Please select another tier.</span>
        </div>
      )}

      {/* Curved Stage Header */}
      <div className="space-y-2 text-center max-w-md mx-auto">
        <div className="h-3 w-full rounded-t-full bg-gradient-to-r from-transparent via-[#DE5D3B] to-transparent opacity-80 shadow-[0_0_15px_rgba(222,93,59,0.2)]"></div>
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#DE5D3B] bg-[#FAF7F2] px-4 py-1 rounded-full border border-[#DE5D3B]/20">
          🎭 STAGE / SCREEN AREA
        </span>
      </div>

      {/* Dynamic Seat Grid */}
      <div className="space-y-3 py-2 overflow-x-auto">
        <div className="min-w-[280px] max-w-md mx-auto space-y-2.5">
          {seatLayout.map(({ row, seats }) => {
            const mid = Math.ceil(seats.length / 2);
            const leftSeats = seats.slice(0, mid);
            const rightSeats = seats.slice(mid);

            return (
              <div key={row} className="flex items-center justify-center gap-2">
                {/* Row Label (Left) */}
                <span className="w-5 text-center text-xs font-bold text-[#676C75]">{row}</span>

                {/* Left Aisle Seats */}
                <div className="flex gap-1.5">
                  {leftSeats.map((seatId) => {
                    const isOccupied = occupiedSeats.has(seatId);
                    const isSelected = selectedSeats.includes(seatId);
                    const seatNum = seatId.replace(row, '');

                    return (
                      <button
                        key={seatId}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => toggleSeat(seatId)}
                        title={isOccupied ? `Seat ${seatId} is booked/held` : `Seat ${seatId} (₹${tier?.price || 0})`}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer transform ${
                          isOccupied
                            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50'
                            : isSelected
                            ? 'bg-[#DE5D3B] text-white border-2 border-[#DE5D3B] shadow-md scale-110 font-extrabold'
                            : 'bg-[#FAF7F2] text-[#1C2434] border border-[#DE5D3B]/25 hover:border-[#DE5D3B] hover:bg-[#FDF2EC] hover:scale-105'
                        }`}
                      >
                        {isOccupied ? (
                          <Lock className="w-3 h-3 opacity-50" />
                        ) : isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          seatNum
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Center Aisle */}
                {rightSeats.length > 0 && (
                  <div className="w-4 text-center text-[9px] text-[#DE5D3B]/30 font-mono">|</div>
                )}

                {/* Right Aisle Seats */}
                <div className="flex gap-1.5">
                  {rightSeats.map((seatId) => {
                    const isOccupied = occupiedSeats.has(seatId);
                    const isSelected = selectedSeats.includes(seatId);
                    const seatNum = seatId.replace(row, '');

                    return (
                      <button
                        key={seatId}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => toggleSeat(seatId)}
                        title={isOccupied ? `Seat ${seatId} is booked/held` : `Seat ${seatId} (₹${tier?.price || 0})`}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer transform ${
                          isOccupied
                            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50'
                            : isSelected
                            ? 'bg-[#DE5D3B] text-white border-2 border-[#DE5D3B] shadow-md scale-110 font-extrabold'
                            : 'bg-[#FAF7F2] text-[#1C2434] border border-[#DE5D3B]/25 hover:border-[#DE5D3B] hover:bg-[#FDF2EC] hover:scale-105'
                        }`}
                      >
                        {isOccupied ? (
                          <Lock className="w-3 h-3 opacity-50" />
                        ) : isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          seatNum
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Row Label (Right) */}
                <span className="w-5 text-center text-xs font-bold text-[#676C75]">{row}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t border-[#EBE5DC] text-xs text-[#676C75]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#FAF7F2] border border-[#DE5D3B]/30"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#DE5D3B] border border-[#DE5D3B] shadow-xs"></div>
          <span className="font-bold text-[#DE5D3B]">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200 opacity-60"></div>
          <span>Occupied / Sold</span>
        </div>
      </div>

      {/* Selection Summary Pill */}
      {selectedSeats.length > 0 && (
        <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#DE5D3B]/25 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs shadow-xs animate-scaleUp">
          <div className="flex items-center gap-2">
            <span className="text-[#676C75]">Selected Seats:</span>
            <div className="flex flex-wrap gap-1">
              {selectedSeats.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-md bg-[#DE5D3B] text-white font-extrabold text-[11px] shadow-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="font-extrabold text-[#DE5D3B]">
            {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''} = ₹{selectedSeats.length * (tier?.price || 0)}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualSeatMap;
