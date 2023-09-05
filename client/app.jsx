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
      const { countdownValue, currentDate } = data;
      const currentDateArray = currentDate.split(/[/,]/);
      const currentDateObj = {
        month: currentDateArray[0],
        date: currentDateArray[1],
        year: currentDateArray[2]
      };
      let isToday = true;
      for (const key in currentDateObj) {
        if (currentDateObj[key] !== this.state.today[key]) {
          isToday = false;
        }
      }
      if (countdownValue === '00:00:00' || !isToday) {
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
