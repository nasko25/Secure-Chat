const express = require("express");
const crypto = require("crypto")
const app = express();
const port = process.env.PORT || 9000;
const bodyParser = require("body-parser");

app.use(bodyParser.json());

app.listen(port, () => console.log(`Server listening on port ${port}`));

app.get("/api", (req, res) => {
	res.send({ api: "api test!" });
});

app.post("/verify_token", (req, res) => {
	console.log(req.body);
	res.end();
});

app.get("/generate_token", (req, res) => {
	crypto.randomBytes(24, function(err, buffer) {
	  if (err) {
		console.log(err);
		res.end();
	  }
	  if (buffer)
		res.send({token: buffer.toString('hex')});
	  else
		res.end();
	});
});