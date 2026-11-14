import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Shirt } from "lucide-react";
import { sports } from "@/config/brand";
export function SportCard({ sport }: { sport: (typeof sports)[number] }) {
  const [failed, setFailed] = useState(false);
  return (
    <Link className="tc-sport-card" to={`/categories/${sport.slug}`}>
      <div>
        {failed ? (
          <Shirt size={70} aria-hidden="true" />
        ) : (
          <img
            src={sport.image}
            alt={`${sport.name} uniform design`}
            width="550"
            height="550"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <span>
        <strong>{sport.name}</strong>
        <ArrowUpRight size={19} />
      </span>
      <p>{sport.description}</p>
    </Link>
  );
}
export function SportGrid() {
  return (
    <div className="tc-sport-grid">
      {sports.map((s) => (
        <SportCard key={s.slug} sport={s} />
      ))}
    </div>
  );
}
