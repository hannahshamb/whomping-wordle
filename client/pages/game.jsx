import React from 'react';
import GameForm from '../components/game-form';
import Spinner from '../components/spinner';
import { AppContext } from '../lib';

export default class Game extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);
    this.state = {
      characterData: undefined,
      loadError: null
    };
  }

  componentDidMount() {
    fetch('/data/characters.json')
      .then(res => {
        if (!res.ok) {
          throw new Error('Could not load character roster');
        }
        return res.json();
      })
      .then(characterData => {
        this.setState({ characterData, loadError: null });
      })
      .catch(err => {
        this.setState({ loadError: err.message });
      });
  }

  render() {
    const { characterData, loadError } = this.state;
    const { today, easyMode, easyModeExplained, toggleEasyMode, acknowledgeEasyMode } = this.context;

    if (loadError) {
      return (
        <div className="row form-font d-flex justify-content-center text-center m-0 w-100">
          <p className="text-danger">{loadError}</p>
        </div>
      );
    }

    return (
      <div className="row form-font d-flex justify-content-center text-center m-0 w-100">
        {characterData === undefined
          ? <Spinner/>
          : <GameForm
              key={`${today.month}-${today.date}-${today.year}`}
              characterData={characterData}
              today={today}
              easyMode={easyMode}
              easyModeExplained={easyModeExplained}
              toggleEasyMode={toggleEasyMode}
              acknowledgeEasyMode={acknowledgeEasyMode}
            />
        }
      </div>
    );
  }

}
