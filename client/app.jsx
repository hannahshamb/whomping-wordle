import React from 'react';
import { parseRoute } from './lib';
import Home from './pages/home';
import PageContainer from './components/page-container';
import Navbar from './components/navbar';
import Game from './pages/game';
import NotFound from './pages/not-found';
export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      route: parseRoute(window.location.hash)
    };
  }

  componentDidMount() {
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
    return (
      <>
        <Navbar />
        <PageContainer>
          { this.renderPage() }
        </PageContainer>
      </>
    );
  }
}
