import React from "react";
import { Link } from "react-router-dom";
import "./index.css"

export default function ConnectionClosed(props) {
	return (
		<div className = "indexPage mainView">
			<div className = "invalidTokenMessage">
				<h2> Sorry the connection closed. </h2>
				<h2> This is probably caused because you have used the session for too long. </h2>

				<h3 className = "goBackMsg"> You can <Link to = "/" className = "goBackLink"> Go back</Link> to start a new session. </h3>
			</div>
		</div>
	);
}
// TODO now if you 'Go back' the handshake does not work properly