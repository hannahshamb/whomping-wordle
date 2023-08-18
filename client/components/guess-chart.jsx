import React, { useRef, useState, useEffect } from 'react';

export default function GuessChart(props) {
  const { guesses, characterOfTheDay, gameStatus } = props;
  const scrollContainerRef = useRef(null);
  const [displayedColumns, setDisplayedColumns] = useState([]);
  let rowKey = guesses.length;
  const [targetRow, setTargetRow] = useState(guesses.length - 1);

  const scrollLeft = () => {
    scrollContainerRef.current.scrollLeft -= 100;
  };

  const scrollRight = () => {
    scrollContainerRef.current.scrollLeft += 100;
  };

  useEffect(() => {
    if (targetRow !== guesses.length) {
      if (displayedColumns.length <= 7) {
        const timeout = setTimeout(() => {
          setDisplayedColumns(prevColumns => [...prevColumns, displayedColumns.length]);
        }, 500);
        return () => clearTimeout(timeout);
      } else {
        setDisplayedColumns([]);
        setTargetRow(prevTarget => prevTarget + 1);
      }

    }

  }, [displayedColumns, guesses, targetRow]);

  const headers = ['character', 'gender', 'hairColour', 'role', 'house', 'species', 'ancestry', 'alive'];
  // const colorMap = (guesses, characterOfTheDay) => {
  //   const colorMap = [];
  //   guesses.forEach(guess => {
  //     const colors = [];
  //     for (const key in characterOfTheDay) {
  //       if (key !== 'image' && key !== 'name' && key !== 'id') {
  //         if (key === 'hairColour' && ((guess.characterData[key] === 'blonde' || guess.characterData[key] === 'blond') &&
  //           (characterOfTheDay[key] === 'blonde' || characterOfTheDay[key] === 'blond'))) {
  //           colors.push({ thName: key, color: 'green' });
  //         } else {
  //           if (characterOfTheDay[key] === guess.characterData[key]) {
  //             colors.push({ thName: key, color: 'green' });
  //           } else if (characterOfTheDay[key] !== guess.characterData[key]) {
  //             colors.push({ thName: key, color: 'red' });
  //           }
  //         }
  //       }
  //     }
  //     const itemPositions = {};
  //     for (const [index, thName] of headers.entries()) {
  //       itemPositions[thName] = index;
  //     }
  //     colors.sort((a, b) => {
  //       return itemPositions[a.thName] - itemPositions[b.thName];
  //     });
  //     colorMap.push({ guessNumber: guess.guessNumber, colors });
  //   });
  //   return colorMap;
  // };
  return (
    gameStatus === 'lose'
      ? null
      // colorMap(guesses, characterOfTheDay)
      : <>
        <div className="scroll-container mt-1 p-0 w-100" ref={scrollContainerRef}>
          <table cellSpacing={0} cellPadding={0}>
            <thead>
              <tr className='d-flex justify-content-center'>
                {headers.map((header, index) => {
                  if (header === 'hairColour') {
                    return <th key={index}>Hair Colour</th>;
                  }
                  if (header === 'role') {
                    return <th key={index}>Hogwarts</th>;
                  }
                  return (
                    <th key={index}>{header[0].toUpperCase() + header.slice(1)}</th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {guesses.slice(0).reverse().map((guess, rowIndex) => {
                rowKey--;

                const tds = [];
                let imgDetails =
                (<div className="category-img-container">
                  <img className='character-img-wizard' src='../imgs/Wizard-Purple.png' alt={`${guess.characterData.name}`} />
                </div>);
                if (guess.characterData.image !== '') {
                  imgDetails =
                    <div className="category-img-container">
                      <img className='character-img-lg' src={`${guess.characterData.image}`} alt={`${guess.characterData.name}`} />
                    </div>;
                }
                tds.push({
                  thName: 'Character',
                  imgDetails,
                  classColor: '',
                  p: guess.characterData.name
                });

                for (const key in characterOfTheDay) {
                  let tdClassColor;
                  if (key !== 'image' && key !== 'name' && key !== 'id') {
                    if (key === 'hairColour' && ((guess.characterData[key] === 'blonde' || guess.characterData[key] === 'blond') &&
                    (characterOfTheDay[key] === 'blonde' || characterOfTheDay[key] === 'blond'))) {
                      tdClassColor = 'green';
                    } else {
                      if (characterOfTheDay[key] === guess.characterData[key]) {
                        tdClassColor = 'green';
                      } else if (characterOfTheDay[key] !== guess.characterData[key]) {
                        tdClassColor = 'red';
                      }
                    }
                    tds.push({
                      thName: key,
                      classColor: tdClassColor,
                      p: guess.characterData[key][0].toUpperCase() + guess.characterData[key].slice(1)
                    });
                  }
                }

                const itemPositions = {};
                for (const [index, thName] of headers.entries()) {
                  itemPositions[thName] = index;
                }
                tds.sort((a, b) => {
                  return itemPositions[a.thName] - itemPositions[b.thName];
                });

                return (
                  <tr key={rowKey} className='d-flex justify-content-center'>
                    {
                        tds.map((cell, cellIndex) => {
                          return (

                            <td key={cellIndex} className={
                              rowKey !== targetRow
                                ? ''
                                : displayedColumns.includes(cellIndex) ? 'show' : 'hidden'
                            }>
                              <div className='position-relative'>
                                {cell.imgDetails ? <div> {cell.imgDetails} </div> : <div className={`category-box ${cell.classColor}`} />}
                                <div className="overlay">
                                  <p className='td-font'>{cell.p}</p>
                                </div>
                              </div>
                            </td>
                          );
                        })
                      }
                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
        <div className="w-100 d-flex justify-content-center mt-3 mb-5 scroll-btn-container">
          <div className="scroll-buttons d-flex justify-content-between align-items-center">
            <i className="fas fa-arrow-left px-3" style={{ color: 'rgb(110, 133, 178, 56%)', height: '100%' }} onClick={scrollLeft} />
            <p className='scroll-btn-font p-0 m-0'>Scroll horizonally to see more</p>
            <i className="fas fa-arrow-right px-3" style={{ color: 'rgb(110, 133, 178, 56%)', height: '100%' }} onClick={scrollRight} />
          </div>
        </div>
      </>
  );
}
