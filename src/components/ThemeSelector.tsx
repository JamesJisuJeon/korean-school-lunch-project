"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 하이드레이션 에러 방지를 위한 마운트 체크
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9" />;

  const modes = [
    { name: "light", icon: Sun, label: "라이트" },
    { name: "dark", icon: Moon, label: "다크" },
    { name: "system", icon: Monitor, label: "시스템" },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
      {modes.map((mode) => (
        <button
          key={mode.name}
          onClick={() => setTheme(mode.name)}
          className={`p-1.5 rounded-lg transition-all ${
            theme === mode.name
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
          title={mode.label}
        >
          <mode.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
