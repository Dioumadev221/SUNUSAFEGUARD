import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import { PrefsProvider } from "./lib/prefs";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PrefsProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </PrefsProvider>
  </React.StrictMode>,
);
