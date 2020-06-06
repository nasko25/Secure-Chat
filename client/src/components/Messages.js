import React from 'react';
import forge from "node-forge";

/*
 * move the state to the parent MainView to be able to pass a addMessageToView() function
 * to the send button.
 * OR use react-redux to store the state of MessagesView ?
 * OR give a reference to the addMessageToView() method inside of the MessagesView component
 * to the parent component so that the parent can give this reference to the other child component ?
  I went with the last approach. Might need to refactor later.
*/
export default class MessagesView extends React.Component {
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

  /*
    Adds a messageToAdd to the view.
    Note that the messageToAdd is expected to be an object with the following format:

    {
      "messageId" : {
        message: "some message",
        mine: true/false,
        time: *a Date object indicating when the message was created*
      }
    }

    "messageId" is indeed a string used as the key for the actual message that will be added to the
    messages view.
  */
  addMessageToView(messageToAdd) {
    var event = new CustomEvent("newMessage", { detail: { messageToAdd: messageToAdd }});

    // trigger the "newMessage" event
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

    this.handler = (event) => {
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
    document.addEventListener("newMessage", this.handler);

    this.timeout = setTimeout(
        function() {
            this.setState({messagesJson: {...this.state.messagesJson, ...newMessage}});
        }
        .bind(this),
        3000
    );

    // get the socket from props
    var socket = this.props.socket;

    // if the socket was passed from the parent component
    if (socket) {
      // handle received messages
      socket.on("message", (data) => {
        // get the encryption key
        var encryptionKey = this.props.encryptionKey;
        // if the encryption key was set
        if (encryptionKey) {
          // get the encryption key and the iv from the parameters passed from the parent component to encrypt the message to the other client
          // the encryption key was converted to a hex string representation, so now it should be converted to a byte representation
          var key = forge.util.hexToBytes(encryptionKey);
          var iv = this.props.iv;

          // get the byte representation of the message from its receieved hex representation
          var encrypted = data.message.message;
          // decipher the message
          var decipher = forge.cipher.createDecipher('AES-CBC', key);
          decipher.start({iv: iv});console.log(encrypted)
          decipher.update(forge.util.createBuffer(forge.util.hexToBytes(encrypted)));
          var result = decipher.finish();console.log(decipher.output.data)
          data.message.message = decipher.output.data;
          // add the message received from the server to the view
          this.addMessageToView({
            "messageId": data.message
          });
        }
      });
    }
  }

  render() {
    return (
      <div className = "messagesView">
        { this.renderAllMessages() }
      </div>
    );
  };

  componentWillUnmount() {
      document.removeEventListener("newMessage", this.handler);

      clearTimeout(this.timeout);
  }
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

// export { MessagesView, Message }
