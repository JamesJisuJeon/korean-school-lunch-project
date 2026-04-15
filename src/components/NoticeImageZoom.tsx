"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface NoticeImageZoomProps {
  src: string;
}

export default function NoticeImageZoom({ src }: NoticeImageZoomProps) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <>
      <div
        className="rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 aspect-[4/3] cursor-zoom-in"
        onClick={() => setZoomed(true)}
      >
        <Image
          src={src}
          alt="공지 이미지"
          width={900}
          height={600}
          className="w-full h-full object-contain"
          priority
          unoptimized
        />
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setZoomed(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={src}
            alt="공지 이미지"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
