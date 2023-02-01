import React from 'react';

export default class GameForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  render() {
    return (

      <form className='form-font d-flex flex-row m-0'>
        <div className="form-group d-flex align-items-center m-0">
          <label htmlFor="characterName" />
          <input className='form-font' type='text' id='characterName' placeholder='Type character name...'/>
          <button className='btn white-btn form-font' type='submit'><i className="fa-lg fa-sharp fa-solid fa-wand-sparkles" /></button>
        </div>
      </form>

    );
  }

}
