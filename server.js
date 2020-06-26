const express = require("express");
const crypto = require("crypto")

const app = express();
const server = require('http').Server(app);
const io = require("socket.io")(server);

const port = process.env.PORT || 9000;
const bodyParser = require("body-parser");

const forge = require("node-forge");

/*
	Maximum time allowed for a connection to stay alive in milliseconds.
	Used for garbage collection.
*/
//const GARB_MAX_TIME_ALLOWED = 20 * 60 * 60 * 1000 // 20 hours

const GARB_MAX_TIME_ALLOWED = 10000;
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
	* a last used timestamp, which will later be used to close unused connections
*/
function ClientPair(client1, client2, secret) {
	this.client1 = client1;
	this.client2 = client2;
	this.secret = secret;
	this.plainTextSecret = null;
	this.connections = 0;
	this.lastUsed = Date.now();
}

// TODO null checks

// TODO if a client gives a token that does not exist, close the socket (and maybe the other socket connected to it too?):
// TODO if one socket in the client pair closes, close the other automatically?
// TODO production: https://create-react-app.dev/docs/deployment/
/* TODO reliable message delivery and buffer messages on the client
	(and buffer messages on the server better - after implementing reliable socket message delivery - ACKs)
*/

// TODO clear the tokens that have stayed for too long; garbage collection
// TODO more sensible name?
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
	console.log(req.body);
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

// app.post("/send_key", (req, res) => {
// 	let token = req.body.token;
// 	let publicKey = req.body.publicKey;
// 	let secret = req.body.secret;

// 	if (!(token in tokens)) {
// 		res.status(400).send({message: "Invalid token"});
// 	} else {
// 		var clientPair = tokens[token];
// 		if (clientPair.client1 == null && clientPair.connections < 1) {
// 			clientPair.client1 = new Client(publicKey);
// 			clientPair.connections++;
// 			clientPair.lastUsed = Date.now();
// 		} else if (clientPair.client2 == null && clientPair.connections < 2) {
// 			clientPair.client2 = new Client(publicKey);
// 			clientPair.connections++;
// 			clientPair.lastUsed = Date.now();
// 		} else {
// 			// There is already a connection established
// 			// TODO might expand the functionallity so that more parties can join
// 			// Then I will need to figure out how to send them the already established AES key
// 			// (they can probably obtain it from one of the other clients)
// 			res.status(400).send({message: "Invalid token"});
// 		}
// 	}
// 	console.log(token, publicKey, secret);
// 	console.log("tokens:", tokens)

// });

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
		// send the token to the initiator client, create a new ClientPair object, and save it in the tokens object
		// with the token as the key
		res.send({token: token});
		// TODO collisions?
		tokens[token] = new ClientPair();
	  }		// otherwise don't do anything (should not happen in practice)
	  else
		res.end();
	});
});

// app.get("/forge/prime.worker.js", (req, res) => {
// 	fs.readFile("prime.worker.js", (err, data)=>{
// 		if (err) {
// 			console.log(err);
// 			return;
// 		}
// 		res.type(".js")
// 		res.send(data);
// 	});
// });

