import React from 'react';
import GameModal from './game-modal';

export default function EasyModeExplainer(props) {
  const { onClose } = props;

  return (
    <GameModal
      title="What is Easy Mode?"
      titleId="easyModeExplainerTitle"
      closeLabel="Got it"
      onClose={onClose}
    >
      <p className="game-modal-body">
        After each guess, the character list gets filtered based on what you&#39;ve
        learned. Learn that today&#39;s wizard is a Gryffindor student, and every witch
        or wizard from another house disappears from the dropdown.
      </p>
      <p className="game-modal-note">
        Because that does some of the work for you, Easy Mode gives you five guesses
        rather than ten. In Normal mode, your character list will not be filtered.
        Switch back to Normal mode any time &mdash; your guesses are kept either way.
      </p>
    </GameModal>
  );
}
