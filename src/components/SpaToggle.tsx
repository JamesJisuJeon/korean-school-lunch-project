"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LockOpen, Lock } from "lucide-react";

export default function SpaToggle() {
  const [isSpaMode, setIsSpaMode] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const match = document.cookie.match(/(^| )spa_mode=([^;]+)/);
    if (match) {
      setIsSpaMode(match[2] === "true");
    }
  }, []);

  const toggle = () => {
    const newMode = !isSpaMode;
    setIsSpaMode(newMode);
    const expires = new Date();
    expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
    document.cookie = `spa_mode=${newMode};expires=${expires.toUTCString()};path=/`;
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all border ${
        isSpaMode
          ? "bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/50 dark:hover:bg-teal-900/40"
          : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 dark:hover:bg-gray-700"
      }`}
      title={isSpaMode ? "학부모회 관리자 메뉴 숨기기" : "학부모회 관리자 메뉴 보기"}
    >
      {isSpaMode ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
    </button>
  );
}
