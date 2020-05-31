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
import io from 'socket.io-client';
import crypto from 'crypto'


export default class App extends React.Component {
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

  render() {
    const InitilizeConnectionWithRouter =  withRouter(InitilizeConnection);

    const socket = io();

    return (
      <Router>
        <Switch>
          <Route exact path = "/">
            <InitilizeConnectionWithRouter socket = {socket} setParentLink = {this.setConnectionInformation.bind(this)} />
          </Route>
          <Route path = "/chat">
            <MainView socket = {socket} getConnectionInformation = {this.getConnectionInformation.bind(this)}/>
          </Route>
          <Route path = "/invalid_token">
            <InvalidToken />
          </Route>
        </Switch>
      </Router>
    );
  }
}

class InitilizeConnection extends React.Component {
  state = {
    // data: null,
    // assume that you are the initiator until the token is checked to be valid from the server
    initiator: true
  };

  initiateConnection = (to, event)=> {

    // TODO id instead of class?
    document.getElementsByClassName("readyLink")[0].style.display = "none";
    document.getElementById("load").style.display = "inline-block";

    event.preventDefault();


    this.getToken()
      .then(res => {
        let newToken = res;
        this.props.history.push({
          pathname: '/',
          search: `?token=${newToken}`,
          // state: {token: "do i need a state?"}
        });

        // setTimeout(()=> {
        //   let query = new URLSearchParams(this.props.location.search);
        //   let secret = document.getElementById("secret").value;
        //   this.publicKeyExchange(this.state.pub, query.get("token"), secret).catch(err => {
        //       console.log(err);
        //       this.props.history.push("/invalid_token");
        //     });

        //   // TODO open socket here and wait for the other client to also join

        //   this.props.history.push(to)
        // }, 5000);

        var socket = this.props.socket;

        const query = new URLSearchParams(this.props.location.search);
        const token = query.get("token");
        const secret = document.getElementById("secret").value;

        var md = forge.md.sha1.create();
        md.update(secret, 'utf8');

        // TODO set a small timeout/interval(with while loop) to be sure that the public key is already set
        socket.emit("clientConnected", {
          token: token,
          publicKey: this.state.pub,
          secret: this.state.priv.sign(md),
          plainTextSecret: secret
        });

        socket.on("invalidToken", () => {
          this.props.history.push("/invalid_token");
        });

        socket.on("clientConnected", () => {
          this.props.history.push(to)
        });

        socket.on("client2Information", (data) => {
          this.setState({otherClientPublicKeyPem: data.publicKey});

          // TODO make it a promise and cancel it on componentWillUnmount ? (can it lead to a memory leak?)
          // generate the first part of the encryption key
          crypto.randomBytes(24, (err, buffer) => {
            if (err) {
              console.log(err);
            }

            if (buffer) {
              var key = buffer.toString('hex');
              var publicKey = forge.pki.publicKeyFromPem(data.publicKey);

              this.setState({encryptionKeyFirstHalf: key});

              console.log("my (first) half:", key);

              socket.emit("firstHalfKey", {
                key: publicKey.encrypt(key),
                token: token
              });
            }
          });
        });

        socket.on("secondHalfKey", (data) => {
          var key = this.state.priv.decrypt(data.key);

          this.setState({encryptionKeySecondHalf: key});

          console.log("second half received:", key);
        });

      })
      .catch(err => console.log(err));
  }

  secondClientConnect = () => {

    // document.getElementsByClassName("readyLink")[0].style.display = "none";
    // document.getElementById("load").style.display = "inline-block";

    var socket = this.props.socket;

    const query = new URLSearchParams(this.props.location.search);
    const token = query.get("token");

    socket.emit("clientConnected", {
      token: token,
      publicKey: this.state.pub,
    });

    socket.on("client1Information", (data) => {
      var md = forge.md.sha1.create();
      md.update(data.plainTextSecret, 'utf8');

      try {
        // if the key matches the signed key
        if (forge.pki.publicKeyFromPem(data.publicKey).verify(md.digest().bytes(), data.secret)) {
          // set the this.state.secret
          this.setState({secret: data.plainTextSecret});

          // set the this.state.otherClientPublicKeyPem with the public key of client 1
          this.setState({otherClientPublicKeyPem: data.publicKey});
        } else {           // redirect if the signed secret and plain secret do not match
          this.props.history.push("/connection_interrupted");
        }
      } catch(err) {
        this.props.history.push("/connection_interrupted");
      }
    });

    // receive the generated half of the key from the other client
    socket.on("firstHalfKey", (data) => {
      var key = this.state.priv.decrypt(data.key);

      this.setState({encryptionKeyFirstHalf: key});
      console.log("first half received:", key);
    });
  }

