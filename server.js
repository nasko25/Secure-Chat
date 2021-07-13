const express = require("express");
const crypto = require("crypto")

const app = express();
const server = require('http').Server(app);
const io = require("socket.io")(server, {
	pingTimeout: 1000,	// 1 second without response means that the socket is disconnected
	pingInterval: 1000,	// ping the clients every 1 second
	path: "/socket" // use /socket for the socket.io requests
});

const port = process.env.PORT || 3210;      // 3210 was the client port (the server port was 9000 originally), but after deployment, the client will be statically served, so this server will
// need to serve the static client build files
const bodyParser = require("body-parser");

const forge = require("node-forge");

/*
	Maximum time allowed for a connection to stay alive in milliseconds.
	Used for garbage collection.
*/
const GARB_MAX_TIME_ALLOWED = 20 * 60 * 60 * 1000; // 20 hours

/*
	Maximum time allowed for a connection to stay alive after the first buffered message in milliseconds.
	Used for garbage collection.
*/
const GARB_MAX_BUFFER_TIME_ALLOWED = 5 * 60 * 1000; // 5 minutes

/*
	This constant variable will determine how verbose the output of the server is.
	If it is true, more information will be output to the console.
	The variable does not affect the output of errors. Errors will be displayed no matter what this variable is.
*/
const DEBUG = false;

/*
	Represents the two clients in the communication.
	Both of them need to share their public key and the
	socket through which they communicate.

	The public key is used for a secure encryption key exchange
	when the parties agree on the encryption key to be used.

	The encryption key is only known by the two parties and they both
	participate in its creation (both of them generate 24 random bytes
	which when combined create the encryption key).
*/
function Client(publicKey, socket) {
	this.publicKey = publicKey;
	this.socket = socket;
	/* Initilize a buffer that will buffer incoming messages when the client is offline

		The buffer now contains lists of eventType and an object of data that will be send through a web socket (in that order).
		For example: buffer = [ [ "ping", { message: "asdf" } ], [...] ], the object { message: "asdf" } will be send though a socket with eventType "ping", like:
			socket.emit("ping", { message: "asdf" });
	*/
	this.buffer = [];
}

/*
	Represents the pair of clients that communicate with each other.

	Each connection needs:
	* the two client functions/object (with their respective information, specified above)
	* a pair of secret (signed with the private key of the initiator client) and its plain text counterpart;
		they are used to prove that the initiator client is authentic;
		since the client decides what the secret is, the other party will see the chosen secret and needs to approve
		the authenticity of the chosen word/phrase before a connection between them is established

		of course there is no way for them to exchange this secret securely before the connection takes place,
		but I assume that since they know each other, the initiator client can choose some secret that will prove his/hers authenticity.

	* number of connections, as there can be at most 2 parties in the connection
	* a last used timestamp, which is used to close unused connections
	* a lastBuffered timestamp, which is used to keep track how long the server has been buffering messages;
		if it is too long, the connection will be closed
*/
function ClientPair(client1, client2, secret) {
	this.client1 = client1;
	this.client2 = client2;
	this.secret = secret;
	this.plainTextSecret = null;
	this.connections = 0;
	this.lastUsed = Date.now();
	this.lastBuffered = null;
}

// TODO if a client gives a token that does not exist, close the socket (and maybe the other socket connected to it too?):
// TODO production: https://create-react-app.dev/docs/deployment/
/* TODO reliable message delivery and buffer messages on the client ?
	(and buffer messages on the server better - after implementing reliable socket message delivery - ACKs)
	(https://stackoverflow.com/questions/20417569/acknowledgment-for-socket-io-custom-event)
*/

/*
	This object keeps track of the tokens and clientPair connections.
	The tokens are the keys and their associated clientPair objects/functions are the values of the tokens object.
*/
let tokens = {};

app.use(bodyParser.json());

// serve the browserified prime.worker.js when a request is made by the client for that file
app.use("/forge/prime.worker.js", express.static(__dirname + "/prime.worker.js"));

