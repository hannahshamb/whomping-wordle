import React from 'react';
import GameModal from './game-modal';

export default function HowToPlay(props) {
  const { onClose } = props;

  return (
    <GameModal
      title="So you think you are some kind of Auror, do you?"
      titleId="howToPlayTitle"
      closeLabel="Let's play"
      onClose={onClose}
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
        A new wizard appears every day at midnight. Playing in Easy Mode filters the
        character list as you learn more &mdash; switch modes above the character box.
      </p>
    </GameModal>
  );
}
