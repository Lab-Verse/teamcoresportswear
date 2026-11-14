import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Shirt, Plus, Download } from "lucide-react";
import { studioApi, message } from "./api";
import api from "@/config/api";
import type { Proof } from "./api";
import { SEOHead } from "@/components/common/SEOHead";
import "./studio.css";
function PrivateImage({
  id,
  revision = false,
}: {
  id: string;
  revision?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true,
      objectUrl = "";
    (revision
      ? api
          .get<Blob>(`/design-studio/revisions/${id}/preview/front`, {
            responseType: "blob",
          })
          .then((r) => r.data)
      : studioApi.asset(id)
    )
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, revision]);
  return url ? (
    <img
      style={{ maxHeight: 400, objectFit: "contain" }}
      src={url}
      alt={
        revision
          ? "Submitted design preview"
          : "Production proof supplied by TEAM CORE"
      }
    />
  ) : (
    <p>
      {failed
        ? "Unable to load this private image. Refresh to retry."
        : "Loading private image…"}
    </p>
  );
}
function ProofCard({ proof, refresh }: { proof: Proof; refresh: () => void }) {
  const [notes, setNotes] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function decide(decision: string) {
    setBusy(true);
    try {
      await studioApi.decide(proof.id, decision, notes);
      refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="studio-proof">
      <h3>Production proof · {proof.status.replace(/_/g, " ")}</h3>
      <PrivateImage id={proof.asset_id} />
      <p>{proof.notes}</p>
      <small>
        Proof {proof.id} · {new Date(proof.created_at).toLocaleString()}
      </small>
      {proof.status === "pending" && (
        <>
          <textarea
            aria-label="Feedback on production proof"
            value={notes}
            maxLength={2000}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any changes you need us to make?"
          />
          <label className="studio-check">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />{" "}
            I approve this exact proof, including all artwork, placement,
            colours, sizes, names and numbers.
          </label>
          <div className="studio-inline">
            <button
              className="studio-primary"
              disabled={!checked || busy}
              onClick={() => void decide("approved")}
            >
              Approve this proof
            </button>
            <button
              disabled={busy || !notes.trim()}
              onClick={() => void decide("rejected")}
            >
              Request changes
            </button>
          </div>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </article>
  );
}
export default function Designs() {
  const { id } = useParams();
  const [error, setError] = useState("");
  const list = useQuery({
    queryKey: ["design-projects"],
    queryFn: studioApi.list,
    enabled: !id,
  });
  const detail = useQuery({
    queryKey: ["design-project", id],
    queryFn: () => studioApi.detail(id!),
    enabled: !!id,
  });
  const q = id ? detail : list;
  async function download(revision: string) {
    try {
      const r = await api.get(
        `/design-studio/revisions/${revision}/specification`,
      );
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(r.data, null, 2)], {
          type: "application/json",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `TEAM CORE-design-${revision}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(message(e));
    }
  }
  return (
    <section>
      <SEOHead title={id ? "Your design & proofs" : "My designs"} />
      <div className="studio-heading">
        <div>
          <p className="eyebrow">YOUR TEAM’S NEXT CHAPTER</p>
          <h2>{detail.data?.name || "My designs"}</h2>
        </div>
        <Link className="studio-link" to="/design-studio">
          <Plus size={18} /> New design
        </Link>
      </div>
      {error && <p role="alert">{error}</p>}
      {q.isPending ? (
        <p>Loading designs…</p>
      ) : q.isError ? (
        <p role="alert">
          Unable to load designs.{" "}
          <button onClick={() => q.refetch()}>Retry</button>
        </p>
      ) : id && detail.data ? (
        <>
          <div className="studio-inline">
            <Link
              className="studio-primary"
              to={`/design-studio?project=${id}`}
            >
              Edit working design <ArrowRight size={16} />
            </Link>
            <Link className="studio-link" to="/account/designs">
              All designs
            </Link>
          </div>
          <p className="studio-helper">
            Editing your working design never changes a submitted revision or an
            approved proof. Submit your updated design as a new request.
          </p>
          {detail.data.revisions?.length === 0 && (
            <div className="studio-empty">
              <Shirt />
              <h3>Saved and ready when you are.</h3>
              <p>
                Finish your design in the studio and send it to TEAM CORE for
                review.
              </p>
            </div>
          )}
          {detail.data.revisions?.map((r) => (
            <article className="studio-proof" key={r.id}>
              <p className="eyebrow">{r.state.replace(/_/g, " ")}</p>
              <h3>
                Design revision · {new Date(r.created_at).toLocaleDateString()}
              </h3>
              <PrivateImage id={r.id} revision />
              <p>
                {Object.values(r.document.quantities).reduce(
                  (a, b) => a + b,
                  0,
                )}{" "}
                pieces · {r.document.method}
              </p>
              <div className="studio-inline">
                <Link
                  className="studio-link"
                  to={`/account/wholesale/${r.inquiry_id}`}
                >
                  View quotation request <ArrowRight size={16} />
                </Link>
                <button onClick={() => void download(r.id)}>
                  <Download size={16} /> Design specification
                </button>
              </div>
              {detail
                .data!.proofs?.filter((f) => f.revision_id === r.id)
                .map((f) => (
                  <ProofCard
                    key={f.id}
                    proof={f}
                    refresh={() => void detail.refetch()}
                  />
                ))}
            </article>
          ))}
          <ol className="studio-timeline">
            {detail.data.events?.map((e) => (
              <li key={e.id}>
                <strong>{e.kind.replace(/_/g, " ")}</strong>
                {e.note && <p>{e.note}</p>}
                <time>{new Date(e.created_at).toLocaleString()}</time>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <div className="studio-design-cards">
          {list.data?.length ? (
            list.data.map((p) => (
              <article className="studio-design-card" key={p.id}>
                <Shirt size={34} />
                <h3>{p.name}</h3>
                <small>{new Date(p.updated_at).toLocaleDateString()}</small>
                <Link to={"/account/designs/" + p.id}>
                  Design history & proofs
                </Link>
                <Link to={"/design-studio?project=" + p.id}>
                  Continue designing
                </Link>
              </article>
            ))
          ) : (
            <div className="studio-empty">
              <Shirt />
              <h3>Your first design starts here.</h3>
              <Link className="studio-primary" to="/design-studio">
                Enter the studio
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
