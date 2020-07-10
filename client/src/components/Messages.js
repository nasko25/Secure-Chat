import React from 'react';
import forge from "node-forge";
import { fromBase64 } from "./util.js";

/*
 * move the state to the parent MainView to be able to pass a addMessageToView() function
 * to the send button.
 * OR use react-redux to store the state of MessagesView ?
 * OR give a reference to the addMessageToView() method inside of the MessagesView component
 * to the parent component so that the parent can give this reference to the other child component ?
  I went with the last approach. Might need to refactor later.
*/
export default class MessagesView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messagesJson: { }
    };

    props.setParentReference(this.addMessageToView);
  }

  /*
    Adds a messageToAdd to the view.
    Note that the messageToAdd is expected to be an object with the following format:

    {
      "messageId" : {
        message: "some message",
        mine: true/false,
        time: *a Date object indicating when the message was created*
      }
    }

    "messageId" is indeed a string used as the key for the actual message that will be added to the
    messages view.
  */
  addMessageToView(messageToAdd) {
    var event = new CustomEvent("newMessage", { detail: { messageToAdd: messageToAdd }});

    // trigger the "newMessage" event
    document.dispatchEvent(event);
  }

  renderAllMessages() {
    var { messagesJson } = this.state;

    // list of messages to return
    var messages = [];
    for (var message in messagesJson) {
      messages.push(
        <Message
          key = { message }
          message = { messagesJson[message].message }
          mine = { messagesJson[message].mine }
        />
      );
    }
    return messages;
  }

  componentDidMount() {

    this.handler = (event) => {
        var messageToAdd = event.detail.messageToAdd;
        var nextId;
        // messageToAdd's id must be unique and follow the order of the this.state.messagesJson object's keys
        // if the messagesJson object has less than 1 element, set the id of the next message to 1 (it will be the initial message)
        if (Object.keys(this.state.messagesJson).length < 1) {
          nextId = 1;
        } // otherwise set the id to the biggest index in the object + 1
        else {
                        // get the key of the object with the highest key                                           and increment it
          nextId = parseInt(Object.keys(this.state.messagesJson).reduce((a, b) => messageToAdd[a] > messageToAdd[b] ? a : b)) + 1;
        }

        // change the old "messageId" key to be nextId, so that the id is a unique number and can be displayed
        if ("messageId" !== nextId) {
            Object.defineProperty(messageToAdd, nextId,
                Object.getOwnPropertyDescriptor(messageToAdd, "messageId"));
            delete messageToAdd["messageId"];
        }
        this.setState({messagesJson: {...this.state.messagesJson, ...messageToAdd}});
    };

    // is this allowed when using react?
    document.addEventListener("newMessage", this.handler);

    // get the socket from props
    var socket = this.props.socket;

    // if the socket was passed from the parent component
    if (socket) {
      // handle received messages
      socket.on("message", (data) => {
        // get the encryption key
        var encryptionKey = this.props.encryptionKey;
        // if the encryption key was set
        if (encryptionKey) {
          try {
            // get the encryption key and the iv from the parameters passed from the parent component to encrypt the message to the other client
            // the encryption key was converted to a hex string representation, so now it should be converted to a byte representation
            var key = forge.util.hexToBytes(encryptionKey);
            var iv = this.props.iv;

            // get the byte representation of the message from its receieved hex representation
            var encrypted = data.message.message;
            // decipher the message
            var decipher = forge.cipher.createDecipher('AES-CBC', key);
            decipher.start({iv: iv});console.log(encrypted)
            decipher.update(forge.util.createBuffer(forge.util.hexToBytes(encrypted)));
            var result = decipher.finish();
            // if there was a problem with the decrypting
            if (!result) {
              console.error("There was an error with decrypting");
              this.props.redirectToConnectionInterrupted();
            }
            data.message.message = fromBase64(decipher.output.data);
            // add the message received from the server to the view
            this.addMessageToView({
              "messageId": data.message
            });

            // autoscroll if the user has not manually scrolled up
            setTimeout(function() {
              var scrollView = document.getElementById("messagesView");

              // if the client has not scrolled up, autoscroll is activated
              if (Math.abs(scrollView.scrollTop - scrollView.scrollHeight) <= (scrollView.clientHeight + 44.5)) {   // TODO 44.5 - magic value (document.getElementsByClassName("compose")[0].clientHeight ?)
                scrollView.scrollTop = scrollView.scrollHeight;
              }
            }, 100);
          }
          catch(err) {
            console.error("There was an error with decrypting");
            console.error(err);
            this.props.redirectToConnectionInterrupted();
          }
        }
      });
    }
  }

  // TODO display times?
  // TODO random ascii art and properly format/escape it
  // font-family: "Courier New", Courier, monospace;
  render() {
    return (
      <div id = "messagesView">
        <div style = {{textAlign: "center", fontFamily: "Courier" }}>
        <pre>
<span className = "invisible">|</span>        69696969                         69696969        <br/>
<span className = "invisible">|</span>     6969    696969                   696969    6969     <br/>
<span className = "invisible">|</span>   969    69  6969696               6969  6969     696   <br/>
<span className = "invisible">|</span>  969        696969696             696969696969     696  <br/>
<span className = "invisible">|</span> 969        69696969696           6969696969696      696 <br/>
<span className = "invisible">|</span> 696      9696969696969           969696969696       969 <br/>
<span className = "invisible">|</span>  696     696969696969             969696969        969  <br/>
<span className = "invisible">|</span>   696     696  96969      _=_      9696969  69    696   <br/>
<span className = "invisible">|</span>     9696    969696      q(-_-)p      696969    6969     <br/>
<span className = "invisible">|</span>        96969696         '_) (_`         69696969        <br/>
<span className = "invisible">|</span>           96            /__/  \            69           <br/>
<span className = "invisible">|</span>           69          _(&lt;_   / )_          96           <br/>
<span className = "invisible">|</span>          6969        (__\_\_|_/__)        9696          <br/>
<br/>
<br/>
<br/>
<br/>
<span className = "invisible">|</span>             .--'''''''''--.              <br/>
<span className = "invisible">|</span>          .'      .---.      '.           <br/>
<span className = "invisible">|</span>         /    .-----------.    \          <br/>
<span className = "invisible">|</span>        /        .-----.        \         <br/>
<span className = "invisible">|</span>        |       .-.   .-.       |         <br/>
<span className = "invisible">|</span>        |      /   \ /   \      |         <br/>
<span className = "invisible">|</span>         \    | .-. | .-. |    /          <br/>
<span className = "invisible">|</span>          '-._| | | | | | |_.-'           <br/>
<span className = "invisible">|</span>              | '-' | '-' |               <br/>
<span className = "invisible">|</span>               \___/ \___/                <br/>
<span className = "invisible">|</span>            _.-'  /   \  `-._             <br/>
<span className = "invisible">|</span>          .' _.--|     |--._ '.           <br/>
<span className = "invisible">|</span>          ' _...-|     |-..._ '           <br/>
<span className = "invisible">|</span>                 |     |                  <br/>
<span className = "invisible">|</span>                 '.___.'                  <br/>
<span className = "invisible">|</span>                   | |                    <br/>
<span className = "invisible">|</span>                  _| |_                   <br/>
<span className = "invisible">|</span>                 /\( )/\                  <br/>
<span className = "invisible">|</span>                /  ` '  \                 <br/>
<span className = "invisible">|</span>               | |     | |                <br/>
<span className = "invisible">|</span>               '-'     '-'                <br/>
<span className = "invisible">|</span>               | |     | |                <br/>
<span className = "invisible">|</span>               | |     | |                <br/>
<span className = "invisible">|</span>               | |-----| |                <br/>
<span className = "invisible">|</span>            .`/  |     | |/`.             <br/>
<span className = "invisible">|</span>            |    |     |    |             <br/>
<span className = "invisible">|</span>            '._.'| .-. |'._.'             <br/>
<span className = "invisible">|</span>                  \ | /                   <br/>
<span className = "invisible">|</span>                  | | |                   <br/>
<span className = "invisible">|</span>                  | | |                   <br/>
<span className = "invisible">|</span>                  | | |                   <br/>
<span className = "invisible">|</span>                 /| | |\                  <br/>
<span className = "invisible">|</span>               .'_| | |_`.                <br/>
<span className = "invisible">|</span>               `. | | | .'                <br/>
<span className = "invisible">|</span>            .    /  |  \    .             <br/>
<span className = "invisible">|</span>           /o`.-'  / \  `-.`o\            <br/>
<span className = "invisible">|</span>          /o  o\ .'   `. /o  o\           <br/>
<span className = "invisible">|</span>          `.___.'       `.___.'           <br/>
<br/>
<br/>
<br/> {/* All lines of the ascii image should have the same length, otherwise it might not load properly ! */}
<span className = "invisible">|</span>                         _____                         <br/>
<span className = "invisible">|</span>                      ,-'     `._                      <br/>
<span className = "invisible">|</span>                    ,'           `.        ,-.         <br/>
<span className = "invisible">|</span>                  ,'               \       ),.\        <br/>
<span className = "invisible">|</span>        ,.       /                  \     /(  \;       <br/>
<span className = "invisible">|</span>       /'\\     ,o.        ,ooooo.   \  ,'  `-')       <br/>
<span className = "invisible">|</span>       )) )`. d8P"Y8.    ,8P"""""Y8.  `'  .--"'        <br/>
<span className = "invisible">|</span>      (`-'   `Y'  `Y8    dP       `'     /             <br/>
<span className = "invisible">|</span>       `----.(   __ `    ,' ,---.       (              <br/>
<span className = "invisible">|</span>              ),--.`.   (  ;,---.        )             <br/>
<span className = "invisible">|</span>             / \O_,' )   \  \O_,'        |             <br/>
<span className = "invisible">|</span>            ;  `-- ,'       `---'        |             <br/>
<span className = "invisible">|</span>            |    -'         `.           |             <br/>
<span className = "invisible">|</span>           _;    ,            )          :             <br/>
<span className = "invisible">|</span>        _.'|     `.:._   ,.::" `..       |             <br/>
<span className = "invisible">|</span>     --'   |   .'     """         `      |`.           <br/>
<span className = "invisible">|</span>           |  :;      :   :     _.       |`.`.-'--.    <br/>
<span className = "invisible">|</span>           |  ' .     :   :__.,'|/       |  \          <br/>
<span className = "invisible">|</span>           `     \--.__.-'|_|_|-/        /   )         <br/>
<span className = "invisible">|</span>            \     \_   `--^"__,'        ,    |         <br/>
<span className = "invisible">|</span>      -hrr- ;  `    `--^---'          ,'     |         <br/>
<span className = "invisible">|</span>             \  `                    /      /          <br/>
<span className = "invisible">|</span>              \   `    _ _          /                  <br/>
<span className = "invisible">|</span>               \           `       /                   <br/>
<span className = "invisible">|</span>                \           '    ,'                    <br/>
<span className = "invisible">|</span>                 `.       ,   _,'                      <br/>
<span className = "invisible">|</span>                   `-.___.---'                         <br/>
<br/>
<br/>
<br/>
<span className = "invisible">|</span>                                                     .""--.._                    <br/>
<span className = "invisible">|</span>                                                    []      `'--.._              <br/>
<span className = "invisible">|</span>                                                    ||__           `'-,          <br/>
<span className = "invisible">|</span>                                                  `)||_ ```'--..       \         <br/>
<span className = "invisible">|</span>                              _                    /|//&#125;        ``--._  |        <br/>
<span className = "invisible">|</span>                           .'` `'.                /////&#125;              `\/        <br/>
<span className = "invisible">|</span>                          /  .""".\              //&#123;///                          <br/>
<span className = "invisible">|</span>                         /  /_  _`\\            // `||                           <br/>
<span className = "invisible">|</span>                         | |(_)(_)||          _//   ||                           <br/>
<span className = "invisible">|</span>                         | |  /\  )|        _///\   ||                           <br/>
<span className = "invisible">|</span>                         | |L====J |       / |/ |   ||                           <br/>
<span className = "invisible">|</span>                        /  /'-..-' /    .'`  \  |   ||                           <br/>
<span className = "invisible">|</span>                       /   |  :: | |_.-`      |  \  ||                           <br/>
<span className = "invisible">|</span>                      /|   `\-::.| |          \   | ||                           <br/>
<span className = "invisible">|</span>                    /` `|   /    | |          |   / ||                           <br/>
<span className = "invisible">|</span>                  |`    \   |    / /          \  |  ||                           <br/>
<span className = "invisible">|</span>                 |       `\_|    |/      ,.__. \ |  ||                           <br/>
<span className = "invisible">|</span>                 /                     /`    `\ ||  ||                           <br/>
<span className = "invisible">|</span>                |           .         /        \||  ||                           <br/>
<span className = "invisible">|</span>                |                     |         |/  ||                           <br/>
<span className = "invisible">|</span>                /         /           |         (   ||                           <br/>
<span className = "invisible">|</span>               /          .           /          )  ||                           <br/>
<span className = "invisible">|</span>              |            \          |             ||                           <br/>
<span className = "invisible">|</span>             /             |          /             ||                           <br/>
<span className = "invisible">|</span>            |\            /          |              ||                           <br/>
<span className = "invisible">|</span>            \ `-._       |           /              ||                           <br/>
<span className = "invisible">|</span>             \ ,//`\    /`           |              ||                           <br/>
<span className = "invisible">|</span>              ///\  \  |             \              ||                           <br/>
<span className = "invisible">|</span>             |||| ) |__/             |              ||                           <br/>
<span className = "invisible">|</span>             |||| `.(                |              ||                           <br/>
<span className = "invisible">|</span>             `\\` /`                 /              ||                           <br/>
<span className = "invisible">|</span>                /`                   /              ||                           <br/>
<span className = "invisible">|</span>          jgs  /                     |              ||                           <br/>
<span className = "invisible">|</span>              |                      \              ||                           <br/>
<span className = "invisible">|</span>             /                        |             ||                           <br/>
<span className = "invisible">|</span>           /`                          \            ||                           <br/>
<span className = "invisible">|</span>         /`                            |            ||                           <br/>
<span className = "invisible">|</span>         `-.___,-.      .-.        ___,'            ||                           <br/>
<span className = "invisible">|</span>                  `---'`   `'----'`                                              <br/>
<br/>
<br/>
<br/>
<span className = "invisible">|</span>                 ____==========_______              <br/>
<span className = "invisible">|</span>      _--____   |    | ""  " "|       \             <br/>
<span className = "invisible">|</span>     /  )8&#125;  ^^^| 0  |  =     |  o  0  |            <br/>
<span className = "invisible">|</span>   &lt;/_ +-==B vvv|""  |  =     | '  "" "|            <br/>
<span className = "invisible">|</span>      \_____/   |____|________|________|            <br/>
<span className = "invisible">|</span>               (_(  )\________/___(  )__)           <br/>
<span className = "invisible">|</span>                 |\  \            /  /\             <br/>
<span className = "invisible">|</span>                 | \  \          /  /\ \            <br/>
<span className = "invisible">|</span>                 | |\  \        /  /  \ \           <br/>
<span className = "invisible">|</span>                 (  )(  )       (  \   (  )         <br/>
<span className = "invisible">|</span>                  \  / /        \  \   \  \         <br/>
<span className = "invisible">|</span>                   \|  |\        \  \  |  |         <br/>
<span className = "invisible">|</span>                    |  | )____    \  \ \  )___      <br/>
<span className = "invisible">|</span>                    (  )  /  /    (  )  (/  /       <br/>
<span className = "invisible">|</span>                   /___\ /__/     /___\ /__/        <br/>
<br/>
<br/>
<br/>
<span className = "invisible">|</span>                 |||      |||                   <br/>
<span className = "invisible">|</span>                 | |  __  | |                   <br/>
<span className = "invisible">|</span>  |-|_____-----/   |_|  |_|   \-----_____|-|    <br/>
<span className = "invisible">|</span>  |_|_________&#123;   &#125;|  (^) |&#123;  &#125;__________|_|    <br/>
<span className = "invisible">|</span>   ||          |_| |   ^  | |_|          ||     <br/>
<span className = "invisible">|</span>   |              \|  /\  |/              |     <br/>
<span className = "invisible">|</span>   |               \ |--| /               |     <br/>
<span className = "invisible">|</span>   =               \ |__| /               =     <br/>
<span className = "invisible">|</span>   +               \      /               +     <br/>
<span className = "invisible">|</span>                    \    /                      <br/>
<span className = "invisible">|</span>                    \    /                      <br/>
<span className = "invisible">|</span>                     \  /                       <br/>
<span className = "invisible">|</span>                     \  /                       <br/>
<span className = "invisible">|</span>                     \  /                       <br/>
<span className = "invisible">|</span>                     \  /                       <br/>
<span className = "invisible">|</span>                     \  /                       <br/>
<span className = "invisible">|</span>                     \  /                       <br/>
<span className = "invisible">|</span>                      \/                        <br/>

<span className = "invisible">|</span>                                                          /\                     <br/>
<span className = "invisible">|</span>                                                         / .\                    <br/>
<span className = "invisible">|</span>                                                        (_/\_)                   <br/>
<span className = "invisible">|</span>                                                          )(                     <br/>
<span className = "invisible">|</span>                                                         /__\                    <br/>
<span className = "invisible">|</span>                                                       _/_/\_\_                  <br/>
<span className = "invisible">|</span>                                                      _/_/__\_\_                 <br/>
<span className = "invisible">|</span>                                                     _/_/_/\_\_\_                <br/>
<span className = "invisible">|</span>                                                    _/_/_/__\_\_\_               <br/>
<span className = "invisible">|</span>                                                  __/_/_/_/\_\_\_\__             <br/>
<span className = "invisible">|</span>                                                 _)__,________'____(_            <br/>
<span className = "invisible">|</span>                                                 )__________________(            <br/>
<span className = "invisible">|</span>                                                    |||      -   |               <br/>
<span className = "invisible">|</span>                                                    | _____-____ |               <br/>
<span className = "invisible">|</span>                                                    | |\      /| |               <br/>
<span className = "invisible">|</span>                                                    ' | \    / | |               <br/>
<span className = "invisible">|</span>                                                    | |  \  /  | |               <br/>
<span className = "invisible">|</span>                                                    | |   \/   | |               <br/>
<span className = "invisible">|</span>                                                    | |   /\   |'|               <br/>
<span className = "invisible">|</span>                                                    | |  /  \  | |               <br/>
<span className = "invisible">|</span>                                                   _| | /    \ | |_              <br/>
<span className = "invisible">|</span>                                                  //| |/      \|  \\             <br/>
<span className = "invisible">|</span>                                                 //|  /        \.                <br/>
<span className = "invisible">|</span>                                                //|  /    ||                     <br/>
<span className = "invisible">|</span>                                               //|  /   __||__                   <br/>
<span className = "invisible">|</span>                                              //|  ,   -__  __-                  <br/>
<span className = "invisible">|</span>                                         ____//|  /    '  ||   .                 <br/>
<span className = "invisible">|</span>                                        _)___/|  /   / /  ||    \                <br/>
<span className = "invisible">|</span>                                   /\   )__  \_ / __/_____/\_____\__             <br/>
<span className = "invisible">|</span>                                  /. \     |   / |__________________|            <br/>
<span className = "invisible">|</span>                                 (_/\_)    '  /   /.    ///\\\     \             <br/>
<span className = "invisible">|</span>                                   )(      |  |  |     /((  ))\ -   |            <br/>
<span className = "invisible">|</span>                                  //\\     | -|  |    /  \\//  \    |            <br/>
<span className = "invisible">|</span>   huummmhummmmmhummmmmm...      //  \\__,_|  |  | - /\   \/   /\ ' |__          <br/>
<span className = "invisible">|</span>          /      |              //-   \____|  |  /  / ()  ()  () \  \  '         <br/>
<span className = "invisible">|</span>                            ___// ./\    \ |  | /  /  /\  /\  /\  \  \ |         <br/>
<span className = "invisible">|</span>      ,```_     _```,       )__   //\\   |_|  - |  | //\\//\\//\\ |  -           <br/>
<span className = "invisible">|</span>       c   -   -   c          |  ((  )) -| | .| |  |((  )(  )(  ))|  |           <br/>
<span className = "invisible">|</span>      ./|-`     `-|\.         |  |\\//|  | |  | '  | \\//\\//\\// |  |           <br/>
<span className = "invisible">|</span>      /` \       /` \         |- | \/ |  | '  | |  |  \/  \/  \/  |  '           <br/>
<span className = "invisible">|</span>     /_|  \)   (/  |_\        |  | () |  | |  | |  |  ()  ()  ()  |  |           <br/>
<span className = "invisible">|</span>      | .__|   |__, |         |  |//\\|  - | -| |  |  /\  /\  /\  |  |           <br/>
<span className = "invisible">|</span>      |   |     |   |         | -|/  \|  | -  | ,  | //\\//\\//\\ '  |           <br/>
<span className = "invisible">|</span>      |   |     |   |       __|_ |    | _|_|  |_|_ |//  \(  )/  \\|  |__+        <br/>
<span className = "invisible">|</span>      |___\     /___|      _)___||____||___|  |___||__   \\//   __|__,  |        <br/>
<span className = "invisible">|</span>  ______===_____===_______|____|  |__|  |_,|__|__|   |____\/____|    | ,         <br/>
<span className = "invisible">|</span>                    __________________________________________b'ger __/          <br/>
</pre> </div>
        { this.renderAllMessages() }
      </div>
    );
  };

  componentWillUnmount() {
      document.removeEventListener("newMessage", this.handler);
  }
}

function Message(props) {
    return (
      <div className = "messageContiner">
        <div className = {`message${ props.mine ? ' mine' : '' }`}>
          { props.message }
        </div>
      </div>
    );
}

// export { MessagesView, Message }
