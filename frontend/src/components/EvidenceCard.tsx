"use client";

import { useState, useRef, useEffect } from "react";

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
}

export function EvidenceCard({ imageUrl, boundingBox, confidence }: EvidenceCardProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  // When the image loads, calculate the scale factor if the image is resized by CSS
  // Real world images might be larger/smaller than their display size.
  // The bounding box from the API is usually in original image pixel coordinates.
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
    window.addEventListener("resize", handleImageLoad);
    return () => window.removeEventListener("resize", handleImageLoad);
  }, []);

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 w-full max-w-md mx-auto">
      <h3 className="font-semibold text-slate-800 mb-2">Evidence Image</h3>
      <div className="relative inline-block border rounded overflow-hidden bg-slate-100">
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Product Label"
          onLoad={handleImageLoad}
          className="max-w-full h-auto object-contain max-h-[400px]"
        />
        
        {boundingBox && (
          <div
            className="absolute border-2 border-red-500 bg-red-500/20"
            style={{
              top: `${boundingBox.ymin * scale.y}px`,
              left: `${boundingBox.xmin * scale.x}px`,
              width: `${(boundingBox.xmax - boundingBox.xmin) * scale.x}px`,
              height: `${(boundingBox.ymax - boundingBox.ymin) * scale.y}px`,
            }}
          >
            {confidence && (
              <div className="absolute -top-6 left-[-2px] bg-red-500 text-white text-xs font-bold px-1 whitespace-nowrap">
                {Math.round(confidence * 100)}% Match
              </div>
            )}
          </div>
        )}
      </div>
      
      {!boundingBox && (
        <p className="text-sm text-slate-500 mt-2 italic">
          No bounding box data provided for this violation.
        </p>
      )}
    </div>
  );
}
