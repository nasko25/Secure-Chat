import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
import { Route, IndexRoute } from 'react-router';
import * as serviceWorker from './serviceWorker';
import MainView from "./components/MainView.js"

class InitilizeConnection extends React.Component {
  render() {
    return (
      <p> Index page. </p>
    );
  }
}

// TODO unit tests?
// TODO make a css file for each component instead of having one index.css?
// ============================================

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// );

ReactDOM.render(
  // <MainView />,
  <InitilizeConnection />,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
