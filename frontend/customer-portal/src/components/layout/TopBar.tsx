import { Link } from "react-router-dom";
import { MapPin, ArrowUpRight } from "lucide-react";
export function TopBar() {
  return (
    <div className="top-strip">
      <div className="container-main">
        <span>
          <MapPin size={12} /> CUSTOM TEAMWEAR · SIALKOT, PAKISTAN
        </span>
        <div>
          <Link to="/help">Help & support</Link>
          <Link to="/wholesale">
            Team & wholesale orders <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
