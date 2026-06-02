import React from 'react';

export default function Tooltip({ text, children, placement = 'above' }) {
  const tooltipId = React.useId();
  const placementClass = placement === 'below' ? 'tooltip-popup-below' : 'tooltip-popup-above';

  const child = React.Children.only(children);

  return (
    <span className="tooltip-trigger">
      {React.cloneElement(child, {
        'aria-describedby': tooltipId
      })}
      <span id={tooltipId} className={`tooltip-popup ${placementClass}`} role="tooltip">
        {text}
      </span>
    </span>
  );
}
