import React from 'react';

export default class Forfeit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <>
        <div className="row w-100 d-flex justify-content-center">
          <div className="results-container w-100 red-font">
            <h1 className='mt-4 mb-3'>FORFEIT</h1>git
            <p className='mb-4 px-5'>Eeek! Looks like you scored a T &#40;Troll&#41; on your OWLS...</p>
          </div>
        </div>
        <button className='mm-btn btn-lg blue-btn btn-font border-0 mt-3 p-2' data-hover-text='Reveal Character'>
          <div className="row d-flex align-items-center justify-content-center p-1">
            <div className="col-8 p-0">
              <p className='btn-font p-0 m-0'>Mischeif Managed</p>
            </div>
            <div className="col-1 p-0">
              <span><i className="fa-lg fa-sharp fa-solid fa-wand-sparkles" /></span>
            </div>
          </div>
        </button>
      </>
    );
  }

}
