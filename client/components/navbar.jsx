import React, { useState, useContext } from 'react';
import { AppContext } from '../lib';
import SettingsModal from './settings-modal';
import Tooltip from './tooltip';

export default function Navbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    colorblindMode,
    toggleColorblindMode,
    easyMode,
    easyModeExplained,
    toggleEasyMode
  } = useContext(AppContext);

  const openSettings = () => {
    setIsSettingsOpen(true);
  };

  // Turning easy mode on surfaces the explainer on the board behind this
  // modal, so step out of the way to let it through.
  const handleToggleEasyMode = () => {
    const turningOn = !easyMode;
    toggleEasyMode();
    if (turningOn && !easyModeExplained) {
      setIsSettingsOpen(false);
    }
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  const goHome = event => {
    event.preventDefault();
    if (window.location.hash !== '#') {
      window.location.hash = '#';
    }
  };

  return (
    <>
      <nav className="navbar sticky-top navbar-custom">
        <div className="navbar-container">
          <div className="navbar-spacer" aria-hidden="true" />
          <a className="navbar-brand" href="#" onClick={goHome}>
            <img src="../imgs/Whomping Wordle.png" alt="Whomping Wordle" />
          </a>
          <div className="navbar-actions">
            <Tooltip text="Settings" placement="below">
              <button
                type="button"
                className="settings-btn"
                aria-label="Open settings"
                onClick={openSettings}
              >
                <i className="fas fa-gear" />
              </button>
            </Tooltip>
          </div>
        </div>
      </nav>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        colorblindMode={colorblindMode}
        onToggleColorblindMode={toggleColorblindMode}
        easyMode={easyMode}
        onToggleEasyMode={handleToggleEasyMode}
      />
    </>
  );
}
