import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

class MainView extends React.Component {
  /*
    The child component MessagesView will get access to this function, so that the child component can
    give access to its addMessageToView() method to the parent MainView.
    This access will later be retrieved from the state of the MainView and given to the other child of MainView,
    namely ComposeView, so that the ComposeView can directly call the MessagesView's method addMessageToView().
  */
  addFunctionToState(func) {
    this.addMessageToView = func;
  }

  /*
    It is used to get access to the addMessageToView() method that is originally in the MessagesView component.
  */
  getFunctionFromState() {
    return this.addMessageToView;
  }

  render() {
    return (
      <div className = "mainView">
        <MessagesView setParentReference = { this.addFunctionToState.bind(this) }/>
        <ComposeView getFunctionFromState = { this.getFunctionFromState.bind(this) }/>
      </div>
    );
  };
}

/*
 * move the state to the parent MainView to be able to pass a addMessageToView() function
 * to the send button.
 * OR use react-redux to store the state of MessagesView ?
 * OR give a reference to the addMessageToView() method inside of the MessagesView component
 * to the parent component so that the parent can give this reference to the other child component ?
  I went with the last approach. Might need to refactor later.
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

    props.setParentReference(this.addMessageToView);
  }

  addMessageToView(messageToAdd) {
    var event = new CustomEvent("newMessage", { detail: { messageToAdd: messageToAdd }});

    // trigger the event
    document.dispatchEvent(event);
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

    var handler = (event) => {
        var messageToAdd = event.detail.messageToAdd;
        // messageToAdd's id must be unique and follow the order of the this.state.messagesJson object's keys
                      // get the key of the object with the highest key
        var nextId = parseInt(Object.keys(this.state.messagesJson).reduce((a, b) => messageToAdd[a] > messageToAdd[b] ? a : b)) + 1;   // TODO is it unique?

        // change the old "messageId" key to be nextId, so that the id is a unique number and can be displayed
        if ("messageId" !== nextId) {
            Object.defineProperty(messageToAdd, nextId,
                Object.getOwnPropertyDescriptor(messageToAdd, "messageId"));
            delete messageToAdd["messageId"];
        }
        this.setState({messagesJson: {...this.state.messagesJson, ...messageToAdd}});
    };

    // is this allowed when using react?
    document.addEventListener("newMessage", handler);

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

class ComposeView extends React.Component {
  sendMessage = (event) => {
    var addMessageToView = this.props.getFunctionFromState();
    // TODO make the "input" class an id?
    var message = document.getElementsByClassName("input")[0].value;
    if (message === null || message === "") {
      return;
    }
    var messageToAdd = {
      "messageId": {
        message: message,
        mine: true,
        time: new Date()
      }
    };

    if(event.key === "Enter" || event.type === "click") {
      addMessageToView(messageToAdd);
      // clear the input
      document.getElementsByClassName("input")[0].value = "";
      // TODO make it an id?
      // var scrollView = document.getElementsByClassName("messagesView")[0];
      // scrollView.scrollTop = scrollView.scrollHeight;
    }
  }

  render() {

    return (
      <div className = "compose">
        <input
         type="text"
         className="input"
         placeholder="Message"
         onKeyDown={this.sendMessage}
       />
        <SendButton sendMessage = {this.sendMessage}/>
      </div>
    );
  };
}

class SendButton extends React.Component {
  constructor(props) {
    super(props);
    this.sendMessage = props.sendMessage;
  }

  // TODO https://stackoverflow.com/questions/53597482/setstate-outside-component
  render() {
    return (
      <button className = "send" onClick = {this.sendMessage}>
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
