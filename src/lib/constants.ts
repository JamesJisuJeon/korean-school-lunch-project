export const PAYMENT_STATUSES = [
  { value: "WAITING", label: "수납 대기", color: "bg-gray-400" },
  { value: "PAID", label: "납부", color: "bg-green-600" },
  { value: "UNPAID", label: "후납", color: "bg-yellow-600" },
  { value: "POST_PAID", label: "후납-납부", color: "bg-blue-600" },
  { value: "CANCELLED", label: "취소", color: "bg-red-600" },
  { value: "FREE_SNACK", label: "무료간식", color: "bg-emerald-500" },
];

export const ORDER_TYPES = [
  { value: "PRE_ORDER", label: "사전 신청", color: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
  { value: "ON_SITE", label: "현장 신청", color: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" },
];

export const getPaymentStatusColor = (value: string, type: 'bg' | 'text' = 'bg') => {
  const status = PAYMENT_STATUSES.find(s => s.value === value);
  if (!status) return type === 'bg' ? "bg-gray-400" : "text-gray-900 dark:text-gray-100";
  return type === 'bg' ? status.color : status.color.replace('bg-', 'text-');
};

export const getPaymentStatusLabel = (value: string) => {
  return PAYMENT_STATUSES.find(s => s.value === value)?.label || value;
};
