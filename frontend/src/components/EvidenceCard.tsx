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
    <div className="card overflow-hidden max-w-md w-full select-none">
      {/* Header */}
      <div className="card-header">
        <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-primary)]">
          OCR Evidence Inspection
        </span>
        {confidence && (
          <span className="badge badge-low font-mono">
            {Math.round(confidence * 100)}% Confidence
          </span>
        )}
      </div>

      {/* Image Area */}
      <div className="card-body p-0 relative bg-[var(--bg-subtle)] flex items-center justify-center overflow-hidden min-h-[300px]">
        <div
          className="relative inline-block overflow-hidden w-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.2s ease" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Product Label Evidence"
            onLoad={handleImageLoad}
            className="w-full h-auto max-h-[380px] object-contain mx-auto"
            crossOrigin="anonymous"
          />

          {/* Bounding Box Overlay */}
          {boundingBox && (
            <div
              style={{
                position: "absolute",
                top: `${boundingBox.ymin * scale.y}px`,
                left: `${boundingBox.xmin * scale.x}px`,
                width: `${(boundingBox.xmax - boundingBox.xmin) * scale.x}px`,
                height: `${(boundingBox.ymax - boundingBox.ymin) * scale.y}px`,
                border: "2px solid #EF4444",
                background: "rgba(239, 68, 68, 0.15)",
                borderRadius: 4,
                boxShadow: "0 0 16px rgba(239, 68, 68, 0.4)",
                pointerEvents: "none",
              }}
            >
              {/* Label Chip */}
              <div
                style={{
                  position: "absolute",
                  top: -24,
                  left: -2,
                  background: "#EF4444",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px 4px 4px 0",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.04em",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                {violationLabel ?? "VIOLATION"} {confidence ? `· ${Math.round(confidence * 100)}%` : ""}
              </div>
            </div>
          )}
        </div>

        {!boundingBox && (
          <p className="text-xs text-[var(--text-tertiary)] italic text-center p-4">
            No bounding box coordinates detected for this violation evidence.
          </p>
        )}
      </div>

      {/* Controls Footer */}
      <div className="border-t border-[var(--border-base)] flex items-center gap-2 p-3 bg-[var(--bg-subtle)]">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          className="btn btn-secondary btn-sm"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-mono text-[var(--text-tertiary)] w-12 text-center tabular-nums font-bold">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          className="btn btn-secondary btn-sm"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="btn btn-secondary btn-sm ml-auto"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}
