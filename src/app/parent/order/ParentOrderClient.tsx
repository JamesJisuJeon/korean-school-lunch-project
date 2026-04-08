"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, CheckCircle, Clock, Utensils, IceCream, Beer, Star, ImageIcon, X } from "lucide-react";

interface Student {
  id: string;
  name: string;
  isPAChild: boolean;
}

interface Menu {
  id: string;
  date: string;
  mainItems: string | null;
  dessertItems: string | null;
  beverageItems: string | null;
  specialItems: string | null;
  imageUrl: string | null;
  notice: string | null;
  price: number;
  isPublished: boolean;
  deadline: string | null;
}

interface Order {
  id: string;
  studentId: string;
  menuId: string;
  isPaid: boolean;
  status: string;
  amount: number;
  notes: string | null;
  student: { name: string };
  menu: { date: string; mainItems: string | null };
}

export default function ParentOrderClient() {
  const [students, setStudents] = useState<Student[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [studentRes, menuRes, orderRes] = await Promise.all([
      fetch("/api/parent/students"),
      fetch("/api/pa/menu"),
      fetch("/api/parent/order"),
    ]);
    if (studentRes.ok) setStudents(await studentRes.json());
    if (menuRes.ok) {
      const menusData = await menuRes.json();
      const publishedMenus = menusData.filter((m: Menu) => m.isPublished);
      setMenus(publishedMenus);
      if (publishedMenus.length > 0) setSelectedMenuId(publishedMenus[0].id);
    }
    if (orderRes.ok) setOrders(await orderRes.json());
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const placeOrder = async () => {
    if (selectedStudentIds.length === 0 || !selectedMenuId) {
      alert("신청할 자녀를 선택해 주세요.");
      return;
    }
    setIsLoading(true);
    const res = await fetch("/api/parent/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds: selectedStudentIds, menuId: selectedMenuId, studentNotes }),
    });
    if (res.ok) {
      alert("신청이 완료되었습니다.");
      setSelectedStudentIds([]);
      fetchData();
    } else {
      const data = await res.json();
      alert(data.message || "신청 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm("신청을 취소하시겠습니까?")) return;
    setIsLoading(true);
    const res = await fetch("/api/parent/order", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    if (res.ok) {
      alert("신청이 취소되었습니다.");
      fetchData();
    } else {
      const data = await res.json();
      alert(data.message || "취소 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  const updateOrderNote = async (orderId: string) => {
    setIsLoading(true);
    const res = await fetch("/api/parent/order", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, notes: editingNote }),
    });
    if (res.ok) {
      alert("특이사항이 수정되었습니다.");
      setEditingOrderId(null);
      fetchData();
    } else {
      const data = await res.json();
      alert(data.message || "수정 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  const selectedMenu = menus.find(m => m.id === selectedMenuId);
  const isExpired = selectedMenu?.deadline ? new Date() > new Date(selectedMenu.deadline) : false;
  const totalPrice = selectedStudentIds.reduce((sum, id) => {
    const student = students.find(s => s.id === id);
    return sum + (student?.isPAChild ? 0 : (selectedMenu?.price || 0));
  }, 0);

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* 이미지 확대 모달 */}
      {zoomImage && selectedMenu?.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomImage(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setZoomImage(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedMenu.imageUrl}
            alt="메뉴 이미지"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── 신청하기 카드 ── */}
      <section className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">

        {/* ① 상단 바: 날짜 + 가격 + 메뉴 칩 + 마감 */}
        <div className="px-4 sm:px-8 py-4 flex flex-wrap items-center gap-2 sm:gap-3 border-b border-gray-100 dark:border-gray-800">
          {/* 이번주 메뉴 안내 + 날짜 + 가격 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="text-base sm:text-lg font-black text-gray-950 dark:text-gray-50">이번주 메뉴 안내</span>
            <span className="text-base sm:text-lg font-black text-gray-600 dark:text-gray-300">
              {selectedMenu
                ? new Date(selectedMenu.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
                : "메뉴 없음"}
            </span>
            {selectedMenu && (
              <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">$ {selectedMenu.price}</span>
            )}
          </div>

          {/* 마감 뱃지 */}
          {selectedMenu?.deadline && (
            <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${
              isExpired
                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
            }`}>
              <Clock className="w-3 h-3" />
              {isExpired
                ? "마감됨"
                : `마감 ${new Date(selectedMenu.deadline).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}`}
            </span>
          )}
        </div>

        {/* ② 중단: 이미지(좌) + 자녀선택(우) */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] min-h-[320px]">

          {/* 좌: 메뉴 이미지 */}
          <div className="relative bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center p-4 md:p-0 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
            {selectedMenu?.imageUrl ? (
              <div className="relative group cursor-zoom-in w-full md:absolute md:inset-0" onClick={() => setZoomImage(true)}>
                <img
                  src={selectedMenu.imageUrl}
                  alt="메뉴 이미지"
                  className="w-full object-contain max-h-[400px] md:h-full md:max-h-none"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs font-black px-3 py-1.5 rounded-full">
                    클릭하여 확대
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-gray-300 dark:text-gray-600 py-16">
                <ImageIcon className="w-14 h-14 opacity-30" />
                <span className="text-xs font-black uppercase tracking-widest">No Image</span>
              </div>
            )}
          </div>

          {/* 우: 자녀 선택 */}
          <div className="p-4 sm:p-6 flex flex-col gap-3">
            {/* 상세 메뉴 */}
            {selectedMenu && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: <Utensils className="w-4 h-4" />, bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-100 dark:border-orange-800", color: "text-orange-600 dark:text-orange-400", label: "메인 메뉴", value: selectedMenu.mainItems },
                  { icon: <IceCream className="w-4 h-4" />, bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-pink-100 dark:border-pink-800", color: "text-pink-600 dark:text-pink-400", label: "디저트", value: selectedMenu.dessertItems },
                  { icon: <Beer className="w-4 h-4" />, bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-100 dark:border-cyan-800", color: "text-cyan-600 dark:text-cyan-400", label: "음료수", value: selectedMenu.beverageItems },
                  { icon: <Star className="w-4 h-4" />, bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-100 dark:border-yellow-800", color: "text-yellow-600 dark:text-yellow-400", label: "매점 특식", value: selectedMenu.specialItems },
                ].map((item, i) => (
                  <div key={i} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border ${item.bg} ${item.border}`}>
                    <div className={`flex items-center gap-1.5 ${item.color}`}>
                      {item.icon}
                      <p className="text-xs font-black">{item.label}</p>
                    </div>
                    <p className="text-sm font-black text-gray-800 dark:text-gray-200 text-center leading-tight">{item.value || "-"}</p>
                  </div>
                ))}
              </div>
            )}
            {selectedMenu?.notice && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
                <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">공지사항</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedMenu.notice}</p>
              </div>
            )}
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">자녀 선택</p>
            {students.map(student => {
              const isSelected = selectedStudentIds.includes(student.id);
              const hasOrdered = orders.some(o => o.studentId === student.id && o.menuId === selectedMenuId);
              return (
                <div key={student.id} className={`rounded-2xl border-2 transition-all duration-200 ${
                  hasOrdered
                    ? "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60"
                    : isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500"
                      : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-200 dark:hover:border-blue-700"
                }`}>
                  <button
                    disabled={hasOrdered || isExpired}
                    onClick={() => toggleStudent(student.id)}
                    className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 disabled:cursor-not-allowed"
                  >
                    <div>
                      <p className="font-black text-gray-950 dark:text-gray-50">{student.name}</p>
                      <div className="flex gap-1.5 mt-0.5 flex-wrap">
                        {student.isPAChild && (
                          <span className="text-[10px] bg-yellow-400 text-yellow-950 font-black px-2 py-0.5 rounded-md">학부모회 자녀</span>
                        )}
                        {hasOrdered && (
                          <span className="text-[10px] bg-green-500 text-white font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> 신청완료
                          </span>
                        )}
                      </div>
                    </div>
                    {!hasOrdered && !isExpired && (
                      <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        isSelected ? "bg-blue-600 border-blue-600" : "border-gray-200 dark:border-gray-600"
                      }`}>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                    )}
                  </button>
                  {isSelected && !hasOrdered && !isExpired && (
                    <div className="px-4 pb-4 animate-in fade-in duration-150">
                      <textarea
                        value={studentNotes[student.id] || ""}
                        onChange={e => setStudentNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                        className="w-full bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-800 rounded-xl px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none resize-none h-9 overflow-hidden transition-all"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {students.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-8 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 font-bold italic text-sm text-center">
                먼저 자녀를 등록해 주세요.
              </div>
            )}
          </div>

        </div>

        {/* ③ 하단 바: 총금액 + 신청 버튼 */}
        <div className="px-4 sm:px-8 py-4 flex items-center justify-between gap-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-widest">Total</p>
              <p className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white leading-none">$ {totalPrice}</p>
            </div>
            {selectedStudentIds.length > 0 && (
              <span className="bg-blue-600 text-xs px-2.5 py-1 rounded-full text-white font-black">{selectedStudentIds.length}명</span>
            )}
          </div>
          <button
            onClick={placeOrder}
            disabled={isLoading || selectedStudentIds.length === 0 || !selectedMenuId || isExpired}
            className={`px-8 py-3 font-black text-sm rounded-2xl transition-all duration-200 active:scale-95 whitespace-nowrap ${
              isExpired
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : selectedStudentIds.length === 0
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/40"
            }`}
          >
            {isExpired ? "신청 마감됨" : isLoading ? "처리 중..." : "신청 완료하기"}
          </button>
        </div>
      </section>

      {/* ── 나의 신청 내역 ── */}
      <section className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50 dark:border-gray-800">
          <h2 className="text-lg sm:text-xl font-black flex items-center gap-3 text-gray-900 dark:text-white">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" /> 나의 신청 내역
          </h2>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1">배식일자 전, 수납대기 상태에서만 취소가 가능합니다.</p>
        </div>

        {/* 모바일 카드 레이아웃 */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {orders.map(order => {
            const canCancel = order.status === "WAITING" && new Date() < new Date(order.menu.date);
            return (
              <div key={order.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-base text-gray-950 dark:text-gray-50">{order.student.name}</p>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(order.menu.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-base font-black text-blue-700 dark:text-blue-400">${order.amount}</span>
                    {order.status === "PAID" || order.status === "POST_PAID" ? (
                      <span className="px-2.5 py-1 text-[10px] font-black bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">수납완료</span>
                    ) : order.status === "FREE_SNACK" ? (
                      <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">무료간식</span>
                    ) : order.status === "UNPAID" ? (
                      <span className="px-2.5 py-1 text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">후납</span>
                    ) : order.status === "CANCELLED" ? (
                      <span className="px-2.5 py-1 text-[10px] font-black bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full border border-red-200 dark:border-red-800">취소</span>
                    ) : (
                      <span className="px-2.5 py-1 text-[10px] font-black bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full border border-yellow-200 dark:border-yellow-800">수납대기</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  {editingOrderId === order.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        className="flex-1 border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 rounded-lg p-2 text-sm font-bold text-gray-900 dark:text-gray-100 outline-none"
                        value={editingNote}
                        onChange={e => setEditingNote(e.target.value)}
                        autoFocus
                        placeholder="특이사항..."
                      />
                      <button onClick={() => updateOrderNote(order.id)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingOrderId(null)} className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 italic">{order.notes || "특이사항 없음"}</span>
                      {!order.isPaid && canCancel && (
                        <button
                          onClick={() => { setEditingOrderId(order.id); setEditingNote(order.notes || ""); }}
                          className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-400 rounded-md transition-all flex-shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      )}
                    </div>
                  )}
                  {!order.isPaid && canCancel && editingOrderId !== order.id ? (
                    <button
                      disabled={isLoading}
                      onClick={() => cancelOrder(order.id)}
                      className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-black rounded-xl border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition-all whitespace-nowrap"
                    >
                      신청 취소
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
          {orders.length === 0 && (
            <div className="px-4 py-16 text-center text-gray-300 dark:text-gray-600 font-black italic">
              아직 신청 내역이 없습니다.
            </div>
          )}
        </div>

        {/* 데스크탑 테이블 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 dark:text-gray-500">배식 날짜</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 dark:text-gray-500">자녀</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 dark:text-gray-500">금액</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 dark:text-gray-500">특이사항</th>
                <th className="px-4 py-4 text-left text-xs font-black text-gray-400 dark:text-gray-500 w-24">상태</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-400 dark:text-gray-500 w-20">취소</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {orders.map(order => {
                const canCancel = order.status === "WAITING" && new Date() < new Date(order.menu.date);
                return (
                  <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-gray-900 dark:text-gray-100">
                      {new Date(order.menu.date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', weekday: 'short' })}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-gray-950 dark:text-gray-100">{order.student.name}</td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-sm font-black text-blue-700 dark:text-blue-400">${order.amount}</span>
                    </td>
                    <td className="px-6 py-5">
                      {editingOrderId === order.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="w-28 border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 rounded-lg p-1.5 text-xs font-bold text-gray-900 dark:text-gray-100 outline-none"
                            value={editingNote}
                            onChange={e => setEditingNote(e.target.value)}
                            autoFocus
                          />
                          <button onClick={() => updateOrderNote(order.id)} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingOrderId(null)} className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 italic">{order.notes || "-"}</span>
                          {!order.isPaid && canCancel && (
                            <button
                              onClick={() => { setEditingOrderId(order.id); setEditingNote(order.notes || ""); }}
                              className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-400 rounded-md transition-all flex-shrink-0"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      {order.status === "PAID" || order.status === "POST_PAID" ? (
                        <span className="px-2.5 py-1 text-[10px] font-black bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">수납완료</span>
                      ) : order.status === "FREE_SNACK" ? (
                        <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">무료간식</span>
                      ) : order.status === "UNPAID" ? (
                        <span className="px-2.5 py-1 text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">후납</span>
                      ) : order.status === "CANCELLED" ? (
                        <span className="px-2.5 py-1 text-[10px] font-black bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full border border-red-200 dark:border-red-800">취소</span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-black bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full border border-yellow-200 dark:border-yellow-800">수납대기</span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      {!order.isPaid && canCancel ? (
                        <button
                          disabled={isLoading}
                          onClick={() => cancelOrder(order.id)}
                          className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-black rounded-xl border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition-all"
                        >
                          취소
                        </button>
                      ) : (
                        <span className="text-gray-200 dark:text-gray-700 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-300 dark:text-gray-600 font-black italic">
                    아직 신청 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
