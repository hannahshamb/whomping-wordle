import React from 'react';
import { parseRoute, getDate, advanceDay, AppContext, clearGameStorage } from './lib';
import Home from './pages/home';
import PageContainer from './components/page-container';
import Navbar from './components/navbar';
import Game from './pages/game';
import NotFound from './pages/not-found';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

function isSameDay(dateObj, today) {
  return dateObj.month === today.month &&
    dateObj.date === today.date &&
    dateObj.year === today.year;
}

function parseSocketDate(currentDate) {
  const currentDateArray = currentDate.split(/[/,]/);
  return {
    month: currentDateArray[0],
    date: currentDateArray[1],
    year: currentDateArray[2]
  };
}

function isLocalHost() {
  return window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
}

export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      route: parseRoute(window.location.hash),
      today: getDate(),
      dayVersion: 0,
      userToken: null,
      user: null,
      countdownValue: '',
      midnightReached: false
    };
    this.socket = null;
    this.fastCountdownTimer = null;
    this.handleDayChange = this.handleDayChange.bind(this);
    this.simulateNextDay = this.simulateNextDay.bind(this);
    this.prepareMidnightRollover = this.prepareMidnightRollover.bind(this);
    this.completeMidnightTransition = this.completeMidnightTransition.bind(this);
    this.startMidnightCountdownTest = this.startMidnightCountdownTest.bind(this);
    this.handlePageClickAfterMidnight = this.handlePageClickAfterMidnight.bind(this);
  }

  prepareMidnightRollover() {
    clearGameStorage();
    this.setState(prevState => ({
      today: advanceDay(prevState.today),
      midnightReached: true,
      countdownValue: '00:00:00'
    }));
  }

  completeMidnightTransition() {
    if (!this.state.midnightReached) {
      return;
    }
    if (window.location.hash.includes('summary')) {
      window.history.replaceState({}, document.title, `${window.location.pathname}#play`);
    }
    clearGameStorage();
    this.setState(prevState => ({
      midnightReached: false,
      dayVersion: prevState.dayVersion + 1,
      countdownValue: ''
    }));
  }

  handlePageClickAfterMidnight() {
    this.completeMidnightTransition();
  }

  startMidnightCountdownTest(seconds = 10) {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    if (this.fastCountdownTimer) {
      clearInterval(this.fastCountdownTimer);
    }

    let remaining = seconds;
    const tick = () => {
      this.setState({
        countdownValue: `00:00:${String(remaining).padStart(2, '0')}`,
        midnightReached: false
      });
      if (remaining === 0) {
        clearInterval(this.fastCountdownTimer);
        this.fastCountdownTimer = null;
        this.prepareMidnightRollover();
        return;
      }
      remaining -= 1;
    };

    tick();
    this.fastCountdownTimer = setInterval(tick, 1000);
  }

  rollToNextDay() {
    clearGameStorage();
    this.setState(prevState => ({
      today: advanceDay(prevState.today),
      dayVersion: prevState.dayVersion + 1,
      midnightReached: false,
      countdownValue: ''
    }));
  }

  simulateNextDay() {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    this.rollToNextDay();
  }

  handleDayChange() {
    this.prepareMidnightRollover();
  }

  componentDidMount() {
    if (isLocalHost() &&
      new URLSearchParams(window.location.search).has('reset')) {
      clearGameStorage();
      fetch('/api/user-submissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: JSON.stringify(getDate()) })
      }).catch(() => {});
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }

    if (process.env.NODE_ENV === 'development' &&
      new URLSearchParams(window.location.search).has('nextDay')) {
      this.simulateNextDay();
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }

    const fastCountdownParam = new URLSearchParams(window.location.search).get('fastCountdown');
    if (process.env.NODE_ENV === 'development' && fastCountdownParam) {
      const seconds = Number(fastCountdownParam) || 10;
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      setTimeout(() => this.startMidnightCountdownTest(seconds), 500);
    }

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

    this.socket = io();

    this.socket.on('countdownUpdate', data => {
      const { countdownValue, currentDate } = data;
      if (this.fastCountdownTimer) {
        return;
      }

      const currentDateObj = parseSocketDate(currentDate);
      this.setState(prevState => {
        const nextState = { countdownValue };
        const dayChanged = !isSameDay(currentDateObj, prevState.today);
        if (countdownValue === '00:00:00' || dayChanged) {
          clearGameStorage();
          let nextToday = dayChanged ? currentDateObj : getDate();
          if (isSameDay(nextToday, prevState.today)) {
            nextToday = advanceDay(prevState.today);
          }
          nextState.today = nextToday;
          nextState.midnightReached = true;
          nextState.countdownValue = '00:00:00';
        }
        return nextState;
      });
    });

    this.socket.on('countdownEnd', () => {
      this.handleDayChange();
    });

    window.addEventListener('hashchange', this.onHashChange);
  }

  componentWillUnmount() {
    if (this.fastCountdownTimer) {
      clearInterval(this.fastCountdownTimer);
    }
    if (this.socket) {
      this.socket.disconnect();
    }
    window.removeEventListener('hashchange', this.onHashChange);
  }

  onHashChange = () => {
    if (this.state.midnightReached) {
      this.completeMidnightTransition();
    }
    this.setState({ route: parseRoute(window.location.hash) });
  };

  renderPage() {
    const { route, dayVersion } = this.state;

    if (route.path === '') {
      return <Home />;
    }
    if (route.path === 'play') {
      return <Game key={dayVersion} />;
    }
    return <NotFound />;
  }

  render() {
    const { today, user, countdownValue, midnightReached } = this.state;
    const contextValue = {
      today,
      user,
      countdownValue,
      midnightReached,
      simulateNextDay: this.simulateNextDay,
      startMidnightCountdownTest: this.startMidnightCountdownTest,
      completeMidnightTransition: this.completeMidnightTransition
    };

    return (
      <AppContext.Provider value={contextValue}>
        <div onClickCapture={midnightReached ? this.handlePageClickAfterMidnight : undefined}>
          <Navbar />
          <PageContainer>
            { this.renderPage() }
          </PageContainer>
        </div>
      </AppContext.Provider>
    );
  }
}
