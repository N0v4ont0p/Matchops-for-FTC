import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

class RootErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean }> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="page">
          <section className="panel">
            <h1>Matchops encountered a runtime error</h1>
            <p className="muted">Refresh the page. If this persists, redeploy the latest commit and verify Firebase and FTCScout settings.</p>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
