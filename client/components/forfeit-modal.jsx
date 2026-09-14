import React, { useState } from 'react';

export default function ForfeitModal(props) {
  const [isModalActive, setIsModalActive] = useState(false);

  const { guessesRemaining, guessesRemainingClass, onForfeit } = props;

  const openModal = () => {
    setIsModalActive(true);
  };

  const closeModal = () => {
    setIsModalActive(false);
  };

  const handleForfeitClick = () => {
    closeModal();
    onForfeit();
  };

  const overlayClass = isModalActive ? 'visible' : 'invisible';

  return (
    <>
      <div className={`modal-overlay ${overlayClass}`}/>
      <button
        type="button"
        className="cast-forfeit-btn"
        data-toggle="modal"
        data-target="#staticBackdrop"
        onClick={openModal}
      >
        Cast Forfeit
        <i className="fa-sharp fa-solid fa-wand-sparkles" />
      </button>
      <div className="modal p-0 fade modal-position" id="staticBackdrop" data-backdrop="static" style={{ zIndex: '1051' }} role="dialog" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content modal-content-box">
            <div className="row mt-3 w-100 d-flex justify-content-end">
              <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={closeModal}>
                <span aria-hidden="true"><i className="fas fa-times"/></span>
              </button>
            </div>
            <div className="modal-body">
              <h1 className="red-font" id="staticBackdropLabel">Are you sure?</h1>
              <p className='modal-font'>If you cast forfeit, you quit the game and may reveal the wizard of the day.</p>
              <p className='modal-font'>You still have <span className={guessesRemainingClass}>{guessesRemaining}</span> guesses remaining</p>
            </div>
            <div className="d-flex justify-content-between px-3 mb-4">
              <button type="button" className="btn-lg modal-btn yellow" data-dismiss="modal" onClick={closeModal}>
                <div className="row d-flex align-items-center justify-content-center mt-1">
                  <span><i className="fa-xl fa-sharp fa-solid fa-wand-sparkles" /></span>
                </div>
                <div className="row d-flex align-items-center justify-content-center">
                  <p className='btn-font px-2 m-0'>Keep Trying</p>
                </div>
              </button>
              <button type="button" className="btn-lg modal-btn red" data-dismiss='modal' onClick={handleForfeitClick}>
                <div className="row d-flex align-items-center justify-content-center mt-1">
                  <span><i className="fa-xl fa-sharp fa-solid fa-wand-sparkles" /></span>
                </div>
                <div className="row d-flex align-items-center justify-content-center">
                  <p className='btn-font px-2 m-0'>Forfeit</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
