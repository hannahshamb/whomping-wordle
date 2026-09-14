import React from 'react';

export default function GameModal(props) {
  const { title, titleId, closeLabel, onClose, children } = props;

  return (
    <>
      <div className="game-modal-overlay" />
      <div className="game-modal" role="dialog" aria-labelledby={titleId} aria-modal="true">
        <div className="game-modal-header">
          <h2 id={titleId} className="game-modal-title">{title}</h2>
          <button type="button" className="game-modal-close" aria-label="Close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>
        {children}
        <div className="game-modal-actions">
          <button type="button" className="cast-guess-btn game-modal-ok" onClick={onClose}>
            <span className="btn-font">{closeLabel}</span>
            <i className="fa-sharp fa-solid fa-wand-sparkles" />
          </button>
        </div>
      </div>
    </>
  );
}
