"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ChartErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            className="card-inset flex min-h-40 items-center justify-center px-4 py-8 text-center text-sm"
            style={{ color: "var(--fg-muted)" }}
          >
            Chart could not be displayed.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
