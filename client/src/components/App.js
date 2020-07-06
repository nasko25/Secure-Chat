import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  withRouter
} from "react-router-dom";
import InitilizeConnection from "./InitilizeConnection.js";
import MainView from "./MainView.js";
import InvalidToken from "./InvalidToken.js";
import NotFound from "./NotFound.js";
import ConnectionClosed from "./ConnectionClosed.js";
import './index.css';
import io from 'socket.io-client';

// TODO might put them in separate modules or one separate module
const socket = io();

const MainViewWithRouter = withRouter(MainView);                // TODO do the same for InitilizeConnection, when you put it in a separate module

export default class App extends React.Component {
  // constructor to set up the state
  constructor(props) {
    super(props);

    const InitilizeConnectionWithRouter =  withRouter(InitilizeConnection);

    this.state = {
      InitilizeConnectionWithRouter: InitilizeConnectionWithRouter
    };
  }

  /*
    This method is used to set information like connection token,
    the encryption key that the parties agreed on (and maybe later the
    public and private keys) for the connection initilized
    by the class InitilizeConnection.
  */
  setConnectionInformation(data) {
    this.connectionInformation = data;
  }

  /*
    Retrieve the connection information that was set in the
    method above.
  */
  getConnectionInformation() {
    return this.connectionInformation;
  }

  // The App component manages all available paths and displays the appropriate components
  render() {
    const InitilizeConnectionWithRouter = this.state.InitilizeConnectionWithRouter;

    return (
      <Router>
        <Switch>
          <Route exact path = "/">
            <InitilizeConnectionWithRouter socket = {socket} setParentLink = {this.setConnectionInformation.bind(this)} />
          </Route>
          <Route path = "/chat">
            <MainViewWithRouter socket = {socket} getConnectionInformation = {this.getConnectionInformation.bind(this)}/>
          </Route>
          <Route path = "/invalid_token">
            <InvalidToken />
          </Route>
          <Route path = "/connection_closed">
            <ConnectionClosed />
          </Route>
          <Route path = "/not_found">
            <NotFound />
          </Route>
          { /* Default path, if the path does not match anything from the specified above */ }
          <Redirect to = "/not_found" />
        </Switch>
      </Router>
    );
  }

  componentWillUnmount() {
    // close the socket
    socket.close();
  }
}
