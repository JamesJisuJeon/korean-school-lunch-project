"use client";

import { useEffect, useState } from "react";
import { Calendar, RefreshCw } from "lucide-react";

interface Menu {
  id: string;
  date: string;
  price: number;
  isPublished: boolean;
}

interface ClassStat {
  className: string;
  totalStudents: number;
  orderedCount: number;
  confirmedCount: number;
  paidCount: number;
  unpaidCount: number;
  waitingCount: number;
  cancelledCount: number;
  paChildCount: number;
  freeLunchCount: number;
  paidAmount: number;
  unpaidAmount: number;
  couponAmount: number;
  couponUnpaidAmount: number;
  freeCouponCount: number;
}

interface Analytics {
  menu: { date: string; price: number };
  totalStudents: number;
  finalOrderCount: number;
  totalPreOrders: number;
  preOrderRegularCount: number;
  preOrderPAChildCount: number;
  preOrderCancelledCount: number;
  onSiteCount: number;
  waitingCount: number;
  paidConfirmedCount: number;
  unpaidCount: number;
  freeLunchCount: number;
  freeCouponCount: number;
  finalConfirmedCount: number;
  preOrderPaidAmount: number;
  preOrderUnpaidAmount: number;
  onSitePaidAmount: number;
  onSiteUnpaidAmount: number;
  totalPaidAmount: number;
  couponSaleAmount: number;
  couponSaleUnpaidAmount: number;
  totalRevenue: number;
  classSummary: ClassStat[];
}

