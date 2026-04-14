"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle, Calendar, Utensils, IceCream, RefreshCw, Check, BookOpen } from "lucide-react";
import { PaymentBadge } from "@/components/common/PaymentBadge";

interface Menu {
  id: string;
  date: string;
  mainItems: string | null;
  specialItems: string | null;
  isPublished: boolean;
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
    isServed: boolean;
    notes: string | null;
    menu: Menu;
  }[];
}

interface ClassData {
  className: string;
  academicYear: string;
  students: Student[];
}

export default function TeacherAllClassClient() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchMenus();
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedMenuId) {
      fetchClassData();
    }
  }, [selectedClassId, selectedMenuId]);

  const fetchClasses = async () => {
    const res = await fetch("/api/teacher/class");
    if (res.ok) {
      const data = await res.json();
      const list: ClassItem[] = data.classes ?? [];
      setClasses(list);
      if (list.length > 0) setSelectedClassId(list[0].id);
    }
  };

  const fetchMenus = async () => {
    const res = await fetch("/api/pa/menu");
    if (res.ok) {
      const data: Menu[] = await res.json();
      setMenus(data);
      if (data.length > 0) {
        const published = data.find((m) => m.isPublished);
        setSelectedMenuId(published ? published.id : data[0].id);
      }
    }
  };

  const fetchClassData = async () => {
    if (!selectedClassId || !selectedMenuId) return;
    setIsLoading(true);
    const res = await fetch(`/api/teacher/class?classId=${selectedClassId}&menuId=${selectedMenuId}`);
    if (res.ok) setClassData(await res.json());
    setIsLoading(false);
  };

  const students = classData
    ? [...classData.students].sort((a, b) => {
        for (let i = 0; i < Math.min(a.name.length, b.name.length); i++) {
          const diff = a.name.charCodeAt(i) - b.name.charCodeAt(i);
          if (diff !== 0) return diff;
        }
        return a.name.length - b.name.length;
      })
    : [];

  const totalStudents = students.length;
  const orderedCount = students.filter(s => s.orders.length > 0 && s.orders[0].status !== "CANCELLED").length;
  const paidCount = students.filter(s => s.orders.length > 0 && ["PAID", "UNPAID", "POST_PAID", "FREE_SNACK"].includes(s.orders[0].status)).length;
  const currentMenu = menus.find(m => m.id === selectedMenuId);

  return (
    <div className="space-y-8">
      {/* 메뉴 정보 */}
      {currentMenu && (
        <div className={`grid ${currentMenu.specialItems ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
          {[
            { icon: <Utensils className="w-4 h-4" />, bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-100 dark:border-orange-800", color: "text-orange-600 dark:text-orange-400", label: "간식 메뉴", value: currentMenu.mainItems },
            ...(currentMenu.specialItems ? [{ icon: <IceCream className="w-4 h-4" />, bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-100 dark:border-yellow-800", color: "text-yellow-600 dark:text-yellow-400", label: "매점 특식 판매", value: currentMenu.specialItems }] : []),
          ].map((item, i) => (
            <div key={i} className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border ${item.bg} ${item.border}`}>
              <div className={`flex items-center gap-1.5 ${item.color}`}>
                {item.icon}
                <p className="text-xs font-black">{item.label}</p>
              </div>
              <p className="text-sm font-black text-gray-800 dark:text-gray-200 text-center leading-tight whitespace-pre-line">{item.value || "-"}</p>
            </div>
          ))}
        </div>
      )}

      {/* 날짜 + 반 선택 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
          <select
            className="flex-1 bg-transparent border-none text-gray-950 dark:text-gray-100 font-black text-lg focus:ring-0 cursor-pointer outline-none"
            value={selectedMenuId}
            onChange={(e) => setSelectedMenuId(e.target.value)}
          >
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {new Date(menu.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400 shrink-0" />
          <select
            className="flex-1 bg-transparent border-none text-gray-950 dark:text-gray-100 font-black text-lg focus:ring-0 cursor-pointer outline-none"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 반 요약 */}
      {classData && (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="p-3 sm:p-4 bg-orange-600 rounded-2xl shadow-md dark:shadow-none">
              <Users className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-gray-50">{classData.className}</h2>
                <button
                  onClick={fetchClassData}
                  className="p-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
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

      {/* 로딩 / 빈 상태 */}
      {isLoading && (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-bold">정보를 불러오는 중...</div>
      )}

      {!isLoading && !classData && selectedClassId && selectedMenuId && (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-bold italic">학생 정보가 없습니다.</div>
      )}

      {/* 학생 명단 */}
      {!isLoading && classData && (
        <div className="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 rounded-3xl overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-2 md:px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 w-10 md:w-16">번호</th>
                <th className="px-2 md:px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400">이름</th>
                <th className="px-2 md:px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 w-16 md:w-20">신청상태</th>
                <th className="px-2 md:px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 w-16 md:w-20">수납상태</th>
                <th className="px-2 md:px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 w-16 md:w-20">배식완료</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {students.map((student, index) => {
                const order = student.orders[0];
                const isOrdered = !!order;
                const status = order?.status;

                return (
                  <tr key={student.id} className={`${!isOrdered ? "bg-gray-50/50 dark:bg-gray-800/20" : "hover:bg-blue-50/30 dark:hover:bg-blue-900/10"} transition-colors`}>
                    <td className="px-1 md:px-4 py-5 whitespace-nowrap text-center text-sm font-black text-gray-400 dark:text-gray-500">
                      {String(index + 1).padStart(2, '0')}
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
                    <td className="px-1 md:px-4 py-5 whitespace-nowrap text-center">
                      {isOrdered ? (
                        <PaymentBadge status={status} simplified={true} />
                      ) : (
                        <span className="text-gray-200 dark:text-gray-700 font-black">-</span>
                      )}
                    </td>
                    <td className="px-1 md:px-4 py-5 whitespace-nowrap text-center">
                      {isOrdered && status !== "CANCELLED" && status !== "WAITING" ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md border-2 ${order.isServed
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-transparent"
                          }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-gray-200 dark:text-gray-700 font-black">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
