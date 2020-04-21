import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

class MainView extends React.Component {
  render() {
    return (
      <div className = "mainView">
        <MessageView/>
        <ComposeView/>
      </div>
    );
  };
}

class MessageView extends React.Component {
  render() {
    return (
      <div> This is the messages view </div>
    );
  };
}

class ComposeView extends React.Component {
  render() {
    return (
      <div className = "compose">
        <input
         type="text"
         className="input"
         placeholder="Message"
       />
        <SendButton />
      </div>
    );
  };
}

class SendButton extends React.Component {
  render() {
    return (
      <button className = "send">
        <i className="material-icons center">send</i>
      </button>
    );
  };
}


// ============================================

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// );

ReactDOM.render(
  <MainView />,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
