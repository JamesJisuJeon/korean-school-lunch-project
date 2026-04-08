"use client";

import { useEffect, useState } from "react";
import { Coffee, Calendar, Lock, Globe, Clock, Utensils, IceCream, Beer, Star, Upload, X, Check, Edit2, Trash2 } from "lucide-react";

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

export default function MenuManagementClient() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [newMenu, setNewMenu] = useState({
    date: "",
    mainItems: "",
    dessertItems: "",
    beverageItems: "",
    specialItems: "",
    imageUrl: "",
    notice: "",
    price: 7,
    isPublished: false,
    deadline: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  const emptyMenu = { date: "", mainItems: "", dessertItems: "", beverageItems: "", specialItems: "", imageUrl: "", notice: "", price: 7, isPublished: false, deadline: "" };

  const cancelForm = () => {
    setEditingId(null);
    setShowForm(false);
    setNewMenu(emptyMenu);
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleDateChange = (dateStr: string) => {
    if (!dateStr) return;
    const selectedDate = new Date(dateStr);
    // 토요일(6)이 아니면 다음 토요일로 자동 보정
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek !== 6) {
      const daysToSaturday = (6 - dayOfWeek + 7) % 7 || 7;
      selectedDate.setDate(selectedDate.getDate() + daysToSaturday);
    }
    const satYear = selectedDate.getFullYear();
    const satMonth = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const satDay = String(selectedDate.getDate()).padStart(2, '0');
    const saturdayStr = `${satYear}-${satMonth}-${satDay}`;
    const thursday = new Date(selectedDate);
    thursday.setDate(selectedDate.getDate() - 2);
    const year = thursday.getFullYear();
    const month = String(thursday.getMonth() + 1).padStart(2, '0');
    const day = String(thursday.getDate()).padStart(2, '0');
    const defaultDeadline = `${year}-${month}-${day}T12:00`;
    setNewMenu({ ...newMenu, date: saturdayStr, deadline: defaultDeadline });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pa/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setNewMenu({ ...newMenu, imageUrl: data.imageUrl });
      }
    } catch (err) {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const fetchMenus = async () => {
    const res = await fetch("/api/pa/menu");
    if (res.ok) setMenus(await res.json());
  };

  // UTC ISO 문자열을 브라우저 로컬 시간 기준의 datetime-local 입력값으로 변환
  const toLocalInputString = (utcStr: string) => {
    const d = new Date(utcStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const addMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch("/api/pa/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // deadline은 브라우저 로컬(NZ) 시간 → UTC ISO 문자열로 변환 후 전송
      body: JSON.stringify({
        ...newMenu,
        id: editingId ?? undefined,
        deadline: newMenu.deadline ? new Date(newMenu.deadline).toISOString() : null,
      }),
    });

    if (res.ok) {
      setEditingId(null);
      setShowForm(false);
      setNewMenu(emptyMenu);
      fetchMenus();
      alert("메뉴가 성공적으로 저장되었습니다.");
    } else {
      const data = await res.json();
      alert(data.message || "메뉴 저장 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  const handleEdit = (menu: Menu) => {
    setEditingId(menu.id);
    setShowForm(true);
    setNewMenu({
      date: menu.date.split('T')[0],
      mainItems: menu.mainItems || "",
      dessertItems: menu.dessertItems || "",
      beverageItems: menu.beverageItems || "",
      specialItems: menu.specialItems || "",
      imageUrl: menu.imageUrl || "",
      notice: menu.notice || "",
      price: menu.price,
      isPublished: menu.isPublished,
      deadline: menu.deadline ? toLocalInputString(menu.deadline) : ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUnpublish = async (menu: Menu) => {
    if (!confirm("이 메뉴의 게시를 해제하시겠습니까? (학부모 신청이 불가능해집니다.)")) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/pa/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: menu.id,
          date: menu.date.split('T')[0],
          mainItems: menu.mainItems,
          dessertItems: menu.dessertItems,
          beverageItems: menu.beverageItems,
          specialItems: menu.specialItems,
          imageUrl: menu.imageUrl,
          notice: menu.notice,
          price: menu.price,
          deadline: menu.deadline,
          isPublished: false
        }),
      });

      if (res.ok) {
        fetchMenus();
        alert("게시가 성공적으로 해제되었습니다.");
      } else {
        const data = await res.json();
        alert(data.message || "오류가 발생했습니다.");
      }
    } catch (err) {
      alert("서버 통신 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  const handlePublish = async (menu: Menu) => {
    if (!confirm("이 메뉴를 게시하시겠습니까? (학부모 신청 페이지에 공개됩니다.)")) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/pa/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: menu.id,
          date: menu.date.split('T')[0],
          mainItems: menu.mainItems,
          dessertItems: menu.dessertItems,
          beverageItems: menu.beverageItems,
          specialItems: menu.specialItems,
          imageUrl: menu.imageUrl,
          notice: menu.notice,
          price: menu.price,
          deadline: menu.deadline,
          isPublished: true
        }),
      });

      if (res.ok) {
        fetchMenus();
        alert("메뉴가 게시되었습니다.");
      } else {
        const data = await res.json();
        alert(data.message || "오류가 발생했습니다.");
      }
    } catch (err) {
      alert("서버 통신 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  const handleDeleteRequest = (menu: Menu) => {
    setDeleteTarget(menu);
    setDeleteConfirmText("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (!confirm(`정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/pa/menu", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      if (res.ok) {
        setDeleteTarget(null);
        fetchMenus();
        alert("메뉴가 삭제되었습니다.");
      } else {
        const data = await res.json();
        alert(data.message || "삭제 중 오류가 발생했습니다.");
      }
    } catch {
      alert("서버 통신 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  const inputClassName = "mt-1 block w-full min-w-0 max-w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-bold focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-50 dark:focus:ring-green-900/30 sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-800 outline-none transition-all";

  return (
    <>
    {/* 이미지 확대 모달 */}
    {zoomImageUrl && (
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
        onClick={() => setZoomImageUrl(null)}
      >
        <button
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          onClick={() => setZoomImageUrl(null)}
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={zoomImageUrl}
          alt="메뉴 이미지"
          className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        />
      </div>
    )}
    <div className="space-y-12">
      <section className="bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3 text-green-700 dark:text-green-400">
            <Calendar className="w-8 h-8" />
            {editingId ? "주간 메뉴 수정" : "주간 메뉴 등록"}
          </h2>
          <div className="flex gap-2 shrink-0">
            {showForm ? (
              <>
                <button
                  type="submit"
                  form="menu-form"
                  disabled={isLoading || isUploading}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 transition-all text-sm"
                >
                  <Check className="w-4 h-4" /> {editingId ? "수정" : "등록"}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
                >
                  <X className="w-4 h-4" /> 취소
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all text-sm"
              >
                <Calendar className="w-4 h-4" /> 메뉴 등록
              </button>
            )}
          </div>
        </div>

        {showForm && <form id="menu-form" onSubmit={addMenu} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="min-w-0">
              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-1">배식 날짜 (토요일)</label>
              <input type="date" required className={inputClassName} value={newMenu.date} onChange={(e) => handleDateChange(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-1">기본 가격 ($)</label>
              <select className={inputClassName} value={newMenu.price} onChange={(e) => setNewMenu({ ...newMenu, price: parseInt(e.target.value) })}>
                <option value="5">$5</option>
                <option value="7">$7</option>
                <option value="10">$10</option>
              </select>
            </div>
            <div className="relative">
              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-1">안내 이미지 업로드</label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 px-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-all">
                  <Upload className="w-4 h-4" />
                  {isUploading ? "업로드 중..." : newMenu.imageUrl ? "이미지 변경" : "파일 선택"}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
                {newMenu.imageUrl && (
                  <button type="button" onClick={() => setNewMenu({...newMenu, imageUrl: ""})} className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-black text-orange-700 dark:text-orange-400 flex items-center gap-1 mb-1"><Utensils className="w-4 h-4" /> 메인 메뉴</label>
              <input required className={inputClassName} placeholder="예: 김밥, 불고기" value={newMenu.mainItems} onChange={(e) => setNewMenu({ ...newMenu, mainItems: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-black text-pink-700 dark:text-pink-400 flex items-center gap-1 mb-1"><IceCream className="w-4 h-4" /> 디저트</label>
              <input className={inputClassName} placeholder="예: 과일, 도넛" value={newMenu.dessertItems} onChange={(e) => setNewMenu({ ...newMenu, dessertItems: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-black text-blue-700 dark:text-blue-400 flex items-center gap-1 mb-1"><Beer className="w-4 h-4" /> 음료수</label>
              <input className={inputClassName} placeholder="예: 주스, 식혜" value={newMenu.beverageItems} onChange={(e) => setNewMenu({ ...newMenu, beverageItems: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-black text-yellow-700 dark:text-yellow-400 flex items-center gap-1 mb-1"><Star className="w-4 h-4" /> 매점 특식</label>
              <input className={inputClassName} placeholder="예: 떡볶이, 순대" value={newMenu.specialItems} onChange={(e) => setNewMenu({ ...newMenu, specialItems: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-1">공지사항</label>
            <textarea
              className={`${inputClassName} resize-none`}
              rows={2}
              placeholder="공지사항을 입력하세요. (선택)"
              value={newMenu.notice}
              onChange={(e) => setNewMenu({ ...newMenu, notice: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="min-w-0">
              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1"><Clock className="w-4 h-4" /> 신청 마감 일시</label>
              <input type="datetime-local" required className={inputClassName} value={newMenu.deadline} onChange={(e) => setNewMenu({ ...newMenu, deadline: e.target.value })} />
            </div>
            <div className="flex items-center gap-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border-2 border-yellow-200 dark:border-yellow-800">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="peer hidden" checked={newMenu.isPublished} onChange={(e) => setNewMenu({ ...newMenu, isPublished: e.target.checked })} />
                  <div className="w-6 h-6 border-2 border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-800 peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center transition-all">
                    <Check className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-sm font-black text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">지금 즉시 학부모 신청 페이지에 게시하기</span>
              </label>
            </div>
          </div>

        </form>}
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black flex items-center gap-2 text-gray-900 dark:text-gray-50">
          <Coffee className="w-7 h-7 text-green-600 dark:text-green-400" /> 등록된 메뉴 리스트
        </h2>
        <div className="grid grid-cols-1 gap-8">
          {menus.map((menu) => (
            <div key={menu.id} className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border-2 border-gray-200 dark:border-gray-800 flex flex-col md:flex-row hover:shadow-2xl transition-shadow group">
              {menu.imageUrl && (
                <div
                  className="md:w-1/3 h-48 sm:h-56 md:h-auto border-b-2 md:border-b-0 md:border-r-2 border-gray-100 dark:border-gray-800 overflow-hidden relative group cursor-zoom-in"
                  onClick={() => setZoomImageUrl(menu.imageUrl)}
                >
                  <img src={menu.imageUrl} alt="메뉴 안내" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs font-black px-3 py-1.5 rounded-full">클릭하여 확대</span>
                  </div>
                </div>
              )}
              <div className="flex-1 p-4 sm:p-8 flex flex-col">
                <div className="mb-4 sm:mb-6">
                  {/* 날짜 + 현재게시중 + 금액 */}
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-lg sm:text-2xl font-black text-gray-950 dark:text-gray-50 shrink-0">
                        {new Date(menu.date).toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </h3>
                      <span className={`shrink-0 px-2 sm:px-3 py-1 rounded-full text-xs font-black border-2 ${menu.isPublished ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                        {menu.isPublished ? '현재 게시 중' : '비공개'}
                      </span>
                    </div>
                    <span className="shrink-0 text-2xl sm:text-4xl font-black text-blue-700 dark:text-blue-400">${menu.price}</span>
                  </div>
                  {/* 마감일자 */}
                  {menu.deadline && (
                    <span className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 sm:px-3 py-1 rounded-full border-2 border-gray-100 dark:border-gray-700 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-blue-500 dark:text-blue-400" /> 마감: {new Date(menu.deadline).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 sm:p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 mb-4 sm:mb-6 text-center">
                  <div>
                    <p className="text-xs sm:text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">메인 메뉴</p>
                    <p className="text-base sm:text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">{menu.mainItems || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">디저트</p>
                    <p className="text-base sm:text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">{menu.dessertItems || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">음료수</p>
                    <p className="text-base sm:text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">{menu.beverageItems || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-yellow-500 dark:text-yellow-400 uppercase tracking-widest mb-1">매점 특식</p>
                    <p className="text-base sm:text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">{menu.specialItems || "-"}</p>
                  </div>
                </div>

                {/* 공지사항 */}
                {menu.notice && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 mb-4 sm:mb-6">
                    <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">공지사항</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{menu.notice}</p>
                  </div>
                )}

                {/* 버튼 행 */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleEdit(menu)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 수정
                  </button>
                  {menu.isPublished ? (
                    <button
                      onClick={() => handleUnpublish(menu)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-xs sm:text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border-2 border-red-200 dark:border-red-800 shadow-sm"
                    >
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 게시 해제
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePublish(menu)}
                      disabled={isLoading || new Date() >= new Date(menu.date)}
                      title={new Date() >= new Date(menu.date) ? "배식일자가 지난 메뉴는 게시할 수 없습니다." : undefined}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-xs sm:text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border-2 border-blue-200 dark:border-blue-800 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-50 dark:disabled:hover:bg-blue-900/30"
                    >
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 게시
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteRequest(menu)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-xs sm:text-sm bg-red-600 dark:bg-red-700 text-white font-bold rounded-xl hover:bg-red-700 dark:hover:bg-red-800 transition-colors border-2 border-red-700 dark:border-red-800 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
          {menus.length === 0 && (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-4 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-bold">
              등록된 메뉴가 없습니다. 위 폼에서 첫 메뉴를 등록해 보세요.
            </div>
          )}
        </div>
      </section>
    </div>

    {/* 삭제 확인 모달 */}
    {deleteTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-red-200 dark:border-red-800 p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400 shrink-0" />
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-50">메뉴 삭제</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-bold mb-2">
            아래 메뉴를 삭제하려고 합니다:
          </p>
          <p className="text-blue-700 dark:text-blue-400 font-black mb-4">
            {new Date(deleteTarget.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            삭제를 확인하려면 아래에 <span className="font-black text-red-600 dark:text-red-400">삭제</span>를 입력하세요.
          </p>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="삭제"
            className="mt-1 block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-bold focus:border-red-500 dark:focus:border-red-400 focus:ring-4 focus:ring-red-50 dark:focus:ring-red-900/30 sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-800 outline-none transition-all mb-6"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-2 border-gray-200 dark:border-gray-700"
            >
              취소
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmText !== "삭제" || isLoading}
              className="flex-1 py-3 bg-red-600 dark:bg-red-700 text-white font-black rounded-xl hover:bg-red-700 dark:hover:bg-red-800 transition-colors border-2 border-red-700 dark:border-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? "삭제 중..." : "삭제 확인"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

