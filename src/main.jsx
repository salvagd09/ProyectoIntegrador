import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Principal from "./Principal";
import "./index.css";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Principal />
    </BrowserRouter>
  </StrictMode>
);
