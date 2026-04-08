"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, DollarSign, ShoppingBag, Filter, UserPlus, X, Check, Calendar, ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw } from "lucide-react";

interface StudentWithOrder {
  id: string;
  name: string;
  isPAChild: boolean;
  class: { name: string; sortOrder: number | null } | null;
  orders: {
    id: string;
    isPaid: boolean;
    amount: number;
    status: string;
    notes: string | null;
    orderType: string;
  }[];
  couponSales: {
    id: string;
    quantity: number;
    amount: number;
    paymentStatus: string;
    menuId: string;
  }[];
}

interface Menu {
  id: string;
  date: string;
  price: number;
  isPublished: boolean;
}

const PAYMENT_STATUSES = [
  { value: "WAITING", label: "수납 대기", color: "bg-gray-400" },
  { value: "PAID", label: "납부", color: "bg-green-600" },
  { value: "UNPAID", label: "후납", color: "bg-yellow-600" },
  { value: "POST_PAID", label: "후납-납부", color: "bg-blue-600" },
  { value: "CANCELLED", label: "취소", color: "bg-red-600" },
  { value: "FREE_SNACK", label: "무료간식", color: "bg-emerald-500" },
];

type SortKey = "class" | "name";
type SortDir = "asc" | "desc";

export default function SalesManagementClient() {
  const [students, setStudents] = useState<StudentWithOrder[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 정렬
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // 필터
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterOrderType, setFilterOrderType] = useState("ALL"); // ALL | PRE_ORDER | ON_SITE | NONE
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCoupon, setFilterCoupon] = useState("ALL"); // ALL | HAS | NONE
  const [filterCouponStatus, setFilterCouponStatus] = useState("ALL"); // ALL | PAID | UNPAID | POST_PAID | FREE_COUPON
  const [filterPAChild, setFilterPAChild] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  useEffect(() => {
    if (selectedMenuId) fetchStudents();
  }, [selectedMenuId]);

  const fetchMenus = async () => {
    const res = await fetch("/api/pa/menu");
    if (res.ok) {
      const data = await res.json();
      setMenus(data);
      if (data.length > 0) {
        const published = data.find((m: Menu) => m.isPublished);
        // 게시된 메뉴가 있으면 해당 메뉴, 없으면 날짜 기준 최신 메뉴(API가 date desc 정렬이므로 첫 번째)
        setSelectedMenuId(published ? published.id : data[0].id);
      }
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    const res = await fetch(`/api/pa/sales?menuId=${selectedMenuId}`);
    if (res.ok) setStudents(await res.json());
    setIsLoading(false);
  };

  const updateOrderStatus = async (orderId: string, status: string, amount?: number) => {
    const body: any = { orderId, status, isPaid: status === "PAID" || status === "POST_PAID" };
    if (amount !== undefined) body.amount = amount;
    const res = await fetch("/api/pa/sales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) fetchStudents();
  };

  const handleOrderStatusChange = (order: StudentWithOrder["orders"][0], newStatus: string, isPAChild: boolean) => {
    if (newStatus === "FREE_SNACK") {
      if (!confirm("무료간식으로 변경하시겠습니까?\n간식 비용이 $0으로 처리됩니다.")) return;
      updateOrderStatus(order.id, newStatus, 0);
    } else if (order.status === "FREE_SNACK") {
      const menu = menus.find(m => m.id === selectedMenuId);
      const originalPrice = isPAChild ? 0 : (menu?.price ?? 0);
      updateOrderStatus(order.id, newStatus, originalPrice);
    } else if (order.orderType === "ON_SITE" && newStatus === "CANCELLED") {
      cancelOnSiteOrder(order.id);
    } else {
      updateOrderStatus(order.id, newStatus);
    }
  };

  const handleOnSiteOrder = async (studentId: string) => {
    const res = await fetch("/api/pa/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, menuId: selectedMenuId }),
    });
    if (res.ok) fetchStudents();
  };

  const updateCouponPaymentStatus = async (studentId: string, menuId: string, couponPaymentStatus: string, couponAmount?: number) => {
    const body: any = { studentId, menuId, couponPaymentStatus };
    if (couponAmount !== undefined) body.couponAmount = couponAmount;
    await fetch("/api/pa/sales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    fetchStudents();
  };

  const handleCouponStatusChange = (studentId: string, couponSale: StudentWithOrder["couponSales"][0], newStatus: string, couponQty: number) => {
    if (newStatus === "FREE_COUPON") {
      if (!confirm("무료쿠폰으로 변경하시겠습니까?\n쿠폰 비용이 $0으로 처리됩니다.")) return;
      updateCouponPaymentStatus(studentId, selectedMenuId, newStatus, 0);
    } else if (couponSale.paymentStatus === "FREE_COUPON") {
      updateCouponPaymentStatus(studentId, selectedMenuId, newStatus, couponQty * 5);
    } else {
      updateCouponPaymentStatus(studentId, selectedMenuId, newStatus);
    }
  };

  const cancelOnSiteOrder = async (orderId: string) => {
    const res = await fetch("/api/pa/sales", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    if (res.ok) fetchStudents();
    else {
      const data = await res.json();
      alert(data.message || "취소 중 오류가 발생했습니다.");
    }
  };

  const updateCouponQty = async (studentId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    const res = await fetch("/api/pa/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, menuId: selectedMenuId, quantity: newQty }),
    });
    if (res.ok) fetchStudents();
  };

  // 정렬 토글
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // 학급 목록 (필터 드롭다운용)
  const classList = useMemo(() => {
    const seen = new Map<string, number | null>();
    for (const s of students) {
      const name = s.class?.name ?? "반미지정";
      if (!seen.has(name)) seen.set(name, s.class?.sortOrder ?? null);
    }
    return Array.from(seen.entries())
      .sort(([, aOrder], [, bOrder]) => {
        if (aOrder === null && bOrder === null) return 0;
        if (aOrder === null) return 1;
        if (bOrder === null) return -1;
        return aOrder - bOrder;
      })
      .map(([name]) => name);
  }, [students]);

  // 필터 + 검색 + 정렬
  const displayedStudents = useMemo(() => {
    let result = [...students];

    // 검색
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.class?.name || "").toLowerCase().includes(q)
      );
    }

    // 학급 필터
    if (filterClass !== "ALL") {
      result = result.filter(s =>
        filterClass === "반미지정" ? !s.class : s.class?.name === filterClass
      );
    }

    // 신청 유형 필터
    if (filterOrderType !== "ALL") {
      if (filterOrderType === "NONE") {
        result = result.filter(s => s.orders.length === 0);
      } else {
        result = result.filter(s => s.orders[0]?.orderType === filterOrderType);
      }
    }

    // 수납 상태 필터
    if (filterStatus !== "ALL") {
      if (filterStatus === "NONE") {
        result = result.filter(s => s.orders.length === 0);
      } else {
        result = result.filter(s => s.orders[0]?.status === filterStatus);
      }
    }

    // 쿠폰 필터
    if (filterCoupon === "HAS") {
      result = result.filter(s => s.couponSales.length > 0 && s.couponSales[0].quantity > 0);
    } else if (filterCoupon === "NONE") {
      result = result.filter(s => s.couponSales.length === 0 || s.couponSales[0].quantity === 0);
    }

    // 쿠폰비 수납 상태 필터
    if (filterCouponStatus !== "ALL") {
      result = result.filter(s =>
        s.couponSales.length > 0 && s.couponSales[0].quantity > 0 && s.couponSales[0].paymentStatus === filterCouponStatus
      );
    }

    // PA 자녀 필터
    if (filterPAChild) {
      result = result.filter(s => s.isPAChild);
    }

    // 정렬
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "class") {
        const aOrder = a.class?.sortOrder ?? Infinity;
        const bOrder = b.class?.sortOrder ?? Infinity;
        cmp = aOrder - bOrder;
        if (cmp === 0) cmp = a.name.localeCompare(b.name, "ko");
      } else {
        cmp = a.name.localeCompare(b.name, "ko");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [students, searchTerm, filterClass, filterOrderType, filterStatus, filterCoupon, filterCouponStatus, filterPAChild, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-400 dark:text-gray-600" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 ml-1 text-blue-500" />
      : <ChevronDown className="w-3 h-3 ml-1 text-blue-500" />;
  };

  const activeFilterCount = [
    filterClass !== "ALL",
    filterOrderType !== "ALL",
    filterStatus !== "ALL",
    filterCoupon !== "ALL",
    filterCouponStatus !== "ALL",
    filterPAChild,
  ].filter(Boolean).length;

  const selectClass = "rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] md:text-xs font-black text-gray-700 dark:text-gray-200 py-1 md:py-2 px-2 md:px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 appearance-none cursor-pointer transition-all";

  return (
    <div className="space-y-8">
      {/* 통계 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-gray-100 dark:bg-gray-900 p-4 md:p-6 rounded-[2rem] shadow-sm border border-gray-200 dark:border-gray-800 flex justify-around items-center">
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">식사 신청 합계</p>
            <h3 className="text-3xl md:text-4xl font-black text-gray-950 dark:text-white">
              {students.filter(s => s.orders.length > 0 && s.orders[0].status !== "CANCELLED").length}
              <span className="text-sm"> 명</span>
            </h3>
          </div>
          <div className="w-px h-8 md:h-10 bg-gray-300 dark:bg-gray-700" />
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">쿠폰 판매 합계</p>
            <h3 className="text-3xl md:text-4xl font-black text-purple-600 dark:text-purple-400">
              {students.reduce((acc, curr) => acc + curr.couponSales.reduce((c, n) => c + n.quantity, 0), 0)}
              <span className="text-sm"> 매</span>
            </h3>
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-gray-900 p-4 md:p-6 rounded-[2.5rem] border border-gray-200 dark:border-gray-800 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">배식 날짜 선택</label>
              <select
                className="w-full bg-transparent border-none p-0 font-black text-lg md:text-xl text-gray-900 dark:text-gray-100 focus:ring-0 cursor-pointer outline-none"
                value={selectedMenuId}
                onChange={(e) => setSelectedMenuId(e.target.value)}
              >
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {new Date(m.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 + 필터 */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="sticky top-28 md:top-16 z-20 bg-white dark:bg-gray-900 rounded-t-[2.5rem] overflow-hidden">
        <div className="p-3 sm:p-6 border-b border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 space-y-2 sm:space-y-4">
          {/* 검색창 */}
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
            <input
              className="pl-12 w-full h-10 sm:h-14 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-0 font-bold transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
              placeholder="학생 또는 학급 이름 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 필터 + 정렬 1줄 */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 shrink-0 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              <Filter className="w-3.5 h-3.5" />
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 flex items-center justify-center bg-blue-600 text-white rounded-full text-[9px] font-black">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <select className={selectClass} value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                <option value="ALL">전체 학급</option>
                {classList.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
              <select className={selectClass} value={filterOrderType} onChange={(e) => setFilterOrderType(e.target.value)}>
                <option value="ALL">전체 신청</option>
                <option value="PRE_ORDER">사전 신청</option>
                <option value="ON_SITE">현장 신청</option>
                <option value="NONE">미신청</option>
              </select>
              <select className={selectClass} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">전체 수납</option>
                {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                <option value="NONE">미신청</option>
              </select>
              <select className={selectClass} value={filterCoupon} onChange={(e) => setFilterCoupon(e.target.value)}>
                <option value="ALL">전체 쿠폰</option>
                <option value="HAS">쿠폰 있음</option>
                <option value="NONE">쿠폰 없음</option>
              </select>
              <select className={selectClass} value={filterCouponStatus} onChange={(e) => setFilterCouponStatus(e.target.value)}>
                <option value="ALL">전체</option>
                <option value="PAID">납부</option>
                <option value="UNPAID">후납</option>
                <option value="POST_PAID">후납-납부</option>
                <option value="FREE_COUPON">무료쿠폰</option>
              </select>
              <button
                onClick={() => setFilterPAChild(v => !v)}
                className={`shrink-0 flex items-center gap-1 px-2 md:px-3 py-1 md:py-2 rounded-xl text-[11px] md:text-xs font-black transition-all border-2 ${
                  filterPAChild
                    ? "bg-yellow-400 text-yellow-950 border-yellow-400"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700"
                }`}
              >
                PA
              </button>
              {activeFilterCount > 0 && (
                <>
                  <button
                    onClick={() => { setFilterClass("ALL"); setFilterOrderType("ALL"); setFilterStatus("ALL"); setFilterCoupon("ALL"); setFilterCouponStatus("ALL"); setFilterPAChild(false); }}
                    className="md:hidden flex items-center justify-center w-6 h-6 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full border border-red-100 dark:border-red-800 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => { setFilterClass("ALL"); setFilterOrderType("ALL"); setFilterStatus("ALL"); setFilterCoupon("ALL"); setFilterCouponStatus("ALL"); setFilterPAChild(false); }}
                    className="hidden md:flex items-center gap-1 px-2 py-1 text-[10px] font-black text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 transition-colors"
                  >
                    <X className="w-3 h-3" /> 초기화
                  </button>
                </>
              )}
              <button
                onClick={fetchStudents}
                className="hidden md:flex shrink-0 items-center justify-center p-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-gray-100 dark:border-gray-700 ml-2"
                title="새로고침"
              >
                <RefreshCw className={`w-3.5 h-3.5 transition-transform ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <div className="md:hidden w-px h-4 bg-gray-200 dark:bg-gray-700 shrink-0" />
              <button
                onClick={() => handleSort("class")}
                className={`md:hidden shrink-0 flex items-center gap-0.5 px-2 py-1 rounded-xl text-[11px] font-black transition-all border ${
                  sortKey === "class" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                }`}
              >
                학급 <SortIcon col="class" />
              </button>
              <button
                onClick={() => handleSort("name")}
                className={`md:hidden shrink-0 flex items-center gap-0.5 px-2 py-1 rounded-xl text-[11px] font-black transition-all border ${
                  sortKey === "name" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                }`}
              >
                이름 <SortIcon col="name" />
              </button>
              <button
                onClick={fetchStudents}
                className="md:hidden shrink-0 flex items-center justify-center p-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-gray-200 dark:border-gray-700"
                title="새로고침"
              >
                <RefreshCw className={`w-3.5 h-3.5 transition-transform ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <span className="shrink-0 text-[10px] font-black text-gray-400 dark:text-gray-500">
              {displayedStudents.length}
            </span>
          </div>
        </div>
        </div>{/* sticky wrapper end */}

        {/* 모바일 카드 레이아웃 */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
          {displayedStudents.map((student) => {
            const order = student.orders[0];
            const couponSale = student.couponSales[0] ?? null;
            const couponQty = couponSale?.quantity ?? 0;
            const total = (order?.amount ?? 0) + (couponSale?.amount ?? 0);

            return (
              <div key={student.id} className="p-4 space-y-2.5">
                {/* Row 1: 이름/학급/총액 (왼쪽) · 신청유형 (오른쪽) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className={`text-base font-black shrink-0 ${student.isPAChild ? "bg-yellow-400 text-yellow-950 px-2 py-0.5 rounded-md" : "text-gray-950 dark:text-gray-100"}`}>{student.name}</p>
                    <p className="text-sm font-black text-blue-500 dark:text-blue-400 shrink-0">{student.class?.name || "반미지정"}</p>
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-black text-gray-800 dark:text-gray-200">${total}</span>
                  </div>
                  {order ? (
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${
                      order.orderType === "PRE_ORDER"
                        ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800"
                        : "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-800"
                    }`}>
                      <Check className="w-3 h-3" />
                      {order.orderType === "PRE_ORDER" ? "사전" : "현장"} ${order.amount}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOnSiteOrder(student.id)}
                      className="shrink-0 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl border-2 border-blue-100 dark:border-blue-800 hover:bg-blue-600 hover:text-white transition-all active:scale-95 whitespace-nowrap"
                    >
                      현장 신청
                    </button>
                  )}
                </div>

                {/* Row 2: 특이사항 (왼쪽) · 수납상태 (오른쪽) */}
                {order && (
                  <div className="flex items-center justify-between gap-2">
                    <input
                      className="flex-1 min-w-0 bg-red-50/50 dark:bg-red-950/20 border border-transparent rounded-lg py-2 px-3 text-sm font-medium text-red-600 dark:text-red-400 italic placeholder:text-red-300 dark:placeholder:text-red-900/50 focus:border-red-400 focus:bg-white dark:focus:bg-gray-900 focus:outline-none"
                      placeholder="특이사항..."
                      defaultValue={order.notes || ""}
                      onBlur={async (e) => {
                        if (e.target.value !== (order.notes || "")) {
                          await fetch("/api/pa/sales", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ orderId: order.id, notes: e.target.value }),
                          });
                          fetchStudents();
                        }
                      }}
                    />
                    <select
                      className={`shrink-0 rounded-xl border-2 py-2 px-3 text-xs font-black appearance-none cursor-pointer ${
                        PAYMENT_STATUSES.find(s => s.value === order.status)?.color.replace('bg-', 'text-') || "text-gray-900 dark:text-gray-100"
                      } bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-0 outline-none`}
                      value={order.status}
                      onChange={(e) => handleOrderStatusChange(order, e.target.value, student.isPAChild)}
                    >
                      {PAYMENT_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Row 3: 쿠폰 수량 (왼쪽) · 쿠폰 납부상태 (오른쪽) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400 dark:text-gray-500 shrink-0">쿠폰 ($5)</span>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-2.5 py-1.5 border-2 border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => updateCouponQty(student.id, couponQty, -1)}
                        disabled={couponQty <= 0}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 active:scale-90 text-base font-bold"
                      >-</button>
                      <span className="text-base font-black text-gray-900 dark:text-gray-100 w-5 text-center">{couponQty}</span>
                      <button
                        onClick={() => updateCouponQty(student.id, couponQty, 1)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:text-purple-600 transition-colors active:scale-90 text-base font-bold"
                      >+</button>
                    </div>
                  </div>
                  {couponQty > 0 && couponSale && (
                    <select
                      className="shrink-0 rounded-xl border-2 py-2 px-3 text-xs font-black appearance-none cursor-pointer bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-0 outline-none text-gray-700 dark:text-gray-200"
                      value={couponSale.paymentStatus}
                      onChange={(e) => handleCouponStatusChange(student.id, couponSale, e.target.value, couponQty)}
                    >
                      <option value="PAID">납부</option>
                      <option value="UNPAID">후납</option>
                      <option value="POST_PAID">후납-납부</option>
                      <option value="FREE_COUPON">무료쿠폰</option>
                    </select>
                  )}
                </div>
              </div>
            );
          })}
          {displayedStudents.length === 0 && (
            <div className="px-8 py-16 text-center text-gray-300 dark:text-gray-600 font-black italic">
              {students.length === 0 ? "배식 날짜를 선택해 주세요." : "조건에 맞는 학생이 없습니다."}
            </div>
          )}
        </div>

        {/* 데스크탑 테이블 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th
                  className="px-4 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none w-28"
                  onClick={() => handleSort("class")}
                >
                  <div className="flex items-center gap-1">
                    학급 <SortIcon col="class" />
                  </div>
                </th>
                <th
                  className="px-4 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none w-32"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    이름 <SortIcon col="name" />
                  </div>
                </th>
                <th className="px-4 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 w-36">사전 신청/현장 신청</th>
                <th className="px-4 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 w-32">수납 상태</th>
                <th className="px-4 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400">특이사항</th>
                <th className="px-4 py-5 text-center text-xs font-black text-gray-500 dark:text-gray-400 w-36">매점 쿠폰 ($5)</th>
                <th className="px-4 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 w-32">쿠폰비 수납</th>
                <th className="px-4 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 w-24">총액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {displayedStudents.map((student) => {
                const order = student.orders[0];
                const couponSale = student.couponSales[0] ?? null;
                const couponQty = couponSale?.quantity ?? 0;
                const total = (order?.amount ?? 0) + (couponSale?.amount ?? 0);

                return (
                  <tr key={student.id} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="px-4 py-5 whitespace-nowrap">
                      <p className="text-sm font-black text-blue-500 dark:text-blue-400">
                        {student.class?.name || "반미지정"}
                      </p>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      <p className="text-base font-black text-gray-950 dark:text-gray-100">{student.name}</p>
                      {student.isPAChild && (
                        <span className="inline-block mt-1 text-[10px] bg-yellow-400 text-yellow-950 font-black px-2 py-0.5 rounded-md">학부모회 자녀</span>
                      )}
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      {order ? (
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border w-fit ${
                            order.orderType === "PRE_ORDER"
                              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800"
                              : "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-800"
                          }`}>
                            <Check className="w-3 h-3" />
                            {order.orderType === "PRE_ORDER" ? "사전 신청" : "현장 신청"}
                          </span>
                          <span className="text-xs font-bold text-gray-400 dark:text-gray-500">${order.amount}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOnSiteOrder(student.id)}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl border-2 border-blue-100 dark:border-blue-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white transition-all shadow-sm active:scale-95 whitespace-nowrap"
                        >
                          현장 신청
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      {order ? (
                        <select
                          className={`w-28 rounded-xl border-2 py-2 px-3 text-xs font-black transition-all appearance-none cursor-pointer ${
                            PAYMENT_STATUSES.find(s => s.value === order.status)?.color.replace('bg-', 'text-') || "text-gray-900 dark:text-gray-100"
                          } bg-gray-50 dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:ring-0 outline-none`}
                          value={order.status}
                          onChange={(e) => handleOrderStatusChange(order, e.target.value, student.isPAChild)}
                        >
                          {PAYMENT_STATUSES.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-200 dark:text-gray-700 font-bold italic">-</span>
                      )}
                    </td>
                    <td className="px-4 py-5">
                      {order ? (
                        <input
                          className="w-full min-w-[140px] bg-red-50/50 dark:bg-red-950/20 border border-transparent rounded-lg py-2 px-3 text-sm font-medium text-red-600 dark:text-red-400 italic placeholder:text-red-300 dark:placeholder:text-red-900/50 hover:border-red-100 dark:hover:border-red-900/30 transition-all focus:border-red-400 dark:focus:border-red-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none"
                          placeholder="특이사항..."
                          defaultValue={order.notes || ""}
                          onBlur={async (e) => {
                            if (e.target.value !== (order.notes || "")) {
                              await fetch("/api/pa/sales", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ orderId: order.id, notes: e.target.value }),
                              });
                              fetchStudents();
                            }
                          }}
                        />
                      ) : (
                        <span className="text-gray-200 dark:text-gray-700 font-bold italic">-</span>
                      )}
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-4 bg-gray-50 dark:bg-gray-800 rounded-2xl p-2 w-32 mx-auto border-2 border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => updateCouponQty(student.id, couponQty, -1)}
                          disabled={couponQty <= 0}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 hover:border-red-100 dark:hover:border-red-900/50 transition-colors disabled:opacity-30 active:scale-90"
                        >
                          -
                        </button>
                        <span className="text-lg font-black text-gray-900 dark:text-gray-100 w-4 text-center">{couponQty}</span>
                        <button
                          onClick={() => updateCouponQty(student.id, couponQty, 1)}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-purple-600 hover:border-purple-100 dark:hover:border-purple-900/50 transition-colors active:scale-90"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      {couponQty > 0 && couponSale ? (
                        <select
                          className="w-28 rounded-xl border-2 py-2 px-3 text-xs font-black transition-all appearance-none cursor-pointer bg-gray-50 dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:ring-0 outline-none text-gray-700 dark:text-gray-200"
                          value={couponSale.paymentStatus}
                          onChange={(e) => handleCouponStatusChange(student.id, couponSale, e.target.value, couponQty)}
                        >
                          <option value="PAID">납부</option>
                          <option value="UNPAID">후납</option>
                          <option value="POST_PAID">후납-납부</option>
                          <option value="FREE_COUPON">무료쿠폰</option>
                        </select>
                      ) : (
                        <span className="text-gray-200 dark:text-gray-700 font-bold italic">-</span>
                      )}
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      <span className="inline-block px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-black text-gray-900 dark:text-gray-100">${total}</span>
                    </td>
                  </tr>
                );
              })}
              {displayedStudents.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center text-gray-300 dark:text-gray-600 font-black italic">
                    {students.length === 0 ? "배식 날짜를 선택해 주세요." : "조건에 맞는 학생이 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
