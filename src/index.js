import React from 'react';
import ReactDOM from 'react-dom';
import './components/index.css';
// import App from './App';
import * as serviceWorker from './serviceWorker';

import App from './components/App';



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
  <App />,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
