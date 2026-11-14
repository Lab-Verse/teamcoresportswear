import type { DesignDocument, Layer, TemplateSpec } from "./contract";
export default function AdvancedTools({
  doc,
  spec,
  layer,
  change,
  update,
}: {
  doc: DesignDocument;
  spec: TemplateSpec;
  layer: Layer;
  change: (d: DesignDocument) => void;
  update: (patch: Partial<Layer>) => void;
}) {
  const zone = spec.zones.find((z) => z.id === layer.zone)!;
  const area = doc.workAreas?.[zone.id] || {
    x: 0,
    y: 0,
    width: zone.width,
    height: zone.height,
  };
  const setArea = (key: keyof typeof area, value: number) => {
    if (!Number.isFinite(value)) return;
    const next = { ...area, [key]: value };
    next.x = Math.max(0, Math.min(zone.width - 2, next.x));
    next.y = Math.max(0, Math.min(zone.height - 2, next.y));
    next.width = Math.max(2, Math.min(zone.width - next.x, next.width));
    next.height = Math.max(2, Math.min(zone.height - next.y, next.height));
    change({ ...doc, workAreas: { ...doc.workAreas, [zone.id]: next } });
  };
  function fit() {
    const scale = Math.min(
      area.width / layer.width,
      area.height / layer.height,
    );
    update({
      x: area.x + (area.width - layer.width * scale) / 2,
      y: area.y + (area.height - layer.height * scale) / 2,
      width: layer.width * scale,
      height: layer.height * scale,
      rotation: 0,
    });
  }
  return (
    <div className="studio-advanced">
      <div className="studio-inline">
        <button
          aria-pressed={!!layer.flipX}
          onClick={() => update({ flipX: !layer.flipX })}
        >
          Flip horizontal
        </button>
        <button
          aria-pressed={!!layer.flipY}
          onClick={() => update({ flipY: !layer.flipY })}
        >
          Flip vertical
        </button>
        <button
          aria-pressed={!!layer.locked}
          onClick={() => update({ locked: !layer.locked })}
        >
          {layer.locked ? "Unlock movement" : "Lock movement"}
        </button>
      </div>
      <label>
        Opacity · {Math.round((layer.opacity ?? 1) * 100)}%
        <input
          type="range"
          min="5"
          max="100"
          value={(layer.opacity ?? 1) * 100}
          onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
        />
      </label>
      {layer.kind === "path" && (
        <label>
          Pen thickness (mm)
          <input
            type="number"
            min="0.5"
            max="20"
            step="0.5"
            value={layer.strokeWidth || 2}
            onChange={(e) =>
              update({
                strokeWidth: Math.max(
                  0.5,
                  Math.min(20, Number(e.target.value)),
                ),
              })
            }
          />
        </label>
      )}
      <details>
        <summary>Adjust your placement guide</summary>
        <p className="studio-helper">
          Set your own working rectangle within {zone.label}. Artwork is clipped
          to the garment silhouette. This guide does not change factory print
          limits.
        </p>
        <div className="studio-measures">
          {(["x", "y", "width", "height"] as const).map((k) => (
            <label key={k}>
              Guide {k} (mm)
              <input
                type="number"
                min="0"
                max="1000"
                value={Math.round(area[k])}
                onChange={(e) => setArea(k, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
        <div className="studio-inline">
          <button onClick={fit}>Fit artwork to guide</button>
          <button
            onClick={() =>
              update({
                x: area.x + (area.width - layer.width) / 2,
                y: area.y + (area.height - layer.height) / 2,
              })
            }
            disabled={layer.width > area.width || layer.height > area.height}
          >
            Centre in guide
          </button>
          <button
            onClick={() => {
              const next = Object.fromEntries(Object.entries(doc.workAreas || {}).filter(([id]) => id !== zone.id));
              change({ ...doc, workAreas: next });
            }}
          >
            Reset guide
          </button>
        </div>
      </details>
      <div className="studio-inline">
        <button
          onClick={() =>
            change({
              ...doc,
              layers: [layer, ...doc.layers.filter((l) => l.id !== layer.id)],
            })
          }
        >
          Send to back
        </button>
        {spec.zones
          .filter((z) => z.side !== zone.side && z.id === z.side)
          .map((z) => (
            <button
              key={z.id}
              onClick={() => {
                const scale = Math.min(
                  1,
                  z.width / layer.width,
                  z.height / layer.height,
                );
                change({
                  ...doc,
                  layers: [
                    ...doc.layers,
                    {
                      ...layer,
                      id: crypto.randomUUID(),
                      zone: z.id,
                      x: 0,
                      y: 0,
                      width: layer.width * scale,
                      height: layer.height * scale,
                    },
                  ],
                });
              }}
            >
              Copy to {z.label}
            </button>
          ))}
      </div>
    </div>
  );
}
