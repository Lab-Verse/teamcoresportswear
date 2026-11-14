import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <TopBar />
      {import.meta.env.VITE_LOCAL_PREVIEW === "true" && (
        <div className="tc-local-notice">
          <strong>Local review:</strong> source-reference designs and test data.
          Commercial details require confirmation; payments and outbound email
          are disabled.
        </div>
      )}
      <Header />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
