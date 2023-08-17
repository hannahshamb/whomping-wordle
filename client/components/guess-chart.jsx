import React, { useRef, useState, useEffect } from 'react';

export default function GuessChart(props) {
  const { guesses, characterOfTheDay } = props;
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

  const headers = ['Character', 'Gender', 'Hair Colour', 'House', 'Role', 'Species', 'Ancestry', 'Alive'];
  return (
    <>
      <div className="scroll-container mt-1 p-0 w-100" ref={scrollContainerRef}>
        <table cellSpacing={0} cellPadding={0}>
          <thead>
            <tr className='d-flex justify-content-center'>
              {headers.map((header, index) => {
                return (
                  <th key={index}>{header}</th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {guesses.slice(0).reverse().map((guess, rowIndex) => {
              rowKey--;

              let genderClass = 'red';
              let hairColourClass = 'red';
              let houseClass = 'red';
              let roleClass = 'red';
              let speciesClass = 'red';
              let ancestryClass = 'red';
              let aliveClass = 'red';
              let role;
              const tds = [];
              const compare = (guess, characterOfTheDay) => {
                // gender comparison
                if (guess.characterData.gender === characterOfTheDay.gender) {
                  genderClass = 'green';
                }

                // hair colour comparison
                if ((guess.characterData.hairColour === 'blonde' || guess.characterData.hairColour === 'blond') &&
                (characterOfTheDay.hairColour === 'blonde' || characterOfTheDay.hairColour === 'blond')) {
                  hairColourClass = 'green';
                } else if (guess.characterData.hairColour === characterOfTheDay.hairColour) {
                  hairColourClass = 'green';
                }

                // house comparison
                if (guess.characterData.house === characterOfTheDay.house) {
                  houseClass = 'green';
                }

                // role comparison
                if (guess.characterData.hogwartsStudent === true) {
                  role = 'Student';
                } else if (guess.characterData.hogwartsStaff === true) {
                  role = 'Staff';
                } else {
                  role = 'Other';
                }
                let characterOfTheDayRole;
                if (characterOfTheDay.hogwartsStudent === true) {
                  characterOfTheDayRole = 'Student';
                } else if (characterOfTheDay.hogwartsStaff === true) {
                  characterOfTheDayRole = 'Staff';
                } else {
                  characterOfTheDayRole = 'Other';
                }
                if (role === characterOfTheDayRole) {
                  roleClass = 'green';
                }

                // species comparison
                if (guess.characterData.species === characterOfTheDay.species) {
                  speciesClass = 'green';
                }

                // ancestry comparison
                if (guess.characterData.ancestry === characterOfTheDay.ancestry) {
                  ancestryClass = 'green';
                }

                // alive comparison
                if (guess.characterData.alive === characterOfTheDay.alive) {
                  aliveClass = 'green';
                }

              };

              compare(guess, characterOfTheDay);

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

              let hairColour;
              if (guess.characterData.hairColour === '') {
                hairColour = 'Unknown';
              } else {
                hairColour = guess.characterData.hairColour[0].toUpperCase() + guess.characterData.hairColour.slice(1);
              }

              let house;
              if (guess.characterData.house === '') {
                house = 'Unknown';
              } else {
                house = guess.characterData.house[0].toUpperCase() + guess.characterData.house.slice(1);
              }

              let species;
              if (guess.characterData.species === '') {
                species = 'Unknown';
              } else {
                species = guess.characterData.species[0].toUpperCase() + guess.characterData.species.slice(1);
              }

              let ancestry;
              if (guess.characterData.ancestry === '') {
                ancestry = 'Unknown';
              } else {
                ancestry = guess.characterData.ancestry[0].toUpperCase() + guess.characterData.ancestry.slice(1);
              }

              let alive;
              if (guess.characterData.alive) {
                alive = 'True';
              } else {
                alive = 'False';
              }
              tds.push({
                imgDetails,
                classColor: '',
                p: guess.characterData.name
              });
              tds.push({
                imgDetails: null,
                classColor: genderClass,
                p: guess.characterData.gender[0].toUpperCase() + guess.characterData.gender.slice(1)
              });
              tds.push({
                imgDetails: null,
                classColor: hairColourClass,
                p: hairColour
              });
              tds.push({
                imgDetails: null,
                classColor: houseClass,
                p: house
              });
              tds.push({
                imgDetails: null,
                classColor: roleClass,
                p: role
              });
              tds.push({
                imgDetails: null,
                classColor: speciesClass,
                p: species
              });
              tds.push({
                imgDetails: null,
                classColor: ancestryClass,
                p: ancestry
              });
              tds.push({
                imgDetails: null,
                classColor: aliveClass,
                p: alive
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
