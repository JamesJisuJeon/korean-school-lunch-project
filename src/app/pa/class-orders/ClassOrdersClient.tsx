"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle, Calendar, Filter, RefreshCw } from "lucide-react";

interface Menu {
  id: string;
  date: string;
  mainItems: string | null;
  dessertItems: string | null;
  beverageItems: string | null;
}

interface ClassItem {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  orders: {
    id: string;
    isPaid: boolean;
    status: string;
    notes: string | null;
    menu: Menu;
  }[];
}

interface ClassData {
  classes: ClassItem[];
  className?: string;
  academicYear?: string;
  students?: Student[];
}

export default function ClassOrdersClient() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/pa/menu")
      .then((r) => r.json())
      .then((data: Menu[]) => {
        setMenus(data);
        if (data.length > 0) setSelectedMenuId(data[0].id);
      });
  }, []);

  // 메뉴 선택 시 학급 목록 로드
  useEffect(() => {
    if (!selectedMenuId) return;
    fetch(`/api/pa/class-orders?menuId=${selectedMenuId}`)
      .then((r) => r.json())
      .then((data) => {
        setClasses(data.classes || []);
        if (data.classes?.length > 0 && !selectedClassId) {
          setSelectedClassId(data.classes[0].id);
        }
      });
  }, [selectedMenuId]);

  const fetchClassData = () => {
    if (!selectedMenuId || !selectedClassId) return;
    setIsLoading(true);
    fetch(`/api/pa/class-orders?menuId=${selectedMenuId}&classId=${selectedClassId}`)
      .then((r) => r.json())
      .then((data) => { setClassData(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  };

  // 학급 + 메뉴 선택 시 학생 목록 로드
  useEffect(() => {
    fetchClassData();
  }, [selectedMenuId, selectedClassId]);

  const students = [...(classData?.students ?? [])].sort((a, b) => {
    for (let i = 0; i < Math.min(a.name.length, b.name.length); i++) {
      const diff = a.name.charCodeAt(i) - b.name.charCodeAt(i);
      if (diff !== 0) return diff;
    }
    return a.name.length - b.name.length;
  });
  const totalStudents = students.length;
  const orderedCount = students.filter((s) => s.orders.length > 0 && s.orders[0].status !== "CANCELLED").length;
  const paidCount = students.filter((s) => s.orders.length > 0 && ["PAID", "UNPAID", "POST_PAID"].includes(s.orders[0].status)).length;
  const currentMenu = menus.find((m) => m.id === selectedMenuId);

  return (
    <div className="space-y-8">
      {/* 메뉴 + 학급 선택 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <Calendar className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
          <select
            className="flex-1 bg-transparent border-none text-gray-950 dark:text-gray-100 font-black text-base focus:ring-0 cursor-pointer outline-none"
            value={selectedMenuId}
            onChange={(e) => setSelectedMenuId(e.target.value)}
          >
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {new Date(m.date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <Filter className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
          <select
            className="flex-1 bg-transparent border-none text-gray-950 dark:text-gray-100 font-black text-base focus:ring-0 cursor-pointer outline-none"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">반 선택</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>


      {/* 반 요약 */}
      {classData?.className && (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="p-3 sm:p-4 bg-green-600 rounded-2xl shadow-md dark:shadow-none">
              <Users className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-gray-50">{classData.className}</h2>
                <button
                  onClick={fetchClassData}
                  className="p-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  title="새로고침"
                >
                  <RefreshCw className={`w-4 h-4 transition-transform ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold tracking-tighter uppercase">{classData.academicYear} ACADEMIC YEAR</p>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <div className="text-center w-20 md:w-24 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
              <p className="text-xs font-black text-gray-400 dark:text-gray-500 mb-1">전체</p>
              <p className="text-2xl font-black text-gray-900 dark:text-gray-50">{totalStudents}</p>
            </div>
            <div className="text-center w-20 md:w-24 py-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border-2 border-blue-100 dark:border-blue-800">
              <p className="text-xs font-black text-blue-400 dark:text-blue-500 mb-1">신청</p>
              <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{orderedCount}</p>
            </div>
            <div className="text-center w-20 md:w-24 py-3 bg-green-50 dark:bg-green-900/30 rounded-2xl border-2 border-green-100 dark:border-green-800">
              <p className="text-xs font-black text-green-400 dark:text-green-500 mb-1">배식확정</p>
              <p className="text-2xl font-black text-green-700 dark:text-green-400">{paidCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* 학생 명단 */}
      {isLoading && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500 font-bold">불러오는 중...</div>
      )}

      {!isLoading && selectedClassId && students.length >= 0 && classData?.className && (
        <div className="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 rounded-3xl overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-2 md:px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 w-10 md:w-16">번호</th>
                <th className="px-2 md:px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400">이름</th>
                <th className="px-2 md:px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 w-16 md:w-20">신청상태</th>
                <th className="px-2 md:px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 w-16 md:w-20">수납상태</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {students.map((student, index) => {
                const order = student.orders[0];
                const isOrdered = !!order;
                const status = order?.status;

                return (
                  <tr
                    key={student.id}
                    className={`${!isOrdered ? "bg-gray-50/50 dark:bg-gray-800/20" : "hover:bg-green-50/30 dark:hover:bg-green-900/10"} transition-colors`}
                  >
                    <td className="px-1 md:px-4 py-5 whitespace-nowrap text-center text-sm font-black text-gray-400 dark:text-gray-500">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-2 md:px-4 py-5 text-center">
                      <p className="text-sm font-black text-gray-950 dark:text-gray-100 whitespace-nowrap">{student.name}</p>
                      {order?.notes && (
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 italic mt-0.5">{order.notes}</p>
                      )}
                    </td>
                    <td className="px-1 md:px-4 py-5 whitespace-nowrap text-center">
                      {isOrdered ? (
                        status === "CANCELLED" ? (
                          <span className="inline-flex items-center justify-center gap-1 text-red-500 dark:text-red-400 font-black text-xs md:text-sm">
                            취소
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1 text-blue-700 dark:text-blue-400 font-black text-xs md:text-sm">
                            <CheckCircle className="w-3.5 h-3.5 md:w-5 md:h-5" /> 신청
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center justify-center text-gray-300 dark:text-gray-600 font-bold text-xs md:text-sm italic">
                          미신청
                        </span>
                      )}
                    </td>
                    <td className="px-2 md:px-4 py-5 whitespace-nowrap text-center">
                      {isOrdered ? (
                        status === "PAID" || status === "POST_PAID" ? (
                          <span className="px-2 py-0.5 md:px-4 md:py-1.5 text-xs font-black bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">수납완료</span>
                        ) : status === "UNPAID" ? (
                          <span className="px-2 py-0.5 md:px-4 md:py-1.5 text-xs font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">후납</span>
                        ) : status === "CANCELLED" ? (
                          <span className="px-2 py-0.5 md:px-4 md:py-1.5 text-xs font-black bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full border border-red-200 dark:border-red-800">취소</span>
                        ) : (
                          <span className="px-2 py-0.5 md:px-4 md:py-1.5 text-xs font-black bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full border border-yellow-200 dark:border-yellow-800">수납대기</span>
                        )
                      ) : (
                        <span className="text-gray-200 dark:text-gray-700 font-black">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-gray-300 dark:text-gray-600 font-bold italic">
                    이 학급에 배정된 학생이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!selectedClassId && (
        <div className="py-20 text-center text-gray-300 dark:text-gray-600 font-bold italic">
          반을 선택하면 급식 신청 내역을 확인할 수 있습니다.
        </div>
      )}
    </div>
  );
}
