import React, { useState } from 'react';
import Countdown from './countdown';

export default function RevealCharacter({ gameStatus, colorMap, characterOfTheDay }) {
  const [rowsExpanded, setRowsExpanded] = useState(false);

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
      <div className="results-container mt-5 mb-4 w-100">
        <h1 className={`${titleClass} mt-3`}>{title}</h1>
        <div className="row d-flex justify-content-center">
          {imgDetails}
        </div>
        <div className="row d-flex justify-content-center">
          <p className='m-0'>{characterOfTheDay.name}</p>
        </div>
        <div className="row d-flex justify-content-center">
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
  );
}
