// MUST be imported before 'pdfjs-dist'. pdf.js 6 calls several very new APIs
// unguarded — Map.prototype.getOrInsertComputed inside PDFPageProxy.render(),
// Promise.try in its worker plumbing, Math.sumPrecise in font handling — and
// ships no polyfills. Without these the preview throws on every browser below
// Chrome 145 / Firefox 144 / Safari 26.2 and shows "Failed to generate image
// preview" instead of the CV.
import '../../utils/pdfjsPolyfills';

// The same polyfills again, but as source text, so they can be injected into
// the worker realm below. Vite's ?raw gives the file's own bytes, so the page
// and the worker run byte-for-byte identical code from one source of truth.
import pdfjsPolyfillSource from '../../utils/pdfjsPolyfills.js?raw';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, AlertTriangle } from 'lucide-react';

// Use the CDN worker that matches the installed pdfjs-dist version.
// This is the most reliable approach for blob: URL rendering in Vite.
// The local ?url import can fail in some environments when the worker
// tries to fetch a blob: URL from a different origin context.
const PDFJS_VERSION = '6.1.200';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

// ── Polyfill the worker realm ────────────────────────────────────────────────
//
// A Web Worker is a separate realm with its own globals, so polyfilling the
// page does nothing for it. Measured over one real render, worker code makes 7
// Promise.withResolvers, 4 Promise.try and 12 Math.sumPrecise calls, and builds
// the document fingerprint with Uint8Array.prototype.toHex — none of which
// exist in an older browser. Patching only the page would leave the preview
// broken for exactly the users this fix is for.
//
// Because the worker is cross-origin (cdnjs), pdf.js does not point a Worker at
// it directly: it wraps it in a same-origin blob module that dynamically
// imports the real script, via PDFWorker._createCDNWrapper. Overriding that
// wrapper lets the polyfills run first, inside the worker, using pdf.js's own
// mechanism — no bundler configuration and no change to how the worker loads.
//
// If a future pdfjs-dist drops the hook, the guard leaves the original
// behaviour untouched rather than breaking the preview.
const patchWorkerRealm = (PDFWorker: any) => {
  if (typeof PDFWorker?._createCDNWrapper !== 'function') return;
  if (PDFWorker.__qhPolyfilled) return;          // idempotent across remounts
  PDFWorker.__qhPolyfilled = true;
  PDFWorker._createCDNWrapper = (url: string) =>
    URL.createObjectURL(
      new Blob([`${pdfjsPolyfillSource}\nawait import(${JSON.stringify(url)});`],
               { type: 'text/javascript' })
    );
};
patchWorkerRealm((pdfjsLib as any).PDFWorker);

interface PdfPreviewProps {
  url: string;
}

// Rendering geometry. The scale is clamped so a bad measurement can never
// produce either a 0x0 canvas (blank box, no error) or one too large to
// allocate. FALLBACK_CONTAINER_WIDTH is only used if layout never reports a
// width at all — a narrow phone width, so the preview is legible either way.
const MIN_RENDER_SCALE = 0.5;
const MAX_RENDER_SCALE = 6;
const FALLBACK_CONTAINER_WIDTH = 360;
const LAYOUT_WAIT_MS = 1500;

