import { Component, type ErrorInfo, type ReactNode } from 'react';
import { LogoMark } from '@/components/Logo';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App render failed:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-5">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <LogoMark size={32} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Takhayal needs a refresh</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Something unexpected interrupted the page. Refreshing usually restores your session.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="min-h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-ember-hover"
          >
            Refresh page
          </button>
        </div>
      </main>
    );
  }
}
