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

/* TODO move the state to the parent MainView to be able to pass a addMessageToView() function
 * to the send button.
 * OR use react-redux to store the state of MessagesView ?
*/
class MessagesView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messagesJson: {
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
      }
    };
  }

  renderAllMessages() {
    // TODO server does not keep a list of messages though
    var { messagesJson } = this.state;

    // list of messages to return
    var messages = [];
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

  componentDidMount() {
    // TODO ajax - https://reactjs.org/docs/faq-ajax.html
    var newMessage = {
      5: {
        message: "my new message",
        mine: true,
        time: new Date(Date.UTC(2010, 0, 1, 12, 12, 14))
      }
    };
    setTimeout(
        function() {
            this.setState({messagesJson: {...this.state.messagesJson, ...newMessage}});
        }
        .bind(this),
        3000
    );
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
  // TODO https://stackoverflow.com/questions/53597482/setstate-outside-component
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