server.listen(port, () => console.log(`Server listening on port ${port}`));

// verity that the token is valid
// (used by the second client when they receive a url with a token)
app.post("/verify_token", (req, res) => {
	if (DEBUG) {
		console.log(req.body);
	}
	let token = req.body.token;

	// if the token is not a key in the object tokens or there are already 2 connected clients
	if (!(token in tokens) || tokens[token].connections >= 2) {
		// respond with a response code 400 Bad Request
		res.status(400).send({message: "Invalid token"});
		//res.send("Sorry the token is invalid.\nThis might be caused by an expired session or just by an invalid token provided.")
	} else {
		// otherwise don't do anything; the token is valid
		res.send({})
	}
});

/*
	Generates a token.
	It is used by the initiator client, when they input a secret.
	This token is then placed in the url as a parameter, and the client needs to share the url, so that
	a second client can join in the connection.
*/
app.get("/generate_token", (req, res) => {
	// generate 24 pseudorandom cryptographically safe bytes that will be used as a token
	crypto.randomBytes(24, function(err, buffer) {
	  // if there is an error, console.log it and don't do anything (should not happen in practice)
	  if (err) {
		console.log(err);
		res.end();
	  }
	  // if buffer is not undefined (should always be the case)
	  if (buffer) {
		// convert the bytes to a hex representation, so they can be used as a url parameter
		let token = buffer.toString('hex');

		// if the token already exists in the tokens object
		while (token in tokens) {
			if (DEBUG) {
				console.log("\ngenerated token already exists in the tokens object:", token);
				console.log("...generating a new token...");
			}

			// generate a new token, because a collision has occured
			token = crypto.randomBytes(24).toString("hex");

			if (DEBUG) {
				console.log("new token:", token, "\n");
			}
		}

		tokens[token] = new ClientPair();

		// send the token to the initiator client, create a new ClientPair object, and save it in the tokens object
		// with the token as the key
		res.send({token: token});
	  }		// otherwise don't do anything (should not happen in practice)
	  else
		res.end();
	});
});

