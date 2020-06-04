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

  componentDidMount() {
    // TODO not working for 'back' button
    // TODO is it even useful ?
    // https://github.com/zeit/next.js/issues/2694

    // Enable navigation prompt
    // TODO if you decide to add it, properly remove the event handler in componentWillUnmount
    // window.onbeforeunload = function() {
    //   return true;
    // };

    // Remove navigation prompt
    // window.onbeforeunload = null;

    // get the connection information from the parent
    const connectionInformation = this.props.getConnectionInformation();

    // if connection information is not set, redirect the user to the homepage
    if (!connectionInformation)
      this.props.history.push("/");

    else {
      // set the connection properties to the component's state
      this.setState({
        key: connectionInformation.key,
        token: connectionInformation.token
      });
    }
  }

  render() {
    return (
      <div className = "mainView">
        <MessagesView setParentReference = { this.addFunctionToState.bind(this) } encryptionKey = { this.state.key } token = { this.state.token } socket = { this.state.socket }/>
        <ComposeView getFunctionFromState = { this.getFunctionFromState.bind(this) } encryptionKey = { this.state.key} token = {this.state.token} socket = { this.state.socket }/>
      </div>
    );
  };
}
