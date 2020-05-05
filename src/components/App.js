import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import MainView from "./MainView.js"
import './index.css'


// TODO https://reacttraining.com/react-router/web/example/query-parameters     query parameters (chat id will be a parameter)
export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path = "/">
          <InitilizeConnection/>
        </Route>
        <Route path = "/chat">
          <MainView />
        </Route>
      </Switch>
    </Router>
  );
}

function InitilizeConnection() {
  return (
    <div>
      <p >Index page. </p>
      <Link to = "chat"> Link </Link>
    </div>
  );
}
