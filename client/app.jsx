import React from 'react';
import Home from './pages/home';
import PageContainer from './components/page-container';

export default class App extends React.Component {
  render() {
    return (
      <PageContainer>
        <Home />
      </PageContainer>
    );
  }
}
