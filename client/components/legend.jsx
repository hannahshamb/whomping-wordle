import React from 'react';

export default function Legend() {

  return (
    <div className='legend-container p-2'>
      <div className="row w-100 d-flex justify-content-center text-center m-0">
        <h1 style={{ fontSize: '25px' }}>Legend</h1>
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
