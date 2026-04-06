"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle, Calendar, Utensils, IceCream, Beer } from "lucide-react";

interface Menu {
  id: string;
  date: string;
  mainItems: string | null;
  dessertItems: string | null;
  beverageItems: string | null;
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
  className: string;
  academicYear: string;
  students: Student[];
}

export default function TeacherClassClient() {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  useEffect(() => {
    if (selectedMenuId || menus.length > 0) {
      fetchClassData();
    }
  }, [selectedMenuId, menus]);

  const fetchMenus = async () => {
    const res = await fetch("/api/pa/menu");
    if (res.ok) {
      const data = await res.json();
      setMenus(data);
      if (data.length > 0) setSelectedMenuId(data[0].id);
    }
  };

  const fetchClassData = async () => {
    setIsLoading(true);
    const res = await fetch(`/api/teacher/class?menuId=${selectedMenuId}`);
    if (res.ok) setClassData(await res.json());
    setIsLoading(false);
  };

  if (!classData && isLoading) return <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-bold">정보를 불러오는 중...</div>;
  if (!classData) return <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-bold italic">배정된 학급 정보가 없습니다.</div>;

  const totalStudents = classData.students.length;
  const orderedCount = classData.students.filter(s => s.orders.length > 0 && s.orders[0].status !== "CANCELLED").length;
  const paidCount = classData.students.filter(s => s.orders.length > 0 && s.orders[0].isPaid).length;
  const currentMenu = menus.find(m => m.id === selectedMenuId);

  return (
    <div className="space-y-8">
      {/* 반 요약 정보 */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="p-3 sm:p-4 bg-orange-600 rounded-2xl shadow-md dark:shadow-none">
            <Users className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-gray-50">{classData.className}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold tracking-tighter uppercase">{classData.academicYear} ACADEMIC YEAR</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="text-center px-6 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 mb-1">전체</p>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-50">{totalStudents}</p>
          </div>
          <div className="text-center px-6 py-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border-2 border-blue-100 dark:border-blue-800">
            <p className="text-xs font-black text-blue-400 dark:text-blue-500 mb-1">신청</p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{orderedCount}</p>
          </div>
          <div className="text-center px-6 py-3 bg-green-50 dark:bg-green-900/30 rounded-2xl border-2 border-green-100 dark:border-green-800">
            <p className="text-xs font-black text-green-400 dark:text-green-500 mb-1">수납완료</p>
            <p className="text-2xl font-black text-green-700 dark:text-green-400">{paidCount}</p>
          </div>
        </div>
      </div>

      {/* 날짜 필터 및 메뉴 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <select
            className="flex-1 bg-transparent border-none text-gray-950 dark:text-gray-100 font-black text-lg focus:ring-0 cursor-pointer outline-none"
            value={selectedMenuId}
            onChange={(e) => setSelectedMenuId(e.target.value)}
          >
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {new Date(menu.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })} 점심
              </option>
            ))}
          </select>
        </div>

        {currentMenu && (
          <div className="lg:col-span-2 grid grid-cols-3 gap-2">
            {[
              { icon: <Utensils className="w-4 h-4" />, bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-100 dark:border-orange-800", color: "text-orange-600 dark:text-orange-400", label: "Main", value: currentMenu.mainItems },
              { icon: <IceCream className="w-4 h-4" />, bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-pink-100 dark:border-pink-800", color: "text-pink-600 dark:text-pink-400", label: "Dessert", value: currentMenu.dessertItems },
              { icon: <Beer className="w-4 h-4" />, bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-100 dark:border-cyan-800", color: "text-cyan-600 dark:text-cyan-400", label: "Beverage", value: currentMenu.beverageItems },
            ].map((item, i) => (
              <div key={i} className={`flex flex-col items-center gap-1 p-3 rounded-2xl border ${item.bg} ${item.border}`}>
                <span className={item.color}>{item.icon}</span>
                <p className={`text-[10px] font-black uppercase tracking-widest ${item.color} opacity-70`}>{item.label}</p>
                <p className="text-xs font-black text-gray-800 dark:text-gray-200 text-center leading-tight">{item.value || "-"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 학생 명단 */}
      <div className="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 rounded-3xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 w-16">번호</th>
              <th className="px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 w-32">이름</th>
              <th className="px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400">특이사항</th>
              <th className="px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 w-28">신청상태</th>
              <th className="px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 w-28">수납상태</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {classData.students.map((student, index) => {
              const order = student.orders[0];
              const isOrdered = !!order;
              const status = order?.status;

              return (
                <tr key={student.id} className={`${!isOrdered ? "bg-gray-50/50 dark:bg-gray-800/20" : "hover:bg-blue-50/30 dark:hover:bg-blue-900/10"} transition-colors`}>
                  <td className="px-4 py-5 whitespace-nowrap text-center text-sm font-black text-gray-400 dark:text-gray-500">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap text-center text-sm font-black text-gray-950 dark:text-gray-100">
                    {student.name}
                  </td>
                  <td className="px-4 py-5 text-center text-sm font-bold text-red-600 dark:text-red-400 italic">
                    {order?.notes || "-"}
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap text-center">
                    {isOrdered ? (
                      status === "CANCELLED" ? (
                        <span className="inline-flex items-center justify-center gap-2 text-red-500 dark:text-red-400 font-black text-sm">
                          취소
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-2 text-blue-700 dark:text-blue-400 font-black text-sm">
                          <CheckCircle className="w-5 h-5" /> 신청
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center justify-center gap-2 text-gray-300 dark:text-gray-600 font-bold text-sm italic">
                        미신청
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap text-center">
                    {isOrdered ? (
                      status === "PAID" || status === "POST_PAID" ? (
                        <span className="px-4 py-1.5 text-xs font-black bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full border-2 border-green-200 dark:border-green-800 shadow-sm">수납완료</span>
                      ) : status === "UNPAID" ? (
                        <span className="px-4 py-1.5 text-xs font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full border-2 border-blue-200 dark:border-blue-800 shadow-sm">후납</span>
                      ) : status === "CANCELLED" ? (
                        <span className="px-4 py-1.5 text-xs font-black bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full border-2 border-red-200 dark:border-red-800 shadow-sm">취소</span>
                      ) : (
                        <span className="px-4 py-1.5 text-xs font-black bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full border-2 border-yellow-200 dark:border-yellow-800 shadow-sm">수납대기</span>
                      )
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
    </div>
  );
}
