import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Use HashRouter when deployed to GitHub Pages (no server-side routing).
// Use BrowserRouter for Docker/local (clean URLs via nginx SPA fallback).
const isGitHubPages =
  typeof window !== "undefined" &&
  window.location.hostname.endsWith("github.io");

const Router = isGitHubPages ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
