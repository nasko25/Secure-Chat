import React from "react";
import { Link } from "react-router-dom";
import './index.css';
import forge from "node-forge";

export default class InitilizeConnection extends React.Component {
  state = {
    // data: null,
    // assume that you are the initiator until the token is checked to be valid from the server
    initiator: true,
    // will be set to true when the initiator client clicks on the "Ready" button
    initiatingConnection: false
  };

  // initiate a connection
  // called when the user clicks on a button
  initiateConnection = (to, event)=> {

    // set a flag indicating that the client is waiting for the second client's response
    this.setState({initiatingConnection: true});
    // start the "loading" animation
    document.getElementById("readyLink").style.display = "none";
    document.getElementById("load").style.display = "inline-block";

    // prevents the default behavior of clicking on a button
    event.preventDefault();

    // get a new token by the server and set it up in the url
    // after the url has a valid token, the client can share the url
    this.getToken()
      .then(res => {
        let newToken = res;

        // wait for 1 second before setting the token in the url
        setTimeout( () => {
          this.props.history.push({
            pathname: '/',
            search: `?token=${newToken}`,
            // state: {token: "do i need a state?"}
          });
        }, 1000);

        // get the socket provided by the parent component
        var socket = this.props.socket;

        // get the token and the secret
        const token = newToken;
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
          forge.random.getBytes(16, (err, buffer) => {
            if (err) {
              console.log(err);
            }
              console.log(buffer)

            // TODO ? forge can generate a 'password' based key:
            /* alternatively, generate a password-based 16-byte key
              var salt = forge.random.getBytesSync(128);
              var key = forge.pkcs5.pbkdf2('password', salt, numIterations, 16);
            */
            // ^ Taken from the documentation
            if (buffer) {
              // convert it to a hex representation
              var key = buffer.toString('hex');
              var publicKey = forge.pki.publicKeyFromPem(data.publicKey);

              console.log("my (first) half:", key);

              // generate the first half of an iv
              var iv = forge.random.getBytesSync(8).toString("hex");

              // save the key and iv to the state variable
              this.setState({
                encryptionKeyFirstHalf: key,
                ivFirstHalf: iv
              });

              // send the encrypted first part of the key and iv to the server
              socket.emit("firstHalfKey", {
                key: publicKey.encrypt(key),
                token: token,
                iv: iv
              });
            }
          });
        });

        // when you receive the other client's part of the encryption key
        socket.on("secondHalfKey", (data) => {
          // decrypt the key using your private key
          var key = this.state.priv.decrypt(data.key);
          var iv = data.iv;

          // save the second part of the encryption key and the iv to the component's state
          this.setState({
            encryptionKeySecondHalf: key,
            ivSecondHalf: iv
          });

          console.log("second half received:", key);
        });

      })
      .catch(err => console.log(err));
  }

  // if this is the second client
  // this is called whenever the second client loads this page (happens when a valid token is passed as a
  // query parameter)
  secondClientConnect = () => {

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
          this.props.history.push("/connection_interrupted");
        }
      } catch(err) {
        this.props.history.push("/connection_interrupted");
      }
    });

    // receive the generated first half of the key from the other client
    socket.on("firstHalfKey", (data) => {
      var key = this.state.priv.decrypt(data.key);
      var iv = data.iv;

      this.setState({
        encryptionKeyFirstHalf: key,
        ivFirstHalf: iv
      });
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
    forge.random.getBytes(16, (err, buffer) => {
      if (err) {
        console.log(err);
      }

      if (buffer) {
        // convert the key to its hex representation
        var key = buffer.toString('hex');
        var publicKey = forge.pki.publicKeyFromPem(this.state.otherClientPublicKeyPem)

        // generate the second half of the iv
        var iv = forge.random.getBytesSync(8).toString("hex");

        // send your public key to the client and save it in the state
        socket.emit("secondHalfKey", {
          key: publicKey.encrypt(key),
          token: token,
          iv: iv
        });

        this.setState({
          encryptionKeySecondHalf: key,
          ivSecondHalf: iv
        });

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

        // this client was not the initiator as there was a token provided
        this.setState({initiator: false});
    }

    var rsa = forge.pki.rsa;

    // make a promise for the generation of the rsa keys
    let promise = new Promise((resolve, reject) => {
      // fetch the /forge/prime.worker.js file from the express backend
      this.getPrimaryWorker().then(res => {

        // create a blob from the fetched javascript worker script and assign it an object url
        var primaryWorker = new Blob([res], {type: 'application/javascript'});
        var blobURL = URL.createObjectURL(primaryWorker);

        // feed the generateKeyPair() function the worker script that was fetched from the express backend
        // otherwise the node-forge module was making multiple get requests to forge/prime.woker.js, which was not ideal
        // you can remove the "workers" parameter to prevent the multiple calls to forge/prime.worker.js (if you stop using the prime worker from the created blob)
        rsa.generateKeyPair({bits: 2048, workers: -1, workerScript: blobURL}, (err, keypair) => {

          // some quick api tests
          let a = keypair.publicKey.encrypt("asdf")
          let b = forge.pki.publicKeyFromPem(forge.pki.publicKeyToPem(keypair.publicKey)).encrypt("asdf")
          console.log(keypair.privateKey.decrypt(a));
          console.log(keypair.privateKey.decrypt(b));

          resolve(keypair);

          reject("promise not fullfilled");
        })
      })
    });

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

    // if the connection is closed, the user should be notified
    this.props.socket.on("connectionClosed", () => {
      this.props.history.push("/connection_closed");
    });

    // set an interval to ping the server
    // in this way the server can keep track of
    // users that are disconnected and can update their sockets
    var pingServer = setInterval(() => {
      let query = new URLSearchParams(this.props.location.search);
      const token = query.get("token");

      // only if the token is defined
      if (token) {
        var socket = this.props.socket;
        socket.emit("pingServer", {
          token: token
        });
      }
    }, 2000);
    this.setState({
      pingServerInterval: pingServer
    });
  }

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

  // get a token from the server
  getToken = async () => {
    const response = await fetch("/generate_token");
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message);
    }

    return body.token;
  }

  getPrimaryWorker = async () => {
    const response = await fetch("/forge/prime.worker.js");
    const body = await response.text();

    if (response.status !== 200) {
      throw Error(body.message);
    }

    return body;
  }

  render() {
    // TODO more readability at the cost of a little code duplication; it is worth it?

    let box;
    let readyLink;
    // if this client is the initiator, show the box where the user can input a secret
    if (this.state.initiator) {
      // if the private key has loaded, you can display the ready button        // if initiatingConnection is true, it means that the client has already started a connection
      if (this.state.priv && document.getElementById("load") && !this.state.initiatingConnection) {
        // hide the "loading" animation as the private key has loaded
        document.getElementById("load").style.display = "none";

        readyLink = (
          <Link id="readyLink" to = "chat" onClick={(event) => this.initiateConnection({ pathname: `chat`, /* hash: `#hash`, */ }, event)}> Ready </Link>
        );
      }         // document.getElementById("load") should not be null
      else if (document.getElementById("load")) {
        // show the "loading" animation as the private key of this client has still not loaded
        document.getElementById("load").style.display = "inline-block";

        // the ready link should not be yet shown
        readyLink = "";
      }

      box = (
        <div className="box">
          <input type="input" className="secretField" placeholder="Secret" name="sec" id='secret'/>     { /* The name of the input field was "secret" but chrome was always trying to autocomplete with previous used input values */ }
          <label htmlFor="secret" className="secretLabel">Secret</label>

          <div className="readyBtn">
            {readyLink}
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
      let connectBtn;
      // display the 'Connect' button only if the public key of the other client and the first part of the encryption key are set
      if (this.state.otherClientPublicKeyPem && this.state.encryptionKeyFirstHalf) {

        // hide the "loading" animation as the public key of the other client was received
        document.getElementById("load").style.display = "none";

        connectBtn = (
          <Link id="readyLink" to = "chat" onClick = {(event) => this.secondClientApprove({ pathname: `chat`}, event) }> Connect </Link>
        );
      } else {
        // show the "loading" animation as the public key of the other client is still missing
        document.getElementById("load").style.display = "inline-block";

        connectBtn = "";
      }

      box = (
        <div className="boxSecondClient">
          {secret}
          <div className="readyBtn">
            {connectBtn}
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

    clearInterval(this.state.pingServerInterval);

    // unsubscribe the socket from any events it was previously listening for;
    // this prevents it from changing the state of this component after the component is unmounted,
    // thus preventing memeory leaks
    this.props.socket.off();

    // combine the two halves of the key
    var fullKey = this.state.encryptionKeyFirstHalf + this.state.encryptionKeySecondHalf;

    // combine the two halves of the iv
    var fullIV = this.state.ivFirstHalf + this.state.ivSecondHalf;

    const query = new URLSearchParams(this.props.location.search);
    const token = query.get("token");

    var data = {
      token: token,
      key: fullKey,
      iv: fullIV
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
