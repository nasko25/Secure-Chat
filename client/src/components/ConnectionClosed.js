import React from "react";
import "./index.css"

export default function ConnectionClosed(props) {
	return (
		<div className = "indexPage mainView">
			<div className = "invalidTokenMessage">
				<h2> Sorry the connection closed. </h2>
				<h2> This is probably because you have used the session for too long or the other client has disconnected. </h2>

				<h3 className = "goBackMsg"> You can <a href = "./" className = "goBackLink"> Go back</a> to start a new session. </h3>
			</div>
		</div>
	);
}