import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../lib';
import Countdown from './countdown';
import Spinner from './spinner';

export default function RevealCharacter({ gameStatus, colorMap, characterOfTheDay }) {
  const [rowsExpanded, setRowsExpanded] = useState(false);
  const [placementNumber, setPlacementNumber] = useState(0);

  const { user, today } = useContext(AppContext);
  useEffect(() => {

    const body = {
      user,
      gameStatus,
      date: JSON.stringify(today)
    };
    const req = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    };
    fetch('/api/user-submissions', req)
      .then(res => res.json())
      .then(result => {
        const allSubmissions = result;
        allSubmissions.sort((a, b) => {
          const timeStampA = new Date(a.timeStamp);
          const timeStampB = new Date(b.timeStamp);

          if (timeStampA < timeStampB) {
            return -1;
          } else if (timeStampA > timeStampB) {
            return 1;
          } else {
            return 0;
          }
        });
        const index = allSubmissions.findIndex(item => item.userId === user.userId);
        const placementNumber = index + 1;
        setPlacementNumber(placementNumber);
      });

  }, [gameStatus, today, user]);

  const lastDigit = placementNumber % 10;
  let ith = 'th';
  if (lastDigit === 1) {
    ith = 'st';
  }
  if (lastDigit === 2) {
    ith = 'nd';
  }
  if (lastDigit === 3) {
    ith = 'rd';
  }

  let isLoading = true;
  if (placementNumber !== 0) {
    isLoading = false;
  }

  const toggleRows = () => {
    setRowsExpanded(!rowsExpanded);
  };

  const reversedColorMap = colorMap.slice().reverse();
  const title = gameStatus === 'lose' ? 'DISAPPARATED' : 'SNATCHED!';
  const titleClass = gameStatus === 'lose' ? 'red-font' : '';

  let imgDetails = (
    <div className="category-img-container">
      <img className='character-img-wizard' src='../imgs/Wizard-Purple.png' alt={`${characterOfTheDay.name}`} />
    </div>
  );

  if (characterOfTheDay.image !== '') {
    imgDetails = (
      <div className="category-img-container">
        <img className='character-img-lg' src={`${characterOfTheDay.image}`} alt={`${characterOfTheDay.name}`} />
      </div>
    );
  }

  let tableMargin = 'mb-5';
  if (colorMap.length > 5) {
    tableMargin = '';
  }

  return (
    <>
      {isLoading
        ? <Spinner />
        : <>
          <div className="results-container mt-5 mb-4 w-100">
            <h1 className={`${titleClass} mt-3`}>{title}</h1>
            <div className="row d-flex justify-content-center">
              {imgDetails}
            </div>
            <div className="row d-flex justify-content-center">
              <p className='m-0'>{characterOfTheDay.name}</p>
            </div>
            <div className="row d-flex justify-content-center w-100 m-0 px-3">
              <p className='guesses-font mb-0'>You are the <span className="guesses-font blue-font">{placementNumber}{ith}</span> to cast revelio on the wizard of the day.</p>
              <p className="guesses-font">
                Attempts to Manage Mischeif: <span className="guesses-font">{colorMap.length}</span>
              </p>
            </div>
            <div className="results-table-container">
              <table className={`results-table ${tableMargin}`}>
                <tbody>
                  {reversedColorMap
                    .slice(0, rowsExpanded ? colorMap.length : 5)
                    .map((guess, index) => {
                      return (
                        <tr key={guess.guessNumber} className="d-flex justify-content-center results-tr">
                          {guess.colors.map((color, index) => {
                            return (
                              <td key={index} className="results-td">
                                <div className={`results-category-box ${color.color}`} />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {colorMap.length > 5 && (
              <button onClick={toggleRows} className="btn-font link mb-5">
                {rowsExpanded ? <><i className="fa-solid fa-arrows-up-to-line" /> Collapse</> : <><i className="fa-solid fa-arrows-down-to-line" /> Expand</>}
              </button>
              )}
            </div>
          </div>
          <Countdown
          timeZone="America/Los_Angeles"
          timeZoneDetails="(Midnight at UTC-8)"
        />
        </>
      }
      {/* */}
    </>
  );
}
