import React from 'react';
import Select, { components } from 'react-select';
import CharacterOfTheDay from './character-of-the-day';
import Legend from './legend';
import CheckGuesses from './check-guesses';
import Forfeit from './forfeit';
import RevealCharacter from './reveal-character';
import { hasCompletedGame, getGameResult, saveGameResult, parseRoute, getGuessesRemainingClass } from '../lib';
import { getCharacterImageStyle } from '../lib/character-image-style';
import WinConfetti from './win-confetti';
import ForfeitModal from './forfeit-modal';
import GameModeToggle from './game-mode-toggle';
import EasyModeExplainer from './easy-mode-explainer';
import WantedPoster from './wanted-poster';

const GUESS_HEADERS = ['character', 'gender', 'hairColour', 'role', 'house', 'species', 'ancestry', 'alive'];
const STAT_KEYS = GUESS_HEADERS.filter(key => key !== 'character');

function formatStatValue(value) {
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  const text = String(value);
  return text[0].toUpperCase() + text.slice(1);
}

function resolveOutcomeStatus({ gameStatus, win, forcedForfeit }) {
  if (gameStatus) {
    return gameStatus;
  }
  if (win) {
    return 'win';
  }
  if (forcedForfeit) {
    return 'lose';
  }
  return null;
}

function renderOutcomeTitle(status) {
  if (!status) {
    return null;
  }
  const title = status === 'lose' ? 'DISAPPARATED' : 'SNATCHED!';
  const titleClass = status === 'lose' ? 'blue-font' : '';
  return (
    <div className="row d-flex justify-content-center w-100 m-0">
      <h1 className={`${titleClass} mt-3 mb-0`}>{title}</h1>
    </div>
  );
}

function hairColoursMatch(guessValue, answerValue) {
  if (guessValue === answerValue) {
    return true;
  }
  const blondeFamily = ['blonde', 'blond'];
  if (blondeFamily.includes(guessValue) && blondeFamily.includes(answerValue)) {
    return true;
  }
  const redFamily = ['red', 'ginger'];
  return redFamily.includes(guessValue) && redFamily.includes(answerValue);
}

function attributeMatches(key, value, target) {
  if (key === 'hairColour') {
    return hairColoursMatch(value, target[key]);
  }
  return value === target[key];
}

// Only confirmed attributes narrow the list. A guess that came back correct
// tells us what the wizard is, so anyone lacking that attribute is dropped.
// Wrong guesses are left alone: eliminating those too solves the board by
// roughly the third guess, which gives the answer away.
function survivesEasyModeFilter(character, guesses, characterOfTheDay) {
  for (const guess of guesses) {
    for (const key of STAT_KEYS) {
      const guessValue = guess.characterData[key];
      const confirmed = attributeMatches(key, guessValue, characterOfTheDay);
      if (confirmed && !attributeMatches(key, guessValue, character)) {
        return false;
      }
    }
  }
  return true;
}

function CustomOption(props) {
  const { innerProps, ...rest } = props;
  const { onMouseMove, onMouseOver, onMouseEnter, ...optionInnerProps } = innerProps;

  return (
    <components.Option
      {...rest}
      innerProps={optionInnerProps}
    />
  );
}

function computeColorMap(guesses, headers, characterData, today) {
  const characterOfTheDay = CharacterOfTheDay(characterData, today);
  const colorMap = [];
  guesses.forEach(guess => {
    const colors = [];
    for (const key of STAT_KEYS) {
      if (key === 'hairColour' && hairColoursMatch(guess.characterData[key], characterOfTheDay[key])) {
        colors.push({ thName: key, color: 'green' });
      } else if (characterOfTheDay[key] === guess.characterData[key]) {
        colors.push({ thName: key, color: 'green' });
      } else {
        colors.push({ thName: key, color: 'red' });
      }
    }
    const itemPositions = {};
    for (const [index, thName] of headers.entries()) {
      itemPositions[thName] = index;
    }
    colors.sort((a, b) => itemPositions[a.thName] - itemPositions[b.thName]);
    colorMap.push({ guessNumber: guess.guessNumber, colors });
  });
  return colorMap;
}

