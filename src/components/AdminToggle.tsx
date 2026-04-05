"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldAlert } from "lucide-react";

export default function AdminToggle() {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // 쿠키에서 초기 상태 읽기
    const match = document.cookie.match(/(^| )admin_mode=([^;]+)/);
    if (match) {
      setIsAdminMode(match[2] === "true");
    }
  }, []);

  const toggleAdminMode = () => {
    const newMode = !isAdminMode;
    setIsAdminMode(newMode);
    
    // 쿠키 설정 (30일간 유지)
    const expires = new Date();
    expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
    document.cookie = `admin_mode=${newMode};expires=${expires.toUTCString()};path=/`;
    
    // 서버 컴포넌트 갱신
    router.refresh();
  };

  return (
    <button
      onClick={toggleAdminMode}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black transition-all border ${
        isAdminMode 
          ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40" 
          : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/40"
      }`}
    >
      {isAdminMode ? (
        <>
          <ShieldAlert className="w-3.5 h-3.5" />
          시스템 관리 해제
        </>
      ) : (
        <>
          <Shield className="w-3.5 h-3.5" />
          시스템 관리
        </>
      )}
    </button>
  );
}
