import React, { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (
      msg.includes('NotAllowedError') || msg.includes('Permission') || msg.includes('audio') ||
      msg.includes('media') || msg.includes('SecurityError') || msg.includes('key') || msg.includes('plugin')
    ) {
      console.warn('[O1 FC Global Guard] Handled unhandled rejection:', reason);
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (event?.message?.includes('SecurityError') || event?.message?.includes('localStorage') || event?.message?.includes('plugin')) {
      console.warn('[O1 FC Global Guard] Handled startup error:', event.message);
      event.preventDefault();
    }
  });
}

interface RootBoundaryProps {
  children: ReactNode;
}

interface RootBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<RootBoundaryProps, RootBoundaryState> {
  override state: RootBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<RootBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[O1 FC Launch Guard]:', error, errorInfo);
  }

  handleReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-16 h-16 rounded-2xl bg-[#C4121A]/10 border border-[#C4121A]/40 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(196,18,26,0.3)]">
            <span className="text-2xl font-black text-[#C4121A]">O1</span>
          </div>
          <h1 className="text-base font-bold uppercase tracking-wider mb-2 text-neutral-100 font-mono">
            Starting O1 FC...
          </h1>
          <p className="text-xs text-neutral-400 max-w-sm mb-6 leading-relaxed">
            Initializing tactical performance engine and offline storage.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="px-6 py-2.5 rounded-xl bg-[#C4121A] hover:bg-[#A30F16] text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer active:scale-95"
          >
            Retry Launch
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      </StrictMode>
    );
  }
} catch (startupError) {
  console.error('[O1 FC Cold Boot Exception Caught]:', startupError);
  const el = document.getElementById('root');
  if (el) {
    el.innerHTML = `
      <div style="min-height:100vh;width:100%;background:#09090b;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;text-align:center;padding:24px;">
        <div style="width:64px;height:64px;border-radius:16px;background:rgba(196,18,26,0.1);border:1px solid rgba(196,18,26,0.4);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:24px;font-weight:900;color:#C4121A;">O1</span>
        </div>
        <h1 style="font-size:16px;font-weight:700;letter-spacing:1px;margin:0 0 8px 0;text-transform:uppercase;">Starting O1 FC...</h1>
        <p style="font-size:12px;color:#a3a3a3;margin:0 0 24px 0;">Initializing performance system</p>
        <button onclick="window.location.reload()" style="padding:10px 24px;border-radius:12px;background:#C4121A;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer;text-transform:uppercase;">Retry Launch</button>
      </div>`;
  }
}