// listen for socket.io connections
io.on("connection", (socket) => {
	// if a client is connected
	socket.on("clientConnected", (data) => {
		// get the token and the public key of the client
		let token = data.token;
		console.log(token)
		let publicKey = data.publicKey;

		// if the token is not in the tokens object, it is not valid, so send "invalidToken" message
		if (!(token in tokens)) {
			socket.emit("invalidToken");
		} else if (token != null && publicKey != null) {				// if the token and the public key are not null/undefined:
			// TODO secret max length; what if empty?
			var clientPair = tokens[token];

			// if it is client1's connection
			if (clientPair.client1 == null && clientPair.connections < 1 && data.secret != null && data.plainTextSecret != null) {
				let secret = data.secret;
				let plainTextSecret = data.plainTextSecret;

				// keep track of the secret and plainTextSecret of the connection
				clientPair.secret = secret;
				clientPair.plainTextSecret = plainTextSecret;

				console.log(publicKey);

				// ================================================================================================================================
				// just testing if the verification of the signed secret works (the secret was signed with the client's private key and
				// can be verified by the public key)
				var md = forge.md.sha1.create();
				md.update(plainTextSecret, 'utf8');

				console.log("is the secret signed with the public key:", forge.pki.publicKeyFromPem(publicKey).verify(md.digest().bytes(), secret));

				// =================================================================================================================================

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
				// There is already a connection between two parties established
				// TODO might expand the functionallity so that more parties can join
				// Then I will need to figure out how to send them the already established AES key
				// (they can probably obtain it from one of the other clients)
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
			// notify client 1 that client 2 approved the connection and has connected
			sendToClientOrBuffer(clientPair.client1.socket, clientPair.client1.buffer, "clientConnected", {}, clientPair);
		}
	});

	// pass the received encrypted secrets to the other clients
	// the first half of the encrytion key is sent by the first client
	socket.on("firstHalfKey", (data) => {
		let token = data.token;

		var clientPair = tokens[token];

		console.log("first half send!")
		// just forward the encrypted key to the second client
		sendToClientOrBuffer(clientPair.client2.socket, clientPair.client2.buffer, "firstHalfKey", {
			key: data.key,
			iv: data.iv
		},
		clientPair);
	});

	// when the second client sends its part of the encryption key,
	// forward it to the first client
	socket.on("secondHalfKey", (data) => {
		let token = data.token;

		var clientPair = tokens[token];

		sendToClientOrBuffer(clientPair.client1.socket, clientPair.client1.buffer, "secondHalfKey", {
			key: data.key,
			iv: data.iv
		},
		clientPair);
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

		// get the buffers that are used to store messages while users are offline
		var client1Buffer = client1.buffer;
		var client2Buffer = client2.buffer;

		// if the socket of one of the clients was not set or is no longer connected,
		// and the other client was not the sender,
		// set the empty socket to be the sender's socket
		if ((!client1.socket || !client1.socket.connected) && client2.socket.id !== sender) {
			client1.socket = socket;

			// while client 1's buffer is not empty, send the messages in that buffer to client 1
			sendBufferToClient(socket, client1Buffer, clientPair);
		}
		else if ((!client2.socket || !client2.socket.connected) && client1.socket.id !== sender) {
			client2.socket = socket;

			// while client 2's buffer is not empty, send the messages in that buffer to client 2
			sendBufferToClient(socket, client2Buffer, clientPair);
		}
	});

	// a message was received
	socket.on("message", (data) => {
		var sender = socket.id;

		var token = data.token;
		var clientPair = tokens[token];

		var message = data.message;

		// get the buffers that are used to store messages while users are offline
		var client1Buffer = clientPair.client1.buffer;
		var client2Buffer = clientPair.client2.buffer;

		/* TODO checking the socket IDs looks like not-so-good practice
		maybe create a room with the token? https://socket.io/docs/rooms-and-namespaces#Rooms
		https://socket.io/docs/emit-cheatsheet/  */

		// set the "mine" property of the message to false, indicating that the other client sent the message
		//console.log(message)
		message.mine = false;

		// TODO i could also implement something checking the validity of message.time?
		/* TODO
			check if the message has a valid structure
			OR better yet create a new message object
			with the approprite/expected fields from the message object
			(after validating them). token should be valid!
		*/

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
				// TODO add proper error logging!
				console.log("WRONG SOCKET ID!");
				console.log("socket id:", socket.id);
				console.log("is 1 connected:", clientPair.client1.socket.connected);
				console.log("is 2 connected:", clientPair.client2.socket.connected);
				/* handle socket changes
					when users exit the browser, or their network connection is reset,
					their sockets naturally close and a new one is opened
					(implemented entirely by socket.io);
					this change in sockets needs to be handled.
				*/
				// TODO buffers should be sent when a client connects, not when they send a message
				// (maybe ping the server every once in a while and then update the sockets as well
				// and send the buffers if neccessary); create an abstraction method for sockets ( .send() ) that checks if
				// a socket is connected and if it is not, adds the message to the respective buffer
				// (to prevent code duplication)

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
			console.log("socket was not set correctly:", clientPair.client1.socket, clientPair.client2.socket);
		}
	});
});

/*
		if (!(token in tokens)) {
			var client = new Client("TODO:socket", "TODO:public key");
			tokens[token] = new ClientPair(client, null);
		}
		else {
			var clientPair = tokens[token];
			if (clientPair.client2 == null && clientPair.connections < 2) {
				clientPair.client2 = new Client("TODO:socket", "TODO:public key");
				clientPair.connections++;
			}
		}

*/
/* An abstraction layer that sends the specified buffer to
	the specified socket.
	This method prevents some code duplication.

	* clientPair includes the following information for the client pair that is exchanging messages:
		* lastUsed		   - contains the Date when the sockets were last used (used for garbage collecting dead connections)
*/
function sendBufferToClient(socket, buffer, clientPair) {
	while (buffer.length !== 0) {
		let bufferedMessage = buffer.shift();
		socket.emit(bufferedMessage[0], bufferedMessage[1]);
		// TODO update the lastUsed variable every time a message is sent throught the socker,
		// or
		// once before the while and once after?
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
	// if the socket is connected
	if (socket.connected) {
		socket.emit(eventName, data);
	} // otherwise buffer the eventName and data to be sent later
	else {
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
		var lastUsed = clientPair.lastUsed;
		var now = Date.now();
		if (now - lastUsed > GARB_MAX_TIME_ALLOWED) {
			// free the resources
			var client1 = clientPair.client1;
			var client2 = clientPair.client2;

			// close any remaining sockets
			if (client1 && client1.socket) {console.log("conn close c1!")
				client1.socket.emit("connectionClosed");	// TODO implement on client -> open a static page with a message about the error
				client1.socket.disconnect(true);
			}
			if (client2 && client2.socket) {
				client2.socket.emit("connectionClosed");
				client2.socket.disconnect(true);
			}

			tokens[token] = null;			// TODO is it necessary?
			delete tokens[token];

			console.log("\n[GARBAGE COLLECTED]: Connection with token", token, "\nWas active for:", new Date(now - lastUsed).toISOString().slice(11, -1), "\nTokens list:", tokens);
		}
	}
}

setInterval(
	garbageCollect,
	10 * 1000		// every 10 seconds
);