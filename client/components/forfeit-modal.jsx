import React, { useState } from 'react';
import GameModal from './game-modal';

export default function ForfeitModal(props) {
  const [isConfirming, setIsConfirming] = useState(false);

  const { guessesRemaining, guessesRemainingClass, easyMode, onForfeit } = props;

  const openModal = () => {
    setIsConfirming(true);
  };

  const closeModal = () => {
    setIsConfirming(false);
  };

  const handleForfeitClick = () => {
    closeModal();
    onForfeit();
  };

  const actions = (
    <>
      <button type="button" className="cast-guess-btn" onClick={closeModal}>
        Keep Trying
        <i className="fa-sharp fa-solid fa-wand-sparkles" />
      </button>
      <button type="button" className="cast-forfeit-btn" onClick={handleForfeitClick}>
        Forfeit
        <i className="fa-sharp fa-solid fa-wand-sparkles" />
      </button>
    </>
  );

  return (
    <>
      <button type="button" className="cast-forfeit-btn" onClick={openModal}>
        Cast Forfeit
        <i className="fa-sharp fa-solid fa-wand-sparkles" />
      </button>
      {isConfirming
        ? <GameModal
            title="Are you sure?"
            titleId="forfeitModalTitle"
            onClose={closeModal}
            actionsAlign="split"
            actions={actions}
          >
          <p className="game-modal-body">
            Casting forfeit ends today&#39;s game and reveals the wizard of the day.
          </p>
          <p className="game-modal-body">
            You still have <span className={guessesRemainingClass}>{guessesRemaining}</span>
            {' '}guesses remaining.
          </p>
          {easyMode
            ? null
            : <p className="game-modal-note">
              Stuck but not finished? Try <span className="yellow-font">Easy Mode</span>. It
              narrows down the wizard options available as you learn more from your guesses.
            </p>}
        </GameModal>
        : null}
    </>
  );
}
