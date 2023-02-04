import React from 'react';

export default function GuessChart(props) {
  // console.log(props);
  const { guesses } = props;
  return (
    <div className='w-100 d-flex justify-content-center'>
      <table className="table-container m-5" cellSpacing={0} cellPadding={0}>
        <thead>
          <tr>
            <th>Character</th>
            <th>Gender</th>
            <th>House</th>
            <th>Role</th>
            <th>Patronus</th>
            <th>Ancestry</th>
            <th>Alive</th>
          </tr>
        </thead>
        <tbody>
          {guesses.slice(0).reverse().map((guess, index) => {

            let imgDetails = <img className='character-img-wizard' src='../imgs/Wizard-Purple.png' alt={`${guess.characterData.name}`} />;
            if (guess.characterData.image !== '') {
              imgDetails = <img className='character-img-lg' src={`${guess.characterData.image}`} alt={`${guess.characterData.name}`} />;
            }

            let house;
            if (guess.characterData.house === '') {
              house = 'Unknown';
            } else {
              house = guess.characterData.house[0].toUpperCase() + guess.characterData.house.slice(1);
            }

            let role;
            if (guess.characterData.hogwartsStudent === true) {
              role = 'Student';
            } else if (guess.characterData.hogwartsStaff === true) {
              role = 'Staff';
            } else {
              role = 'Other';
            }

            let patronus;
            if (guess.characterData.patronus === '') {
              patronus = 'Unknown';
            } else {
              patronus = guess.characterData.patronus[0].toUpperCase() + guess.characterData.patronus.slice(1);
            }

            let ancestry;
            if (guess.characterData.ancestry === '') {
              ancestry = 'Unknown';
            } else {
              ancestry = guess.characterData.ancestry[0].toUpperCase() + guess.characterData.ancestry.slice(1);
            }

            let alive;
            if (guess.characterData.alive) {
              alive = 'True';
            } else {
              alive = 'False';
            }

            return (
              <tr key={index}>
                <td className='d-flex justify-content-center'>
                  <div className='position-relative d-inline-block'>
                    <div className="category-img-container">
                      {imgDetails}
                    </div>

                    <div className="overlay">
                      <p className='td-font'>{guess.characterData.name}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className='position-relative d-inline-block'>
                    <div className="category-box" />
                    <div className="overlay">
                      <p className='td-font'>{guess.characterData.gender[0].toUpperCase() + guess.characterData.gender.slice(1)}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className='position-relative d-inline-block'>
                    <div className="category-box" />
                    <div className="overlay">
                      <p className='td-font'>{ house }</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className='position-relative d-inline-block'>
                    <div className="category-box" />
                    <div className="overlay">
                      <p className='td-font'>{ role }</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className='position-relative d-inline-block'>
                    <div className="category-box" />
                    <div className="overlay">
                      <p className='td-font'>{ patronus }</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className='position-relative d-inline-block'>
                    <div className="category-box" />
                    <div className="overlay">
                      <p className='td-font'>{ ancestry }</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className='position-relative d-inline-block'>
                    <div className="category-box" />
                    <div className="overlay">
                      <p className='td-font'>{alive}</p>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

  );
}
