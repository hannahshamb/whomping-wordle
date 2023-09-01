import React from 'react';
import { parseRoute, getDate, AppContext } from './lib';
import Home from './pages/home';
import PageContainer from './components/page-container';
import Navbar from './components/navbar';
import Game from './pages/game';
import NotFound from './pages/not-found';
import io from 'socket.io-client';

export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      route: parseRoute(window.location.hash),
      today: getDate()
    };
  }

  componentDidMount() {

    const socket = io();
    socket.on('countdownUpdate', data => {
      const { countdownValue } = data;
      if (countdownValue === '00:00:00') {
        window.location.hash = '';
        this.setState({ today: getDate() });
      }

    });

    onhashchange = event => {
      this.setState({ route: parseRoute(window.location.hash) });
    };

  }

  renderPage() {
    const { route } = this.state;

    if (route.path === '') {
      return <Home />;
    }
    if (route.path === 'play') {
      return <Game />;
    }
    return <NotFound />;
  }

  render() {
    const { today } = this.state;
    const contextValue = { today };
    return (
      <AppContext.Provider value={contextValue}>
        <Navbar />
        <PageContainer>
          { this.renderPage() }
        </PageContainer>
      </AppContext.Provider>
    );
  }
}
