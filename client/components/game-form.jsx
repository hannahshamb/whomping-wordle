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
      error: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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
    this.setState({ characters: characterData, characterOfTheDay, guesses, guessesRemaining });
  }

  render() {
    // feature 2 continued
    const { characterData, error, guesses, characters, characterOfTheDay, guessesRemaining } = this.state;
    const errorClass = error ? '' : 'd-none';

    let guessesRemainingClass;

    let gameStatus = null;

    if (guessesRemaining === 0) {
      gameStatus = 'lose';
    }

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

    return (
      <>
        {guessesRemaining === 0
          ? null
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
          </>
      }

        <div className="row justify-content-center mt-3 w-100">
          <p className='guesses-font'>Guesses remaining: <span className={`guesses-font ${guessesRemainingClass}`}>{guessesRemaining}</span></p>
        </div>
        {guesses && guesses.length > 0 && guessesRemaining > 0
          ? <>
            {/* GameStatus === 'lose'? If so update gameStatus and pass via props the outcome tp guessChart */}
            <GuessChart guesses={guesses} characterOfTheDay={characterOfTheDay} guessesRemaining={guessesRemainingClass} gameStatus={gameStatus} />
            {/* Forfeit button - will need to send character of the day as well */}
            <Legend />
          </>
          : guessesRemaining !== 10
            ? <GuessChart guesses={guesses} characterOfTheDay={characterOfTheDay} guessesRemaining={guessesRemainingClass} gameStatus={gameStatus} />
            : null
}
      </>

    );
  }

}
GameForm.contextType = AppContext;

// {
//   guesses && guesses.length > 0 && guessesRemaining > 0
//   ? <>
//     {/* GameStatus === 'lose'? If so update gameStatus and pass via props the outcome tp guessChart */}
//     <GuessChart guesses={guesses} characterOfTheDay={characterOfTheDay} guessesRemaining={guessesRemainingClass} gameStatus={gameStatus} />
//     {/* Forfeit button - will need to send character of the day as well */}
//     <Legend />
//   </>
//   : < GuessChart guesses={guesses} characterOfTheDay={characterOfTheDay} guessesRemaining={guessesRemaining} gameStatus={gameStatus} />
// }