function createInitialState(characterData, today) {
  const characterOfTheDay = CharacterOfTheDay(characterData, today);
  CheckGuesses(today);
  const forfeit = JSON.parse(localStorage.getItem('forfeit'));
  const guesses = JSON.parse(localStorage.getItem('guesses')) || [];
  let guessesRemaining = 10 - guesses.length;
  const targetRow = guesses.length - 1;
  if (guessesRemaining <= 0) {
    guessesRemaining = 0;
  }
  let forcedForfeit = guessesRemaining === 0;
  let colorMap = [];
  let win = false;
  if (guesses.length !== 0) {
    win = true;
    colorMap = computeColorMap(guesses, GUESS_HEADERS, characterData, today);
    colorMap[colorMap.length - 1].colors.forEach(td => {
      if (td.color === 'red') {
        win = false;
      }
    });
  }
  if (forfeit) {
    forcedForfeit = true;
  }

  const savedResult = getGameResult();
  let viewMode = 'playing';
  let gameStatus = null;

  if (hasCompletedGame(today)) {
    viewMode = 'summary';
    gameStatus = savedResult?.gameStatus || (win ? 'win' : 'lose');
    win = gameStatus === 'win';
    forcedForfeit = gameStatus === 'lose';
    saveGameResult(today, gameStatus);
  }

  return {
    characters: characterData,
    characterData: {},
    characterOfTheDay,
    guesses,
    guessesRemaining,
    error: false,
    gameStatus,
    forcedForfeit,
    win,
    windowWidth: window.innerWidth,
    doneRendering: guesses.length > 0,
    animatingGuessNumber: null,
    viewMode,
    targetRow,
    colorMap,
    fitToScreen: false,
    showEasyInfo: false
  };
}

