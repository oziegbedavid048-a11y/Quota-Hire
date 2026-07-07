import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Loader2, Crop } from "lucide-react";
import { Button } from "./Button";

export interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  fileName?: string;
  onCropComplete: (croppedFile: File) => void;
}

const CONTAINER_SIZE = 320;
const CROP_SIZE = 200;

export function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  fileName = "avatar.png",
  onCropComplete,
}: ImageCropperModalProps) {
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [displayWidth, setDisplayWidth] = useState(0);
  const [displayHeight, setDisplayHeight] = useState(0);

  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalTranslate, setOriginalTranslate] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const imageRef = useRef<HTMLImageElement | null>(null);

  // Prevent scrolling under the modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Calculate layout sizes when natural sizes are loaded
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalWidth(nw);
    setNaturalHeight(nh);

    const aspect = nw / nh;
    let dw = CONTAINER_SIZE;
    let dh = CONTAINER_SIZE;

    // Scale image base size to fill container aspect ratios
    if (aspect > 1) {
      // Wide image: match height to container, width stretches
      dh = CONTAINER_SIZE;
      dw = CONTAINER_SIZE * aspect;
    } else {
      // Tall image: match width to container, height stretches
      dw = CONTAINER_SIZE;
      dh = CONTAINER_SIZE / aspect;
    }

    setDisplayWidth(dw);
    setDisplayHeight(dh);

    // Calculate minimum zoom to ensure image covers crop circle (CROP_SIZE x CROP_SIZE)
    const minZoomW = CROP_SIZE / dw;
    const minZoomH = CROP_SIZE / dh;
    const calculatedMinZoom = Math.max(1, minZoomW, minZoomH);

    setMinZoom(calculatedMinZoom);
    setZoom(calculatedMinZoom);
    setTranslateX(0);
    setTranslateY(0);
  };

  // Helper to clamp values so crop area is always filled by the image
  const getClampedTranslation = (tx: number, ty: number, currentZoom: number) => {
    const maxTx = Math.max(0, (displayWidth * currentZoom) / 2 - CROP_SIZE / 2);
    const minTx = -maxTx;
    const maxTy = Math.max(0, (displayHeight * currentZoom) / 2 - CROP_SIZE / 2);
    const minTy = -maxTy;

    return {
      x: Math.min(Math.max(tx, minTx), maxTx),
      y: Math.min(Math.max(ty, minTy), maxTy),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOriginalTranslate({ x: translateX, y: translateY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const targetX = originalTranslate.x + dx;
    const targetY = originalTranslate.y + dy;

    const clamped = getClampedTranslation(targetX, targetY, zoom);
    setTranslateX(clamped.x);
    setTranslateY(clamped.y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextZoom = parseFloat(e.target.value);
    setZoom(nextZoom);

    // Re-clamp translation offsets based on new zoom
    const clamped = getClampedTranslation(translateX, translateY, nextZoom);
    setTranslateX(clamped.x);
    setTranslateY(clamped.y);
  };

  const handleDone = () => {
    if (!imageRef.current || isProcessing) return;
    setIsProcessing(true);

    const canvas = document.createElement("canvas");
    canvas.width = 400; // Output high-res 400x400
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Background white (for transparent png fallbacks)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 400);

      // Render image relative to crop circle coordinates
      const scaleFactor = 400 / CROP_SIZE;
      const imageCenterInCanvasX = (CROP_SIZE / 2 + translateX) * scaleFactor;
      const imageCenterInCanvasY = (CROP_SIZE / 2 + translateY) * scaleFactor;
      const imageWidthInCanvas = displayWidth * zoom * scaleFactor;
      const imageHeightInCanvas = displayHeight * zoom * scaleFactor;

      const imageLeftInCanvas = imageCenterInCanvasX - imageWidthInCanvas / 2;
      const imageTopInCanvas = imageCenterInCanvasY - imageHeightInCanvas / 2;

      ctx.drawImage(
        imageRef.current,
        imageLeftInCanvas,
        imageTopInCanvas,
        imageWidthInCanvas,
        imageHeightInCanvas
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], fileName, {
              type: "image/png",
            });
            onCropComplete(croppedFile);
          }
          setIsProcessing(false);
        },
        "image/png",
        0.95
      );
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="crop-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            {/* Modal Card */}
            <motion.div
              key="crop-card"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
                    <Crop size={16} className="text-accent-500" />
                  </div>
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                    Crop Profile Picture
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Viewport */}
              <div className="flex-1 flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-950/40">
                <div
                  className="relative overflow-hidden bg-neutral-950 select-none touch-none rounded-2xl shadow-inner border border-neutral-200 dark:border-neutral-800 cursor-move"
                  style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  {/* Image */}
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Cropping View"
                    onLoad={handleImageLoaded}
                    className="absolute max-w-none origin-center pointer-events-none"
                    style={{
                      width: displayWidth,
                      height: displayHeight,
                      left: CONTAINER_SIZE / 2,
                      top: CONTAINER_SIZE / 2,
                      marginLeft: -displayWidth / 2,
                      marginTop: -displayHeight / 2,
                      transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
                    }}
                  />

                  {/* Dimmed circular overlay */}
                  <div
                    className="absolute border border-white/60 pointer-events-none rounded-full"
                    style={{
                      width: CROP_SIZE,
                      height: CROP_SIZE,
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
                    }}
                  />
                  
                  {/* Subtle circular grid helper */}
                  <div
                    className="absolute pointer-events-none rounded-full border border-dashed border-white/20"
                    style={{
                      width: CROP_SIZE,
                      height: CROP_SIZE,
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                </div>
              </div>

              {/* Slider & Action Footer */}
              <div className="px-6 py-5 space-y-5 border-t border-neutral-100 dark:border-neutral-800">
                {/* Zoom Control */}
                <div className="flex items-center gap-3">
                  <ZoomOut size={16} className="text-neutral-400 dark:text-neutral-600 shrink-0" />
                  <input
                    type="range"
                    min={minZoom}
                    max={minZoom * 3}
                    step={0.01}
                    value={zoom}
                    onChange={handleZoomChange}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-accent-500 outline-none"
                  />
                  <ZoomIn size={16} className="text-neutral-400 dark:text-neutral-600 shrink-0" />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="w-1/2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-bold text-sm text-neutral-600 dark:text-neutral-400 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleDone}
                    disabled={isProcessing}
                    className="w-1/2 bg-accent-600 hover:bg-accent-700 text-white font-bold"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Done"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
