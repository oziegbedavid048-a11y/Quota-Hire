import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Loader2, AlertTriangle } from 'lucide-react';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfPreviewProps {
  url: string;
}

export function PdfPreview({ url }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let renderTask: pdfjsLib.RenderTask | null = null;
    let isActive = true;

    const renderPage = async () => {
      if (!url) return;
      
      try {
        setLoading(true);
        setError(null);

        // Load the PDF
        const loadingTask = pdfjsLib.getDocument({ url });
        const pdf = await loadingTask.promise;
        
        if (!isActive) return;

        // Get the first page
        const page = await pdf.getPage(1);
        
        if (!isActive) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate scale to fit container width
        const viewport = page.getViewport({ scale: 1 });
        // Make it high resolution for sharp text (scale 2x)
        const scale = (container.clientWidth / viewport.width) * 2;
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

    // Small delay to ensure container width is calculated correctly after layout
    setTimeout(renderPage, 100);

    return () => {
      isActive = false;
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
