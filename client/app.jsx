import React from 'react';
import { parseRoute, getDate, AppContext } from './lib';
import Home from './pages/home';
import PageContainer from './components/page-container';
import Navbar from './components/navbar';
import Game from './pages/game';
import NotFound from './pages/not-found';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      route: parseRoute(window.location.hash),
      today: getDate(),
      userToken: null,
      user: null
    };
  }

  componentDidMount() {

    let userToken = localStorage.getItem('userToken');
    if (!userToken) {
      userToken = uuidv4();
      localStorage.setItem('userToken', userToken);
      this.setState({ userToken });
    }
    if (this.state.userToken === null) {
      this.setState({ userToken });
    }

    const body = { userToken };
    const req = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    };

    fetch('/api/users', req)
      .then(res => res.json())
      .then(result => {
        const user = result;
        this.setState({ user });
      });

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
    const { today, user } = this.state;
    const contextValue = { today, user };
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
