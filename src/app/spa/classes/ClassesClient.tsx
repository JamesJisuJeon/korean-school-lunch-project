"use client";

import { useEffect, useState, useMemo } from "react";
import { GraduationCap, Search, X } from "lucide-react";
import { matchesSearch } from "@/lib/chosungUtils";

interface Assistant {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string };
}

interface ClassItem {
  id: string;
  name: string;
  grade: string | null;
  teacherName: string | null;
  sortOrder: number | null;
  assistants: Assistant[];
}

export default function ClassesClient() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await fetch("/api/spa/classes");
    if (res.ok) {
      const data = await res.json();
      setClasses(data.classes ?? []);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClasses = useMemo(() => {
    if (!searchTerm) return classes;
    return classes.filter(
      (c) =>
        matchesSearch(c.name, searchTerm) ||
        matchesSearch(c.grade ?? "", searchTerm) ||
        matchesSearch(c.teacherName ?? "", searchTerm) ||
        c.assistants.some(
          (a) =>
            matchesSearch(a.user.name ?? "", searchTerm) ||
            matchesSearch(a.user.email, searchTerm)
        )
    );
  }, [classes, searchTerm]);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400 dark:text-gray-500 font-bold">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          className="w-full pl-14 pr-10 py-4 rounded-2xl border-none shadow-md dark:shadow-none bg-white dark:bg-gray-800 font-bold text-gray-950 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:ring-4 focus:ring-teal-50 dark:focus:ring-teal-900/20 transition-all outline-none"
          placeholder="학년, 학급 이름, 담임교사, 보조교사로 검색하세요"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 목록 */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* 모바일 카드 */}
        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-lg font-black text-gray-950 dark:text-gray-50">{cls.name}</p>
                {cls.grade && (
                  <span className="text-xs font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {cls.grade}
                  </span>
                )}
                {cls.teacherName && (
                  <div className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-[10px]">
                      {cls.teacherName[0]}
                    </div>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{cls.teacherName}</span>
                  </div>
                )}
              </div>

              <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-3 border border-teal-100 dark:border-teal-800 space-y-2">
                <p className="text-xs font-black text-teal-700 dark:text-teal-400 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" /> 보조교사
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cls.assistants.map((a) => (
                    <span
                      key={a.userId}
                      className="bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg border border-teal-200 dark:border-teal-700"
                    >
                      {a.user.name || a.user.email}
                    </span>
                  ))}
                  {cls.assistants.length === 0 && (
                    <span className="text-xs text-gray-400 italic">등록된 보조교사 없음</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredClasses.length === 0 && (
            <div className="px-8 py-20 text-center text-gray-400 dark:text-gray-500 font-black italic">
              학급 정보가 없습니다.
            </div>
          )}
        </div>

        {/* 데스크탑 테이블 */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest w-16">순서</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">학년</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">학급 이름</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">담임교사</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">보조교사</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-teal-50/20 dark:hover:bg-teal-900/10 transition-colors">
                  <td className="px-6 py-5 text-center text-sm font-black text-gray-400 dark:text-gray-500">
                    {cls.sortOrder ?? <span className="text-gray-300 dark:text-gray-700">-</span>}
                  </td>
                  <td className="px-6 py-5 text-sm font-black text-gray-900 dark:text-gray-100">{cls.grade}</td>
                  <td className="px-6 py-5 text-base font-black text-gray-950 dark:text-gray-50">{cls.name}</td>
                  <td className="px-6 py-5">
                    {cls.teacherName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm shrink-0">
                          {cls.teacherName[0]}
                        </div>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{cls.teacherName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-700 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                      {cls.assistants.map((a) => (
                        <span
                          key={a.userId}
                          className="bg-teal-50 dark:bg-teal-900/20 text-xs font-bold text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-700"
                        >
                          {a.user.name || a.user.email}
                        </span>
                      ))}
                      {cls.assistants.length === 0 && (
                        <span className="text-gray-300 dark:text-gray-700 text-sm">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center text-gray-400 dark:text-gray-500 font-black italic">
                    학급 정보가 없습니다.
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
