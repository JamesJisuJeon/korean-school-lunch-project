"use client";

import React from "react";
import { getPaymentStatusLabel } from "@/lib/constants";

interface PaymentBadgeProps {
  status: string;
  simplified?: boolean; // 교사용 UI 등에서 FREE_SNACK과 PAID를 묶어 수납완료로 단순 표기할 때 사용
}

export function PaymentBadge({ status, simplified }: PaymentBadgeProps) {
  let badgeClass = "";
  let label = getPaymentStatusLabel(status);

  // simplified 모드에서는 무료간식을 무조건 수납완료로 표기
  const isPaidGroup = status === "PAID" || status === "POST_PAID" || (simplified && status === "FREE_SNACK");

  if (isPaidGroup) {
    badgeClass = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800";
    label = "수납완료";
  } else if (status === "FREE_SNACK") {
    badgeClass = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  } else if (status === "UNPAID") {
    badgeClass = "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
  } else if (status === "CANCELLED") {
    badgeClass = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
  } else {
    badgeClass = "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
    label = "수납대기";
  }

  return (
    <span className={`px-2 py-0.5 md:px-4 md:py-1.5 text-xs font-black rounded-full border ${badgeClass}`}>
      {label}
    </span>
  );
}
