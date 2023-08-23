import React from 'react';

export default class RevealCharacter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { gameStatus, colorMap, characterOfTheDay } = this.props;
    let reversedColorMap = colorMap;
    if (colorMap[0].guessNumber !== 10) {
      reversedColorMap = colorMap.reverse();
    }
    let title = 'SNATCHED!';
    let titleClass = '';
    if (gameStatus === 'lose') {
      title = 'DISAPPARATED';
      titleClass = 'red-font';
    }

    let imgDetails =
      (<div className="category-img-container">
        <img className='character-img-wizard' src='../imgs/Wizard-Purple.png' alt={`${characterOfTheDay.name}`} />
      </div>);
    if (characterOfTheDay.image !== '') {
      imgDetails =
        <div className="category-img-container">
          <img className='character-img-lg' src={`${characterOfTheDay.image}`} alt={`${characterOfTheDay.name}`} />
        </div>;
    }

    return (
      <div className="results-container w-100">
        <h1 className={`${titleClass} mt-3`}>{title}</h1>
        <div className="row d-flex justify-content-center">
          {imgDetails}
        </div>
        <div className="row d-flex justify-content-center">
          <p className='m-0'>{characterOfTheDay.name}</p>
        </div>
        <div className="row d-flex justify-content-center">
          <p className="guesses-font">
            Attempts to Manage Mischeif: <span className="guesses-font">{colorMap.length}</span>
          </p>
        </div>
        <div className="results-table-container">
          <table className="results-table mb-5">
            <tbody>
              {reversedColorMap.map((guess, index) => {
                return (
                  <tr key={guess.guessNumber} className="d-flex justify-content-center results-tr">
                    {guess.colors.map((color, index) => {
                      return (
                        <td key={index} className="results-td">
                          <div className={`results-category-box ${color.color}`} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    );
  }

}