// listen for socket.io connections
io.on("connection", (socket) => {
	// if a client is connected
	socket.on("clientConnected", (data) => {
		// get the token and the public key of the client
		let token = data.token;
		if (DEBUG) {
			console.log(token);
		}
		let publicKey = data.publicKey;

		// if the token is not in the tokens object, it is not valid, so send "invalidToken" message
		if (!(token in tokens)) {
			socket.emit("invalidToken");
		} else if (token != null && publicKey != null) {				// if the token and the public key are not null/undefined:
			var clientPair = tokens[token];

			// if it is client1's connection
			if (clientPair.client1 == null && clientPair.connections < 1 && data.secret != null && data.plainTextSecret != null) {
				let secret = data.secret;
				let plainTextSecret = data.plainTextSecret;

				// keep track of the secret and plainTextSecret of the connection
				clientPair.secret = secret;
				clientPair.plainTextSecret = plainTextSecret;

				if (DEBUG) {
					console.log(publicKey);

					// ================================================================================================================================
					// just testing if the verification of the signed secret works (the secret was signed with the client's private key and
					// can be verified by the public key)
					var md = forge.md.sha1.create();
					md.update(plainTextSecret, 'utf8');

					console.log("is the secret signed with the public key:", forge.pki.publicKeyFromPem(publicKey).verify(md.digest().bytes(), secret));

					// =================================================================================================================================
				}

				// create a new client object and keep track of it in the clientPair
				clientPair.client1 = new Client(publicKey, socket);
				clientPair.connections++;
				clientPair.lastUsed = Date.now();
			} else if (clientPair.client1 != null && clientPair.client2 == null && clientPair.connections < 2) {		// client2 connected
				clientPair.client2 = new Client(publicKey, socket);
				clientPair.connections++;
				clientPair.lastUsed = Date.now();

				// send the client1 information to client2
				clientPair.client2.socket.emit("client1Information", {
					publicKey: clientPair.client1.publicKey,
					secret: clientPair.secret,
					plainTextSecret: clientPair.plainTextSecret
				});

				// if client 1 is still connected, send the client2 information to client 1;
				// otherwise buffer the information that needs to be send
				sendToClientOrBuffer(clientPair.client1.socket, clientPair.client1.buffer, "client2Information", 		{
					publicKey: clientPair.client2.publicKey
				},
				clientPair);
			} else {
				// There is already a connection between two parties established or the token is just not valid
				socket.emit("invalidToken");
			}
		}
	});

	// if the second client approves the connection
	socket.on("client2Approve", (data) => {
		let token = data.token;

		if (!(token in tokens)) {
			socket.emit("invalidToken");
		} else {
			var clientPair = tokens[token];
			// clientPair and client1 should not be null
			if (clientPair && clientPair.client1) {
				// notify client 1 that client 2 approved the connection and has connected
				sendToClientOrBuffer(clientPair.client1.socket, clientPair.client1.buffer, "clientConnected", {}, clientPair);
			}
			else {
				socket.emit("connectionClosed");
				console.error("clientPair or client 1 was undefined", clientPair);
			}
		}
	});

	// pass the received encrypted secrets to the other clients
	// the first half of the encrytion key is sent by the first client
	socket.on("firstHalfKey", (data) => {
		let token = data.token;

		var clientPair = tokens[token];

		if (clientPair && clientPair.client2) {
			// just forward the encrypted key to the second client
			sendToClientOrBuffer(clientPair.client2.socket, clientPair.client2.buffer, "firstHalfKey", {
				key: data.key,
				iv: data.iv
			},
			clientPair);
			if (DEBUG) {
				console.log("first half sent!");
			}
		}
		else {
			console.error("clientPair or client 2 was undefined:", clientPair);
		}
	});

	// when the second client sends its part of the encryption key,
	// forward it to the first client
	socket.on("secondHalfKey", (data) => {
		let token = data.token;

		var clientPair = tokens[token];

		if (clientPair && clientPair.client1) {
			sendToClientOrBuffer(clientPair.client1.socket, clientPair.client1.buffer, "secondHalfKey", {
				key: data.key,
				iv: data.iv
			},
			clientPair);
		}
		else {
			socket.emit("connectionClosed");
			console.error("clientPair or client 1 was undefined:", clientPair)
		}
	});

	// ping the server to update the socket and send any messages that are stored in the client buffers
	socket.on("pingServer", (data) => {
		var token = data.token;

		var sender = socket.id;

		var clientPair = tokens[token];
		if (!clientPair) {
			return;
		}
		var client1 = clientPair.client1;
		var client2 = clientPair.client2;

		if (!client1 || !client2) {
			return;
		}

		// get the buffers that are used to store messages while users are offline
		var client1Buffer = client1.buffer;
		var client2Buffer = client2.buffer;

		// if the socket of one of the clients was not set or is no longer connected,
		// and the other client was not the sender,
		// set the empty socket to be the sender's socket
		if ((!client1.socket || !client1.socket.connected) && client2.socket.id !== sender && client1Buffer.length !== 0 ) {
			client1.socket = socket;

			// while client 1's buffer is not empty, send the messages in that buffer to client 1
			sendBufferToClient(socket, client1Buffer, clientPair);
		}
		else if ((!client2.socket || !client2.socket.connected) && client1.socket.id !== sender && client2Buffer.length !== 0) {
			client2.socket = socket;

			// while client 2's buffer is not empty, send the messages in that buffer to client 2
			sendBufferToClient(socket, client2Buffer, clientPair);
		}
		// however, if the client just disconnected temporarily and their socket is still valid, but there are buffered messages for them
		else if ((client1.socket && client1.socket.connected) && client1Buffer.length !== 0 && client2.socket.id === sender) {
			sendBufferToClient(socket, client1Buffer, clientPair);
		}
		else if ((client2.socket && client2.socket.connected) && client2Buffer.length !== 0 && client1.socket.id === sender) {
			sendBufferToClient(socket, client2Buffer, clientPair);
		}
	});

	// a message was received
	socket.on("message", (data) => {
		var sender = socket.id;

		var token = data.token;
		var clientPair = tokens[token];

		if (!clientPair || !clientPair.client1 || !clientPair.client2) {
			socket.emit("connectionClosed");
			console.error("clientPair or one of the clients was undefined - message", clientPair);
			return;
		}

		var messageRecieved = data.message;
		var message = {};

		if (!message) {
			if (DEBUG) {
				console.log("The client sent a forged data object:", "It does not have a message field");
			}
			return;
		}

		// get the buffers that are used to store messages while users are offline
		var client1Buffer = clientPair.client1.buffer;
		var client2Buffer = clientPair.client2.buffer;


		// create a new message object with the expected fields from the messageReceived object
		// in this way, no extra information is sent to the client

		// set the "mine" property of the message to false, indicating that the other client sent the message
		//console.log(message)
		message.mine = false;

		// set the actual message if it is of a valid type
		if (typeof messageRecieved.message === 'string' || messageRecieved.message instanceof String) {
			message.message = messageRecieved.message;
		}
		// otherwise the other client sent an invalid message
		else {
			// TODO send to the client that sent this message that it is of invalid type
			message.message = "";
		}

		// set the time to what was sent
		if (messageRecieved.time && (typeof messageRecieved.time === 'string' || messageRecieved.time instanceof String)) {
			message.time = messageRecieved.time;
		}
		// if the date is not valid, set it to the UTC date now
		else {
			var date = new Date();
			message.time = date.toUTCString();
		}

		// the clients must have their sockets set
		if (clientPair.client1.socket && clientPair.client2.socket) {
			// did client 1 send the message?
			if (clientPair.client1.socket.id === sender) {
				// if client 2 is connected, relay the message, otherwise buffer the data in client 2's buffer
				sendToClientOrBuffer(clientPair.client2.socket, client2Buffer, "message", {
					message: message
				},
				clientPair);
			}
			// did client 2 send the message?
			else if (clientPair.client2.socket.id === sender) {
				// if client 1 is connected, relay the message, otherwise buffer the data in client 1's buffer
				sendToClientOrBuffer(clientPair.client1.socket, client1Buffer, "message", {
					message: message
				},
				clientPair);
			}
			// wrong socket id !
			else {
				if (DEBUG) {
					console.log("WRONG SOCKET ID!");
					console.log("socket id:", socket.id);
					console.log("is 1 connected:", clientPair.client1.socket.connected);
					console.log("is 2 connected:", clientPair.client2.socket.connected);
				}
				/*
					handle socket changes
					when users exit the browser, or their network connection is reset,
					their sockets naturally close and a new one is opened
					(implemented entirely by socket.io);
					this change in sockets needs to be handled.
				*/

				// if socket 1 is not connected, set the sending socket to be client 1's new socket
				if (!clientPair.client1.socket.connected) {
					clientPair.client1.socket = socket;

					// while client 1's buffer is not empty, send the messages in that buffer to client 1
					sendBufferToClient(socket, client1Buffer, clientPair);
					// also send the message to client 2
					sendToClientOrBuffer(clientPair.client2.socket, clientPair.client2.buffer, "message", { message: message }, clientPair);

				} // if client 2 is not connected, set the sending socket to be client 2's new socket
				else if (!clientPair.client2.socket.connected) {
					clientPair.client2.socket = socket;

					// while client 2's buffer is not empty, send the messages in that buffer to client 2
					sendBufferToClient(socket, client2Buffer, clientPair);
					// also send the message to client 1
					sendToClientOrBuffer(clientPair.client1.socket, clientPair.client1.buffer, "message", {message: message}, clientPair);
				}
			}
		}
		else {
			console.error("Socket was not set correctly:", clientPair.client1.socket, clientPair.client2.socket);
		}
	});
});

