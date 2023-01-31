import React from 'react';

export default function Home(props) {
  return (
    <div className="vh-100 text-center d-flex flex-column align-items-center justify-content-center">
      <div className="row mb-4">
        <div className="col text-center">
          <h1>HAVE YOU SEEN THIS WIZARD?</h1>
        </div>
      </div>
      <div className="row mb-3">
        <img src='../imgs/Wizard.png' alt='wizard' />
      </div>
      <div className="row">
        <p>So you think you are some kind of Auror, do you?</p>
      </div>
      <div className="row mt-4">
        <p><span style={{ color: '#D3A625' }}>Try to snatch this wizard if you can...</span></p>
      </div>
      <div className="row mt-4">
        <button className='blue-btn btn btn-lg'>
          <div className="row d-flex align-items-center justify-content-center p-1">
            <div className="col-8 p-0">
              <p className='btn-font p-0 m-0'>I solemnly swear I am up to no good!</p>
            </div>
            <div className="col-1 p-0">
              <span><i className="fa-lg fa-sharp fa-solid fa-wand-sparkles" /></span>
            </div>
          </div>
        </button>
      </div>

    </div>
  );
}
