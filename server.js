const express = require("express");
const crypto = require("crypto")
const app = express();
const port = process.env.PORT || 9000;
const bodyParser = require("body-parser");

function Client(socket, publicKey) {
	this.socket = socket;
	this.publicKey = publicKey;
}

function ClientPair(client1, client2) {
	this.client1 = client1;
	this.client2 = client2;
	this.connections = 0;
	this.lastUsed = Date.now();
}

// TODO clear the tokens that have stayed for too long
let tokens = {};

app.use(bodyParser.json());

app.listen(port, () => console.log(`Server listening on port ${port}`));

app.get("/api", (req, res) => {
	res.send({ api: "api test!" });
});

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

app.post("/send_key", (req, res) => {
	let token = req.body.token;
	let publicKey = req.body.publicKey;
	let secret = req.body.secret;

	if (!(token in tokens)) {
		res.status(400).send({message: "Invalid token"});
	} else {
		var clientPair = tokens[token];
		if (clientPair.client1 == null && clientPair.connections < 1) {
			clientPair.client1 = new Client("TODO:socket", publicKey);
			clientPair.connections++;
			clientPair.lastUsed = Date.now();
		} else if (clientPair.client2 == null && clientPair.connections < 2) {
			clientPair.client2 = new Client("TODO:socket", publicKey);
			clientPair.connections++;
			clientPair.lastUsed = Date.now();
		} else {
			// There is already a connection established
			// TODO might expand the functionallity so that more parties can join 
			// Then I will need to figure out how to send them the already established AES key
			// (they can probably obtain it from one of the other clients)
			res.status(400).send({message: "Invalid token"});
		}
	}
	console.log(token, publicKey, secret);
	console.log("tokens:", tokens)

});

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