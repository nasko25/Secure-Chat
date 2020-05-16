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
import forge from "node-forge"


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

    let query = new URLSearchParams(this.props.location.search);
    const token = query.get("token");

    if (token) {
      // there is already a token set
      this.verifyToken(token).then(res => console.log(res)).catch(err => console.log(err));

    }
    else {
      this.getToken()
        .then(res => {
          let newToken = res;
          this.props.history.push({
            pathname: '/',
            search: `?token=${newToken}`,
            // state: {token: "do i need a state?"}
          });
        })
        .catch(err => console.log(err));
    }

    var rsa = forge.pki.rsa;

    rsa.generateKeyPair({bits: 2048, workers: -1}, (err, keypair) => {

      // some quick api tests
      let a = keypair.publicKey.encrypt("asdf")
      let b = forge.pki.publicKeyFromPem(forge.pki.publicKeyToPem(keypair.publicKey)).encrypt("asdf")
      console.log(keypair.privateKey.decrypt(a));
      console.log(keypair.privateKey.decrypt(b));

      this.setState({ priv: keypair.privateKey});
      this.setState({ pub: forge.pki.publicKeyToPem(keypair.publicKey)});
    });

    // this.setState({dh: crypto.createDiffieHellman(1024)});
  }

  verifyToken = async (token) => {
    // TODO verify that it is a real token
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' , 'Connection': 'close'},
      body: JSON.stringify({ token: token })
    };

    const response = await fetch('/verify_token', requestOptions);
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message);
    }

    return body;
  }

  // TODO code duplication!
  getToken = async () => {
    const response = await fetch("/generate_token");
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message);
    }

    return body.token;
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
        <p> Testing rsa: {this.state.pub} </p>
      </div>
    );
  }
}
