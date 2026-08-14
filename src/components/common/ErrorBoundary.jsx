import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      globalThis.appStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Terjadi Kesalahan pada Halaman Preview</h2>
            <p className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 text-left overflow-x-auto max-h-32">
              {this.state.error?.toString() || "Unknown rendering error"}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Muat Ulang Halaman
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
              >
                Reset Data & Cache
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
