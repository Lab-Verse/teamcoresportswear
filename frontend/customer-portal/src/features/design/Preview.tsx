import { useRef, useState } from "react";
import type { DesignDocument, TemplateSpec, Side, Layer } from "./contract";
import { renderDesign } from "./contract";
export default function Preview({
  document,
  spec,
  side,
  assets,
  player = 0,
  guides = false,
  selected,
  onSelect,
  onMove,
  pen,
  activeZone,
  onDraw,
}: {
  document: DesignDocument;
  spec: TemplateSpec;
  side: Side;
  assets: Record<string, string>;
  player?: number;
  guides?: boolean;
  selected?: string;
  onSelect?: (id: string) => void;
  onMove?: (layer: Layer) => void;
  pen?: { colour: string; width: number };
  activeZone?: string;
  onDraw?: (layer: Layer) => void;
}) {
  const stroke = useRef<{
    id: string;
    points: { x: number; y: number }[];
  } | null>(null);
  const zone =
    spec.zones.find((z) => z.id === activeZone && z.side === side) ||
    spec.zones.find((z) => z.side === side)!;
  const penPoint = (element: HTMLDivElement, x: number, y: number) => {
    const matrix = element.querySelector("svg")?.getScreenCTM();
    if (!matrix || !zone) return null;
    const point = new DOMPoint(x, y).matrixTransform(matrix.inverse());
    return {
      x: Math.max(
        0,
        Math.min(
          zone.width,
          ((point.x - zone.x) * zone.width) / zone.previewWidth,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          zone.height,
          ((point.y - zone.y) * zone.height) / zone.previewHeight,
        ),
      ),
    };
  };
  const penLayer = (): Layer | null => {
    if (!stroke.current || !pen || !zone || stroke.current.points.length < 2)
      return null;
    const points = stroke.current.points;
    const x = Math.min(...points.map((p) => p.x)),
      y = Math.min(...points.map((p) => p.y));
    const width = Math.max(2, Math.max(...points.map((p) => p.x)) - x),
      height = Math.max(2, Math.max(...points.map((p) => p.y)) - y);
    const originX = Math.min(x, zone.width - width),
      originY = Math.min(y, zone.height - height);
    return {
      id: stroke.current.id,
      kind: "path",
      text: "Freehand",
      zone: zone.id,
      colour: pen.colour,
      font: "Inter",
      x: originX,
      y: originY,
      width,
      height,
      rotation: 0,
      strokeWidth: pen.width,
      points: points.map((p) => ({
        x: (p.x - originX) / width,
        y: (p.y - originY) / height,
      })),
    };
  };
  const drag = useRef<{
    layer: Layer;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
  } | null>(null);
  const [moving, setMoving] = useState<Layer | null>(null);
  const [zoom, setZoom] = useState(1);
  const position = (x: number, y: number) => {
    const d = drag.current;
    return d
      ? {
          ...d.layer,
          x: Math.max(0, d.layer.x + (x - d.startX) * d.dx),
          y: Math.max(0, d.layer.y + (y - d.startY) * d.dy),
        }
      : null;
  };
  const shown = moving
    ? {
        ...document,
        layers: document.layers.some((l) => l.id === moving.id)
          ? document.layers.map((l) => (l.id === moving.id ? moving : l))
          : [...document.layers, moving],
      }
    : document;
  return (
    <>
      <div className="studio-preview-viewport">
        <div
          className="studio-preview"
          style={{
            width: `${zoom * 100}%`,
            maxWidth: "none",
            touchAction: onMove ? "none" : "pan-y",
          }}
          onPointerDown={(e) => {
            if (pen && onDraw) {
              const point = penPoint(e.currentTarget, e.clientX, e.clientY);
              if (point) {
                e.currentTarget.setPointerCapture(e.pointerId);
                stroke.current = { id: crypto.randomUUID(), points: [point] };
              }
              return;
            }
            if (!onMove) return;
            const g = (e.target as Element).closest("[data-layer]");
            const id = g?.getAttribute("data-layer");
            const l = document.layers.find((x) => x.id === id);
            if (!l) return;
            onSelect?.(l.id);
            if (l.locked) return;
            const svg = e.currentTarget.querySelector("svg")!;
            const matrix = svg.getScreenCTM();
            const z = spec.zones.find((x) => x.id === l.zone)!;
            if (!matrix) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = {
              layer: l,
              startX: e.clientX,
              startY: e.clientY,
              dx: z.width / z.previewWidth / matrix.a,
              dy: z.height / z.previewHeight / matrix.d,
            };
          }}
          onPointerMove={(e) => {
            if (stroke.current) {
              const point = penPoint(e.currentTarget, e.clientX, e.clientY);
              if (point && stroke.current.points.length < 400) {
                stroke.current.points.push(point);
                setMoving(penLayer());
              }
              return;
            }
            if (drag.current) setMoving(position(e.clientX, e.clientY));
          }}
          onPointerUp={(e) => {
            if (stroke.current) {
              const next = penLayer();
              stroke.current = null;
              setMoving(null);
              if (next) onDraw?.(next);
              return;
            }
            const next = position(e.clientX, e.clientY);
            drag.current = null;
            setMoving(null);
            if (next) onMove?.(next);
          }}
          onPointerCancel={() => {
            stroke.current = null;
            drag.current = null;
            setMoving(null);
          }}
          aria-label={
            selected
              ? "Garment preview. Use position fields or arrow controls to adjust the selected layer."
              : "Garment preview"
          }
          dangerouslySetInnerHTML={{
            __html: renderDesign(
              shown,
              spec,
              side,
              assets,
              player,
              guides,
              selected,
            ),
          }}
        />
      </div>
      <div className="studio-zoom">
        <button
          type="button"
          aria-label="Zoom out"
          disabled={zoom <= 1}
          onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
        >
          −
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          aria-label="Zoom in"
          disabled={zoom >= 2.5}
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.5))}
        >
          +
        </button>
        <button type="button" onClick={() => setZoom(1)}>
          Fit
        </button>
      </div>
    </>
  );
}
