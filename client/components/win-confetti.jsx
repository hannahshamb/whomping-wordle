import React, { useEffect, useMemo, useState } from 'react';

const CONFETTI_EMOJIS = ['⚡', '⚡', '⚡', '🪄', '🪄', '🧙', '🧙‍♀️', '✨', '✨', '✨', '✨'];
const PIECE_COUNT = 22;
const BURST_DURATION_MS = 6500;

function createPieces() {
  const pieces = [];

  for (let i = 0; i < PIECE_COUNT; i++) {
    const seed = i * 17 + 31;
    pieces.push({
      id: i,
      emoji: CONFETTI_EMOJIS[seed % CONFETTI_EMOJIS.length],
      left: `${4 + (seed * 13) % 92}%`,
      delay: `${((seed * 7) % 12) / 10}s`,
      duration: `${3.5 + (seed % 20) / 10}s`,
      size: `${38 + (seed % 14)}px`,
      drift: `${-50 + (seed % 100)}px`,
      spin: `${180 + (seed % 360)}deg`
    });
  }

  return pieces;
}

function WinConfetti() {
  const pieces = useMemo(createPieces, []);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), BURST_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="win-confetti" aria-hidden="true">
      {pieces.map(piece => (
        <span
          key={piece.id}
          className="win-confetti-piece"
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            fontSize: piece.size,
            '--drift': piece.drift,
            '--spin': piece.spin
          }}
        >
          {piece.emoji}
        </span>
      ))}
    </div>
  );
}

export default React.memo(WinConfetti);
