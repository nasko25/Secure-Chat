import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

class MainView extends React.Component {
  render() {
    return (
      <div className = "mainView">
        <MessagesView/>
        <ComposeView/>
      </div>
    );
  };
}

class MessagesView extends React.Component {

  renderAllMessages() {
    // TODO server does not keep a list of messages though
    var messagesJson = {
      1: {
        message: "This is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a messageThis is a message",
        mine: true,
        time: new Date(Date.UTC(2010, 0, 1, 12, 12, 12))
      },
      2: {
        message: "hey",
        mine: false,
        time: new Date(Date.UTC(2010, 0, 1, 12, 12, 14))
      },
      3: {
        message: "message",
        mine: false,
        time: new Date(Date.UTC(2010, 0, 1, 12, 12, 14))
      },
      4: {
        message: "nice",
        mine: true,
        time: new Date(Date.UTC(2010, 0, 1, 12, 12, 14))
      }
    };


    var messages = []
    for (var message in messagesJson) {
      messages.push(
        <Message
          key = { message }
          message = { messagesJson[message].message }
          mine = { messagesJson[message].mine }
        />
      );
    }
    return messages;
  }

  render() {
    return (
      <div className = "messagesView">
        { this.renderAllMessages() }
      </div>
    );
  };
}

function Message(props) {
    // TODO also css classes for start and end sequence of messages?
    return (
      <div className = "messageContiner">
        <div className = {`message${ props.mine ? ' mine' : '' }`}>
          { props.message }
        </div>
      </div>
    );
}

function addMessageToView() {
  // TODO
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
