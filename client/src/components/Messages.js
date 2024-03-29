import React, { useState } from 'react';
import forge from "node-forge";
import AsciiImage from "./AsciiImage.js";
import { fromBase64 } from "./util.js";

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
      messagesJson: { }
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
    var { messagesJson } = this.state;

    // list of messages to return
    var messages = [];
    for (var message in messagesJson) {
      var time = messagesJson[message].time;
      // if time is a not Dates object (happens for not "mine" messages)
      if (!(time instanceof Date)) {
        // then time will be an ISO string, so it has to be converted to a Date object
        time = new Date(time);
      }
      var hours = time.getHours();
      var minutes = time.getMinutes();
      // add a leading 0 if hours < 10 and if minutes < 10
      if (hours < 10) {
        hours = "0" + hours;
      }
      if (minutes < 10) {
        minutes = "0" + minutes;
      }
      // change the time to a HH:MM format string
      time = hours + ":" + minutes;

      messages.push(
        <Message
          key = { message }
          message = { messagesJson[message].message }
          mine = { messagesJson[message].mine }
          time = { time }
        />
      );
    }
    return messages;
  }

  componentDidMount() {

    this.handler = (event) => {
        var messageToAdd = event.detail.messageToAdd;
        var nextId;
        // messageToAdd's id must be unique and follow the order of the this.state.messagesJson object's keys
        // if the messagesJson object has less than 1 element, set the id of the next message to 1 (it will be the initial message)
        if (Object.keys(this.state.messagesJson).length < 1) {
          nextId = 1;
        } // otherwise set the id to the biggest index in the object + 1
        else {
                        // get the key of the object with the highest key                                           and increment it
          nextId = parseInt(Object.keys(this.state.messagesJson).reduce((a, b) => messageToAdd[a] > messageToAdd[b] ? a : b)) + 1;
        }

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
          try {
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
            var result = decipher.finish();
            // if there was a problem with the decrypting
            if (!result) {
              console.error("There was an error with decrypting");
              this.props.redirectToConnectionInterrupted();
            }
            data.message.message = fromBase64(decipher.output.data);
            // add the message received from the server to the view
            this.addMessageToView({
              "messageId": data.message
            });

            // autoscroll if the user has not manually scrolled up
            setTimeout(function() {
              var scrollView = document.getElementById("messagesView");

              // if the client has not scrolled up, autoscroll is activated
              if (Math.abs(scrollView.scrollTop - scrollView.scrollHeight) <= (scrollView.clientHeight + 44.5)) {   // 44.5 can be replaced with (document.getElementsByClassName("compose")[0].clientHeight)
                scrollView.scrollTop = scrollView.scrollHeight;
              }
            }, 100);
          }
          catch(err) {
            console.error("There was an error with decrypting");
            console.error(err);
            this.props.redirectToConnectionInterrupted();
          }
        }
      });
    }
  }

  // font-family: "Courier New", Courier, monospace;
  render() {
    return (
      <div id = "messagesView">
        <div style = {{textAlign: "center", fontFamily: "Courier" }}>
          <AsciiImage/>
        </div>
        { this.renderAllMessages() }
      </div>
    );
  };

  componentWillUnmount() {
      document.removeEventListener("newMessage", this.handler);
  }
}

function Message(props) {
    const [isShown, setIsShown] = useState(false);

    return (
      <div className = "messageContiner">
        { /* if the message is mine and you hover over it, display the time before the message (to the left of the message) */ }
        { props.mine && isShown && (
          <span className = "beforeMessage"> { props.time } </span>
        ) }
                  {/* if the message is "mine" add the "mine" class;  if it is both "mine" and the time should be shown, change the margin to be fixed */}
        <div className = {`message${ props.mine ? ' mine' : '' }${ (props.mine && isShown) ? ' fixedMargin' : ''}`}
          onMouseEnter={() => setIsShown(true)}
          onMouseLeave={() => setIsShown(false)}
        >
          { props.message }
        </div>
        { /* if the message is NOT mine and you hover over it, display the time after the message (to the right of the message) */ }
        { !props.mine && isShown && (
          <span className = "afterMessage"> { props.time } </span>
        ) }
      </div>
    );
}

// export { MessagesView, Message }
