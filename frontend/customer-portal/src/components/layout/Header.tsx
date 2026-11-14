import { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  FileText,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { Brand } from "@/components/common/Brand";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useBasket } from "@/store/basket.store";
import { sports, brand } from "@/config/brand";
const links = [
  ["/custom-uniforms", "Custom Uniforms"],
  ["/private-label", "Private Label"],
  ["/design-studio", "Design Your Kit"],
  ["/about", "About Us"],
  ["/contact", "Contact"],
] as const;
export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const cart = useBasket((s) => s.cart);
  const quotes = useBasket((s) => s.quotes);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    navigate(
      search.trim()
        ? `/search?search=${encodeURIComponent(search.trim())}`
        : "/products",
    );
  }
  return (
    <header className="site-header tc-header">
      <div className="container-main header-main">
        <Brand />
        <form className="tc-search" role="search" onSubmit={submit}>
          <Search size={20} />
          <input
            type="search"
            aria-label="Search uniforms, kits or product code"
            placeholder="Search uniforms, kits or product code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" aria-label="Search products">
            <Search size={19} />
          </button>
        </form>
        <div className="header-actions">
          <Link to="/account" className="tc-header-action tc-account-action">
            <UserRound size={21} />
            <span>Account</span>
          </Link>
          <Link
            to="/quote-basket"
            className="tc-header-action"
            aria-label={`Quote basket, ${quotes.length} items`}
          >
            <FileText size={21} />
            <span>Quote list</span>
            <b>{quotes.length}</b>
          </Link>
          <Link
            to="/cart"
            className="tc-header-action"
            aria-label={`Shopping cart, ${cart.length} items`}
          >
            <ShoppingBag size={21} />
            <span>Cart</span>
            <b>{cart.length}</b>
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="tc-mobile-menu" aria-label="Open navigation">
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="tc-menu-drawer"
              aria-describedby={undefined}
            >
              <SheetTitle>{brand.name}</SheetTitle>
              <nav aria-label="Mobile navigation">
                <h3>Shop by sport</h3>
                {sports.map((s) => (
                  <Link
                    key={s.slug}
                    to={`/categories/${s.slug}`}
                    onClick={() => setOpen(false)}
                  >
                    {s.name}
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
                <Link to="/products" onClick={() => setOpen(false)}>
                  All uniforms
                  <ArrowUpRight size={16} />
                </Link>
                <h3>Made for your team</h3>
                {[
                  ...links,
                  ["/wholesale", "Team & bulk orders"],
                  ["/manufacturing-process", "Our process"],
                  ["/account", "Your account"],
                  ["/help", "Help & support"],
                ].map(([url, label]) => (
                  <Link key={url} to={url} onClick={() => setOpen(false)}>
                    {label}
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="tc-navigation">
        <div className="container-main">
          <details className="tc-sports-menu" key={location.pathname}>
            <summary>
              <Menu size={17} /> Shop by Sport <ChevronDown size={15} />
            </summary>
            <div className="tc-sports-popover">
              <Link to="/categories">
                Explore all sports <ArrowUpRight size={17} />
              </Link>
              {sports.map((s) => (
                <Link key={s.slug} to={`/categories/${s.slug}`}>
                  <img
                    src={s.image}
                    alt=""
                    width="48"
                    height="48"
                    loading="lazy"
                  />
                  <span>
                    {s.name}
                    <small>{s.description}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
          </details>
          <nav aria-label="Main navigation">
            {links.map(([url, label]) => (
              <NavLink key={url} to={url}>
                {label}
              </NavLink>
            ))}
          </nav>
          <Link className="tc-nav-quote" to="/wholesale">
            Request a Quote <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </header>
  );
}
