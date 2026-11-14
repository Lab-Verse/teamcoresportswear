import { Outlet, Link } from "react-router-dom";
import { Brand } from "@/components/common/Brand";
export function AuthLayout() {
  return (
    <div className="auth-shell">
      <aside>
        <Brand inverse />
        <div>
          <p className="eyebrow">WELCOME TO YOUR NEXT CHAPTER</p>
          <h2>
            One account.
            <br />
            Every game.
          </h2>
          <p>
            Keep your orders, wholesale quotes and conversations in one place.
          </p>
        </div>
        <Link to="/products">← Back to the range</Link>
      </aside>
      <main>
        <div className="auth-card">
          <Outlet />
        </div>
        <p className="text-sm text-text-muted mt-8">
          <Link to="/privacy-policy">Privacy</Link> ·{" "}
          <Link to="/help">Need a hand?</Link>
        </p>
      </main>
    </div>
  );
}
