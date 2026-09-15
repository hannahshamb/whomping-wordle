import React from 'react';

export default function Legend(props) {
  const { onHide } = props;

  return (
    <div className='legend-container p-2'>
      <div className="legend-header">
        <h1 className="legend-title">Legend</h1>
        {onHide
          ? <button
              type="button"
              className="legend-close"
              aria-label="Hide the legend"
              title="Hide the legend"
              onClick={onHide}
            >
            <i className="fas fa-times" />
          </button>
          : null}
      </div>
      <div className="row d-flex justify-content-between">
        <div className="col d-flex justify-content-center">
          <div className='legend-box green' />
        </div>
        <div className="col d-flex justify-content-center">
          <div className='legend-box red' />
        </div>
      </div>
      <div className="row d-flex justify-content-between">
        <div className="col">
          <p className='m-0' style={{ fontSize: '25px' }}>Correct</p>
        </div>
        <div className="col">
          <p className='m-0' style={{ fontSize: '25px' }}>Incorrect</p>
        </div>
      </div>
    </div>
  );
}
