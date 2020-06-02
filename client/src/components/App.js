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
  // TODO display a 404, when an unknown path is queried
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

  // initiate a connection
  // called when the user clicks on a button
  initiateConnection = (to, event)=> {

    // start the "loading" animation
    // TODO id instead of class?
    document.getElementsByClassName("readyLink")[0].style.display = "none";
    document.getElementById("load").style.display = "inline-block";

    // prevents the default behavior of clicking on a button
    event.preventDefault();

    // get a new token by the server and set it up in the url
    // after the url has a valid token, the client can share the url
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

        // get the socket provided by the parent component
        var socket = this.props.socket;

        // get the token and the secret
        const query = new URLSearchParams(this.props.location.search);
        const token = query.get("token");
        const secret = document.getElementById("secret").value;

        // set up a message digest to be used to sign the secret with the client's private key
        var md = forge.md.sha1.create();
        md.update(secret, 'utf8');

        // notify the server that a client has connected
        // TODO set a small timeout/interval(with while loop) to be sure that the public key is already set
        socket.emit("clientConnected", {
          token: token,
          publicKey: this.state.pub,
          secret: this.state.priv.sign(md),
          plainTextSecret: secret
        });

        // if the token is invalid, redirect the user
        socket.on("invalidToken", () => {
          this.props.history.push("/invalid_token");
        });

        // when the second client is connected, redirect the user to /chat
        socket.on("clientConnected", () => {
          this.props.history.push(to)
        });

        // when the server forwards the client 2 information
        socket.on("client2Information", (data) => {
          // save the other user's public key
          this.setState({otherClientPublicKeyPem: data.publicKey});

          // TODO make it a promise and cancel it on componentWillUnmount ? (can it lead to a memory leak?)
          // generate the first part of the encryption key
          crypto.randomBytes(24, (err, buffer) => {
            if (err) {
              console.log(err);
            }

            if (buffer) {
              // convert it to a hex representation
              var key = buffer.toString('hex');
              var publicKey = forge.pki.publicKeyFromPem(data.publicKey);

              // save it to the state variable
              this.setState({encryptionKeyFirstHalf: key});

              console.log("my (first) half:", key);

              // send the encrypted first part of the key to the server
              socket.emit("firstHalfKey", {
                key: publicKey.encrypt(key),
                token: token
              });
            }
          });
        });

        // when you receive the other client's part of the encryption key
        socket.on("secondHalfKey", (data) => {
          // decrypt the key using your private key
          var key = this.state.priv.decrypt(data.key);

          // save the second part of the encryption key to your state
          this.setState({encryptionKeySecondHalf: key});

          console.log("second half received:", key);
        });

      })
      .catch(err => console.log(err));
  }

  // if this is the second client
  // this is called whenever the second client loads this page (happens when a valid token is passed as a 
  // query parameter)
  secondClientConnect = () => {

    // document.getElementsByClassName("readyLink")[0].style.display = "none";
    // document.getElementById("load").style.display = "inline-block";

    var socket = this.props.socket;

    const query = new URLSearchParams(this.props.location.search);
    const token = query.get("token");

    // notify the server that the client has connected (connection is still not approved)
    socket.emit("clientConnected", {
      token: token,
      publicKey: this.state.pub,
    });

    // receive the information of the first client
    socket.on("client1Information", (data) => {
      var md = forge.md.sha1.create();
      md.update(data.plainTextSecret, 'utf8');

      try {
        // verify that the secret matches the signed secret
        if (forge.pki.publicKeyFromPem(data.publicKey).verify(md.digest().bytes(), data.secret)) {
          // set the this.state.secret to keep track of the plain text secret, so the user can approve it
          this.setState({secret: data.plainTextSecret});

          // set the this.state.otherClientPublicKeyPem with the public key of client 1
          this.setState({otherClientPublicKeyPem: data.publicKey});
        } else {           // redirect if the signed secret and plain secret do not match
          this.props.history.push("/connection_interrupted");       // TODO create this page
        }
      } catch(err) {
        this.props.history.push("/connection_interrupted");
      }
    });

    // receive the generated first half of the key from the other client
    socket.on("firstHalfKey", (data) => {
      var key = this.state.priv.decrypt(data.key);

      this.setState({encryptionKeyFirstHalf: key});
      console.log("first half received:", key);
    });
  }

  // when the second client approves the connection
  // the method is called when the user clicks on a button
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
        // convert the key to its hex representation
        var key = buffer.toString('hex');
        var publicKey = forge.pki.publicKeyFromPem(this.state.otherClientPublicKeyPem)

        // send your public key to the client and save it in the state
        socket.emit("secondHalfKey", {
          key: publicKey.encrypt(key),
          token: token
        });

        this.setState({encryptionKeySecondHalf: key});

        // notify the user that you approve the connection
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

    // open the socket (it might be closed by the componentWillUnmount)
    this.props.socket.open();

    let query = new URLSearchParams(this.props.location.search);
    const token = query.get("token");

    if (token) {
      // there is already a token set, verify it
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
        // save your public and private keys to the state variable
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

  // verifies that the token is valid on the server
  verifyToken = async (token) => {
    // verify that it is a real token
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' , 'Connection': 'close'},
      body: JSON.stringify({ token: token })
    };

    const response = await fetch('/verify_token', requestOptions);
    const body = await response.json();

    if (response.status !== 200) {
      // this error should be catched and user should be redirected to /invalid_token
      throw Error(body.message);
    }

    return body;
  }

  // TODO code duplication!
  // get a token from the server
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

  // publicKeyExchange = async (publicKey, token, secret) => {
  //   const  requestOptions = {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' , 'Connection': 'close'},
  //     body: JSON.stringify({ publicKey: publicKey, token: token, secret: secret })
  //   }

  //   const response = await fetch('/send_key', requestOptions);
  //   const body = await response.json();

  //   if (response.status !== 200) {
  //     throw Error(body.message);
  //   }

  //   return body;
  // }

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
            <p className = "secretDescription"> * Could this have been the secret sent from the initiator of the connection (i.e. from the person that sent you the link) </p>
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
    // cancel the unfulfilled promises
    if (this.state.apiTestPromise)
      this.state.apiTestPromise.cancel();

    if (this.state.generateRsaPromise)
      this.state.generateRsaPromise.cancel();

    // close the socket (it can later be opened again)
    this.props.socket.close();

    //combine the two halves of the key
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

// makes a promise cancelable
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