export function PdfPreview({ url }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let renderTask: pdfjsLib.RenderTask | null = null;
    let isActive = true;
    let startTimer: number | undefined;
    let sizeObserver: ResizeObserver | undefined;

    /** The container's usable CSS width, or 0 if layout has not settled yet. */
    const measureWidth = () => {
      const el = containerRef.current;
      if (!el) return 0;
      return el.clientWidth || Math.round(el.getBoundingClientRect().width) || 0;
    };

    const renderPage = async (containerWidth: number) => {
      // `loading` starts true, so every path out of here must either finish the
      // render, report an error, or stop the spinner. A bare return leaves the
      // component spinning with nothing to explain it.
      if (!url) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch the blob bytes directly on the main thread
        // Passing 'data' (Uint8Array) directly to pdfjs bypasses worker URL fetching and CORS entirely
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch PDF blob: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        if (!isActive) return;

        // `isEvalSupported: false` used to be passed here. pdf.js 6 removed the
        // option entirely — it appears nowhere in the runtime — so it was
        // silently ignored and gave no protection. Dropping it stops the code
        // implying a safeguard that does not exist. What actually limits risk
        // here is that this component only ever renders a PDF the app generated
        // moments earlier, never a user-supplied file.
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
        });
        const pdf = await loadingTask.promise;
        
        if (!isActive) return;

        // Get the first page
        const page = await pdf.getPage(1);
        
        if (!isActive) return;

        const canvas = canvasRef.current;
        if (!canvas) {
          // Normally means the component went away mid-render, in which case
          // isActive is already false and nobody sees the result. If it is still
          // active the canvas genuinely never mounted, which is an error worth
          // showing rather than an endless spinner.
          if (isActive) throw new Error('The preview canvas was not available.');
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Leaving `loading` true here would spin forever with no explanation.
          throw new Error('This browser could not provide a 2D canvas to draw the preview.');
        }

        // Calculate scale to fit the container width, at 2x for sharp text.
        //
        // The width is passed in rather than read here, and is guaranteed
        // non-zero by the caller. Reading container.clientWidth at this point
        // used to yield 0 whenever layout had not settled — inside a modal that
        // is still animating, or under a display:none ancestor — which made
        // `scale` 0, sized the canvas 0x0, and left a blank white box with no
        // spinner and no error. Clamped as well, so a pathological measurement
        // cannot produce a canvas too large to allocate.
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
          Math.max((containerWidth / viewport.width) * 2, MIN_RENDER_SCALE),
          MAX_RENDER_SCALE,
        );
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const renderContext = {
          canvasContext: ctx,
          canvas: canvas,
          viewport: scaledViewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;

        if (isActive) {
          setLoading(false);
        }
      } catch (err: any) {
        if (isActive && err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF:', err);
          setError(err.message || 'Failed to render preview');
          setLoading(false);
        }
      }
    };

    // Wait for the container to report a real width before rendering, rather
    // than guessing with a fixed delay. The old `setTimeout(renderPage, 100)`
    // both raced layout (100ms is not always enough inside an animating modal)
    // and was never cleared on unmount.
    const start = () => {
      if (!isActive) return;

      const width = measureWidth();
      if (width > 0) {
        void renderPage(width);
        return;
      }

      if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
        sizeObserver = new ResizeObserver(() => {
          const observed = measureWidth();
          if (!isActive || observed <= 0) return;
          sizeObserver?.disconnect();
          sizeObserver = undefined;
          window.clearTimeout(startTimer);
          void renderPage(observed);
        });
        sizeObserver.observe(containerRef.current);
      }

      // Backstop: if the width never arrives (no ResizeObserver, or a hidden
      // ancestor), render at a sensible default instead of leaving the spinner
      // up forever.
      startTimer = window.setTimeout(() => {
        if (!isActive) return;
        sizeObserver?.disconnect();
        sizeObserver = undefined;
        void renderPage(measureWidth() || FALLBACK_CONTAINER_WIDTH);
      }, LAYOUT_WAIT_MS);
    };

    start();

    return () => {
      isActive = false;
      window.clearTimeout(startTimer);   // previously leaked: the timer was never cleared
      sizeObserver?.disconnect();
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [url]);

  return (
    <div 
      ref={containerRef} 
      className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative select-none"
      style={{ height: '52vh', minHeight: '360px' }}
    >
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-gray-400" />
          <p className="text-sm text-gray-500 font-medium">Generating Image…</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-6 text-center z-10">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-red-700 font-bold text-sm">Failed to generate image preview</p>
          <p className="text-red-500 text-xs mt-1">{error}</p>
        </div>
      )}

      <div className="w-full h-full overflow-hidden absolute top-0 left-0 pointer-events-none bg-white">
        <canvas 
          ref={canvasRef} 
          className="w-full h-auto origin-top pointer-events-none"
          style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease' }}
        />
      </div>

      {/* Gradient mask to hide the bottom */}
      {!loading && !error && (
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-gray-50 via-white/80 to-transparent pointer-events-none z-20"></div>
      )}
    </div>
  );
}
