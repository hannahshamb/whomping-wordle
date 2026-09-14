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
      centerActions
    >
      <p className="game-modal-body">
        One wizard is hiding out every day, and you get ten guesses to snatch them.
      </p>
      <ol className="game-modal-list">
        <li>Type any character name and choose them from the dropdown list.</li>
        <li>Cast your guess with the wand button or the Cast Guess button.</li>
        <li>
          Each column turns green where your guess matches today&#39;s wizard and red
          where it doesn&#39;t. Narrow it down from there.
        </li>
        <li>Out of guesses or out of patience? Forfeit to reveal the answer.</li>
      </ol>
      <p className="game-modal-note">
        A new wizard appears every day at midnight. Easy Mode narrows the dropdown as
        you learn more, so it only gives you five guesses instead of ten &mdash; switch
        modes under the Cast Guess button.
      </p>
    </GameModal>
  );
}
