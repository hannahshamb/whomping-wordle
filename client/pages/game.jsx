import React from 'react';
import GameForm from '../components/game-form';

export default class Game extends React.Component {

  render() {
    return (
      <>
        <div className="text-center d-flex align-items-center justify-content-center mt-5" >
          <div className="row mb-3">
            <img src='../imgs/Wizard.png' alt='wizard' />
          </div>
        </div>
        <div className="row form-font d-flex justify-content-center text-center m-0 w-100">
          <GameForm />
        </div>
      </>
    );
  }

}
