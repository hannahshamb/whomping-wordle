import React, { useState, useEffect } from 'react';

function Countdown({ timeZone, timeZoneDetails }) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    function calculateCountdown() {
      const options = { timeZone: 'America/Los_Angeles' };
      const currentDatePST = new Date().toLocaleString('en-US', options);
      const midnightPST = new Date(currentDatePST);
      midnightPST.setHours(24, 0, 0, 0);

      const timeDifference = midnightPST - new Date(currentDatePST);

      const hours = Math.floor(timeDifference / (60 * 60 * 1000));
      const minutes = Math.floor((timeDifference % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((timeDifference % (60 * 1000)) / 1000);

      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');

      const countdownValue = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
      setTimeRemaining(countdownValue);
    }

    calculateCountdown();

    const countdownInterval = setInterval(calculateCountdown, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, []);

  return (
    <div className='w-100'>
      <hr className='my-0' />
      <p className='btn-font m-0'>Next wizard in:</p>
      <p className='btn-font count-down m-0'>{timeRemaining}</p>
      <p className='count-down-details m-0'>Time zone: {timeZone}</p>
      <p className='count-down-details m-0'>{timeZoneDetails}</p>
    </div>
  );
}

export default Countdown;
