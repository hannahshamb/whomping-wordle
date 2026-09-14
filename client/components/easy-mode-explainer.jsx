import React from 'react';

export default function EasyModeExplainer(props) {
  const { onClose } = props;

  return (
    <>
      <div className="easy-mode-overlay" />
      <div
        className="easy-mode-explainer"
        role="dialog"
        aria-labelledby="easyModeExplainerTitle"
        aria-modal="true"
      >
        <div className="easy-mode-explainer-header">
          <h2 id="easyModeExplainerTitle" className="easy-mode-explainer-title">Easy Mode is on</h2>
          <button
            type="button"
            className="easy-mode-explainer-close"
            aria-label="Close"
            onClick={onClose}
          >
            <i className="fas fa-times" />
          </button>
        </div>
        <p className="easy-mode-explainer-body">
          After each guess, the character list narrows to everyone still matching what
          you&#39;ve confirmed. Learn that today&#39;s wizard is a Gryffindor student, and
          every witch or wizard from another house disappears from the dropdown.
        </p>
        <p className="easy-mode-explainer-note">
          Switch back to Normal any time. Your guesses so far are kept either way.
        </p>
        <div className="easy-mode-explainer-actions">
          <button type="button" className="cast-guess-btn easy-mode-explainer-ok" onClick={onClose}>
            <span className="btn-font">Got it</span>
            <i className="fa-sharp fa-solid fa-wand-sparkles" />
          </button>
        </div>
      </div>
    </>
  );
}
