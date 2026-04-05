"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle } from "lucide-react";

interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export default function YearsManagementClient() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [newYear, setNewYear] = useState({ name: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    const res = await fetch("/api/admin/school");
    if (res.ok) setYears(await res.json());
  };

  const addYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch("/api/admin/school", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newYear.name }),
    });
    if (res.ok) {
      setNewYear({ name: "" });
      fetchYears();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 border-l-8 border-blue-600 dark:border-blue-400 pl-6 py-2">
        <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50">학사연도 관리</h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold">학교의 운영 연도를 등록하고 활성화합니다.</p>
        </div>
      </div>

      <section className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-blue-50 dark:border-blue-900/30">
        <h2 className="text-xl font-black mb-6 text-gray-800 dark:text-gray-100">새 학사연도 정의</h2>
        <form onSubmit={addYear} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">운영 연도 (Year)</label>
            <input
              required
              type="number"
              className="w-full rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 font-black focus:bg-white dark:focus:bg-gray-700 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all outline-none text-gray-900 dark:text-gray-100"
              placeholder="예: 2026"
              value={newYear.name}
              onChange={(e) => setNewYear({ ...newYear, name: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto bg-blue-600 dark:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-700 dark:hover:bg-blue-600 shadow-xl shadow-blue-100 dark:shadow-blue-900/30 active:scale-95 transition-all"
          >
            등록 완료
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500 font-bold italic">* 현재 연도와 일치하는 연도를 등록하면 자동으로 활성화됩니다.</p>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-50">등록된 학사연도 목록</h2>
        <div className="grid grid-cols-1 gap-4">
          {years.map((year) => (
            <div key={year.id} className={`p-6 rounded-3xl border-2 flex justify-between items-center transition-all ${year.isActive ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-4 ring-blue-50 dark:ring-blue-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm'}`}>
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${year.isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-gray-50">{year.name} 학사연도</h3>
                  <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(year.startDate).toLocaleDateString()} ~ {new Date(year.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {year.isActive && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-black text-xs shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
                  <CheckCircle className="w-4 h-4" /> 현재 활성 상태
                </div>
              )}
            </div>
          ))}
          {years.length === 0 && (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-bold">
              등록된 학사연도가 없습니다.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
