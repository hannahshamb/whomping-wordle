import React from 'react';
import Select from 'react-select';
import CharacterOfTheDay from './character-of-the-day';
import Legend from './legend';
import CheckGuesses from './check-guesses';
import Forfeit from './forfeit';
import RevealCharacter from './reveal-character';
import { AppContext } from '../lib';
import Confetti from 'react-confetti';
import ForfeitModal from './forfeit-modal';

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
      displayedColumns: [],
      forcedForfeit: false,
      win: false,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      doneRendering: false
    };
    this.scrollContainerRef = React.createRef();
    this.animationTimeoutRef = null;
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleContinue = this.handleContinue.bind(this);
    this.handleForfeit = this.handleForfeit.bind(this);
  }

  colorMap = (guesses, headers) => {
    const { today } = this.context;
    const { characterData } = this.props;
    const characterOfTheDay = CharacterOfTheDay(characterData, today);
    const colorMap = [];
    guesses.forEach(guess => {
      const colors = [];
      for (const key in characterOfTheDay) {
        if (key !== 'image' && key !== 'name' && key !== 'id') {
          if (key === 'hairColour' && ((guess.characterData[key] === 'blonde' || guess.characterData[key] === 'blond') &&
            (characterOfTheDay[key] === 'blonde' || characterOfTheDay[key] === 'blond'))) {
            colors.push({ thName: key, color: 'green' });
          } else {
            if (characterOfTheDay[key] === guess.characterData[key]) {
              colors.push({ thName: key, color: 'green' });
            } else if (characterOfTheDay[key] !== guess.characterData[key]) {
              colors.push({ thName: key, color: 'red' });
            }
          }
        }
      }
      const itemPositions = {};
      for (const [index, thName] of headers.entries()) {
        itemPositions[thName] = index;
      }
      colors.sort((a, b) => {
        return itemPositions[a.thName] - itemPositions[b.thName];
      });
      colorMap.push({ guessNumber: guess.guessNumber, colors });
    });
    return colorMap;
  };

  handleForfeit() {
    const { today } = this.context;
    localStorage.setItem('forfeit', JSON.stringify({ forfeit: true, today }));
    this.setState({ forcedForfeit: true, gameStatus: 'lose' });
  }

  handleSubmit(event) {
    event.preventDefault();
    const { characterData, win, forcedForfeit } = this.state;
    const { today } = this.context;
    CheckGuesses(today);

    if (win) {
      return;
    }
    if (forcedForfeit) {
      return;
    }

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
    const guessesRemaining = 10 - guesses.length;
    let forcedForfeitCheck = false;
    if (guessesRemaining <= 0) {
      forcedForfeitCheck = true;
    }
    const targetRow = guesses.length - 1;
    const headers = ['character', 'gender', 'hairColour', 'role', 'house', 'species', 'ancestry', 'alive'];
    const colorMap = this.colorMap(guesses, headers);
    let winCheck = true;
    colorMap[colorMap.length - 1].colors.forEach(td => {
      if (td.color === 'red') {
        winCheck = false;
      }
    });
    this.setState({ characterData: {}, guesses, today, guessesRemaining, targetRow, colorMap, win: winCheck, forcedForfeit: forcedForfeitCheck });
    this.clearAnimation();
  }

  scrollLeft = () => {
    this.scrollContainerRef.current.scrollLeft -= 100;
  };

  scrollRight = () => {
    this.scrollContainerRef.current.scrollLeft += 100;
  };

  clearAnimation() {
    clearTimeout(this.animationTimeoutRef);
    this.setState({ displayedColumns: [], doneRendering: false });
    this.animationTimeoutRef = null;
  }

  clearAnimationHandleChange() {
    const { targetRow } = this.state;
    clearTimeout(this.animationTimeoutRef);
    this.setState({ displayedColumns: [], doneRendering: false, targetRow: targetRow + 1 });
    this.animationTimeoutRef = null;
  }

  handleChange(event) {
    const { characterData } = event;
    const { forcedForfeit, win } = this.state;
    if (forcedForfeit || win) {
      return;
    }
    this.setState({ characterData, error: false });
    this.clearAnimationHandleChange();
  }

  handleContinue(event) {
    if (event.target.getAttribute('action') === 'forfeit') {
      this.setState({ gameStatus: 'lose', forcedForfeit: true });
    } else {
      this.setState({ gameStatus: 'win', win: true });
    }

  }

  componentDidMount() {
    const { today } = this.context;
    const { characterData } = this.props;

    const characterOfTheDay = CharacterOfTheDay(characterData, today);
    CheckGuesses(today);
    const forfeit = JSON.parse(localStorage.getItem('forfeit'));
    const guesses = JSON.parse(localStorage.getItem('guesses'));
    let guessesRemaining = 10 - guesses.length;
    const targetRow = guesses.length - 1;
    if (guessesRemaining <= 0) {
      guessesRemaining = 0;
    }
    let forcedForfeit = false;
    if (guessesRemaining === 0) {
      forcedForfeit = true;
    }
    let colorMap = [];
    const gameStatus = null;
    let win = false;
    if (guesses.length !== 0) {
      win = true;
      const headers = ['character', 'gender', 'hairColour', 'role', 'house', 'species', 'ancestry', 'alive'];
      colorMap = this.colorMap(guesses, headers);
      colorMap[colorMap.length - 1].colors.forEach(td => {
        if (td.color === 'red') {
          win = false;
        }
      });
    }
    if (forfeit) {
      forcedForfeit = true;
    }
    window.addEventListener('resize', this.handleResize);
    this.setState({
      characters: characterData,
      characterOfTheDay,
      guesses,
      guessesRemaining,
      targetRow,
      forcedForfeit,
      colorMap,
      gameStatus,
      win
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.targetRow !== this.state.guesses.length ||
      prevState.displayedColumns.length !== this.state.displayedColumns.length
    ) {
      this.updateDisplayedColumns();
    }
    if (prevState.characterData !== this.state.characterData) {
      this.clearAnimation();
    }
  }

  updateDisplayedColumns = () => {
    const { targetRow, displayedColumns, guesses } = this.state;

    if (targetRow !== guesses.length) {
      if (displayedColumns.length <= 8) {
        this.animationTimeoutRef = setTimeout(() => {
          this.setState(prevState => ({
            doneRendering: false,
            displayedColumns: [...prevState.displayedColumns, prevState.displayedColumns.length]
          }));
        }, 500);
        return () => clearTimeout(this.animationTimeoutRef);
      } else {
        this.setState(prevState => ({
          displayedColumns: [],
          targetRow: prevState.targetRow + 1,
          doneRendering: true
        }));
      }
    }
  };

  componentWillUnmount() {
    this.clearAnimation();
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });
  };

  render() {
    const {
      characterData, error, guesses, characters, characterOfTheDay,
      guessesRemaining, gameStatus, displayedColumns, targetRow, forcedForfeit,
      colorMap, win, windowWidth, windowHeight, doneRendering
    } = this.state;

    // Action & Confetti
    let action;
    let confetti = false;
    if (win) {
      action = 'win';
      if (doneRendering) {
        confetti = true;
      }
    }
    if (forcedForfeit) {
      action = 'forfeit';
    }

    // Guesses Remaining Color
    let guessesRemainingClass;
    if (guessesRemaining <= 3) {
      guessesRemainingClass = 'red-font';
    } else if (guessesRemaining <= 6) {
      guessesRemainingClass = 'yellow-font';
    } else if (guessesRemaining <= 10) {
      guessesRemainingClass = 'green-font';
    }

    // Select Element
    let placeholder = 'Type character name...';
    if (Object.getOwnPropertyNames(characterData).length !== 0) {
      placeholder = characterData.name;
      if (windowWidth < 500) {
        const shortened = `${characterData.name.substring(0, 13)}...`;
        placeholder = shortened;
      }
    } else if (windowWidth < 500) {
      placeholder = 'Type...';
    }

    const errorClass = error ? '' : 'd-none';
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

    const select = (
      <>
        <div className="row position-relative mb-3" style={{ width: '500px' }}>
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
      </>
    );

    // Guess Chart Element
    const headers = ['character', 'gender', 'hairColour', 'role', 'house', 'species', 'ancestry', 'alive'];
    let rowKey = guesses.length;
    const guessChart = (
      <>
        <div className="scroll-container mt-1 p-0 w-100" ref={this.scrollContainerRef}>
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

                colorMap.forEach(colorGuessData => {
                  if (colorGuessData.guessNumber === guess.guessNumber) {
                    colorGuessData.colors.forEach(colorData => {
                      const thName = colorData.thName;
                      const classColor = colorData.color;
                      for (const key in characterOfTheDay) {
                        if (key === thName) {
                          if (key !== 'image' || key !== 'name') {
                            tds.push({
                              thName,
                              classColor,
                              p: guess.characterData[key][0].toUpperCase() + guess.characterData[key].slice(1)
                            });
                          }
                        }
                      }
                    });
                  }
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
        <div className="w-100 d-flex justify-content-center mt-3 scroll-btn-container">
          <div className="scroll-buttons d-flex justify-content-between align-items-center">
            <i className="fas fa-arrow-left px-3" style={{ color: 'rgb(110, 133, 178, 56%)', height: '100%' }} onClick={this.scrollLeft} />
            <p className='scroll-btn-font p-0 m-0'>Scroll horizonally to see more</p>
            <i className="fas fa-arrow-right px-3" style={{ color: 'rgb(110, 133, 178, 56%)', height: '100%' }} onClick={this.scrollRight} />
          </div>
        </div>
      </>
    );

    return (
      <>
        {gameStatus === 'lose' && forcedForfeit
          ? <Forfeit colorMap={colorMap} characterOfTheDay={characterOfTheDay} guessesRemainingClass={guessesRemainingClass} guessesRemaining={guessesRemaining}/>
          : gameStatus === 'win' && win
            ? <RevealCharacter colorMap={colorMap} gameStatus={gameStatus} characterOfTheDay={characterOfTheDay} />
            : <>
              <div className="text-center d-flex align-items-center justify-content-center mt-5 w-100" >
                <div className="row mb-3">
                  <img src='../imgs/Wizard.png' alt='wizard' />
                </div>
              </div>
              <div className="row justify-content-center mt-2 w-100">
                <p className='guesses-font'>Guesses remaining: <span className={`guesses-font ${guessesRemainingClass}`}>{guessesRemaining}</span></p>
              </div>
              {forcedForfeit || win
                ? doneRendering
                  ? <>
                    <div className="row justify-content-center mb-3 w-100 "><button className='blue-btn btn-font btn-lg border-0' action={action} onClick={this.handleContinue}>Continue</button></div>
                    {confetti ? <Confetti width={windowWidth} height={windowHeight} /> : null}
                  </>
                  : select
                : select
          }
              { guesses && guesses.length > 0
                ? <>
                  { guessChart }
                  {forcedForfeit ? null : <ForfeitModal guessesRemaining={guessesRemaining} guessesRemainingClass={guessesRemainingClass} onForfeit={this.handleForfeit} />}
                  <Legend />
                </>
                : null
            }
            </>
      }
        {/*  */}
      </>
    );
  }

}
GameForm.contextType = AppContext;
