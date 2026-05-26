import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../lib';

function Countdown() {
  const { countdownValue, midnightReached, startMidnightCountdownTest } = useContext(AppContext);
  const [timeRemaining, setTimeRemaining] = useState(countdownValue || '');

  useEffect(() => {
    if (countdownValue) {
      setTimeRemaining(countdownValue);
    }
  }, [countdownValue]);

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

      setTimeRemaining(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }

    if (!countdownValue) {
      calculateCountdown();
      const countdownInterval = setInterval(calculateCountdown, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [countdownValue]);

  return (
    <div className='w-100'>
      <hr className='my-0' />
      <p className='btn-font m-0'>Next wizard in: </p>
      <p className='btn-font count-down m-0'>{timeRemaining}</p>
      {midnightReached
        ? (
          <p className='count-down-details yellow-font m-0'>
            A new wizard awaits — click anywhere to continue
          </p>
          )
        : (
          <p className='count-down-details yellow-font m-0'>New wizard daily at midnight PST / UTC−8</p>
          )}
      {process.env.NODE_ENV === 'development' && startMidnightCountdownTest && !midnightReached && (
        <div className="row d-flex justify-content-center w-100 m-0 mt-3 mb-3">
          <button
            type="button"
            className="btn-font link"
            onClick={event => {
              event.stopPropagation();
              startMidnightCountdownTest(10);
            }}
          >
            Test midnight countdown (10s)
          </button>
        </div>
      )}
    </div>
  );
}

export default Countdown;
