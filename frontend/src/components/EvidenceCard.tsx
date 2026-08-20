"use client";

import { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

interface EvidenceCardProps {
  imageUrl: string;
  boundingBox?: BoundingBox;
  confidence?: number;
  violationLabel?: string;
}

export function EvidenceCard({
  imageUrl,
  boundingBox,
  confidence,
  violationLabel,
}: EvidenceCardProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [zoom, setZoom] = useState(1);

  const handleImageLoad = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight, clientWidth, clientHeight } = imgRef.current;
      setScale({
        x: clientWidth / naturalWidth,
        y: clientHeight / naturalHeight,
      });
    }
  };

  useEffect(() => {
    const onResize = () => handleImageLoad();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="card overflow-hidden max-w-md w-full">
      {/* Header */}
      <div className="card-header">
        <span className="text-[13px] font-semibold text-slate-800">Evidence Image</span>
        {confidence && (
          <span
            className="badge"
            style={{ background: "#EEF2FF", color: "#4F46E5", borderColor: "#C7D2FE" }}
          >
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>

      {/* Image area */}
      <div className="card-body p-0 relative bg-slate-50">
        <div
          className="relative inline-block overflow-hidden w-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.2s ease" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
            ref={imgRef}
            src={imageUrl}
            alt="Product Label Evidence"
            onLoad={handleImageLoad}
            className="w-full h-auto max-h-[380px] object-contain"
            crossOrigin="anonymous"
          />

          {/* Bounding box overlay */}
          {boundingBox && (
            <div
              style={{
                position: "absolute",
                top: `${boundingBox.ymin * scale.y}px`,
                left: `${boundingBox.xmin * scale.x}px`,
                width: `${(boundingBox.xmax - boundingBox.xmin) * scale.x}px`,
                height: `${(boundingBox.ymax - boundingBox.ymin) * scale.y}px`,
                border: "2px solid #EF4444",
                background: "rgba(239,68,68,0.12)",
                borderRadius: 2,
                pointerEvents: "none",
              }}
            >
              {/* Label chip */}
              <div
                style={{
                  position: "absolute",
                  top: -22,
                  left: -2,
                  background: "#EF4444",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px 4px 4px 0",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.03em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {violationLabel ?? "VIOLATION"} {confidence ? `· ${Math.round(confidence * 100)}%` : ""}
              </div>

              {/* Corner dots */}
              {[
                { top: -3, left: -3 },
                { top: -3, right: -3 },
                { bottom: -3, left: -3 },
                { bottom: -3, right: -3 },
              ].map((pos, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 6,
                    height: 6,
                    background: "#EF4444",
                    borderRadius: 1,
                    ...pos,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {!boundingBox && (
          <p className="text-sm text-slate-400 italic text-center p-4">
            No bounding box data for this violation.
          </p>
        )}
      </div>

      {/* Zoom controls */}
      <div className="border-t border-slate-100 flex items-center gap-1 p-2 bg-slate-50/50">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          className="btn btn-secondary btn-sm"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] text-slate-500 w-10 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          className="btn btn-secondary btn-sm"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="btn btn-secondary btn-sm ml-auto"
          title="Reset zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}
