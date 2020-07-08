import MainView from "./MainView.js";
import InitilizeConnection from "./InitilizeConnection.js";
import { withRouter } from "react-router-dom";
import io from 'socket.io-client';


const socket = io();

const MainViewWithRouter = withRouter(MainView);

const InitilizeConnectionWithRouter =  withRouter(InitilizeConnection);

export { socket, MainViewWithRouter, InitilizeConnectionWithRouter }