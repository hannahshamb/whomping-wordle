import React from 'react';

export default function NotFound() {
  return (
    <div className="row vh-100 text-center d-flex align-items-center justify-content-center">
      <div className="col">
        <h1 className="danger fs-1 mb-3">404</h1>
        <h1 className='mb-5'>Oops, page not found! &#128556; </h1>
        <a href='#'>Return to home</a>
      </div>
    </div>
  );
}
