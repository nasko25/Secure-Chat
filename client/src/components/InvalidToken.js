import React from "react";
import { Link } from "react-router-dom";
import "./index.css"

export default function InvalidToken(props) {
	return (
		<div className = "indexPage mainView">
			<div className = "invalidTokenMessage">
				<h2> Sorry the token is invalid. </h2>
				<h2> This might be caused by an expired session or just by an invalid token provided. </h2>

				<h3 className = "goBackMsg"> You can <Link to = "/" className = "goBackLink"> Go back</Link> to generate a new link. </h3>
			</div>
		</div>
	);
}