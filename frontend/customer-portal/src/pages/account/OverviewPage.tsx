import { Link } from "react-router-dom";
import {
  FileText,
  ShoppingBag,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { SEOHead } from "@/components/common/SEOHead";
export default function OverviewPage() {
  const user = useAuthStore((s) => s.user);
  return (
    <>
      <SEOHead title="Your account" />
      <h1 className="content-title mb-6">
        Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
      </h1>
      <p className="text-text-muted text-sm mb-8">
        Your next order, your latest quotation and a direct line to our team.
      </p>
      <div className="account-stats">
        {[
          [
            "/account/orders",
            "Your orders",
            "Track progress and review payment status.",
            ShoppingBag,
          ],
          [
            "/account/wholesale",
            "Your quotations",
            "Review requirements, prices and terms.",
            FileText,
          ],
          [
            "/account/chat",
            "Conversations",
            "Stay in touch with our team.",
            MessageCircle,
          ],
        ].map(([url, title, desc, Icon]) => {
          const Symbol = Icon as typeof FileText;
          return (
            <Link key={String(url)} to={String(url)}>
              <Symbol />
              <h2>{String(title)}</h2>
              <p>{String(desc)}</p>
              <ArrowUpRight size={20} className="mt-6 text-primary" />
            </Link>
          );
        })}
      </div>
    </>
  );
}
