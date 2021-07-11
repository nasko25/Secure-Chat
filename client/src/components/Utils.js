import MainView from "./MainView.js";
import InitilizeConnection from "./InitilizeConnection.js";
import { withRouter } from "react-router-dom";
import io from 'socket.io-client';

                        // use /socket as the socket.io path
const socket = io({ path: "/socket" });

const MainViewWithRouter = withRouter(MainView);

const InitilizeConnectionWithRouter =  withRouter(InitilizeConnection);

export { socket, MainViewWithRouter, InitilizeConnectionWithRouter }
