import { Component, ReactNode, ErrorInfo } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; info: string; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, info: '' };
  private _didCatch = false;

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, info: '' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (this._didCatch) return;
    this._didCatch = true;
    const msg = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    const compStack = info?.componentStack || '';
    console.error('ErrorBoundary caught:', msg, compStack);
    this.setState({ info: msg || compStack || 'Unknown error' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h2>
            <p className="text-gray-500 mb-4 text-sm">Maaf, terjadi kesalahan yang tidak terduga. Silakan muat ulang halaman.</p>
            <p className="text-xs text-gray-400 mb-6 bg-gray-50 p-3 rounded-lg text-left font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">{this.state.info}</p>
            <button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-lg font-semibold transition-colors">
              <i className="fas fa-sync-alt mr-2"></i>Muat Ulang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
