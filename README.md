## Description
This will hopefully be a secure chat web application that is implemented in a very secure way - using cryptographic principles to ensure that the messages sent between the clients are impossible to be read by a third party.

## Install the needed dependencies 
Run 
``` bash 
npm install
cd client 
npm install
```
to download both the server and react client needed dependencies.

## How to run 
You could either run 
``` bash 
npm run startAll 
```
to run both the server and react client scripts at the same time, or run
``` bash 
npm start 
```
in the home directory to start the server and then on a different terminal run 
``` bash
cd client
npm start 
```

## How does it work?
TODO
When a user opens the page to create a new connection, they can input a secret. This secret is meant to prove that the user is who they say they are, because a link will be shared through a somewhat untrusted medium. It will not function as a "password" type of shared secret, because it will be shared in plain text, but it should be used to somehow identify the initiator of the connection. It could even be a sentence or even a paragraph. It would be best if the secret is decided through a safe medium, but if absolutely necessary, it could be a previously shared secret that both parties can recognize.
This secret could also be empty, so the user decides if it is really needed.
    
When the secret is chosen, the browser will sign the secret with a generated RSA private key, and will send the public key of the client, together with the signed secret to the server.
This is important, because in this way the other client can be sure that the public key is also authentic.