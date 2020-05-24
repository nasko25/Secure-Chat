import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  withRouter
} from "react-router-dom";
import MainView from "./MainView.js"
import InvalidToken from "./InvalidToken.js"
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
        <Route path = "/invalid_token">
          <InvalidToken />
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
    setTimeout(()=> {
      let query = new URLSearchParams(this.props.location.search);
      let secret = document.getElementById("secret").value;
      this.publicKeyExchange(this.state.pub, query.get("token"), secret).catch(err => {
          console.log(err);
          this.props.history.push("/invalid_token");
        });

      // TODO open socket here and wait for the other client to also join

      this.props.history.push(to)
    }, 5000);
  }

  componentDidMount() {
    // canceled in componentWillUnmount to prevent memory leak
    const apiTestPromise = makeCancelable(this.callApi());
    this.setState({apiTestPromise: apiTestPromise});
    apiTestPromise
      .promise
      .then(res => this.setState({ data: res.api }))
      .catch(err => console.log(err));

    let query = new URLSearchParams(this.props.location.search);
    const token = query.get("token");

    if (token) {
      // there is already a token set
      this.verifyToken(token)
        .then(res => console.log(res))
        .catch(err => {
          console.log(err);
          this.props.history.push("/invalid_token");
        });
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

    // make a promise for the generation of the rsa keys
    let promise = new Promise(function(resolve, reject) {
      rsa.generateKeyPair({bits: 2048, workers: -1}, (err, keypair) => {

        // some quick api tests
        let a = keypair.publicKey.encrypt("asdf")
        let b = forge.pki.publicKeyFromPem(forge.pki.publicKeyToPem(keypair.publicKey)).encrypt("asdf")
        console.log(keypair.privateKey.decrypt(a));
        console.log(keypair.privateKey.decrypt(b));

        resolve(keypair);

        reject("promise not fullfilled");
      })
    })

    // make the promise cancalable (so it will be canceled if the token is invalid as the page does not need to load in this case)
    const generateRsaPromise = makeCancelable(promise);
    this.setState({ generateRsaPromise: generateRsaPromise});
    generateRsaPromise
      .promise
      .then(keypair => {
        this.setState({ priv: keypair.privateKey});
        this.setState({ pub: forge.pki.publicKeyToPem(keypair.publicKey)});
      })
      .catch(err => console.log(err));

    // this.setState({dh: crypto.createDiffieHellman(1024)});
  }

  // generateRsa = async () => {
  //   var rsa = forge.pki.rsa;
  //   rsa.generateKeyPair({bits: 2048, workers: -1}, (err, keypair) => {

  //     // some quick api tests
  //     let a = keypair.publicKey.encrypt("asdf")
  //     let b = forge.pki.publicKeyFromPem(forge.pki.publicKeyToPem(keypair.publicKey)).encrypt("asdf")
  //     console.log(keypair.privateKey.decrypt(a));
  //     console.log(keypair.privateKey.decrypt(b));

  //     this.setState({ priv: keypair.privateKey});
  //     this.setState({ pub: forge.pki.publicKeyToPem(keypair.publicKey)});
  //   })
  // }

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

  publicKeyExchange = async (publicKey, token, secret) => {
    const  requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' , 'Connection': 'close'},
      body: JSON.stringify({ publicKey: publicKey, token: token, secret: secret })
    }

    const response = await fetch('/send_key', requestOptions);
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

  componentWillUnmount() {
    if (this.state.apiTestPromise)
      this.state.apiTestPromise.cancel();

    if (this.state.generateRsaPromise)
      this.state.generateRsaPromise.cancel();
  }
}

function makeCancelable(promise) {
  if (promise) {
    let hasCanceled_ = false;

    const wrappedPromise = new Promise((resolve, reject) => {
      promise.then(
        val => hasCanceled_ ? reject({isCanceled: true}) : resolve(val),
        error => hasCanceled_ ? reject({isCanceled: true}) : reject(error)
      );
    });

    return {
      promise: wrappedPromise,
      cancel() {
        hasCanceled_ = true;
      },
    };
  }
};
