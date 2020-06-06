import React from 'react';
import forge from "node-forge";

export default class ComposeView extends React.Component {
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
      // get the socket from the props
      var socket = this.props.socket;


      // get the encryption key and the iv from the parameters passed from the parent component to encrypt the message to the other client
      // the encryption key was converted to a hex string representation, so now it should be converted to a byte representation
      var key = forge.util.hexToBytes(this.props.encryptionKey); console.log("key length:",key.length, key, this.props.encryptionKey)
      var iv = this.props.iv;

      // encrypt the key
      var cipher = forge.cipher.createCipher('AES-CBC', key);
      cipher.start({iv: iv});
      var unencrypted = messageToAdd["messageId"].message
      cipher.update(forge.util.createBuffer(unencrypted));
      cipher.finish();
      var encrypted = cipher.output;
      messageToAdd["messageId"].message = encrypted.toHex();
      // send the encrypted message to the server, so the server can transmit it to the other client
      socket.emit("message", {
        message: messageToAdd["messageId"],
        token: this.props.token
      });

      // set the message to plaintext again so it can be displayed in the user's browser
      messageToAdd["messageId"].message = unencrypted;

      // add the message to the view
      addMessageToView(messageToAdd);

      // clear the input
      document.getElementsByClassName("input")[0].value = "";

      // auto scroll when a new message is added to the view
      // TODO don't scroll if user has scrolled up
      // TODO this looks like a hacky solution ?
      setTimeout(function() {
        // TODO make it an id?
        var scrollView = document.getElementsByClassName("messagesView")[0];
        scrollView.scrollTop = scrollView.scrollHeight;
      }, 100);
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
