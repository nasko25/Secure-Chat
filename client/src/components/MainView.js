import React from 'react';
import MessagesView from "./Messages.js"
import ComposeView from "./ComposeView.js"
import "./index.css"

export default class MainView extends React.Component {

  // constructor to set up the state
  constructor(props) {
    super(props);
    // set the socket to the component's state
    this.state = {
      socket: props.socket
    };
  }

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

  /*
    It is used by MessagesView to redirect to /connection_interrupted if it cannot decrypt a message from the other client.
  */
  redirectToConnectionInterrupted() {
    this.props.history.push("/connection_interrupted");
  }

  componentDidMount() {
    // not working for 'back' button
    // is it even useful ?
    // https://github.com/zeit/next.js/issues/2694

    // Enable navigation prompt (if you enable it, don't forget to disable it in componentWillUnmount)
    // window.onbeforeunload = function() {
    //   return true;
    // };

    // get the connection information from the parent
    const connectionInformation = this.props.getConnectionInformation();

    // if connection information is not set, redirect the user to the homepage
    if (!connectionInformation)
      this.props.history.push("/");

    else {
      // set the connection properties to the component's state
      this.setState({
        key: connectionInformation.key,
        token: connectionInformation.token,
        iv: connectionInformation.iv
      });
      // set an interval to ping the server
      // in this way the server can keep track of
      // users that are disconnected and can update their sockets
      var pingServer = setInterval(() => {
        var socket = this.state.socket;
        socket.emit("pingServer", {
          token: connectionInformation.token
        });
      }, 2000);

      this.setState({
        pingServerInterval: pingServer
      });
    }

    this.state.socket.on("connectionClosed", () => {
      this.props.history.push("/connection_closed");
    });
  }

  render() {
    return (
      <div className = "mainView"> <meta name = "viewport" content = "width=device-width user-scalable=no"/> { /* a meta tag that prevents automatic zooming on mobile when users start typing a message */ }
        <MessagesView setParentReference = { this.addFunctionToState.bind(this) } encryptionKey = { this.state.key }
          token = { this.state.token } socket = { this.state.socket } iv = {this.state.iv}
          redirectToConnectionInterrupted = { this.redirectToConnectionInterrupted.bind(this) }/>

        <ComposeView getFunctionFromState = { this.getFunctionFromState.bind(this) } encryptionKey = { this.state.key}
          token = {this.state.token} socket = { this.state.socket } iv = {this.state.iv}/>
      </div>
    );
  };

  componentWillUnmount() {
    // Remove navigation prompt
    // window.onbeforeunload = null;

    clearInterval(this.state.pingServerInterval);
  }
}
