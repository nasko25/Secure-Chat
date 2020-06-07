import React from "react";
import { Link } from "react-router-dom";
import "./index.css"

export default function NotFound(props) {
	return (
		<div className = "indexPage mainView">
			<div className = "invalidTokenMessage">
				<h1> Page not found :( </h1>
				<h2> Sorry the page was not found. </h2>

				<h3 className = "goBackMsg"> You can <Link to = "/" className = "goBackLink"> Go back</Link>. </h3>
			</div>
		</div>
	);
}