import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ToastProvider } from "./components/ToastProvider";
import { HelmetProvider } from "react-helmet-async";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/theme.css";
import "./styles/auth.css";
import "./styles/toast.css";
import "./styles/dashboard.css";
import "./styles/modal.css";
import "./styles/profile.css";
import "./styles/static-pages.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
    </HelmetProvider>
  </React.StrictMode>
);
