import React from 'react';
import MessagesView from "./Messages.js"
import ComposeView from "./ComposeView.js"
import "../index.css"

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

  render() {
    return (
      <div className = "mainView">
        <MessagesView setParentReference = { this.addFunctionToState.bind(this) }/>
        <ComposeView getFunctionFromState = { this.getFunctionFromState.bind(this) }/>
      </div>
    );
  };
}
