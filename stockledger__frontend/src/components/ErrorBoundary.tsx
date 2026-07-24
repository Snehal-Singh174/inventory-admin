import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

// Allow DhiWise platform to hook into uncaught errors
declare global {
  interface Window {
    __COMPONENT_ERROR__?: (error: Error, errorInfo: ErrorInfo) => void;
  }
}

/**
 * Root-level error boundary.
 * Catches uncaught render errors in any child subtree and shows a
 * recovery screen using design tokens (no hardcoded colors).
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message ?? 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error & { __ErrorBoundary?: boolean }, errorInfo: ErrorInfo): void {
    error.__ErrorBoundary = true;
    window.__COMPONENT_ERROR__?.(error, errorInfo);
  }

  private handleReload = (): void => {
    // Full reload clears React state and re-mounts the app cleanly
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/inventory';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-background px-4"
          role="main"
        >
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div
              className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-errorBackground
                         flex items-center justify-center"
            >
              <AlertTriangle
                size={26}
                strokeWidth={2}
                className="text-error"
                aria-hidden="true"
              />
            </div>

            {/* Heading */}
            <h1 className="text-xl font-bold text-onBackground mb-2">
              This page couldn't load
            </h1>

            {/* Specific message */}
            <p className="text-sm text-muted-foreground mb-1 leading-relaxed">
              An unexpected error stopped this screen from rendering.
            </p>
            <p className="text-xs font-mono text-muted-foreground bg-muted border border-border
                          rounded px-3 py-2 mb-8 text-left break-all">
              {this.state.errorMessage}
            </p>

            {/* Recovery actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 h-10 px-5
                           bg-primary text-onPrimary text-sm font-semibold rounded-lg
                           hover:bg-primary-500 active:scale-[0.98]
                           transition-all duration-150
                           focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
                Reload page
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center h-10 px-5
                           border border-border bg-surface text-onSurface text-sm
                           font-medium rounded-lg hover:bg-muted
                           transition-colors duration-150
                           focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Go to Inventory
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
