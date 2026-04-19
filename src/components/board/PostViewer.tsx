"use client";

import { useEffect, useRef, useState } from "react";

interface PostViewerProps {
  content: string;
}

function fixRelativeUrls(html: string): string {
  return html.replace(/src="(?:\.\.\/)*uploads\//g, 'src="/uploads/');
}

export default function PostViewer({ content }: PostViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") setLightbox((target as HTMLImageElement).src);
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [content]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <>
      <div
        ref={containerRef}
        className="prose prose-gray dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_img]:max-w-full [&_img]:rounded [&_img]:cursor-zoom-in"
        dangerouslySetInnerHTML={{ __html: fixRelativeUrls(content) }}
      />

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-[90vh] rounded shadow-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
