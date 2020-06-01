import React from 'react';
import MessagesView from "./Messages.js"
import ComposeView from "./ComposeView.js"
import "./index.css"

export default class MainView extends React.Component {
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

    const connectionInformation = this.props.getConnectionInformation();

    // TODO:
    // if connection information is not set, redirect the user to the homepage
    if (!connectionInformation)
      this.props.history.push("/");

    // reopen the closed socket
    var socket = this.props.socket;
    socket.open();

    var data = this.props.getConnectionInformation();

    this.setState({
      key: data.key,
      token: data.token
    });
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
