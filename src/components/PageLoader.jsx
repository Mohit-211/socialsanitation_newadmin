import { Spin } from "antd";

/** Shown while a page's code is loading (see src/routes/AppRoutes.jsx). */
const PageLoader = ({ fullScreen = false }) => (
  <div
    className={`page-loader${fullScreen ? " page-loader--full" : ""}`}
    role="status"
    aria-live="polite"
  >
    <Spin size="large" />
  </div>
);

export default PageLoader;
