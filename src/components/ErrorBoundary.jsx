import { Component } from "react";
import i18n from "@/i18n";

/** Shows a friendly screen instead of a blank page if something crashes */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("APP ERROR:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const t = i18n.t.bind(i18n);
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="max-w-md text-center">
          <img src="/logo-mark.png" alt="TechZhop" className="w-16 h-16 mx-auto mb-6 rounded-full" />
          <h1 className="text-2xl font-bold mb-3">{t("errorPage.title")}</h1>
          <p className="text-gray-400 mb-6">{t("errorPage.text")}</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-3 rounded-lg border-0 cursor-pointer"
          >
            {t("errorPage.home")}
          </button>
        </div>
      </div>
    );
  }
}
