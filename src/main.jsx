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
import "./styles/portfolio.css";
import "./styles/contracts.css";
import "./styles/inbound.css";
import "./styles/media-kit.css";
import "./styles/media-kit-editor.css";
import "./styles/money.css";
import "./styles/brands.css";
import "./styles/rates.css";
import "./styles/deal-analyzer.css";
import "./styles/deal-workspace.css";
import "./styles/deliverables.css";
import "./styles/intelligence.css";
import "./styles/roi.css";
import "./styles/static-pages.css";
import "./styles/final-ui.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
    </HelmetProvider>
  </React.StrictMode>
);
