"use client";

import React from "react";

interface CouponControlProps {
  qty: number;
  onUpdate: (delta: number) => void;
}

export function CouponControl({ qty, onUpdate }: CouponControlProps) {
  return (
    <div className="flex items-center justify-center gap-2 xl:gap-4 bg-gray-50 dark:bg-gray-800 rounded-xl px-2.5 xl:px-2 h-[38px] xl:w-32 border-2 border-gray-100 dark:border-gray-700">
      <button
        onClick={() => onUpdate(-1)}
        disabled={qty <= 0}
        className="w-7 h-7 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 hover:border-red-100 dark:hover:border-red-900/50 transition-colors disabled:opacity-30 active:scale-90 text-sm font-bold"
      >
        -
      </button>
      <span className="text-sm font-black text-gray-900 dark:text-gray-100 w-5 xl:w-4 text-center">{qty}</span>
      <button
        onClick={() => onUpdate(1)}
        className="w-7 h-7 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-purple-600 hover:border-purple-100 dark:hover:border-purple-900/50 transition-colors active:scale-90 text-sm font-bold"
      >
        +
      </button>
    </div>
  );
}
