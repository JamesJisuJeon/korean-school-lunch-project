"use client";

import { useEffect, useState, useMemo } from "react";
import { Calendar, Search, Trash2, CheckCircle2, X, Plus } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Class {
  id: string;
  name: string;
  academicYear: { name: string };
}

interface Substitute {
  id: string;
  date: string;
  class: Class;
  user: User;
}

interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
  classes: { id: string; name: string }[];
}

export default function AdminSubstitutesClient() {
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [listSearch, setListSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [subRes, schoolRes, userRes] = await Promise.all([
      fetch("/api/admin/substitutes"),
      fetch("/api/admin/school"),
      fetch("/api/admin/users"),
    ]);
    if (subRes.ok) setSubstitutes(await subRes.json());
    if (schoolRes.ok) setYears(await schoolRes.json());
    if (userRes.ok) setAllUsers(await userRes.json());
  };

  const activeYearClasses = useMemo(() => {
    const activeYear = years.find((y) => y.isActive);
    return activeYear ? activeYear.classes : [];
  }, [years]);

  const filteredUsers = useMemo(() => {
    if (!userSearch) return [];
    return allUsers
      .filter(
        (u) =>
          (u.name?.toLowerCase() || "").includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase())
      )
      .slice(0, 5);
  }, [allUsers, userSearch]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedSubstitutes = useMemo(() => {
    let result = [...substitutes.filter((s) => {
      const lower = listSearch.toLowerCase();
      return (
        !listSearch ||
        (s.user.name?.toLowerCase() || "").includes(lower) ||
        s.user.email.toLowerCase().includes(lower) ||
        s.class.name.toLowerCase().includes(lower) ||
        format(new Date(s.date), "yyyy.MM.dd").includes(lower)
      );
    })];

    if (sortConfig) {
      result.sort((a, b) => {
        let aVal = "", bVal = "";
        if (sortConfig.key === "date") { aVal = a.date; bVal = b.date; }
        if (sortConfig.key === "class") { aVal = a.class.name; bVal = b.class.name; }
        if (sortConfig.key === "user") { aVal = a.user.name || ""; bVal = b.user.name || ""; }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [substitutes, listSearch, sortConfig]);

  const handleAddSubstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !selectedClassId || !selectedUserId) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    setIsLoading(true);
    const res = await fetch("/api/admin/substitutes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, classId: selectedClassId, userId: selectedUserId }),
    });
    if (res.ok) {
      setShowAddForm(false);
      setSelectedClassId("");
      setSelectedUserId("");
      setUserSearch("");
      fetchData();
    } else {
      const data = await res.json();
      alert(data.message || "오류 발생");
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await fetch("/api/admin/substitutes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchData();
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 text-gray-400 dark:text-gray-500">
      {sortConfig?.key === col ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  const inputClass = "w-full rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 text-base font-black focus:bg-white dark:focus:bg-gray-700 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all outline-none text-gray-900 dark:text-gray-100";

  return (
    <div className="space-y-8">
      {/* 액션 바 */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            className="pl-12 pr-10 w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-base py-3 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all outline-none font-bold text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="날짜, 학급, 선생님으로 검색..."
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
          />
          {listSearch && (
            <button
              onClick={() => setListSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="w-full md:w-auto px-8 py-3.5 bg-blue-600 dark:bg-blue-500 text-white font-black rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 active:scale-95 transition-all text-base"
          >
            <Plus className="w-5 h-5" /> 보결 선생님 등록
          </button>
        )}
      </div>

      {/* 등록 폼 */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-md dark:shadow-none border border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 dark:bg-blue-500 rounded-xl shadow-sm">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-gray-900 dark:text-gray-50">보결 선생님 등록</span>
            </h3>
            <button
              onClick={() => { setShowAddForm(false); setSelectedUserId(""); setUserSearch(""); }}
              className="px-5 py-2.5 text-sm font-black bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              닫기
            </button>
          </div>

          <form onSubmit={handleAddSubstitute} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">보결 일자</label>
                <input
                  type="date"
                  required
                  className={inputClass}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">대상 학급 (활성 연도)</label>
                <select
                  required
                  className={`${inputClass} appearance-none`}
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">학급 선택</option>
                  {activeYearClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 relative">
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">보결 선생님 검색</label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    required
                    className={inputClass}
                    placeholder="이름 또는 이메일 검색"
                    value={userSearch}
                    onFocus={() => setIsSearchOpen(true)}
                    onChange={(e) => { setUserSearch(e.target.value); setSelectedUserId(""); setIsSearchOpen(true); }}
                  />
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => { setUserSearch(""); setSelectedUserId(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {isSearchOpen && userSearch && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className="w-full px-5 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 flex justify-between items-center transition-colors group border-b border-gray-100 dark:border-gray-700 last:border-0"
                          onClick={() => {
                            setSelectedUserId(u.id);
                            setUserSearch(u.name || u.email);
                            setIsSearchOpen(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{u.name || "이름없음"}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{u.email}</span>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-transparent group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                        </button>
                      )) : (
                        <div className="px-5 py-6 text-center text-gray-400 dark:text-gray-500 font-bold text-xs italic">결과가 없습니다.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading || !selectedUserId}
                className="w-full md:w-auto px-12 py-4 bg-blue-600 dark:bg-blue-500 text-white text-lg font-black rounded-2xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 transition-all active:scale-95"
              >
                {isLoading ? "등록 중..." : "보결 선생님 지정 완료"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 목록 테이블 */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* 모바일 카드 */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {sortedSubstitutes.map((sub) => (
            <div key={sub.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-black">
                    {format(new Date(sub.date), "yyyy.MM.dd")}
                  </span>
                  <span className="font-black text-sm text-gray-900 dark:text-gray-100">{sub.class.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs shrink-0">
                    {sub.user.name?.[0] || "?"}
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-800 dark:text-gray-200">{sub.user.name || "이름없음"}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{sub.user.email}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(sub.id)}
                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {sortedSubstitutes.length === 0 && (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500 font-black italic">
              {listSearch ? "검색 결과가 없습니다." : "배정된 보결 선생님이 없습니다."}
            </div>
          )}
        </div>

        {/* 데스크탑 테이블 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th
                  onClick={() => handleSort("date")}
                  className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-1">날짜<SortIcon col="date" /></div>
                </th>
                <th
                  onClick={() => handleSort("class")}
                  className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-1">학급<SortIcon col="class" /></div>
                </th>
                <th
                  onClick={() => handleSort("user")}
                  className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-1">보결 선생님<SortIcon col="user" /></div>
                </th>
                <th className="px-8 py-5 text-center text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {sortedSubstitutes.map((sub) => (
                <tr key={sub.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-black">
                      {format(new Date(sub.date), "yyyy.MM.dd")}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="font-black text-base text-gray-900 dark:text-gray-100">{sub.class.name}</div>
                    <div className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-0.5">{sub.class.academicYear.name} 학사연도</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm">
                        {sub.user.name?.[0] || "?"}
                      </div>
                      <div>
                        <div className="font-black text-base text-gray-900 dark:text-gray-100">{sub.user.name || "이름없음"}</div>
                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500">{sub.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleDelete(sub.id)}
                      title="삭제"
                      className="p-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-all active:scale-90"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedSubstitutes.length === 0 && (
            <div className="text-center py-24 text-gray-400 dark:text-gray-500 font-black italic text-lg">
              {listSearch ? "검색 결과가 없습니다." : "배정된 보결 선생님이 없습니다."}
            </div>
          )}
        </div>
      </div>

      {isSearchOpen && <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} />}
    </div>
  );
}
