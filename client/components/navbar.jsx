import React from 'react';

export default class Navbar extends React.Component {

  render() {

    const navStyle = {
      color: 'white',
      backgroundColor: '#6e85b2'
    };

    return (
      <nav className="navbar sticky-top" style={navStyle}>
        <div className="container d-flex justify-content-center">
          <a className='navbar-brand' href='#'>
            <img src='../imgs/Whomping Wordle.png' alt='Whomping Wordle' />
          </a>
        </div>
      </nav>
    );
  }

}
