import React from 'react';

const STAMPS = {
  win: { text: 'SNATCHED!', className: 'wanted-poster-stamp-win' },
  lose: { text: 'DISAPPARATED!', className: 'wanted-poster-stamp-lose' }
};

export default function WantedPoster(props) {
  const { stamp } = props;
  const stampDetails = stamp ? STAMPS[stamp] : null;

  return (
    <div className="wanted-poster">
      <p className="wanted-poster-caption">WANTED</p>
      <img className="wanted-poster-img" src="../imgs/Wizard.png" alt="Silhouette of an unidentified wizard" />
      {stampDetails
        ? <span className={`wanted-poster-stamp ${stampDetails.className}`}>{stampDetails.text}</span>
        : null}
    </div>
  );
}
