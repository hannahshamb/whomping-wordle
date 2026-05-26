import React, { useState, useEffect, useContext } from 'react';
import { AppContext, formatOrdinal, getGameResult, saveGameResult, isSameDay } from '../lib';
import Countdown from './countdown';
import Spinner from './spinner';

export default function RevealCharacter({ gameStatus, colorMap, characterOfTheDay, onReviewGuesses }) {
  const [rowsExpanded, setRowsExpanded] = useState(false);
  const [placementNumber, setPlacementNumber] = useState(null);

  const { user, today, midnightReached } = useContext(AppContext);

  useEffect(() => {
    if (!user?.userId || !gameStatus || midnightReached) {
      return;
    }

    const savedResult = getGameResult();
    if (
      savedResult?.placement &&
      savedResult.gameStatus === gameStatus &&
      isSameDay(savedResult.today, today)
    ) {
      setPlacementNumber(savedResult.placement);
      return;
    }

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

    let cancelled = false;

    fetch('/api/user-submissions', req)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to record submission');
        }
        return res.json();
      })
      .then(result => {
        if (cancelled) {
          return;
        }
        const placement = result.placement > 0 ? result.placement : 1;
        setPlacementNumber(placement);
        saveGameResult(today, gameStatus, placement);
      })
      .catch(() => {
        if (!cancelled) {
          setPlacementNumber(1);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gameStatus, today, user, midnightReached]);

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

  const isLoading = placementNumber === null;
  const placementLabel = isLoading ? '...' : formatOrdinal(placementNumber);

  return isLoading
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
          <p className='guesses-font mb-0'>You are the <span className="guesses-font blue-font">{placementLabel}</span> to cast revelio on the wizard of the day.</p>
          <p className="guesses-font">
            Attempts to Manage Mischeif: <span className="guesses-font">{colorMap.length}</span>
          </p>
        </div>
        <div className="results-table-container">
          <table className={`results-table ${tableMargin}`}>
            <tbody>
              {reversedColorMap
                .slice(0, rowsExpanded ? colorMap.length : 5)
                .map(guess => {
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
        {onReviewGuesses && (
        <div className="row d-flex justify-content-center w-100 m-0 mb-3">
          <button type="button" className="btn-font link" onClick={onReviewGuesses}>
            <i className="fa-solid fa-table-columns" /> Review your guesses
          </button>
        </div>
        )}
      </div>
      <Countdown />
    </>;
}
