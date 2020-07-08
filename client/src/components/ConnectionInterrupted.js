import React from "react";
import "./index.css"

export default function ConnectionInterrupted(props) {
	return (
		<div className = "indexPage mainView">
			<div className = "invalidTokenMessage">
				<h2> Sorry the connection was interrupted. </h2>
				<h2> This should not normally happen. It means that the secret the initiator of the connection chose was not signed properly
					or the message was not encrypted properly. </h2>
                <h2> It usually means that the message was intercepted by a third party. </h2>
                <h3> More information on how the website works can be found on the github <a href = "https://github.com/nasko25/Secure-Chat/" className = "goBackLink">page</a> of the project. </h3>

				<h3 className = "goBackMsg"> <a href = "./" className = "goBackLink"> Go back</a> and try again. </h3>
			</div>
		</div>
	);
}