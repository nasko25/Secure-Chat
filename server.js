const express = require("express");
const crypto = require("crypto")

const app = express();
const server = require('http').Server(app);
const io = require("socket.io")(server);

const port = process.env.PORT || 9000;
const bodyParser = require("body-parser");

const forge = require("node-forge");

function Client(publicKey, socket) {
	this.publicKey = publicKey;
	this.socket = socket;
}

function ClientPair(client1, client2, secret) {
	this.client1 = client1;
	this.client2 = client2;
	this.secret = secret;
	this.plainTextSecret = null;
	this.connections = 0;
	this.lastUsed = Date.now();
}

// TODO null checks

// TODO clear the tokens that have stayed for too long
let tokens = {};

app.use(bodyParser.json());

server.listen(port, () => console.log(`Server listening on port ${port}`));

app.post("/verify_token", (req, res) => {
	console.log(req.body);
	let token = req.body.token;
	if (!(token in tokens)) {
		// TODO can also check if the number for the ClientPair connections for this token is < 2
		res.status(400).send({message: "Invalid token"});
		//res.send("Sorry the token is invalid.\nThis might be caused by an expired session or just by an invalid token provided.")
	} else{
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

app.get("/generate_token", (req, res) => {
	crypto.randomBytes(24, function(err, buffer) {
	  if (err) {
		console.log(err);
		res.end();
	  }
	  if (buffer) {
		let token = buffer.toString('hex');
		res.send({token: token});
		// TODO collisions?
		tokens[token] = new ClientPair();
	  }
	  else
		res.end();
	});
});

io.on("connection", (socket) => {
	socket.on("clientConnected", (data) => {
		let token = data.token;
		let publicKey = data.publicKey;

		if (!(token in tokens)) {
			socket.emit("invalidToken");
		} else if (token != null && publicKey != null) {
			// TODO secret max length; what if empty?
			// TODO display the secret to the client to verify if the public key has verified it
			var clientPair = tokens[token];

			// if it is client1's connection
			if (clientPair.client1 == null && clientPair.connections < 1 && data.secret != null && data.plainTextSecret != null) {
				let secret = data.secret;
				let plainTextSecret = data.plainTextSecret;

				clientPair.secret = secret;
				clientPair.plainTextSecret = plainTextSecret;

				console.log(publicKey);

				// ================================================================================================================================

				var md = forge.md.sha1.create();
				md.update(plainTextSecret, 'utf8');

				console.log("is the secret signed with the public key:", forge.pki.publicKeyFromPem(publicKey).verify(md.digest().bytes(), secret));

				// =================================================================================================================================

				clientPair.client1 = new Client(publicKey, socket);
				clientPair.connections++;
				clientPair.lastUsed = Date.now();
			} else if (clientPair.client1 != null && clientPair.client2 == null && clientPair.connections < 2) {		// client2 connected
				clientPair.client2 = new Client(publicKey, socket);
				clientPair.connections++;
				clientPair.lastUsed = Date.now();

				// notify the other client that another client has connected
				clientPair.client1.socket.emit("clientConnected");

				// send the client1 information to client2
				clientPair.client2.socket.emit("client1Information", {
					publicKey: clientPair.client1.publicKey,
					secret: clientPair.secret,
					plainTextSecret: clientPair.plainTextSecret
				});

			} else {
				// There is already a connection between two parties established
				// TODO might expand the functionallity so that more parties can join
				// Then I will need to figure out how to send them the already established AES key
				// (they can probably obtain it from one of the other clients)
				socket.emit("invalidToken");
			}
		}
	});
})

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