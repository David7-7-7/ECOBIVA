import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/dashboard.css";
import App from "./App";

import "./assets/css/global.css";

import { LayoutProvider } from "./context/LayoutContext";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <LayoutProvider>
        <App />
      </LayoutProvider>
    </AuthProvider>
  </BrowserRouter>,
);