/* An abstraction layer that sends the specified buffer to
	the specified socket.
	This method prevents some code duplication.

	* clientPair includes the following information for the client pair that is exchanging messages:
		* lastUsed		   - contains the Date when the sockets were last used (used for garbage collecting dead connections)
*/
function sendBufferToClient(socket, buffer, clientPair) {
	if (!socket || !buffer || !clientPair) {
		console.error("[ERROR] Socket, clientPair or the buffer is undefined.");
		console.log(socket, buffer, clientPair);
		return;
	}

	// reset the clientPair.lastBuffered variable to null, because the client is online
	clientPair.lastBuffered = null;
	while (buffer.length !== 0) {
		let bufferedMessage = buffer.shift();
		socket.emit(bufferedMessage[0], bufferedMessage[1]);

		// update the lastUsed variable every time a message is sent throught the socket,
		clientPair.lastUsed = Date.now();
	}
}

/* An abstraction layer that sends the specified data to the specified client socket,
	if this socket is still connected.

	Otherwise, the method will buffer the data in the specified client's buffer.
	This method prevents code duplication.

	* the eventName is the name of the event used by socket.io to transmit the message

	* clientPair includes the following information for the client pair that is exchanging messages:
		* lastUsed		   - contains the Date when the sockets were last used (used for garbage collecting dead connections)
*/
function sendToClientOrBuffer(socket, buffer, eventName, data, clientPair) {
	// if socket is null or undefined
	if (!socket || !buffer || !clientPair) {
		console.error("[ERROR] Socket, clientPair or the buffer is undefined.");
		console.log(socket, buffer, eventName, data, clientPair);
		return;
	}

	// if the socket is connected
	if (socket.connected) {
		socket.emit(eventName, data);
	} // otherwise buffer the eventName and data to be sent later
	else {
		// if the clientPair.lastBuffered variable is null, set it to the time now, so the server can keep track of how long the client has been disconnected
		if (clientPair.lastBuffered === null) {
			clientPair.lastBuffered = Date.now();
		}

		buffer.push([
			eventName,
			data
		]);
	}
	clientPair.lastUsed = Date.now();
}