function StatCard({
  label,
  value,
  sub,
  color = "gray",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "gray" | "blue" | "green" | "yellow" | "red" | "purple" | "orange";
}) {
  const colorMap: Record<string, string> = {
    gray: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50",
    blue: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    green: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
    yellow: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300",
    red: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
    purple: "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
    orange: "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300",
  };
  return (
    <div className={`rounded-xl sm:rounded-2xl border sm:border-2 p-2 sm:p-3 flex flex-col items-center text-center gap-0.5 sm:gap-1 ${colorMap[color]}`}>
      <p className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
      <p className={`text-lg sm:text-3xl font-black leading-tight ${colorMap[color].split(" ").slice(2).join(" ")}`}>{value}</p>
      {sub && <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

export default function AnalyticsClient() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [data, setData] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/pa/menu")
      .then((r) => r.json())
      .then((d: Menu[]) => {
        setMenus(d);
        if (d.length > 0) {
          const published = d.find((m) => m.isPublished);
          setSelectedMenuId(published ? published.id : d[0].id);
        }
      });
  }, []);

  const fetchData = () => {
    if (!selectedMenuId) return;
    setIsLoading(true);
    fetch(`/api/pa/analytics?menuId=${selectedMenuId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedMenuId]);

  const fmt = (n: number) => `$${Math.round(n)}`;

  return (
    <div>
      {/* 메뉴 선택 */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3 max-w-xs">
        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
        <select
          className="flex-1 bg-transparent border-none text-gray-950 dark:text-gray-100 font-black text-base focus:ring-0 cursor-pointer outline-none"
          value={selectedMenuId}
          onChange={(e) => setSelectedMenuId(e.target.value)}
        >
          {menus.map((m) => (
            <option key={m.id} value={m.id}>
              {new Date(m.date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })} 점심
            </option>
          ))}
        </select>
      </div>

      {isLoading && !data && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500 font-bold">집계 중...</div>
      )}

      {data && (
        <div className="space-y-8 mt-3">
          {/* 신청/수납 현황 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">신청/수납 현황</h2>
              <button onClick={fetchData} className="p-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="새로고침"><RefreshCw className={`w-4 h-4 transition-transform ${isLoading ? "animate-spin" : ""}`} /></button>
            </div>
            {/* 1열: 신청 관련 */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 mb-3 sm:mb-4">
              <StatCard label="사전 신청 일반" value={`${data.preOrderRegularCount}명`} color="blue" />
              <StatCard label="사전 신청 PA자녀" value={`${data.preOrderPAChildCount}명`} color="purple" />
              <StatCard label="총 사전 신청" value={`${data.totalPreOrders}명`} color="blue" />
              <StatCard label="사전 신청 취소" value={`${data.preOrderCancelledCount}명`} color="red" />
              <StatCard label="현장 신청" value={`${data.onSiteCount}명`} color="orange" />
              <StatCard label="무료쿠폰" value={`${data.freeCouponCount}명`} color="green" />
            </div>
            {/* 2열: 수납 관련 */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
              <StatCard label="최종 신청 인원" value={`${data.finalOrderCount}명`} color="green" />
              <StatCard label="최종 확정 인원" value={`${data.finalConfirmedCount}명`} color="green" />
              <StatCard label="수납 대기" value={`${data.waitingCount}명`} color="gray" />
              <StatCard label="납부 / 후납-납부" value={`${data.paidConfirmedCount}명`} color="green" />
              <StatCard label="후납" value={`${data.unpaidCount}명`} color="yellow" />
              <StatCard label="무료간식" value={`${data.freeLunchCount}명`} color="green" />
            </div>
          </div>

          {/* 금액 집계 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">금액 현황</h2>
              <button onClick={fetchData} className="p-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="새로고침"><RefreshCw className={`w-4 h-4 transition-transform ${isLoading ? "animate-spin" : ""}`} /></button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
              <StatCard label="총 매출" value={fmt(data.totalRevenue)} color="blue" />
              <StatCard label="점심 납부 총액" value={fmt(data.totalPaidAmount)} color="green" />
              <StatCard label="사전 신청 납부" value={fmt(data.preOrderPaidAmount)} color="green" />
              <StatCard label="사전 신청 후납" value={fmt(data.preOrderUnpaidAmount)} color="yellow" />
              <StatCard label="현장 신청 납부" value={fmt(data.onSitePaidAmount)} color="green" />
              <StatCard label="현장 신청 후납" value={fmt(data.onSiteUnpaidAmount)} color="yellow" />
              <StatCard label="쿠폰 납부 금액" value={fmt(data.couponSaleAmount)} color="green" />
              <StatCard label="쿠폰 판매 후납" value={fmt(data.couponSaleUnpaidAmount)} color="yellow" />
            </div>
          </div>

          {/* 반별 통계 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">반별 통계</h2>
              <button onClick={fetchData} className="p-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="새로고침"><RefreshCw className={`w-4 h-4 transition-transform ${isLoading ? "animate-spin" : ""}`} /></button>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-auto max-h-[70vh]">
              <table className="min-w-[640px] w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-20">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 sticky left-0 z-30 bg-gray-50 dark:bg-gray-800 whitespace-nowrap">반</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">총인원</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">신청</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">확정</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">수납대기</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">수납완료</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">후납</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">취소</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">PA자녀</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">무료간식</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">무료쿠폰</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 dark:text-gray-400">납부금액</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 dark:text-gray-400">쿠폰납부</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 dark:text-gray-400">쿠폰후납</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.classSummary.map((cls) => (
                    <tr key={cls.className} className="group hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-black text-gray-950 dark:text-gray-100 sticky left-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-gray-50/60 dark:group-hover:bg-gray-800/30 transition-colors whitespace-nowrap">{cls.className}</td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 font-bold">{cls.totalStudents}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-black ${
                          cls.confirmedCount !== cls.orderedCount && cls.orderedCount > 0
                            ? "text-white bg-orange-500 dark:bg-orange-600 px-2 py-0.5 rounded-full text-xs"
                            : "text-blue-700 dark:text-blue-400"
                        }`}>{cls.orderedCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-black ${
                          cls.confirmedCount === cls.orderedCount && cls.orderedCount > 0
                            ? "text-white bg-indigo-600 dark:bg-indigo-500 px-2 py-0.5 rounded-full text-xs"
                            : "text-indigo-700 dark:text-indigo-400"
                        }`}>{cls.confirmedCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-gray-500 dark:text-gray-400">{cls.waitingCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-green-700 dark:text-green-400">{cls.paidCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-yellow-700 dark:text-yellow-400">{cls.unpaidCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-red-600 dark:text-red-400">{cls.cancelledCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-purple-600 dark:text-purple-400">{cls.paChildCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-emerald-600 dark:text-emerald-400">{cls.freeLunchCount > 0 ? cls.freeLunchCount : <span className="text-gray-300 dark:text-gray-700">-</span>}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {cls.freeCouponCount > 0 ? cls.freeCouponCount : <span className="text-gray-300 dark:text-gray-700">-</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300">{fmt(cls.paidAmount)}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700 dark:text-green-400">
                        {cls.couponAmount > 0 ? fmt(cls.couponAmount) : <span className="text-gray-300 dark:text-gray-700">-</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-yellow-700 dark:text-yellow-400">
                        {cls.couponUnpaidAmount > 0 ? fmt(cls.couponUnpaidAmount) : <span className="text-gray-300 dark:text-gray-700">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* 합계 행 */}
                <tfoot className="bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray-200 dark:border-gray-700">
                  <tr>
                    <td className="px-4 py-3 text-xs font-black text-gray-500 dark:text-gray-400 sticky left-0 z-10 bg-gray-50 dark:bg-gray-800/50">합계</td>
                    <td className="px-4 py-3 text-center font-black text-gray-900 dark:text-gray-100">
                      {data.classSummary.reduce((s, c) => s + c.totalStudents, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-blue-700 dark:text-blue-400">
                      {data.classSummary.reduce((s, c) => s + c.orderedCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-indigo-700 dark:text-indigo-400">
                      {data.classSummary.reduce((s, c) => s + c.confirmedCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-gray-500 dark:text-gray-400">
                      {data.classSummary.reduce((s, c) => s + c.waitingCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-green-700 dark:text-green-400">
                      {data.classSummary.reduce((s, c) => s + c.paidCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-yellow-700 dark:text-yellow-400">
                      {data.classSummary.reduce((s, c) => s + c.unpaidCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-red-600 dark:text-red-400">
                      {data.classSummary.reduce((s, c) => s + c.cancelledCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-purple-600 dark:text-purple-400">
                      {data.classSummary.reduce((s, c) => s + c.paChildCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-emerald-600 dark:text-emerald-400">
                      {data.classSummary.reduce((s, c) => s + c.freeLunchCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-emerald-600 dark:text-emerald-400">
                      {data.classSummary.reduce((s, c) => s + c.freeCouponCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-gray-100">
                      {fmt(data.classSummary.reduce((s, c) => s + c.paidAmount, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-green-700 dark:text-green-400">
                      {fmt(data.classSummary.reduce((s, c) => s + c.couponAmount, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-yellow-700 dark:text-yellow-400">
                      {fmt(data.classSummary.reduce((s, c) => s + c.couponUnpaidAmount, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
