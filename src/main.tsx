import "@fontsource-variable/roboto";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App as AntApp, ConfigProvider } from "antd";
import { buildAntdTheme } from "./theme/antdTheme";
import App from "./App";

// index.css is loaded above, so its design tokens can be read here.
const theme = buildAntdTheme();

// Static helpers such as message.success() and Modal.confirm() render outside
// the React tree; this gives them the same theme as everything else.
ConfigProvider.config({
  holderRender: (children) => (
    <ConfigProvider theme={theme}>{children}</ConfigProvider>
  ),
});

const root = document.getElementById("root");
if (!root) throw new Error("The page has no #root element to render into.");

createRoot(root).render(
  <StrictMode>
    <ConfigProvider theme={theme}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
);
