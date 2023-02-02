import React from 'react';
import GameForm from '../components/game-form';

export default class Game extends React.Component {

  render() {
    return (
      <div className="text-center d-flex flex-column align-items-center justify-content-center mt-5" >
        <div className="row mb-3">
          <img src='../imgs/Wizard.png' alt='wizard' />
        </div>
        <div className="form-font m-0 d-flex justify-content-center m-0 w-100">
          <GameForm />
        </div>
      </div>
    );
  }

}
