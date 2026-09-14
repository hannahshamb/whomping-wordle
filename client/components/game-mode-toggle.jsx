import React from 'react';

export default function GameModeToggle(props) {
  const { easyMode, easyDisabled, easyMaxGuesses, onSelectMode, onShowInfo } = props;

  return (
    <div className="game-mode-toggle-wrapper">
      <div className="game-mode-toggle" role="group" aria-label="Game mode">
        <button
          type="button"
          className={`game-mode-segment${easyMode ? '' : ' active'}`}
          aria-pressed={!easyMode}
          onClick={() => onSelectMode(false)}
        >
          Normal
        </button>
        <button
          type="button"
          className={`game-mode-segment${easyMode ? ' active' : ''}`}
          aria-pressed={easyMode}
          disabled={easyDisabled}
          title={easyDisabled
            ? `Easy Mode only allows ${easyMaxGuesses} guesses, and you have already used them`
            : undefined}
          onClick={() => onSelectMode(true)}
        >
          Easy
        </button>
      </div>
      <button
        type="button"
        className="game-mode-info"
        aria-label="What is easy mode?"
        title="What is easy mode?"
        onClick={onShowInfo}
      >
        ?
      </button>
    </div>
  );
}
