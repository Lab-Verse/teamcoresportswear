import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Undo2,
  Redo2,
  Upload,
  Shirt,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { SEOHead } from "@/components/common/SEOHead";
import { studioApi, message } from "./api";
import type { Asset, Template } from "./api";
import { inspectDesign } from "./contract";
import type { DesignDocument, Layer, Side } from "./contract";
import { localDraft } from "./local-draft";
import Preview from "./Preview";
import AdvancedTools from "./AdvancedTools";
import { downloadPreview } from "./export-preview";
import "./studio.css";
const steps = [
  "Your kit",
  "The build",
  "Your colours",
  "Your identity",
  "Your squad",
  "Design check",
  "Save & refine",
  "Send to TEAM CORE",
];
const subtitles = [
  "Start with the right foundation.",
  "Made for the way you play.",
  "Wear your team with pride.",
  "Make every detail your own.",
  "One team. Every player.",
  "A closer look, from every angle.",
  "Good ideas deserve a place to stay.",
  "Your design. Our next conversation.",
];
type Draft = {
  name: string;
  document: DesignDocument;
  id?: string;
  version: number;
  assets: Record<string, Asset & { cloud?: boolean }>;
};
const initial = (t: Template): DesignDocument => ({
  schemaVersion: 1,
  templateId: t.id,
  colour: t.spec.colours[0],
  accent: "#c6010b",
  method: t.spec.methods[0],
  pattern: "plain",
  layers: [],
  quantities: {},
  roster: [],
});
export default function Studio() {
  const user = useAuthStore((s) => s.user);
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const projectId = params.get("project");
  const productId = params.get("product");
  const templates = useQuery({
    queryKey: ["studio", "templates"],
    queryFn: studioApi.templates,
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState(0);
  const [side, setSide] = useState<Side>("front");
  const [selected, setSelected] = useState("");
  const [player, setPlayer] = useState(0);
  const [guides, setGuides] = useState(true);
  const [penMode, setPenMode] = useState(false);
  const [penColour, setPenColour] = useState("#c6010b");
  const [penWidth, setPenWidth] = useState(3);
  const [activeZone, setActiveZone] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [download, setDownload] = useState<{ url: string; side: Side } | null>(
    null,
  );
  useEffect(
    () => () => {
      if (download) URL.revokeObjectURL(download.url);
    },
    [download],
  );
  const [status, setStatus] = useState("Saved on this device");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [warningsAccepted, setWarningsAccepted] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [extraTemplates, setExtraTemplates] = useState<Template[]>([]);
  const [contact, setContact] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    deliveryCountry: "PK",
    deliveryCity: "",
    deliveryAddress: "",
    notes: "",
  });
  const [desiredDate, setDesiredDate] = useState("");
  const [history, setHistory] = useState<DesignDocument[]>([]);
  const [future, setFuture] = useState<DesignDocument[]>([]);
  const current = useRef(draft);
  current.current = draft;
  const saving = useRef(false);
  const cloudVersion = useRef(0);
  const savedHash = useRef("");
  const submissionKey = useRef(crypto.randomUUID());
  const generation = useRef(0);
  const stepsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = stepsRef.current;
    const active = nav?.querySelector<HTMLElement>("[aria-current=step]");
    if (nav && active)
      nav.scrollTo({
        left: active.offsetLeft - nav.offsetLeft - 8,
        behavior: "instant",
      });
  }, [step]);
  const localKey = user?.id ? `account:${user.id}` : "guest";
  const template = [...(templates.data || []), ...extraTemplates].find(
    (t) => t.id === draft?.document.templateId,
  );
  const doc = draft?.document;
  const layer = doc?.layers.find((l) => l.id === selected);
  const spec = template?.spec;
  const issueList = doc && spec ? inspectDesign(doc, spec, draft.assets) : [];
  const total = doc
    ? Object.values(doc.quantities).reduce((a, b) => a + b, 0)
    : 0;
  useEffect(() => {
    const g = ++generation.current;
    setReady(false);
    setDraft(null);
    setError("");
    setHistory([]);
    setFuture([]);
    savedHash.current = "";
    (async () => {
      try {
        if (projectId && signedIn) {
          const p = await studioApi.detail(projectId);
          if (g !== generation.current) return;
          const assets = Object.fromEntries(
            ((p as unknown as { assets: Asset[] }).assets || []).map((a) => [
              a.id,
              { ...a, cloud: true },
            ]),
          );
          setExtraTemplates(p.templates || []);
          setDraft({
            name: p.name,
            document: p.document,
            id: p.id,
            version: p.version,
            assets,
          });
          cloudVersion.current = p.version;
          savedHash.current = JSON.stringify({
            name: p.name,
            document: p.document,
          });
          setStatus("Saved to your account");
        } else {
          const saved =
            (await localDraft.read(localKey)) ||
            (signedIn ? await localDraft.read("guest") : undefined);
          if (g !== generation.current) return;
          if (saved) {
            let version = saved.owner === user?.id ? saved.version : 0;
            if (signedIn && saved.id && saved.owner === user?.id) {
              const remote = await studioApi.detail(saved.id);
              if (g !== generation.current) return;
              setExtraTemplates(remote.templates || []);
              savedHash.current = JSON.stringify({
                name: remote.name,
                document: remote.document,
              });
              if (
                savedHash.current ===
                JSON.stringify({ name: saved.name, document: saved.document })
              )
                version = remote.version;
            }
            setDraft({
              ...saved,
              id: saved.owner === user?.id ? saved.id : undefined,
              version,
            });
            cloudVersion.current = version;
            setStep(saved.step || 0);
          }
        }
      } catch (e) {
        if (g === generation.current) setError(message(e));
      } finally {
        if (g === generation.current) setReady(true);
      }
    })();
    return () => {
      generation.current = g + 1;
    };
  }, [localKey, projectId, signedIn, user?.id]);
  useEffect(() => {
    if (!draft || !ready) return;
    const timer = setTimeout(() => {
      localDraft
        .save(localKey, { ...draft, owner: user?.id, step })
        .catch(() =>
          setError(
            "Device storage is unavailable. Keep this tab open and save to your account.",
          ),
        );
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, step, localKey, ready, user?.id]);
  const artworkKey =
    doc?.layers
      .filter((l) => l.kind === "image")
      .map((l) => l.assetId)
      .filter(Boolean)
      .join(",") || "";
  useEffect(() => {
    let active = true;
    const made: string[] = [];
    (async () => {
      const next: Record<string, string> = {};
      for (const id of [...new Set(artworkKey.split(",").filter(Boolean))]) {
        try {
          const file =
            (await localDraft.file(id)) ||
            (signedIn ? await studioApi.asset(id) : undefined);
          if (!file) continue;
          const url = URL.createObjectURL(file);
          if (!active) {
            URL.revokeObjectURL(url);
            continue;
          }
          made.push(url);
          next[id] = url;
        } catch {
          /* Missing assets appear in validation and as placeholders. */
        }
      }
      if (active) setUrls(next);
    })();
    return () => {
      active = false;
      made.forEach((url) => URL.revokeObjectURL(url));
    };
    // Only load image bytes when the artwork set changes, not on every pointer move.
  }, [artworkKey, signedIn]);
  const saveCloud = useCallback(
    async (copy = false) => {
      if (!signedIn) {
        if (current.current)
          await localDraft.save("guest", { ...current.current, step });
        navigate("/login", {
          state: {
            from: "/design-studio" + (projectId ? `?project=${projectId}` : ""),
          },
        });
        return undefined;
      }
      if (saving.current || !current.current) return undefined;
      saving.current = true;
      setStatus("Saving…");
      const g = generation.current;
      const snapshot = structuredClone(current.current);
      try {
        let document = snapshot.document;
        const assets = { ...snapshot.assets };
        const replacements: Record<string, string> = {};
        for (const l of document.layers.filter((l) => l.kind === "image")) {
          if (assets[l.assetId!]?.cloud || replacements[l.assetId!]) continue;
          const file = await localDraft.file(l.assetId!);
          if (!file)
            throw new Error(
              "An artwork file is missing. Please upload it again.",
            );
          const uploaded = await studioApi.upload(
            new File([file], "artwork.png", { type: file.type }),
          );
          await localDraft.putFile(uploaded.id, file);
          assets[uploaded.id] = { ...uploaded, cloud: true };
          replacements[l.assetId!] = uploaded.id;
          document = {
            ...document,
            layers: document.layers.map((x) =>
              x.assetId === l.assetId ? { ...x, assetId: uploaded.id } : x,
            ),
          };
        }
        const p = await studioApi.save(
          copy ? undefined : snapshot.id,
          copy ? snapshot.name + " — copy" : snapshot.name,
          document,
          copy ? 0 : cloudVersion.current,
        );
        if (g !== generation.current) return undefined;
        cloudVersion.current = p.version;
        savedHash.current = JSON.stringify({
          name: p.name,
          document: p.document,
        });
        setDraft((now) => {
          if (!now) return now;
          const unchanged =
            JSON.stringify(now.document) === JSON.stringify(snapshot.document);
          const updated = {
            ...now.document,
            layers: now.document.layers.map((l) =>
              l.assetId && replacements[l.assetId]
                ? { ...l, assetId: replacements[l.assetId] }
                : l,
            ),
          };
          return {
            ...now,
            id: p.id,
            version: p.version,
            name: copy ? p.name : now.name,
            document: unchanged ? p.document : updated,
            assets: { ...now.assets, ...assets },
          };
        });
        setHistory((h) =>
          h.map((d) => ({
            ...d,
            layers: d.layers.map((l) =>
              l.assetId && replacements[l.assetId]
                ? { ...l, assetId: replacements[l.assetId] }
                : l,
            ),
          })),
        );
        setFuture((h) =>
          h.map((d) => ({
            ...d,
            layers: d.layers.map((l) =>
              l.assetId && replacements[l.assetId]
                ? { ...l, assetId: replacements[l.assetId] }
                : l,
            ),
          })),
        );
        await localDraft.remove("guest");
        setStatus("Saved to your account");
        setError("");
        return p;
      } catch (e) {
        setStatus("Not synced");
        setError(message(e));
        return undefined;
      } finally {
        saving.current = false;
      }
    },
    [signedIn, navigate, projectId, step],
  );
  useEffect(() => {
    if (
      !ready ||
      !signedIn ||
      !draft ||
      busy ||
      !template ||
      template.status !== "published"
    )
      return;
    if (
      JSON.stringify({ name: draft.name, document: draft.document }) ===
      savedHash.current
    )
      return;
    const timer = setTimeout(() => void saveCloud(), 1400);
    return () => clearTimeout(timer);
  }, [draft, ready, signedIn, busy, template, saveCloud]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (
        saving.current ||
        status === "Not synced" ||
        status === "Unsaved changes"
      ) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);
  function change(next: DesignDocument, remember = true) {
    if (!doc) return;
    if (remember) {
      setHistory((h) => [...h.slice(-39), doc]);
      setFuture([]);
    }
    setDraft((d) => (d ? { ...d, document: next } : d));
    setWarningsAccepted(false);
    submissionKey.current = crypto.randomUUID();
    setStatus(signedIn ? "Unsaved changes" : "Saved on this device");
  }
  function updateLayer(patch: Partial<Layer>) {
    if (layer && doc)
      change({
        ...doc,
        layers: doc.layers.map((l) =>
          l.id === layer.id ? { ...l, ...patch } : l,
        ),
      });
  }
  function choose(t: Template) {
    if (saving.current) {
      setError("Please wait for the current save before changing garments.");
      return;
    }
    if (
      doc &&
      doc.layers.length &&
      !window.confirm(
        "Start a new design? Save your current design to your account first if you want to keep it. This replaces the draft on this device.",
      )
    )
      return;
    setDraft({
      name: `My ${t.name}`,
      document: initial(t),
      version: 0,
      assets: {},
    });
    cloudVersion.current = 0;
    savedHash.current = "";
    setHistory([]);
    setFuture([]);
    setSelected("");
    setStep(1);
    setActiveZone("");
    setSide("front");
    setPenMode(false);
  }
  function add(kind: Layer["kind"], text = "TEAM CORE", asset?: Asset) {
    if (!doc || !spec) return;
    const z =
      spec.zones.find((z) => z.id === activeZone && z.side === side) ||
      spec.zones.find((z) => z.side === side) ||
      spec.zones[0];
    setSide(z.side);
    const item: Layer = {
      id: crypto.randomUUID(),
      kind,
      text,
      assetId: asset?.id,
      zone: z.id,
      colour: "#18181b",
      font: "Inter",
      x: 10,
      y: 10,
      width: Math.min(
        z.width - 20,
        kind === "image" || kind === "graphic" ? 65 : 180,
      ),
      height: Math.min(
        z.height - 20,
        kind === "image" || kind === "graphic" ? 65 : 25,
      ),
      rotation: 0,
    };
    if (asset) item.height = (item.width * asset.height) / asset.width;
    const scale = Math.min(1, (z.height - 20) / item.height);
    item.width *= scale;
    item.height *= scale;
    item.x = (z.width - item.width) / 2;
    item.y = (z.height - item.height) / 2;
    change({ ...doc, layers: [...doc.layers, item] });
    setSelected(item.id);
  }
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choose a still PNG, JPEG or WebP under 10 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 24000000) {
        bitmap.close();
        throw new Error("Use an image with fewer than 24 million pixels.");
      }
      const a: Asset & { cloud?: boolean } = signedIn
        ? { ...(await studioApi.upload(file)), cloud: true }
        : {
            id: crypto.randomUUID(),
            width: bitmap.width,
            height: bitmap.height,
          };
      bitmap.close();
      await localDraft.putFile(a.id, file);
      setDraft((d) => (d ? { ...d, assets: { ...d.assets, [a.id]: a } } : d));
      add("image", "", a);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  function undo() {
    if (!history.length || !doc) return;
    setFuture((f) => [doc, ...f]);
    change(history[history.length - 1], false);
    setHistory((h) => h.slice(0, -1));
  }
  function redo() {
    if (!future.length || !doc) return;
    setHistory((h) => [...h, doc]);
    change(future[0], false);
    setFuture((f) => f.slice(1));
  }
  async function importRoster(file?: File) {
    if (!file || !doc) return;
    try {
      if (file.size > 100000) throw new Error("CSV must be under 100 KB.");
      const raw = await file.text();
      const rows = raw
        .replace(/^\uFEFF/, "")
        .trim()
        .split(/\r?\n/);
      if (rows[0].toLowerCase() !== "name,number,size")
        throw new Error(
          "Use the header name,number,size. Commas inside names are not supported.",
        );
      const roster = rows.slice(1).map((row) => {
        const cells = row.split(",");
        if (cells.length !== 3)
          throw new Error("Each row needs name,number,size.");
        const [name, number, size] = cells.map((x) => x.trim());
        if (
          name.length > 60 ||
          !/^\d{0,4}$/.test(number) ||
          !spec?.sizes.some((s) => s.label === size)
        )
          throw new Error("Check player name, number and size values.");
        return { name, number, size };
      });
      if (roster.length > 200) throw new Error("Use at most 200 players.");
      change({
        ...doc,
        roster,
        quantities: roster.reduce<Record<string, number>>(
          (acc, r) => ({ ...acc, [r.size]: (acc[r.size] || 0) + 1 }),
          {},
        ),
      });
    } catch (e) {
      setError(message(e));
    }
  }
  async function submit() {
    if (!draft || !doc || busy) return;
    setBusy(true);
    setError("");
    try {
      const saved = await saveCloud();
      if (!saved) return;
      const r = await studioApi.submit(saved.id, {
        version: saved.version,
        submissionKey: submissionKey.current,
        warningsAccepted,
        contact: {
          ...contact,
          contactPhone: contact.contactPhone.trim() || undefined,
        },
        ...(desiredDate ? { desiredDate } : {}),
      });
      navigate("/account/designs/" + r.project_id);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const button = (label: string, run: () => void, disabled = false) => (
    <button
      type="button"
      aria-label={
        (
          {
            "←": "Move left one millimetre",
            "→": "Move right one millimetre",
            "↑": "Move up one millimetre",
            "↓": "Move down one millimetre",
          } as Record<string, string>
        )[label] || label
      }
      disabled={disabled || busy}
      onClick={run}
    >
      {label}
    </button>
  );
  return (
    <div className="design-studio">
      <SEOHead
        title="TEAM CORE Design Studio"
        description="Create your team's custom sportswear. Choose your colours, add your identity and request a quotation from Team Core Sports Wear."
      />
      <div className="studio-heading">
        <div>
          <p className="eyebrow">TEAM CORE DESIGN STUDIO</p>
          <h1>
            Your team. <span>Your signature.</span>
          </h1>
          <p>Create something you are proud to play in.</p>
        </div>
        <Link className="studio-link" to="/account/designs">
          My designs <ArrowRight size={18} />
        </Link>
      </div>
      {error && (
        <div className="studio-alert" role="alert">
          {error}
          <button aria-label="Dismiss message" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {!ready || templates.isPending ? (
        <p className="studio-empty" role="status">
          Preparing your studio…
        </p>
      ) : templates.isError ? (
        <div className="studio-empty">
          <h2>We couldn’t load the garments.</h2>
          <button onClick={() => templates.refetch()}>Try again</button>
        </div>
      ) : !templates.data?.length && !draft ? (
        <div className="studio-empty">
          <Shirt size={54} />
          <h2>Your next kit starts here.</h2>
          <p>
            Our team is preparing the first customizable garments. Tell us what
            you have in mind and we’ll help you get started.
          </p>
          <Link className="studio-primary" to="/contact">
            Talk to TEAM CORE <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <>
          <nav
            ref={stepsRef}
            className="studio-steps"
            aria-label="Design steps"
          >
            {steps.map((s, i) => (
              <button
                key={s}
                aria-current={i === step ? "step" : undefined}
                disabled={!draft && i > 0}
                onClick={() => setStep(i)}
              >
                <span>
                  {i < step ? (
                    <Check size={15} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                {s}
              </button>
            ))}
          </nav>
          <div
            className={`studio-workspace ${expanded ? "studio-expanded" : ""}`}
          >
            <section className="studio-stage" aria-label="Your garment">
              {spec &&
                !spec.garment &&
                templates.data?.some(
                  (t) =>
                    t.product_id === template?.product_id && t.spec.garment,
                ) && (
                  <p className="studio-helper">
                    This saved design uses the original chest-area template.{" "}
                    <button className="studio-link" onClick={() => setStep(0)}>
                      Choose a full-garment template
                    </button>{" "}
                    to start a new design.
                  </p>
                )}
              <div className="studio-stage-top">
                <span>
                  {template?.name.replace(
                    / · (Full Surface v2|Design Brief v1)$/,
                    "",
                  ) || "YOUR NEXT KIT"}
                </span>
                <span className="studio-pill">LIVE PREVIEW</span>
              </div>
              {doc && spec ? (
                <>
                  <div className="studio-canvas-toolbar">
                    <button
                      disabled={exporting}
                      onClick={async () => {
                        setExporting(true);
                        try {
                          setDownload({
                            url: await downloadPreview(
                              doc,
                              spec,
                              side,
                              urls,
                              player,
                            ),
                            side,
                          });
                        } catch (e) {
                          setError(message(e));
                        } finally {
                          setExporting(false);
                        }
                      }}
                    >
                      <Download size={15} />
                      {exporting ? "Preparing…" : "Download PNG"}
                    </button>
                    {download && (
                      <a
                        className="studio-export-link"
                        href={download.url}
                        download={`teamcore-${download.side}-design-preview.png`}
                      >
                        <img
                          src={download.url}
                          alt="Prepared design preview"
                          width="40"
                          height="44"
                        />
                        Save prepared {download.side} PNG
                      </a>
                    )}
                    <button
                      aria-pressed={expanded}
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? "Standard workspace" : "Expand workspace"}
                    </button>
                    <button
                      aria-pressed={!penMode}
                      onClick={() => setPenMode(false)}
                    >
                      Select & move
                    </button>
                    <button
                      aria-pressed={penMode}
                      onClick={() => {
                        setPenMode(!penMode);
                        setStep(3);
                      }}
                    >
                      Freehand pen
                    </button>
                  </div>
                  <label>
                    Design surface
                    <select
                      value={
                        spec.zones.some(
                          (z) => z.id === activeZone && z.side === side,
                        )
                          ? activeZone
                          : spec.zones.find((z) => z.side === side)?.id
                      }
                      onChange={(e) => setActiveZone(e.target.value)}
                    >
                      {spec.zones
                        .filter((z) => z.side === side)
                        .map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  {penMode && (
                    <div className="studio-pen-settings">
                      <label>
                        Pen colour
                        <input
                          type="color"
                          value={penColour}
                          onChange={(e) => setPenColour(e.target.value)}
                        />
                      </label>
                      <label>
                        Thickness (mm)
                        <input
                          type="number"
                          min="0.5"
                          max="20"
                          step="0.5"
                          value={penWidth}
                          onChange={(e) =>
                            setPenWidth(
                              Math.max(
                                0.5,
                                Math.min(20, Number(e.target.value)),
                              ),
                            )
                          }
                        />
                      </label>
                      <p>
                        Draw directly on the garment. Each stroke becomes an
                        editable layer.
                      </p>
                    </div>
                  )}
                  <Preview
                    document={doc}
                    spec={spec}
                    side={side}
                    assets={urls}
                    guides={guides}
                    selected={selected}
                    player={player}
                    activeZone={activeZone}
                    pen={
                      penMode && step === 3
                        ? { colour: penColour, width: penWidth }
                        : undefined
                    }
                    onDraw={(l) => {
                      change({ ...doc, layers: [...doc.layers, l] });
                      setSelected(l.id);
                    }}
                    onSelect={(id) => {
                      setSelected(id);
                      setStep(3);
                    }}
                    onMove={(l) =>
                      change({
                        ...doc,
                        layers: doc.layers.map((x) => (x.id === l.id ? l : x)),
                      })
                    }
                  />
                  <div
                    className="studio-view-controls"
                    aria-label="Garment view"
                  >
                    {(
                      [...new Set(spec.zones.map((z) => z.side))] as Side[]
                    ).map((s) => (
                      <button
                        key={s}
                        aria-pressed={s === side}
                        onClick={() => setSide(s)}
                      >
                        {s === "left"
                          ? "Left sleeve"
                          : s === "right"
                            ? "Right sleeve"
                            : s}
                      </button>
                    ))}
                  </div>
                  <label className="studio-check">
                    <input
                      type="checkbox"
                      checked={guides}
                      onChange={(e) => setGuides(e.target.checked)}
                    />{" "}
                    Show print areas
                  </label>
                  <p className="studio-preview-note">
                    {spec?.publicationMode === "design_brief"
                      ? "Design brief preview. Colours, size labels and print areas express your preferences; TEAM CORE confirms fabric, fit, dimensions and availability with your quote."
                      : "Illustrative preview. Final colours, placement and production artwork are confirmed in your proof."}
                  </p>
                </>
              ) : (
                <div className="studio-stage-placeholder">
                  <Shirt size={110} strokeWidth={0.7} />
                  <p>Choose your starting point.</p>
                </div>
              )}
            </section>
            <section
              className="studio-panel"
              key={step}
              aria-label={steps[step]}
            >
              <p className="eyebrow">
                STEP {String(step + 1).padStart(2, "0")} / 08
              </p>
              <h2>{steps[step]}</h2>
              <p className="studio-subtitle">{subtitles[step]}</p>
              {step === 0 && (
                <div className="studio-products">
                  {templates.data
                    ?.filter(
                      (t, index, all) =>
                        all.findIndex(
                          (other) => other.product_id === t.product_id,
                        ) === index,
                    )
                    ?.filter((t) => !productId || t.product_id === productId)
                    .map((t) => (
                      <button
                        className="studio-product"
                        key={t.id}
                        onClick={() => choose(t)}
                      >
                        {t.spec.images.front ? (
                          <img
                            className="studio-garment-thumbnail"
                            src={t.spec.images.front}
                            alt={`${t.name} front garment illustration`}
                            width={180}
                            height={195}
                          />
                        ) : (
                          <Shirt size={40} />
                        )}
                        <strong>
                          {t.name.replace(
                            / · (Full Surface v2|Design Brief v1)$/,
                            "",
                          )}
                        </strong>
                        <small>
                          {t.spec.fabric} · {t.spec.fit}
                        </small>
                        <small>
                          {t.spec.publicationMode === "design_brief"
                            ? "Design & request a quote · made to order"
                            : `From ${t.spec.minimumQuantity} pieces`}
                        </small>
                        <span>
                          Make it yours <ArrowRight size={16} />
                        </span>
                      </button>
                    ))}
                </div>
              )}
              {doc && spec && (
                <>
                  {step === 1 && (
                    <>
                      <div className="studio-material">
                        <Shirt />
                        <h3>{spec.fabric}</h3>
                        <p>
                          {spec.fit} · {spec.neckline}
                        </p>
                      </div>
                      <label>
                        Decoration method
                        <select
                          value={doc.method}
                          onChange={(e) =>
                            change({ ...doc, method: e.target.value })
                          }
                        >
                          {spec.methods.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      </label>
                      <p className="studio-helper">
                        We’ll review your artwork for your chosen method before
                        production.
                      </p>
                      <details>
                        <summary>Fit & sizing guidance</summary>
                        <p>{spec.sizeGuide}</p>
                      </details>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <label>
                        Garment colour <span>{doc.colour}</span>
                      </label>
                      <div className="studio-swatches">
                        {spec.colours.map((c) => (
                          <button
                            key={c}
                            style={{ background: c }}
                            aria-label={`Garment colour ${c}`}
                            aria-pressed={doc.colour === c}
                            onClick={() => change({ ...doc, colour: c })}
                          >
                            {doc.colour === c && (
                              <Check
                                color={
                                  c.toLowerCase() === "#ffffff"
                                    ? "#18181b"
                                    : "white"
                                }
                              />
                            )}
                          </button>
                        ))}
                      </div>
                      <label>
                        Pattern
                        <select
                          value={doc.pattern}
                          onChange={(e) =>
                            change({
                              ...doc,
                              pattern: e.target
                                .value as DesignDocument["pattern"],
                            })
                          }
                        >
                          {spec.patterns.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </label>
                      {doc.pattern !== "plain" && (
                        <label>
                          Pattern colour
                          <input
                            type="color"
                            value={doc.accent}
                            onChange={(e) =>
                              change({ ...doc, accent: e.target.value })
                            }
                          />
                        </label>
                      )}
                      <p className="studio-helper">
                        {spec.publicationMode === "design_brief"
                          ? "Choose your colour direction. TEAM CORE confirms fabric swatches and pattern feasibility with your quote."
                          : "Available colours reflect this garment’s production options. Screens can display colours differently."}
                      </p>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <div className="studio-toolbar">
                        <button
                          onClick={undo}
                          disabled={!history.length}
                          aria-label="Undo"
                        >
                          <Undo2 size={18} />
                        </button>
                        <button
                          onClick={redo}
                          disabled={!future.length}
                          aria-label="Redo"
                        >
                          <Redo2 size={18} />
                        </button>
                        <button onClick={() => add("text")}>
                          <Plus size={17} /> Text
                        </button>
                        <label className="studio-upload">
                          <Upload size={17} /> Logo
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => {
                              void upload(e.target.files?.[0]);
                              e.target.value = "";
                            }}
                            disabled={busy}
                          />
                        </label>
                      </div>
                      <div className="studio-inline">
                        {button("Player name", () => add("name", ""))}
                        {button("Player number", () => add("number", ""))}
                      </div>
                      <p className="studio-helper">
                        PNG, JPEG or WebP · up to 10 MB. Transparent PNG works
                        well for logos.
                      </p>
                      <div
                        className="studio-inline"
                        aria-label="TEAM CORE graphic library"
                      >
                        {[
                          "star",
                          "bolt",
                          "shield",
                          "circle",
                          "diamond",
                          "triangle",
                          "bar",
                          "chevrons",
                        ].map((g) => (
                          <button key={g} onClick={() => add("graphic", g)}>
                            {g === "star"
                              ? "★"
                              : g === "bolt"
                                ? "ϟ"
                                : g === "circle"
                                  ? "●"
                                  : g === "triangle"
                                    ? "▲"
                                    : "◇"}{" "}
                            {g}
                          </button>
                        ))}
                      </div>
                      <div className="studio-layer-list">
                        {doc.layers.map((l, i) => (
                          <button
                            key={l.id}
                            aria-pressed={selected === l.id}
                            onClick={() => {
                              setSelected(l.id);
                              setSide(
                                spec.zones.find((z) => z.id === l.zone)!.side,
                              );
                            }}
                          >
                            <span>{String(i + 1).padStart(2, "0")}</span>
                            {l.kind === "text"
                              ? l.text || "Empty text"
                              : l.kind}
                            <small>{l.zone}</small>
                          </button>
                        ))}
                      </div>
                      {layer && (
                        <div className="studio-layer-editor">
                          <h3>Edit {layer.kind}</h3>
                          <AdvancedTools
                            doc={doc}
                            spec={spec}
                            layer={layer}
                            change={change}
                            update={updateLayer}
                          />
                          {layer.kind === "text" && (
                            <label>
                              Text
                              <input
                                maxLength={120}
                                value={layer.text}
                                onChange={(e) =>
                                  updateLayer({ text: e.target.value })
                                }
                              />
                            </label>
                          )}
                          <label>
                            Print area
                            <select
                              value={layer.zone}
                              onChange={(e) => {
                                const zone = spec.zones.find(
                                  (z) => z.id === e.target.value,
                                )!;
                                const ratio = Math.min(
                                  1,
                                  (zone.width - 20) / layer.width,
                                  (zone.height - 20) / layer.height,
                                );
                                updateLayer({
                                  zone: e.target.value,
                                  x: 10,
                                  y: 10,
                                  width: layer.width * ratio,
                                  height: layer.height * ratio,
                                  rotation: 0,
                                });
                                setSide(
                                  spec.zones.find(
                                    (z) => z.id === e.target.value,
                                  )!.side,
                                );
                              }}
                            >
                              {spec.zones.map((z) => (
                                <option key={z.id} value={z.id}>
                                  {z.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          {layer.kind !== "image" && (
                            <>
                              <label>
                                Ink / thread colour
                                <input
                                  type="color"
                                  value={layer.colour}
                                  onChange={(e) =>
                                    updateLayer({ colour: e.target.value })
                                  }
                                />
                              </label>
                              {["text", "name", "number"].includes(
                                layer.kind,
                              ) && (
                                <label>
                                  Typeface
                                  <select
                                    value={layer.font}
                                    onChange={(e) =>
                                      updateLayer({
                                        font: e.target.value as Layer["font"],
                                      })
                                    }
                                  >
                                    <option>Inter</option>
                                    <option>Barlow Condensed</option>
                                  </select>
                                </label>
                              )}
                            </>
                          )}
                          <div className="studio-measures">
                            {(
                              ["x", "y", "width", "height", "rotation"] as const
                            ).map((k) => (
                              <label key={k}>
                                {k} ({k === "rotation" ? "°" : "mm"})
                                <input
                                  type="number"
                                  min={
                                    k === "rotation"
                                      ? -180
                                      : k === "width" || k === "height"
                                        ? 2
                                        : 0
                                  }
                                  max={k === "rotation" ? 180 : 1000}
                                  step="1"
                                  value={Math.round(layer[k] * 10) / 10}
                                  onChange={(e) => {
                                    const n = Number(e.target.value);
                                    if (!Number.isFinite(n)) return;
                                    const patch: Partial<Layer> = { [k]: n };
                                    if (
                                      layer.kind === "image" &&
                                      (k === "width" || k === "height")
                                    ) {
                                      const a = draft.assets[layer.assetId!];
                                      if (a) {
                                        if (k === "width")
                                          patch.height =
                                            (n * a.height) / a.width;
                                        else
                                          patch.width =
                                            (n * a.width) / a.height;
                                      }
                                    }
                                    updateLayer(patch);
                                  }}
                                />
                              </label>
                            ))}
                          </div>
                          <div className="studio-inline">
                            {button("←", () =>
                              updateLayer({ x: Math.max(0, layer.x - 1) }),
                            )}
                            {button("→", () => updateLayer({ x: layer.x + 1 }))}
                            {button("↑", () =>
                              updateLayer({ y: Math.max(0, layer.y - 1) }),
                            )}
                            {button("↓", () => updateLayer({ y: layer.y + 1 }))}
                            {button("Centre", () =>
                              updateLayer({
                                x: Math.max(
                                  0,
                                  (spec.zones.find((z) => z.id === layer.zone)!
                                    .width -
                                    layer.width) /
                                    2,
                                ),
                              }),
                            )}
                          </div>
                          <div className="studio-inline">
                            <button
                              onClick={() => {
                                const l = {
                                  ...layer,
                                  id: crypto.randomUUID(),
                                  y: layer.y + 5,
                                };
                                change({ ...doc, layers: [...doc.layers, l] });
                                setSelected(l.id);
                              }}
                            >
                              <Copy size={15} /> Duplicate
                            </button>
                            <button
                              onClick={() => {
                                const list = doc.layers.filter(
                                  (l) => l.id !== layer.id,
                                );
                                change({ ...doc, layers: [...list, layer] });
                              }}
                            >
                              Bring forward
                            </button>
                            <button
                              onClick={() => {
                                change({
                                  ...doc,
                                  layers: doc.layers.filter(
                                    (l) => l.id !== layer.id,
                                  ),
                                });
                                setSelected("");
                              }}
                            >
                              <Trash2 size={15} /> Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {step === 4 && (
                    <>
                      <div className="studio-size-grid">
                        {spec.sizes
                          .filter((s) => s.colour === doc.colour)
                          .map((s) => (
                            <label key={s.label}>
                              {s.label}
                              <input
                                type="number"
                                min="0"
                                max="100000"
                                value={doc.quantities[s.label] || 0}
                                onChange={(e) =>
                                  change({
                                    ...doc,
                                    quantities: {
                                      ...doc.quantities,
                                      [s.label]: Math.max(
                                        0,
                                        Math.floor(Number(e.target.value)),
                                      ),
                                    },
                                  })
                                }
                              />
                            </label>
                          ))}
                      </div>
                      <p className="studio-helper">
                        Minimum {spec.minimumQuantity} pieces · multiples of{" "}
                        {spec.increment}. Total: {total}
                      </p>
                      <details>
                        <summary>Size guide</summary>
                        <p>{spec.sizeGuide}</p>
                      </details>
                      <h3>
                        Personalize your squad <small>Optional</small>
                      </h3>
                      <p className="studio-helper">
                        One row per shirt when using player names or numbers.
                        Keep numbers like 007 exactly as you want them printed.
                      </p>
                      <label className="studio-upload">
                        <Upload size={16} /> Import CSV
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={(e) => {
                            void importRoster(e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <p className="studio-helper">
                        CSV header: name,number,size
                      </p>
                      {doc.roster.map((r, i) => (
                        <div className="studio-player" key={i}>
                          <label>
                            Name
                            <input
                              aria-label={`Player ${i + 1} name`}
                              maxLength={60}
                              value={r.name}
                              onChange={(e) =>
                                change({
                                  ...doc,
                                  roster: doc.roster.map((x, j) =>
                                    j === i
                                      ? { ...x, name: e.target.value }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </label>
                          <label>
                            Number
                            <input
                              aria-label={`Player ${i + 1} number`}
                              inputMode="numeric"
                              maxLength={4}
                              value={r.number}
                              onChange={(e) =>
                                change({
                                  ...doc,
                                  roster: doc.roster.map((x, j) =>
                                    j === i
                                      ? {
                                          ...x,
                                          number: e.target.value.replace(
                                            /\D/g,
                                            "",
                                          ),
                                        }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </label>
                          <label>
                            Size
                            <select
                              value={r.size}
                              onChange={(e) =>
                                change({
                                  ...doc,
                                  roster: doc.roster.map((x, j) =>
                                    j === i
                                      ? { ...x, size: e.target.value }
                                      : x,
                                  ),
                                })
                              }
                            >
                              {spec.sizes
                                .filter((s) => s.colour === doc.colour)
                                .map((s) => (
                                  <option key={s.label}>{s.label}</option>
                                ))}
                            </select>
                          </label>
                          <button
                            aria-label={`Remove player ${i + 1}`}
                            onClick={() =>
                              change({
                                ...doc,
                                roster: doc.roster.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <div className="studio-inline">
                        {button(
                          "Add player",
                          () =>
                            change({
                              ...doc,
                              roster: [
                                ...doc.roster,
                                {
                                  name: "",
                                  number: "",
                                  size: spec.sizes.find(
                                    (s) => s.colour === doc.colour,
                                  )!.label,
                                },
                              ],
                            }),
                          doc.roster.length >= 200,
                        )}
                        {button(
                          "Match quantities to squad",
                          () =>
                            change({
                              ...doc,
                              quantities: doc.roster.reduce<
                                Record<string, number>
                              >(
                                (a, r) => ({
                                  ...a,
                                  [r.size]: (a[r.size] || 0) + 1,
                                }),
                                {},
                              ),
                            }),
                          !doc.roster.length,
                        )}
                      </div>
                    </>
                  )}
                  {step === 5 && (
                    <>
                      <div className="studio-check-heading">
                        <ShieldCheck size={34} />
                        <h3>
                          {issueList.some((i) => i.level === "error")
                            ? "A few details to resolve."
                            : "Looking good for review."}
                        </h3>
                      </div>
                      {!issueList.length && (
                        <p>
                          Your design passes the automatic checks. TEAM CORE will
                          still review the artwork and production details.
                        </p>
                      )}
                      {issueList.map((i) => (
                        <p
                          key={i.message}
                          className={"studio-issue " + i.level}
                        >
                          {i.level === "error" ? "Check" : "Note"}: {i.message}
                        </p>
                      ))}
                      {doc.roster.length > 0 && (
                        <label>
                          Preview player
                          <select
                            value={player}
                            onChange={(e) => setPlayer(Number(e.target.value))}
                          >
                            {doc.roster.map((r, i) => (
                              <option key={i} value={i}>
                                {r.name || "Player " + (i + 1)} · {r.number} ·{" "}
                                {r.size}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      <div className="studio-summary">
                        <span>{total} pieces</span>
                        <span>{doc.layers.length} design elements</span>
                        <span>{doc.method}</span>
                      </div>
                    </>
                  )}
                  {step === 6 && (
                    <>
                      <label>
                        Give your design a name
                        <input
                          value={draft.name}
                          maxLength={120}
                          onChange={(e) =>
                            setDraft((d) =>
                              d ? { ...d, name: e.target.value } : d,
                            )
                          }
                        />
                      </label>
                      <p>
                        Save your progress, try another version, or come back
                        when inspiration strikes.
                      </p>
                      <button
                        className="studio-primary"
                        disabled={busy}
                        onClick={() => void saveCloud()}
                      >
                        <Save size={18} />
                        {signedIn ? "Save design" : "Sign in & save design"}
                      </button>
                      {signedIn && (
                        <button onClick={() => void saveCloud(true)}>
                          <Copy size={17} /> Save as a new design
                        </button>
                      )}
                      <p className="studio-helper">
                        Your local draft stays on this device. Clearing browser
                        data removes local drafts. Account saves let you
                        continue on another device.
                      </p>
                    </>
                  )}
                  {step === 7 && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void submit();
                      }}
                    >
                      <div className="studio-summary">
                        <strong>{draft.name}</strong>
                        <span>
                          {total} pieces · {doc.method}
                        </span>
                        <span>Quotation required</span>
                      </div>
                      {(
                        [
                          "companyName",
                          "contactName",
                          "contactEmail",
                          "contactPhone",
                          "deliveryCountry",
                          "deliveryCity",
                          "deliveryAddress",
                        ] as const
                      ).map((k) => (
                        <label key={k}>
                          {
                            {
                              companyName: "Team / company",
                              contactName: "Your name",
                              contactEmail: "Email",
                              contactPhone: "Phone (optional)",
                              deliveryCountry: "Country code (e.g. PK, US)",
                              deliveryCity: "City",
                              deliveryAddress: "Delivery address",
                            }[k]
                          }
                          <input
                            required={k !== "contactPhone"}
                            type={k === "contactEmail" ? "email" : "text"}
                            maxLength={k === "deliveryCountry" ? 2 : 200}
                            value={contact[k]}
                            onChange={(e) =>
                              setContact((c) => ({
                                ...c,
                                [k]:
                                  k === "deliveryCountry"
                                    ? e.target.value.toUpperCase()
                                    : e.target.value,
                              }))
                            }
                          />
                        </label>
                      ))}
                      <label>
                        Desired delivery date (optional)
                        <input
                          type="date"
                          value={desiredDate}
                          onChange={(e) => setDesiredDate(e.target.value)}
                        />
                      </label>
                      <label>
                        Anything we should know?
                        <textarea
                          maxLength={3000}
                          value={contact.notes}
                          onChange={(e) =>
                            setContact((c) => ({ ...c, notes: e.target.value }))
                          }
                        />
                      </label>
                      <label className="studio-check">
                        <input
                          type="checkbox"
                          required
                          checked={warningsAccepted}
                          onChange={(e) =>
                            setWarningsAccepted(e.target.checked)
                          }
                        />{" "}
                        I have reviewed the design and player details, have
                        permission to use the artwork, and understand that TEAM CORE
                        will confirm the final proof, price and delivery date.
                      </label>
                      {issueList.some((i) => i.level === "error") && (
                        <p className="studio-issue error">
                          Resolve the issues in Design check before sending.
                        </p>
                      )}
                      <button
                        type="submit"
                        className="studio-primary"
                        disabled={
                          busy ||
                          status === "Saving…" ||
                          issueList.some((i) => i.level === "error") ||
                          !warningsAccepted
                        }
                      >
                        {busy ? "Sending…" : "Send my design"}
                        <ArrowRight size={18} />
                      </button>
                    </form>
                  )}
                </>
              )}
            </section>
          </div>
          <footer className="studio-action-bar">
            <span role="status">
              <CheckCircle2 size={16} />
              {status}
            </span>
            <span>{total} pieces · Quote required</span>
            <div>
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
              >
                <ArrowLeft size={17} /> Back
              </button>
              {step < 7 && (
                <button
                  className="studio-primary"
                  onClick={() => setStep(step + 1)}
                  disabled={!draft}
                >
                  Continue <ArrowRight size={17} />
                </button>
              )}
              <button
                className="studio-save"
                onClick={() => void saveCloud()}
                disabled={!draft || busy}
              >
                <Save size={18} />
                <span>Save</span>
              </button>
            </div>
          </footer>
        </>
      )}
      <div className="studio-promise">
        <span>
          <ShieldCheck size={18} /> Your artwork stays private.
        </span>
        <span>
          <CheckCircle2 size={18} /> You approve the final production proof.
        </span>
        <span>
          <Download size={18} /> Saved for your next season.
        </span>
      </div>
    </div>
  );
}
