import React from 'react';
import { getCharacterImageStyle } from '../lib/character-image-style';

const STAMPS = {
  win: { text: 'SNATCHED!', className: 'wanted-poster-stamp-win' },
  lose: { text: 'DISAPPARATED!', className: 'wanted-poster-stamp-lose' }
};

export default function WantedPoster(props) {
  const { stamp, character } = props;
  const stampDetails = stamp ? STAMPS[stamp] : null;

  // Once the game is over the silhouette gives way to the wizard it was
  // standing in for, and the stamp lands on their face instead.
  const portrait = character
    ? (
      <div className="wanted-poster-portrait">
        {character.image
          ? <img
              className="wanted-poster-face"
              src={character.image}
              alt={character.name}
              style={getCharacterImageStyle(character)}
            />
          : <img className="wanted-poster-face" src="../imgs/Wizard-Purple.png" alt={character.name} />}
      </div>
      )
    : <img className="wanted-poster-img" src="../imgs/Wizard.png" alt="Silhouette of an unidentified wizard" />;

  return (
    <div className="wanted-poster">
      <p className="wanted-poster-caption">WANTED</p>
      {portrait}
      {stampDetails
        ? <span className={`wanted-poster-stamp ${stampDetails.className}`}>{stampDetails.text}</span>
        : null}
    </div>
  );
}
