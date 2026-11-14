import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Users,
  GraduationCap,
  Flag,
  Tag,
  ClipboardList,
  Check,
} from "lucide-react";
import { storefront } from "@/services/storefront";

const audiences = [
  {
    title: "Clubs & teams",
    text: "A shared look for every player, from the first size to the last number.",
    icon: Users,
    image: "soccer-02",
    topic: "Club teamwear enquiry",
  },
  {
    title: "Schools & academies",
    text: "Bring squads, age groups and your school identity into one clear brief.",
    icon: GraduationCap,
    image: "basketball-02",
    topic: "School teamwear enquiry",
  },
  {
    title: "Leagues & events",
    text: "Coordinate different teams and designs for the season ahead.",
    icon: Flag,
    image: "american-football-02",
    topic: "League teamwear enquiry",
  },
  {
    title: "Brands & resellers",
    text: "Plan a collection around your own labels, artwork and requirements.",
    icon: Tag,
    image: "baseball-02",
    topic: "Private label enquiry",
  },
] as const;
export function AudienceCollections() {
  return (
    <section
      className="section container-main"
      aria-label="Made for your kind of team"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">START WITH WHO YOU ARE</p>
          <h2>Made for your kind of team.</h2>
          <p className="tc-section-description">
            Four ways to start. One conversation around your needs.
          </p>
        </div>
      </div>
      <div className="tc-audience-grid">
        {audiences.map(({ title, text, icon: Icon, image, topic }) => (
          <Link
            key={title}
            className="tc-audience-card"
            to={`/contact?topic=${encodeURIComponent(topic)}`}
          >
            <div className="tc-audience-image">
              <img
                src={`/teamcore/products/${image}.webp`}
                width="550"
                height="550"
                loading="lazy"
                alt=""
              />
              <span>
                <Icon size={22} aria-hidden="true" />
              </span>
            </div>
            <div>
              <h3>
                {title} <ArrowUpRight size={18} aria-hidden="true" />
              </h3>
              <p>{text}</p>
              <span className="text-link">Plan your teamwear</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function BulkOrderFinder({
  contained = false,
}: {
  contained?: boolean;
}) {
  const categories = useQuery({
    queryKey: ["storefront", "categories"],
    queryFn: storefront.categories,
  });
  const [sport, setSport] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyer, setBuyer] = useState("Club or team");
  const navigate = useNavigate();
  const validSport = categories.data?.some((c) => c.slug === sport)
    ? sport
    : "";
  return (
    <section
      className={`section ${contained ? "" : "container-main"}`}
      aria-label="Plan your bulk order"
    >
      <div className="tc-bulk-planner">
        <div>
          <span className="tc-planner-icon">
            <ClipboardList size={28} />
          </span>
          <p className="eyebrow">ONE BRIEF. THE WHOLE TEAM.</p>
          <h2>Plan your bulk order.</h2>
          <p>
            Start with your sport and squad size. Browse quote-ready designs or
            share a custom brief with our team.
          </p>
          <ul>
            {[
              "Choose sizes and quantities on the product page",
              "Keep multiple designs in one quote list",
              "Review specifications and pricing before ordering",
            ].map((item) => (
              <li key={item}>
                <Check size={16} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const params = new URLSearchParams({
              topic: "Bulk teamwear enquiry",
              buyer,
            });
            if (validSport) params.set("sport", validSport);
            if (quantity) params.set("quantity", quantity);
            navigate(`/contact?${params}`);
          }}
        >
          <h3>Your next kit starts here.</h3>
          <label>
            <span className="field-label">Your sport</span>
            <select
              className="field"
              value={validSport}
              onChange={(e) => setSport(e.target.value)}
              disabled={categories.isPending || categories.isError}
            >
              <option value="">
                {categories.isPending
                  ? "Loading sports…"
                  : "Any sport / discuss a custom brief"}
              </option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {categories.isError && (
            <p role="alert">
              Sports could not load.{" "}
              <button
                type="button"
                className="text-link"
                onClick={() => void categories.refetch()}
              >
                Retry
              </button>{" "}
              You can still send your brief.
            </p>
          )}
          <div className="tc-planner-fields">
            <label>
              <span className="field-label">Approximate quantity</span>
              <input
                className="field"
                type="number"
                min="1"
                max="1000000"
                step="1"
                inputMode="numeric"
                placeholder="e.g. 30"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Buying for</span>
              <select
                className="field"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
              >
                {[
                  "Club or team",
                  "School or academy",
                  "League or event",
                  "Brand or reseller",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <button className="action action-red" type="submit">
            Continue your brief <ArrowUpRight size={18} />
          </button>
          <Link
            className="text-link"
            to={
              validSport
                ? `/products?mode=quote&category=${encodeURIComponent(validSport)}`
                : "/products?mode=quote"
            }
          >
            Browse quote-ready designs <ArrowUpRight size={16} />
          </Link>
          <small>
            This prepares your enquiry. No order or payment is made.
          </small>
        </form>
      </div>
    </section>
  );
}

export function PersonalizationGuide({
  contained = false,
}: {
  contained?: boolean;
}) {
  return (
    <section
      className={`section ${contained ? "" : "container-main"}`}
      aria-label="Put your identity in every detail"
    >
      <div className="tc-personalization">
        <div className="tc-personalization-art">
          <img
            src="/teamcore/products/ice-hockey-03.webp"
            width="550"
            height="550"
            loading="lazy"
            alt="Personalized hockey jersey reference showing player number and team artwork"
          />
          <span>
            YOUR NAME.
            <br />
            YOUR NUMBER.
            <br />
            <em>YOUR TEAM.</em>
          </span>
        </div>
        <div>
          <p className="eyebrow">THE DETAILS THAT MAKE IT YOURS</p>
          <h2>
            Put your identity
            <br />
            in every detail.
          </h2>
          <p>
            A great kit starts with a clear brief. Gather these three things,
            then explore an available template or talk to our team.
          </p>
          <ol>
            {[
              [
                "Team colours & artwork",
                "Bring your colour references and the logo you want to use.",
              ],
              [
                "Player names & numbers",
                "Check each name and number against your squad list.",
              ],
              [
                "Sizes & specifications",
                "Collect measurements, quantities and garment requirements.",
              ],
            ].map(([title, text], i) => (
              <li key={title}>
                <span>{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="tc-marketing-actions">
            <Link className="action action-red" to="/design-studio">
              Open design studio <ArrowUpRight size={18} />
            </Link>
            <Link className="text-link" to="/custom-uniforms">
              Customization guide <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
