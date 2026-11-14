import { Link } from "react-router-dom";
import { brand } from "@/config/brand";
export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      to="/"
      aria-label={`${brand.name} home`}
      className={`brand tc-brand ${inverse ? "brand-inverse" : ""}`}
    >
      <img src={brand.logo} width="64" height="64" alt="" />
      <span>
        <strong>Team Core</strong>
        <span>Sports Wear</span>
      </span>
    </Link>
  );
}
