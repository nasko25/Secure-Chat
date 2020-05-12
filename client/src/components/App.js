import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  withRouter
} from "react-router-dom";
import MainView from "./MainView.js"
import './index.css'


// TODO https://reacttraining.com/react-router/web/example/query-parameters     query parameters (chat id will be a parameter)
export default function App() {
  const InitilizeConnectionWithRouter =  withRouter(InitilizeConnection);
  return (
    <Router>
      <Switch>
        <Route exact path = "/">
          <InitilizeConnectionWithRouter/>
        </Route>
        <Route path = "/chat">
          <MainView />
        </Route>
      </Switch>
    </Router>
  );
}

class InitilizeConnection extends React.Component {
  state = {
    data: null
  };

  initiateConnection = (to, event)=> {

    // TODO id instead of class?
    document.getElementsByClassName("readyLink")[0].style.display = "none";
    document.getElementById("load").style.display = "inline-block";

    event.preventDefault();
    setTimeout(()=>this.props.history.push(to), 5000);
  }

  componentDidMount() {
    this.callApi()
      .then(res => this.setState({ data: res.api }))
      .catch(err => console.log(err));
  }

  callApi = async () => {
    const response = await fetch("/api");
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message);
    }

    return body;
  }

  render() {
    return (
      <div className = "indexPage mainView">
        <div className="box">
          <input type="input" className="secretField" placeholder="Secret" name="secret" id='secret'/>
          <label htmlFor="secret" className="secretLabel">Secret</label>

          <div className="readyBtn">
            <Link className="readyLink" to = "chat" onClick={(event) => this.initiateConnection({ pathname: `chat`, /* hash: `#hash`, */ }, event)}> Ready </Link>
            <div className="loader" id = "load"><div></div><div></div><div></div><div></div></div>
          </div>
        </div>

        <p> Data from the api: {this.state.data} </p>
      </div>
    );
  }
}
