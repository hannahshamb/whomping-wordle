import React from 'react';
import Select from 'react-select';
import CharacterOfTheDay from './character-of-the-day';
import GuessChart from './guess-chart';
import Legend from './legend';
import CheckGuesses from './check-guesses';
import { AppContext } from '../lib';

export default class GameForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      characters: [],
      characterData: {},
      guesses: [],
      guessesRemaining: null,
      error: false,
      gameStatus: null,
      displayedColumns: []
    };
    // this.scrollContainerRef = useRef(null);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleContinue = this.handleContinue.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    const { characterData } = this.state;
    const { today } = this.context;
    CheckGuesses(today);

    if (Object.getOwnPropertyNames(characterData).length === 0) {
      this.setState({ error: true });
      return;
    }
    let guesses = JSON.parse(localStorage.getItem('guesses'));
    if (guesses) {
      const nextNum = guesses.length + 1;
      const currentGuess = { guessNumber: nextNum, characterData, today };
      guesses.push(currentGuess);
    } else {
      guesses = [{ guessNumber: 1, characterData, today }];
    }
    localStorage.setItem('guesses', JSON.stringify(guesses));
    let guessesRemaining = 10 - guesses.length;
    if (guessesRemaining <= 0) {
      guessesRemaining = 0;
    }
    this.setState({ characterData: {}, guesses, today, guessesRemaining });
  }

  handleChange(event) {
    const { characterData } = event;
    this.setState({ characterData, error: false });
  }

  handleContinue() {
    this.setState({ gameStatus: 'lose' });
  }

  componentDidMount() {
    const { today } = this.context;
    const { characterData } = this.props;
    const characterOfTheDay = CharacterOfTheDay(characterData, today);
    CheckGuesses(today);
    const guesses = JSON.parse(localStorage.getItem('guesses'));
    let guessesRemaining = 10 - guesses.length;
    if (guessesRemaining <= 0) {
      guessesRemaining = 0;
    }
    this.setState({
      characters: characterData,
      characterOfTheDay,
      guesses,
      guessesRemaining
    });
  }

  render() {
    const {
      characterData, error, guesses, characters, characterOfTheDay,
      guessesRemaining, gameStatus
    } = this.state;
    const errorClass = error ? '' : 'd-none';

    let guessesRemainingClass;

    if (guessesRemaining <= 3) {
      guessesRemainingClass = 'red-font';
    } else if (guessesRemaining <= 6) {
      guessesRemainingClass = 'yellow-font';
    } else if (guessesRemaining <= 10) {
      guessesRemainingClass = 'green-font';
    }

    let placeholder = 'Type character name...';
    if (Object.getOwnPropertyNames(characterData).length !== 0) {
      placeholder = characterData.name;
    }

    let filteredCharacters = characters;
    if (guesses && guesses.length > 0) {
      const filtered = [];
      characters.forEach(character => {
        let duplicate = false;
        guesses.forEach(guess => {
          if (guess.characterData.id === character.id) {
            duplicate = true;
          }
        });
        if (!duplicate) {
          filtered.push(character);
        }
        return filtered;
      });
      filteredCharacters = filtered;
    }
    const mappedOptions = filteredCharacters.map(character => {
      let imgDetails = <img className='character-img-wizard' src='../imgs/Wizard-Purple.png' alt={`${character.name}`} />;
      if (character.image !== '') {
        imgDetails = <img className='character-img-lg' src={`${character.image}`} alt={`${character.name}`} />;
      }
      return { value: character.name, label: character.name, characterData: character, img: imgDetails };
    });

    function customTheme(theme) {
      return {
        ...theme,
        colors: {
          ...theme.colors,
          primary25: '#d3a625',
          primary: '#6e85b2',
          neutral50: '#6e85b2'
        }
      };
    }

    const customStyles = {
      menu: base => ({
        ...base,
        background: 'rgb(240, 240, 240, 90%)',
        marginTop: 0
      }),
      menuList: base => ({
        ...base,
        '::-webkit-scrollbar': {
          width: '0px',
          height: '0px'
        }
      })
    };

    const formatOptionLabel = ({ value, label, img }) => {
      return (
        <div className='row d-flex align-items-center justify-content-center'>
          <div className="col-4">
            <div className='img-container'>{img}</div>
          </div>
          <div className='col p-0 d-flex justify-content-start'>{label}</div>
        </div>
      );
    };

    const guessChart = <GuessChart guesses={guesses} characterOfTheDay={characterOfTheDay} guessesRemaining={guessesRemainingClass} gameStatus={gameStatus} />;

    return (
      <>
        {gameStatus === 'lose'
          ? <p>FORFEIT</p>
          : gameStatus === 'win'
            ? <p>YOU WON!!!</p>
            : guessesRemaining === 0
              ? <>
                <div className="row justify-content-center mt-3 w-100">
                  <p className='guesses-font'>Guesses remaining: <span className={`guesses-font ${guessesRemainingClass}`}>{guessesRemaining}</span></p>
                </div>
                <div className="row justify-content-center mb-3 w-100 "><button className='blue-btn btn-font btn-lg border-0' onClick={this.handleContinue}>Continue</button></div>
                {guessChart}
                {/* Forfeit button - will need to send character of the day as well */}
                <Legend />
              </>
              : <>
                <div className="row position-relative" style={{ width: '500px' }}>
                  <Select
                    className='w-100 mx-2 text-left'
                    placeholder={`${placeholder}`}
                    options={mappedOptions}
                    styles={customStyles}
                    theme={customTheme}
                    formatOptionLabel={formatOptionLabel}
                    isSearchable
                    maxMenuHeight="360px"
                    controlShouldRenderValue={false}
                    onChange={this.handleChange}
                    noOptionsMessage={() => 'No characters with that name...'}
                  />
                  <div className="btn-absolute mx-2">
                    <button className='white-btn form-font' style={{ width: '100px', height: '72px' }} onClick={this.handleSubmit}>
                      <i className="fa-lg fa-sharp fa-solid fa-wand-sparkles" />
                    </button>
                  </div>
                </div>
                <div className={`row ${errorClass} justify-content-center mt-3 w-100`}>
                  <p className='error-font'>Must select a correct character name from the provided list</p>
                </div>
                <div className="row justify-content-center mt-3 w-100">
                  <p className='guesses-font'>Guesses remaining: <span className={`guesses-font ${guessesRemainingClass}`}>{guessesRemaining}</span></p>
                </div>
                {guesses && guesses.length > 0
                  ? <>
                    {guessChart}
                    {/* Forfeit button - will need to send character of the day as well */}
                    <Legend />
                  </>
                  : <p>when does this happen?</p>
                }
              </>
      }
        {/* comment */}
      </>

    );
  }

}
GameForm.contextType = AppContext;

/*
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
*/
