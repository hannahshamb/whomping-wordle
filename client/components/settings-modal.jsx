import React from 'react';

export default function SettingsModal(props) {
  const { isOpen, onClose, colorblindMode, onToggleColorblindMode } = props;

  if (!isOpen) {
    return null;
  }

  const toggleClass = colorblindMode ? 'settings-toggle on' : 'settings-toggle off';
  const toggleLabel = colorblindMode ? 'Turn colorblind off' : 'Turn colorblind on';

  return (
    <>
      <div className="settings-modal-overlay" />
      <div className="settings-modal" role="dialog" aria-labelledby="settingsModalTitle" aria-modal="true">
        <div className="settings-modal-header">
          <h2 id="settingsModalTitle" className="settings-modal-title">Settings</h2>
          <button type="button" className="settings-modal-close" aria-label="Close settings" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>
        <hr className="settings-modal-divider" />
        <div className="settings-modal-row">
          <i className="fas fa-eye settings-modal-icon" aria-hidden="true" />
          <span className="settings-modal-label">Colorblind Mode</span>
          <button
            type="button"
            className={toggleClass}
            role="switch"
            aria-checked={colorblindMode}
            aria-label={toggleLabel}
            onClick={onToggleColorblindMode}
          >
            <span className="settings-toggle-slider" />
          </button>
        </div>
      </div>
    </>
  );
}
