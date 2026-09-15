import React from 'react';
import GameModal from './game-modal';

export default function HowToPlay(props) {
  const { onClose } = props;

  return (
    <GameModal
      title="So you think you are some kind of Auror, do you?"
      titleId="howToPlayTitle"
      closeLabel="I solemnly swear I am up to no good!"
      onClose={onClose}
      actionsAlign="center"
    >
      <p className="game-modal-body">
        One wizard is hiding out every day, and you must make a correct guess in order
        to snatch them.
      </p>
      <h3 className="game-modal-subtitle">How to play</h3>
      <hr className="game-modal-divider" />
      <ol className="game-modal-list">
        <li>Type any character name and choose them from the dropdown list.</li>
        <li>Cast your guess with the wand button or the Cast Guess button.</li>
        <li>
          Each column turns green where your guess matches today&#39;s wizard and red
          where it doesn&#39;t.
        </li>
        <li>Can&#39;t figure it out? Cast forfeit to reveal the wizard of the day.</li>
        <li>A new wizard appears every day at midnight PST.</li>
      </ol>
      <p className="game-modal-note">
        Tip: <span className="yellow-font">Easy Mode</span> narrows down the wizard
        options available as you learn more from your guesses.
      </p>
    </GameModal>
  );
}
