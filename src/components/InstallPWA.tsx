"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPWA() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 이미 설치된 경우 숨김
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") setPromptEvent(null);
  };

  if (isStandalone || dismissed) return null;

  // Android/Chrome: 설치 버튼
  if (promptEvent) {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all active:scale-95 shadow-sm"
        title="홈 화면에 추가"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">앱 설치</span>
      </button>
    );
  }

  // iOS Safari: 안내 배너
  if (isIOS) {
    if (showIOSGuide) {
      return (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start mb-3">
            <p className="font-black text-gray-900 dark:text-gray-100 text-sm">홈 화면에 추가하기</p>
            <button onClick={() => { setShowIOSGuide(false); setDismissed(true); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">1</span>
              Safari 하단의 <strong>공유 버튼</strong> (□↑) 탭
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">2</span>
              <strong>홈 화면에 추가</strong> 선택
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">3</span>
              오른쪽 상단 <strong>추가</strong> 탭
            </li>
          </ol>
        </div>
      );
    }

    return (
      <button
        onClick={() => setShowIOSGuide(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all active:scale-95 shadow-sm"
        title="홈 화면에 추가"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">앱 설치</span>
      </button>
    );
  }

  return null;
}