export default class GameForm extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = createInitialState(props.characterData, props.today);
    this.scrollContainerRef = React.createRef();
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleContinue = this.handleContinue.bind(this);
    this.handleForfeit = this.handleForfeit.bind(this);
    this.toggleFitToScreen = this.toggleFitToScreen.bind(this);
  }

  colorMap = (guesses, headers) => {
    const { characterData, today } = this.props;
    return computeColorMap(guesses, headers, characterData, today);
  };

  handleForfeit() {
    const { today } = this.props;
    localStorage.setItem('forfeit', JSON.stringify({ forfeit: true, today }));
    this.setState({ forcedForfeit: true, gameStatus: 'lose', viewMode: 'forfeit' });
  }

  goToSummary(gameStatus) {
    const { today } = this.props;
    saveGameResult(today, gameStatus);
    this.setState({
      viewMode: 'summary',
      gameStatus,
      win: gameStatus === 'win',
      forcedForfeit: gameStatus === 'lose'
    });
  }

  goToReview = () => {
    this.setState({ viewMode: 'review' });
  };

  handleSelectMode = nextEasyMode => {
    if (nextEasyMode !== this.props.easyMode) {
      this.props.toggleEasyMode();
    }
  };

  handleShowEasyInfo = () => {
    this.setState({ showEasyInfo: true });
  };

  handleCloseEasyInfo = () => {
    this.setState({ showEasyInfo: false });
    if (!this.props.easyModeExplained) {
      this.props.acknowledgeEasyMode();
    }
  };

  goBackToSummary = () => {
    this.setState({ viewMode: 'summary' });
  };

  handleSubmit(event) {
    event.preventDefault();
    const { characterData, win, forcedForfeit } = this.state;
    const { today } = this.props;
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
    const headers = GUESS_HEADERS;
    const colorMap = this.colorMap(guesses, headers);
    let winCheck = true;
    colorMap[colorMap.length - 1].colors.forEach(td => {
      if (td.color === 'red') {
        winCheck = false;
      }
    });
    this.setState({
      characterData: {},
      guesses,
      today,
      guessesRemaining,
      targetRow: guesses.length - 1,
      colorMap,
      win: winCheck,
      forcedForfeit: forcedForfeitCheck,
      doneRendering: false,
      animatingGuessNumber: guesses.length
    });
  }

  scrollLeft = () => {
    this.scrollContainerRef.current.scrollLeft -= 100;
  };

  scrollRight = () => {
    this.scrollContainerRef.current.scrollLeft += 100;
  };

  toggleFitToScreen = () => {
    this.setState(prevState => {
      const fitToScreen = !prevState.fitToScreen;
      if (fitToScreen && this.scrollContainerRef.current) {
        this.scrollContainerRef.current.scrollLeft = 0;
      }
      return { fitToScreen };
    });
  };

  handleGuessAnimationEnd = (guessNumber, cellIndex) => {
    if (guessNumber !== this.state.animatingGuessNumber || cellIndex !== 7) {
      return;
    }
    this.setState({ animatingGuessNumber: null, doneRendering: true });
  };

  handleChange(selectedOption) {
    const characterData = selectedOption?.characterData;
    const { forcedForfeit, win } = this.state;
    if (forcedForfeit || win || !characterData) {
      return;
    }
    this.setState({ characterData, error: false });
  }

  handleContinue(event) {
    if (event.target.getAttribute('action') === 'forfeit') {
      this.setState({ viewMode: 'forfeit', gameStatus: 'lose', forcedForfeit: true });
    } else {
      this.goToSummary('win');
    }
  }

  componentDidMount() {
    const { params } = parseRoute(window.location.hash);
    if (params.has('summary')) {
      window.history.replaceState({}, document.title, `${window.location.pathname}#play`);
    }
    this.resizeTimer = null;
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
  }

  handleResize = () => {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    this.resizeTimer = setTimeout(() => {
      const windowWidth = window.innerWidth;
      this.setState(prevState => ({
        windowWidth,
        fitToScreen: windowWidth >= 768 ? false : prevState.fitToScreen
      }));
    }, 150);
  };

  render() {
    const {
      characterData, error, guesses, characters, characterOfTheDay,
      guessesRemaining, gameStatus, forcedForfeit,
      colorMap, win, windowWidth, doneRendering,
      animatingGuessNumber, viewMode, fitToScreen, showEasyInfo
    } = this.state;
    const { easyMode, easyModeExplained } = this.props;

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

    const guessesRemainingClass = getGuessesRemainingClass(guessesRemaining);

    // Select Element
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

      if (easyMode) {
        filteredCharacters = filteredCharacters.filter(character =>
          survivesEasyModeFilter(character, guesses, characterOfTheDay)
        );
      }
    }

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

    const sortedCharacters = [...filteredCharacters].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );

    const mappedOptions = sortedCharacters.map(character => {
      let imgDetails = <img className='character-img-wizard' src='../imgs/Wizard-Purple.png' alt={`${character.name}`} />;
      if (character.image !== '') {
        imgDetails = (
          <img
            className='character-img-lg'
            src={`${character.image}`}
            alt={`${character.name}`}
            style={getCharacterImageStyle(character)}
          />
        );
      }
      return { value: character.name, label: character.name, characterData: character, img: imgDetails };
    });

    function customTheme(theme) {
      return {
        ...theme,
        colors: {
          ...theme.colors,
          primary25: '#D49E24',
          primary: '#7B90BD',
          neutral50: '#7B90BD'
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
      }),
      option: base => ({
        ...base,
        backgroundColor: 'transparent',
        color: 'var(--color-bg)',
        cursor: 'pointer'
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
            className="character-select-container w-100 mx-2 text-left"
            classNamePrefix="character-select"
            placeholder={`${placeholder}`}
            options={mappedOptions}
            styles={customStyles}
            theme={customTheme}
            components={{ Option: CustomOption }}
            formatOptionLabel={formatOptionLabel}
            isSearchable
            maxMenuHeight="360px"
            controlShouldRenderValue={false}
            onChange={this.handleChange}
            noOptionsMessage={() => 'No characters with that name...'}
          />
          <div className="btn-absolute mx-2">
            <button className='white-btn form-font' aria-label='Cast guess' style={{ width: '100px', height: '72px' }} onClick={this.handleSubmit}>
              <i className="fa-lg fa-sharp fa-solid fa-wand-sparkles" />
            </button>
          </div>
        </div>
        <div className="row w-100 d-flex justify-content-center">
          <button type="button" className="cast-guess-btn" onClick={this.handleSubmit}>
            <span className="btn-font">Cast Guess</span>
            <i className="fa-lg fa-sharp fa-solid fa-wand-sparkles" />
          </button>
        </div>
        <div className={`row ${errorClass} justify-content-center mt-3 w-100`}>
          <p className='error-font'>Must select a correct character name from the provided list</p>
        </div>
      </>
    );

    // Guess Chart Element
    const headers = GUESS_HEADERS;
    let rowKey = guesses.length;
    const scrollContainerClass = fitToScreen
      ? 'scroll-container scroll-container-fit mt-1 p-0 w-100'
      : 'scroll-container mt-1 p-0 w-100';
    const guessChart = (
      <>
        <div className="chart-frame-outer w-100">
          <div className="chart-frame">
            <button
              type="button"
              className="chart-view-toggle-btn"
            onClick={this.toggleFitToScreen}
            aria-label={fitToScreen ? 'Collapse table to full-size view' : 'Expand table to fit screen'}
            title={fitToScreen ? 'Collapse' : 'Expand'}
          >
              <i className={`fa-solid ${fitToScreen ? 'fa-compress' : 'fa-expand'}`} />
            </button>
            <div className={scrollContainerClass} ref={this.scrollContainerRef}>
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
                          <img
                        className='character-img-lg'
                        src={`${guess.characterData.image}`}
                        alt={`${guess.characterData.name}`}
                        style={getCharacterImageStyle(guess.characterData)}
                      />
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
                          if (STAT_KEYS.includes(thName)) {
                            tds.push({
                              thName,
                              classColor,
                              p: formatStatValue(guess.characterData[thName])
                            });
                          }
                        });
                      }
                    });

                    return (
                      <tr key={rowKey} className='d-flex justify-content-center'>
                        {
                      tds.map((cell, cellIndex) => {
                        const isAnimating = animatingGuessNumber === guess.guessNumber;
                        const cellClass = isAnimating ? 'guess-cell animating' : 'guess-cell revealed';

                        return (

                          <td
                            key={cellIndex}
                            className={cellClass}
                            style={{ '--i': cellIndex }}
                            onAnimationEnd={() => this.handleGuessAnimationEnd(guess.guessNumber, cellIndex)}
                          >
                            <div className='position-relative'>
                              {cell.imgDetails ? <div> {cell.imgDetails} </div> : <div className={`category-box ${cell.classColor}`} />}
                              <div className={`overlay${cell.imgDetails ? ' overlay-full' : ''}`}>
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
          </div>
        </div>
        <div className={`w-100 d-flex justify-content-center mt-3 scroll-btn-container${fitToScreen ? ' scroll-btn-container-hidden' : ''}`}>
          <div className="scroll-buttons d-flex justify-content-between align-items-center">
            <button type="button" className="scroll-arrow-btn" onClick={this.scrollLeft} aria-label="Scroll table left">
              <i className="fas fa-arrow-left px-3" style={{ color: 'rgb(123, 144, 189, 56%)' }} />
            </button>
            <p className='scroll-btn-font p-0 m-0'>Scroll horizontally to see more</p>
            <button type="button" className="scroll-arrow-btn" onClick={this.scrollRight} aria-label="Scroll table right">
              <i className="fas fa-arrow-right px-3" style={{ color: 'rgb(123, 144, 189, 56%)' }} />
            </button>
          </div>
        </div>
      </>
    );

    const showForfeit = viewMode === 'playing' &&
      !forcedForfeit &&
      !win &&
      animatingGuessNumber === null;
    const outcomeStatus = resolveOutcomeStatus({ gameStatus, win, forcedForfeit });
    const showOutcomeHeader = outcomeStatus && (
      viewMode === 'review' || (viewMode === 'playing' && win && doneRendering)
    );

    if (viewMode === 'summary') {
      return (
        <RevealCharacter
          colorMap={colorMap}
          gameStatus={gameStatus}
          characterOfTheDay={characterOfTheDay}
          onReviewGuesses={this.goToReview}
        />
      );
    }

    if (viewMode === 'review') {
      return (
        <>
          {renderOutcomeTitle(outcomeStatus)}
          <div className="row justify-content-center mt-2 w-100">
            <p className='guesses-font'>Guesses remaining: <span className={`guesses-font ${guessesRemainingClass}`}>{guessesRemaining}</span></p>
          </div>
          <div className="row justify-content-center mb-3 w-100">
            <button type="button" className='blue-btn btn-font btn-lg border-0' onClick={this.goBackToSummary}>
              Continue
            </button>
          </div>
          {guessChart}
          <Legend />
          {confetti ? <WinConfetti /> : null}
        </>
      );
    }

    if (viewMode === 'forfeit') {
      return (
        <Forfeit
          guessesRemaining={guessesRemaining}
          guessesRemainingClass={guessesRemainingClass}
          onReveal={() => this.goToSummary('lose')}
        />
      );
    }

    return (
      <>
        {!showOutcomeHeader && (
          <>
            <div className="row w-100 d-flex justify-content-center mt-4">
              <h1 className='game-headline'>HAVE YOU SEEN THIS WIZARD?</h1>
            </div>
            <div className="text-center d-flex align-items-center justify-content-center w-100" >
              <div className="row mb-3">
                <WantedPoster />
              </div>
            </div>
          </>
        )}
        {showOutcomeHeader ? renderOutcomeTitle(outcomeStatus) : null}
        <div className="row justify-content-center mt-2 w-100">
          <p className='guesses-font'>Guesses remaining: <span className={`guesses-font ${guessesRemainingClass}`}>{guessesRemaining}</span></p>
        </div>
        {!win && !forcedForfeit
          ? <GameModeToggle
              easyMode={easyMode}
              onSelectMode={this.handleSelectMode}
              onShowInfo={this.handleShowEasyInfo}
            />
          : null}
        {forcedForfeit || win
          ? doneRendering
            ? <>
              <div className="row justify-content-center mb-3 w-100 "><button className='blue-btn btn-font btn-lg border-0' action={action} onClick={this.handleContinue}>Continue</button></div>
              {confetti ? <WinConfetti /> : null}
            </>
            : select
          : select
        }
        {showForfeit && guesses.length > 0
          ? <ForfeitModal guessesRemaining={guessesRemaining} guessesRemainingClass={guessesRemainingClass} onForfeit={this.handleForfeit} />
          : null}
        { guesses && guesses.length > 0
          ? <>
            { guessChart }
            <Legend />
          </>
          : null
        }
        {(easyMode && !easyModeExplained) || showEasyInfo
          ? <EasyModeExplainer onClose={this.handleCloseEasyInfo} />
          : null}
      </>
    );
  }

}
