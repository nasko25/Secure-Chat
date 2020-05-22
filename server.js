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
		res.status(400).send({message: "Invalid token"});
		//res.send("Sorry the token is invalid.\nThis might be caused by an expired session or just by an invalid token provided.")
	} else{
		res.send({})
	}
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