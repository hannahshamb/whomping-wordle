import React from 'react';

export default function SettingsModal(props) {
  const {
    isOpen,
    onClose,
    colorblindMode,
    onToggleColorblindMode,
    easyMode,
    onToggleEasyMode,
    showLegend,
    onToggleShowLegend
  } = props;

  if (!isOpen) {
    return null;
  }

  const colorblindToggleClass = colorblindMode ? 'settings-toggle on' : 'settings-toggle off';
  const colorblindToggleLabel = colorblindMode ? 'Turn colorblind off' : 'Turn colorblind on';
  const easyToggleClass = easyMode ? 'settings-toggle on' : 'settings-toggle off';
  const easyToggleLabel = easyMode ? 'Switch to normal mode' : 'Switch to easy mode';
  const legendToggleClass = showLegend ? 'settings-toggle on' : 'settings-toggle off';
  const legendToggleLabel = showLegend ? 'Hide the legend' : 'Show the legend';

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
            className={colorblindToggleClass}
            role="switch"
            aria-checked={colorblindMode}
            aria-label={colorblindToggleLabel}
            onClick={onToggleColorblindMode}
          >
            <span className="settings-toggle-slider" />
          </button>
        </div>
        <div className="settings-modal-row">
          <i className="fa-sharp fa-solid fa-wand-sparkles settings-modal-icon" aria-hidden="true" />
          <span className="settings-modal-label">Easy Mode</span>
          <button
            type="button"
            className={easyToggleClass}
            role="switch"
            aria-checked={easyMode}
            aria-label={easyToggleLabel}
            onClick={onToggleEasyMode}
          >
            <span className="settings-toggle-slider" />
          </button>
        </div>
        <div className="settings-modal-row">
          <i className="fa-solid fa-key settings-modal-icon" aria-hidden="true" />
          <span className="settings-modal-label">Show Legend</span>
          <button
            type="button"
            className={legendToggleClass}
            role="switch"
            aria-checked={showLegend}
            aria-label={legendToggleLabel}
            onClick={onToggleShowLegend}
          >
            <span className="settings-toggle-slider" />
          </button>
        </div>
      </div>
    </>
  );
}
