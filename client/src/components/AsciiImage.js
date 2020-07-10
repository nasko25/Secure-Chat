import React from 'react';

export default class AsciiImage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            index: 0
        };
        /* 
            All lines of the ascii image should have the same length, otherwise the image might not load properly !
            Also for some reason, they need a character in the very beginning or they are not aligned properly.
            But this character can be transparent ( or even "display:none;" ! - tested on Chrome )
        */
        this.images = [
(<pre>
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
</pre>),
(<pre>
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
</pre>),
(<pre>
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
</pre>),
(<pre>
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
</pre>),
(<pre>
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
</pre>),
(<pre>
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
</pre>),
(<pre>
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
</pre>)
        ];
    }

    componentDidMount() {
        // choose a random ascii image from the array
        this.setState({
            index: Math.floor(Math.random() * Math.floor(this.images.length))
        });
    }
    render() {
        return this.images[this.state.index];
    }
}