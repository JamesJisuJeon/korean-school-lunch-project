"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

interface Menu {
  id: string;
  date: string;
  price: number;
}

interface ClassStat {
  className: string;
  totalStudents: number;
  orderedCount: number;
  paidCount: number;
  unpaidCount: number;
  waitingCount: number;
  cancelledCount: number;
  paChildCount: number;
  paidAmount: number;
  unpaidAmount: number;
  couponAmount: number;
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
  finalConfirmedCount: number;
  preOrderPaidAmount: number;
  preOrderUnpaidAmount: number;
  onSitePaidAmount: number;
  onSiteUnpaidAmount: number;
  totalPaidAmount: number;
  couponSaleAmount: number;
  couponSaleUnpaidAmount: number;
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
    <div className={`rounded-2xl border-2 p-5 flex flex-col gap-1 ${colorMap[color]}`}>
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-3xl font-black ${colorMap[color].split(" ").slice(2).join(" ")}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
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
        if (d.length > 0) setSelectedMenuId(d[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedMenuId) return;
    setIsLoading(true);
    fetch(`/api/pa/analytics?menuId=${selectedMenuId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [selectedMenuId]);

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="space-y-8">
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

      {isLoading && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500 font-bold">집계 중...</div>
      )}

      {!isLoading && data && (
        <>
          {/* 신청/수납 현황 */}
          <div>
            <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">신청/수납 현황</h2>
            {/* 1열: 신청 관련 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
              <StatCard label="총 인원" value={`${data.totalStudents}명`} color="gray" />
              <StatCard label="사전 신청 일반" value={`${data.preOrderRegularCount}명`} sub="취소 포함" color="blue" />
              <StatCard label="사전 신청 학부모회 자녀" value={`${data.preOrderPAChildCount}명`} sub="취소 포함" color="purple" />
              <StatCard label="총 사전 신청" value={`${data.totalPreOrders}명`} sub="취소 포함" color="blue" />
              <StatCard label="사전 신청 취소" value={`${data.preOrderCancelledCount}명`} color="red" />
              <StatCard label="현장 신청" value={`${data.onSiteCount}명`} color="orange" />
              <StatCard label="최종 신청 인원" value={`${data.finalOrderCount}명`} sub="후납 포함" color="green" />
            </div>
            {/* 2열: 수납 관련 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="수납 대기" value={`${data.waitingCount}명`} color="gray" />
              <StatCard label="납부 / 후납-납부" value={`${data.paidConfirmedCount}명`} color="green" />
              <StatCard label="후납" value={`${data.unpaidCount}명`} color="yellow" />
              <StatCard label="최종 확정 인원" value={`${data.finalConfirmedCount}명`} sub="납부+후납 합계" color="green" />
            </div>
          </div>

          {/* 금액 집계 */}
          <div>
            <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">금액 현황</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              <StatCard label="점심 납부 총액" value={fmt(data.totalPaidAmount)} sub="사전+현장" color="green" />
              <StatCard label="사전 신청 납부" value={fmt(data.preOrderPaidAmount)} color="green" />
              <StatCard label="사전 신청 후납" value={fmt(data.preOrderUnpaidAmount)} color="yellow" />
              <StatCard label="현장 신청 납부" value={fmt(data.onSitePaidAmount)} color="green" />
              <StatCard label="현장 신청 후납" value={fmt(data.onSiteUnpaidAmount)} color="yellow" />
              <StatCard label="쿠폰 판매 금액" value={fmt(data.couponSaleAmount)} sub="당일 매점 쿠폰" color="green" />
              <StatCard label="쿠폰 판매 후납" value={fmt(data.couponSaleUnpaidAmount)} color="yellow" />
            </div>
          </div>

          {/* 반별 통계 */}
          <div>
            <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">반별 통계</h2>
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
              <table className="min-w-[640px] w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400">반</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">총인원</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">신청</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">수납완료</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">후납</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">수납대기</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">취소</th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400">PA자녀</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 dark:text-gray-400">납부금액</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 dark:text-gray-400">쿠폰금액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.classSummary.map((cls) => (
                    <tr key={cls.className} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-black text-gray-950 dark:text-gray-100">{cls.className}</td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 font-bold">{cls.totalStudents}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-blue-700 dark:text-blue-400">{cls.orderedCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-green-700 dark:text-green-400">{cls.paidCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-yellow-700 dark:text-yellow-400">{cls.unpaidCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-gray-500 dark:text-gray-400">{cls.waitingCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-red-600 dark:text-red-400">{cls.cancelledCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-purple-600 dark:text-purple-400">{cls.paChildCount}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300">{fmt(cls.paidAmount)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300">
                        {cls.couponAmount > 0 ? fmt(cls.couponAmount) : <span className="text-gray-300 dark:text-gray-700">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* 합계 행 */}
                <tfoot className="bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray-200 dark:border-gray-700">
                  <tr>
                    <td className="px-4 py-3 text-xs font-black text-gray-500 dark:text-gray-400">합계</td>
                    <td className="px-4 py-3 text-center font-black text-gray-900 dark:text-gray-100">
                      {data.classSummary.reduce((s, c) => s + c.totalStudents, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-blue-700 dark:text-blue-400">
                      {data.classSummary.reduce((s, c) => s + c.orderedCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-green-700 dark:text-green-400">
                      {data.classSummary.reduce((s, c) => s + c.paidCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-yellow-700 dark:text-yellow-400">
                      {data.classSummary.reduce((s, c) => s + c.unpaidCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-gray-500 dark:text-gray-400">
                      {data.classSummary.reduce((s, c) => s + c.waitingCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-red-600 dark:text-red-400">
                      {data.classSummary.reduce((s, c) => s + c.cancelledCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-purple-600 dark:text-purple-400">
                      {data.classSummary.reduce((s, c) => s + c.paChildCount, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-gray-100">
                      {fmt(data.classSummary.reduce((s, c) => s + c.paidAmount, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-gray-100">
                      {fmt(data.classSummary.reduce((s, c) => s + c.couponAmount, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