/*
	This function frees the resources associated with dead connections
*/
function garbageCollect() {
	for (var token in tokens) {
		var clientPair = tokens[token];
		if (!clientPair) {
			console.error("[ERROR] clientPair is undefined!");
			return;
		}
		var lastUsed = clientPair.lastUsed;
		var lastBuffered = clientPair.lastBuffered;
		var now = Date.now();
		// if too much time has passed without the connection being used,
		// or the server has been buffering messages for too long
		// close the connections and free the resources
		if (
			(now - lastUsed > GARB_MAX_TIME_ALLOWED) ||
			(lastBuffered !== null && (now - lastBuffered) > GARB_MAX_BUFFER_TIME_ALLOWED)
		) {
			// free the resources

			var client1 = clientPair.client1;
			var client2 = clientPair.client2;

			// close any remaining sockets
			if (client1 && client1.socket) {
				client1.socket.emit("connectionClosed");
				client1.socket.disconnect(true);
			}
			if (client2 && client2.socket) {
				client2.socket.emit("connectionClosed");
				client2.socket.disconnect(true);
			}

			tokens[token] = null;
			delete tokens[token];

			if (DEBUG) {
				console.log("\n[GARBAGE COLLECTED]: Connection with token", token, "\nWas active for:", new Date(now - lastUsed).toISOString().slice(11, -1), "\nTokens list:", tokens);
			}
		}
	}
}

setInterval(
	garbageCollect,
	10 * 1000		// every 10 seconds
);

// this is needed for production, because when the React client app is built (with `npm run build`),
// the build files are located in /client/build and need to be served by this server
app.use("/static", express.static(__dirname + "/client/build/static")); // the static files need to be served from /client/build/static
// anything else will open index.html
app.get("*", (req, res) => {
    // if it is not a defined url (defined in the React client App.js) return 404
    //  (and the React Router will redirect to the /not_found page)
    if (!["/", "/chat", "/invalid_token", "/connection_closed", "/connection_interrupted", "/not_found"].includes(req.path))
        res.status(404);
    res.sendFile("index.html", { root: __dirname + "/client/build" });
});
