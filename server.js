const express = require("express");
const crypto = require("crypto")
const app = express();
const port = process.env.PORT || 9000;
const bodyParser = require("body-parser");

// TODO clear the tokens that have stayed for too long
let tokens = [];

app.use(bodyParser.json());

app.listen(port, () => console.log(`Server listening on port ${port}`));

app.get("/api", (req, res) => {
	res.send({ api: "api test!" });
});

app.post("/verify_token", (req, res) => {
	console.log(req.body);
	let token = req.body.token;
	if (!(token in tokens)) {
		res.status(400).end();
		//res.send("Sorry the token is invalid.\nThis might be caused by an expired session or just by an invalid token provided.")
	}
	res.end();
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
		tokens.push(token);
	  }
	  else
		res.end();
	});
});