  secondClientApprove = (to, event) => {
    var socket = this.props.socket;

    const query = new URLSearchParams(this.props.location.search);
    const token = query.get("token");

    event.preventDefault();

    // TODO make it a promise and cancel it on componentWillUnmount ? (can it lead to a memory leak?)
    // generate a random encryption key
    crypto.randomBytes(24, (err, buffer) => {
      if (err) {
        console.log(err);
      }

      if (buffer) {
        var key = buffer.toString('hex');
        var publicKey = forge.pki.publicKeyFromPem(this.state.otherClientPublicKeyPem)

        socket.emit("secondHalfKey", {
          key: publicKey.encrypt(key),
          token: token
        });

        this.setState({encryptionKeySecondHalf: key});

        socket.emit("client2Approve", {
          token: token
        });

        console.log("my (second) half:", key);

        // redirect the user to the chat
        this.props.history.push(to);
      }
    });

  }

  componentDidMount() {
    // // canceled in componentWillUnmount to prevent memory leak
    // const apiTestPromise = makeCancelable(this.callApi());
    // this.setState({apiTestPromise: apiTestPromise});
    // apiTestPromise
    //   .promise
    //   .then(res => this.setState({ data: res.api }))
    //   .catch(err => console.log(err));

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

        // this client was not the initiator and the token provided is indeed valid
        this.setState({initiator: false});
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

        // if it is not the initiator, call the second client connected method
        if (!this.state.initiator)
          this.secondClientConnect();
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

  // callApi = async () => {
  //   const response = await fetch("/api");
  //   const body = await response.json();

  //   if (response.status !== 200) {
  //     throw Error(body.message);
  //   }

  //   return body;
  // }

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
    // TODO more readability at the cost of a little code duplication; it is worth it?

    let box;
    // if this client is the initiator, show the box where the user can input a secret
    if (this.state.initiator) {
      box = (
        <div className="box">
          <input type="input" className="secretField" placeholder="Secret" name="secret" id='secret'/>
          <label htmlFor="secret" className="secretLabel">Secret</label>

          <div className="readyBtn">
            <Link className="readyLink" to = "chat" onClick={(event) => this.initiateConnection({ pathname: `chat`, /* hash: `#hash`, */ }, event)}> Ready </Link>
            <div className="loader" id = "load"><div></div><div></div><div></div><div></div></div>
          </div>
        </div>
      );
    } else {
      let secret;
      // if the secret is empty or composed of only space characters
      if (this.state.secret === undefined || this.state.secret.replace(/\s/g, "") === "") {
        secret = "";
      } else {
        secret = (
          <div>
            <h2> Secret: {this.state.secret} </h2>
            <p className = "secretDescription"> * Could this have been the secret sent from the initiator of the connection (i.e. from the person what sent you the link) </p>
          </div>
        );
      }

      box = (
        <div className="boxSecondClient">
          {secret}
          <div className="readyBtn">
            <Link className="readyLink" to = "chat" onClick = {(event) => this.secondClientApprove({ pathname: `chat`}, event) }> Connect </Link>
            <div className="loader" id = "load"><div></div><div></div><div></div><div></div></div>
          </div>
        </div>
      );
    }

    return (
      <div className = "indexPage mainView">
        {box}
      </div>
    );
  }

  componentWillUnmount() {
    if (this.state.apiTestPromise)
      this.state.apiTestPromise.cancel();

    if (this.state.generateRsaPromise)
      this.state.generateRsaPromise.cancel();

    this.props.socket.close();

    var fullKey = this.state.encryptionKeyFirstHalf + this.state.encryptionKeySecondHalf;

    const query = new URLSearchParams(this.props.location.search);
    const token = query.get("token");

    var data = {
      token: token,
      key: fullKey
    };

    // pass the information about the connection to the parent component
    this.props.setParentLink(data);
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
