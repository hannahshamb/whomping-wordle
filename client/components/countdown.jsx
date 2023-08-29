import React, { useState, useEffect } from 'react';

function Countdown({ onCountdownEnd }) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    function calculateCountdown() {
      const currentDate = new Date();
      const options = { timeZone: 'America/Los_Angeles', hour12: false };

      const pstDate = new Date(currentDate.toLocaleString('en-US', options));

      const tomorrowPST = new Date(pstDate);
      tomorrowPST.setDate(pstDate.getDate() + 1);
      tomorrowPST.setHours(0, 0, 0, 0);

      const timeDifference = tomorrowPST - pstDate;

      let remainingTime = timeDifference;
      const hours = Math.floor(remainingTime / (60 * 60 * 1000));
      remainingTime -= hours * (60 * 60 * 1000);
      const minutes = Math.floor(remainingTime / (60 * 1000));
      remainingTime -= minutes * (60 * 1000);
      const seconds = Math.floor(remainingTime / 1000);

      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');

      const newTimeRemaining = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
      setTimeRemaining(newTimeRemaining);

      if (newTimeRemaining === '00:00:00') {
        onCountdownEnd(); // Call the reset function from the prop
      }

      setTimeout(calculateCountdown, 1000);
    }

    calculateCountdown();
  }, [onCountdownEnd]);

  return (
    <div className='w-100'>
      <hr className='my-0' />
      <p className='btn-font m-0'>Next wizard in:</p>
      <p className='btn-font count-down m-0'>{timeRemaining}</p>
      <p className='count-down-details m-0'>Time zone&#58; America</p>
      <p className='count-down-details m-0'>(Midnight at UTC-8)</p>
    </div>
  );
}

export default Countdown;
