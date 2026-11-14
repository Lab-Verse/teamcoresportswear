import { Outlet, NavLink } from "react-router-dom";
import {
  UserRound,
  ShoppingBag,
  FileText,
  MapPin,
  Heart,
  Star,
  Bell,
  RotateCcw,
  MessageCircle,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { TopBar } from "./TopBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SEOHead } from "@/components/common/SEOHead";
const links = [
  ["/account", "Overview", LayoutDashboard],
  ["/account/profile", "Your profile", UserRound],
  ["/account/wholesale", "Quotes & enquiries", FileText],
  ["/account/designs", "My designs", Star],
  ["/account/orders", "Your orders", ShoppingBag],
  ["/account/addresses", "Addresses", MapPin],
  ["/account/wishlist", "Saved products", Heart],
  ["/account/reviews", "Reviews", Star],
  ["/account/returns", "Returns", RotateCcw],
  ["/account/notifications", "Notifications", Bell],
  ["/account/chat", "Conversations", MessageCircle],
  ["/account/settings", "Settings", Settings],
] as const;
export function AccountLayout() {
  return (
    <div>
      <SEOHead title="Your account" />
      <a href="#account-content" className="skip-to-content">
        Skip to account content
      </a>
      <TopBar />
      <Header />
      <div className="page-intro">
        <div className="container-main">
          <p className="eyebrow">YOUR TEAM CORE SPORTS WEAR ACCOUNT</p>
          <h1>Your team. Your account.</h1>
        </div>
      </div>
      <div className="container-main section account-layout">
        <nav className="account-nav" aria-label="Account navigation">
          {links.map(([url, label, Icon]) => (
            <NavLink key={url} to={url} end={url === "/account"}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <main id="account-content" className="account-body" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
