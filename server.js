const express = require("express");
const app = express();
const port = process.env.PORT || 9000;

app.listen(port, () => console.log(`Server listening on port ${port}`));

app.get("/api", (req, res) => {
	res.send({ api: "api test!" });
});