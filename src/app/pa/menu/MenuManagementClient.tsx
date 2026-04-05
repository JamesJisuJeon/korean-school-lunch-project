"use client";

import { useEffect, useState } from "react";
import { Coffee, Calendar, Globe, Lock, Clock, Utensils, IceCream, Beer, Upload, X, Check, Edit2 } from "lucide-react";

interface Menu {
  id: string;
  date: string;
  mainItems: string | null;
  dessertItems: string | null;
  beverageItems: string | null;
  imageUrl: string | null;
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
    imageUrl: "",
    price: 7,
    isPublished: false,
    deadline: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleDateChange = (dateStr: string) => {
    if (!dateStr) return;
    const selectedDate = new Date(dateStr);
    const thursday = new Date(selectedDate);
    thursday.setDate(selectedDate.getDate() - 2);
    const year = thursday.getFullYear();
    const month = String(thursday.getMonth() + 1).padStart(2, '0');
    const day = String(thursday.getDate()).padStart(2, '0');
    const defaultDeadline = `${year}-${month}-${day}T12:00`;
    setNewMenu({ ...newMenu, date: dateStr, deadline: defaultDeadline });
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

  const addMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch("/api/pa/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMenu),
    });

    if (res.ok) {
      setNewMenu({
        date: "",
        mainItems: "",
        dessertItems: "",
        beverageItems: "",
        imageUrl: "",
        price: 7,
        isPublished: false,
        deadline: ""
      });
      fetchMenus();
      alert("메뉴가 성공적으로 저장되었습니다.");
    } else {
      const data = await res.json();
      alert(data.message || "메뉴 저장 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  const handleEdit = (menu: Menu) => {
    setNewMenu({
      date: menu.date.split('T')[0],
      mainItems: menu.mainItems || "",
      dessertItems: menu.dessertItems || "",
      beverageItems: menu.beverageItems || "",
      imageUrl: menu.imageUrl || "",
      price: menu.price,
      isPublished: menu.isPublished,
      deadline: menu.deadline ? menu.deadline.slice(0, 16) : ""
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
          date: menu.date.split('T')[0],
          mainItems: menu.mainItems,
          dessertItems: menu.dessertItems,
          beverageItems: menu.beverageItems,
          imageUrl: menu.imageUrl,
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

  const inputClassName = "mt-1 block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-bold focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-50 dark:focus:ring-green-900/30 sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-800 outline-none transition-all";

  return (
    <div className="space-y-12">
      <section className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-green-700 dark:text-green-400">
          <Calendar className="w-8 h-8" /> 주간 메뉴 등록 및 이미지 업로드
        </h2>
        <form onSubmit={addMenu} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end border-t pt-8 border-gray-100 dark:border-gray-800">
            <div>
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

          <button type="submit" disabled={isLoading || isUploading} className="w-full py-5 bg-green-700 dark:bg-green-600 text-white font-black text-xl rounded-2xl hover:bg-green-800 dark:hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 transition-all border-b-4 border-green-900 dark:border-green-800 active:border-b-0 active:translate-y-1">
            {isLoading ? "처리 중..." : "메뉴 데이터 및 이미지 저장 완료"}
          </button>
        </form>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black flex items-center gap-2 text-gray-900 dark:text-gray-50">
          <Coffee className="w-7 h-7 text-green-600 dark:text-green-400" /> 등록된 메뉴 리스트
        </h2>
        <div className="grid grid-cols-1 gap-8">
          {menus.map((menu) => (
            <div key={menu.id} className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border-2 border-gray-200 dark:border-gray-800 flex flex-col md:flex-row hover:shadow-2xl transition-shadow group">
              {menu.imageUrl && (
                <div className="md:w-1/3 h-64 md:h-auto border-r-2 border-gray-100 dark:border-gray-800 overflow-hidden">
                  <img src={menu.imageUrl} alt="메뉴 안내" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="flex-1 p-8 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-gray-950 dark:text-gray-50 mb-2">
                      {new Date(menu.date).toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-black border-2 ${menu.isPublished ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                        {menu.isPublished ? '현재 게시 중' : '비공개'}
                      </span>
                      {menu.deadline && (
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full border-2 border-gray-100 dark:border-gray-700">
                          <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" /> 마감: {new Date(menu.deadline).toLocaleString('ko-KR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-4xl font-black text-blue-700 dark:text-blue-400">${menu.price}</span>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEdit(menu)}
                        className="flex items-center justify-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" /> 수정
                      </button>
                      {menu.isPublished && (
                        <button
                          onClick={() => handleUnpublish(menu)}
                          className="flex items-center justify-center gap-1 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border-2 border-red-200 dark:border-red-800 shadow-sm"
                        >
                          <Lock className="w-4 h-4" /> 게시 해제
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 mt-auto">
                  <div>
                    <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">메인 메뉴</p>
                    <p className="text-lg font-black text-gray-900 dark:text-gray-100 leading-tight">{menu.mainItems || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">디저트</p>
                    <p className="text-lg font-black text-gray-900 dark:text-gray-100 leading-tight">{menu.dessertItems || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">음료수</p>
                    <p className="text-lg font-black text-gray-900 dark:text-gray-100 leading-tight">{menu.beverageItems || "-"}</p>
                  </div>
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
  );
}
