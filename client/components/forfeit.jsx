import React from 'react';
import RevealCharacter from './reveal-character';

export default class Forfeit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      reveal: false
    };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState({ reveal: true });
  }

  render() {
    const { reveal } = this.state;
    const { colorMap, characterOfTheDay, guessesRemaining, guessesRemainingClass } = this.props;
    return (
      <>
        {reveal
          ? <RevealCharacter colorMap={colorMap} gameStatus="lose" characterOfTheDay={characterOfTheDay}/>
          : <>
            <div className="text-center d-flex align-items-center justify-content-center mt-5 w-100" >
              <div className="row mb-3">
                <img src='../imgs/Wizard.png' alt='wizard' />
              </div>
            </div>
            <div className="row justify-content-center mt-2 w-100">
              <p className='guesses-font'>Guesses remaining: <span className={`guesses-font ${guessesRemainingClass}`}>{guessesRemaining}</span></p>
            </div>
            <div className="row w-100 d-flex justify-content-center">
              <div className="results-container w-100 red-font">
                <h1 className='mt-4 mb-3'>FORFEIT</h1>
                <p className='mb-4 px-5'>Eeek! Looks like you scored a T &#40;Troll&#41; on your OWLS...</p>
              </div>
            </div>
            <button className='mm-btn btn-lg blue-btn btn-font border-0 mt-3 p-2' data-hover-text='Reveal Character' onClick={this.handleClick}>
              <div className="row d-flex align-items-center justify-content-center p-1">
                <div className="col-8 p-0">
                  <p className='btn-font p-0 m-0'>Mischeif Managed</p>
                </div>
                <div className="col-1 p-0">
                  <span><i className="fa-lg fa-sharp fa-solid fa-wand-sparkles" /></span>
                </div>
              </div>
            </button>
          </>
      }
        {/* */}
      </>
    );
  }

}
