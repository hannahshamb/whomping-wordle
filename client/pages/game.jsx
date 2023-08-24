import React from 'react';
import GameForm from '../components/game-form';
import Spinner from '../components/spinner';

export default class Game extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    fetch('https://hp-api.onrender.com/api/characters')
      .then(res => res.json())
      .then(response => {
        const fullCharacterData = response;
        const filteredCharaters = [];

        fullCharacterData.forEach(character => {
          if (character.hogwartsStaff === true) {
            character.role = 'Staff';
          } else if (character.hogwartsStudent === true) {
            character.role = 'Student';
          } else {
            character.role = 'Uninvolved';
          }
          if (character.hairColour === 'dark' || character.hairColour === 'tawny' || character.hairColour === 'dull') {
            character.hairColour = 'brown';
          }
          if (character.hairColour === 'blond' || character.hairColour === 'blonde' || character.hairColour === 'sandy') {
            if (character.gender === 'male') {
              character.hairColour = 'blond';
            } else {
              character.hairColour = 'blonde';
            }
          }
          if (character.hairColour === 'ginger') {
            character.hairColour = 'red';
          }

          const filteredCharacter = Object.keys(character).reduce((accumulator, key) => {
            function filteredFunc(characterDataKey) {
              const keys = ['id', 'image', 'name', 'gender', 'hairColour', 'role', 'house', 'species', 'ancestry', 'alive'];
              let result = false;
              keys.forEach(filteredKey => {
                if (characterDataKey === filteredKey) {
                  result = true;
                }
              });
              return result;
            }

            let value = character[key];
            if (value === '' && key !== 'image') {
              value = 'Unknown';
            }
            if (value === false) {
              value = 'False';
            }
            if (value === true) {
              value = 'True';
            }
            if (filteredFunc(key)) {
              accumulator[key] = value;
            }
            return accumulator;
          }, {});
          filteredCharaters.push(filteredCharacter);
        });

        const dataDict = {};
        for (const obj of filteredCharaters) {
          for (const key in obj) {
            if (key !== 'name' || key !== 'image') {
              if (!dataDict[key]) {
                dataDict[key] = [];
              }
              dataDict[key].push(obj[key]);
            }
          }
        }

        const indicies = [];
        const uniqueCharacters = [];
        for (let i = 0; i < dataDict.alive.length; i++) {
          const currentCharacter = `${dataDict.gender[i]} ${dataDict.hairColour[i]} ${dataDict.house[i]} ${dataDict.role[i]} ${dataDict.species[i]} ${dataDict.ancestry[i]} ${dataDict.alive[i]}`;
          if (!uniqueCharacters.includes(currentCharacter)) {
            uniqueCharacters.push(currentCharacter);
            indicies.push(i);
          }
        }
        const characterData = [];
        indicies.forEach(i => {
          characterData.push(filteredCharaters[i]);
        });
        this.setState({ characterData });
      });
  }

  render() {
    const { characterData } = this.state;
    return (
      <div className="row form-font d-flex justify-content-center text-center m-0 w-100">
        {characterData === undefined
          ? <Spinner/>
          : <GameForm characterData={characterData} />
          }

      </div>
    );
  }

}
