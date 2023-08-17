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
        fullCharacterData.forEach(character => {
          if (character.hogwartsStaff === true) {
            character.role = 'Staff';
          } else if (character.hogwartsStudent === true) {
            character.role = 'Student';
          } else {
            character.role = 'Other';
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

        });
        const dataDict = {};
        for (const obj of fullCharacterData) {
          for (const key in obj) {
            if (key === 'gender' || key === 'hairColour' || key === 'house' || key === 'role' ||
              key === 'species' || key === 'ancestry' || key === 'alive') {
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
          characterData.push(fullCharacterData[i]);
        });
        this.setState({ characterData });
      });
  }

  render() {
    const { characterData } = this.state;
    return (
      <>
        <div className="text-center d-flex align-items-center justify-content-center mt-5" >
          <div className="row mb-3">
            <img src='../imgs/Wizard.png' alt='wizard' />
          </div>
        </div>
        <div className="row form-font d-flex justify-content-center text-center m-0 w-100">
          {characterData === undefined
            ? <Spinner/>
            : <GameForm characterData={characterData} />
          }

        </div>
      </>
    );
  }

}
