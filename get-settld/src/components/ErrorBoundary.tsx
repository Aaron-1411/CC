import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface State { error: Error | null; ref: string | null; }

/**
 * App-wide error boundary. Catches render errors in the tree, logs a
 * stable reference id (so users can quote it to support) and offers
 * recovery without losing the rest of the app shell. Designed to be
 * forwarded to a remote logger later (Sentry/Logflare) without changing
 * the public API.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, ref: null };

  static getDerivedStateFromError(error: Error): State {
    // Short, non-PII reference users can paste into a support email.
    const ref = `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return { error, ref };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", this.state.ref, error, info?.componentStack);
    // Hook for future remote reporting:
    //   reportError({ ref: this.state.ref, message: error.message, stack: error.stack, componentStack: info?.componentStack });
  }

  reset = () => this.setState({ error: null, ref: null });

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <AlertTriangle className="w-10 h-10 mx-auto text-warning mb-3" aria-hidden="true" />
            <h2 className="font-serif text-2xl font-bold text-brand mb-2">
              Something went wrong in this tool
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              {this.state.error.message || "An unexpected error occurred."}
            </p>
            {this.state.ref && (
              <p className="text-xs text-muted-foreground mb-4">
                Reference:{" "}
                <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{this.state.ref}</code>
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={this.reset} className="bg-brand text-brand-foreground hover:bg-brand/90">
                Try again
              </Button>
              <Button variant="outline" onClick={() => { window.location.href = "/"; }}>
                Back to home
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
