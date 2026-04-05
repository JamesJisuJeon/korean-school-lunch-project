"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { 
  Users, 
  Search, 
  Download, 
  Upload, 
  UserPlus, 
  UserMinus, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  GraduationCap,
  X
} from "lucide-react";
import * as XLSX from "xlsx";

interface Parent {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  classId: string | null;
  parents: Parent[];
}

interface Class {
  id: string;
  name: string;
  students: Student[];
}

export default function ClassStudentManagementClient() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [activeYear, setActiveYear] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const res = await fetch("/api/admin/class-students");
    if (res.ok) {
      const data = await res.json();
      setClasses(data.classes || []);
      setUnassignedStudents(data.unassignedStudents || []);
      setActiveYear(data.activeYear || "");
      
      // 학급이 있고 선택된게 없으면 첫번째 학급 자동 선택
      if (data.classes?.length > 0 && !selectedClassId) {
        setSelectedClassId(data.classes[0].id);
      }
    }
    setIsLoading(false);
  };

  const selectedClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId);
  }, [classes, selectedClassId]);

  const filteredUnassigned = useMemo(() => {
    if (!searchTerm) return unassignedStudents;
    const lower = searchTerm.toLowerCase();
    return unassignedStudents.filter(s => 
      s.name.toLowerCase().includes(lower) || 
      s.parents.some(p => p.name.toLowerCase().includes(lower))
    );
  }, [unassignedStudents, searchTerm]);

  const handleAssign = async (studentId: string, classId: string | null) => {
    const res = await fetch("/api/admin/class-students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, classId }),
    });
    if (res.ok) {
      fetchData();
    } else {
      const data = await res.json();
      alert(data.message || "오류 발생");
    }
  };

  const downloadTemplate = () => {
    const data = [
      { "학생이름(StudentName)": "홍길동", "학급이름(ClassName)": "무궁화반" },
      { "학생이름(StudentName)": "김철수", "학급이름(ClassName)": "진달래반" }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assignments");
    XLSX.writeFile(wb, "class_assignment_template.xlsx");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        const assignments = data.map(item => ({
          studentName: item["학생이름(StudentName)"] || item["studentName"],
          className: item["학급이름(ClassName)"] || item["className"]
        })).filter(a => a.studentName && a.className);

        if (assignments.length === 0) {
          alert("등록할 데이터가 없습니다.");
          return;
        }

        setIsLoading(true);
        const res = await fetch("/api/admin/class-students", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments }),
        });

        if (res.ok) {
          const result = await res.json();
          alert(`처리 완료: 성공 ${result.successCount}건, 실패 ${result.failCount}건`);
          fetchData();
        } else {
          alert("업로드 중 오류가 발생했습니다.");
        }
      } catch (error) {
        alert("파일 읽기 오류");
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-md dark:shadow-none border border-gray-200 dark:border-gray-800 gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-blue-600 rounded-3xl shadow-md">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-950 dark:text-gray-50">학급 학생 관리</h1>
            <p className="text-sm font-bold text-gray-400 mt-1">{activeYear} 학사연도 학급 배정을 관리합니다.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <button onClick={downloadTemplate} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-50 text-gray-700 rounded-2xl font-black border-2 border-gray-100 hover:bg-gray-100 transition-all active:scale-95">
            <Download className="w-5 h-5" /> 양식 다운로드
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-700 text-white rounded-2xl font-black hover:bg-black dark:hover:bg-gray-600 transition-all active:scale-95 shadow-md dark:shadow-none">
            <Upload className="w-5 h-5" /> 엑셀 대량 등록
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleExcelUpload} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Class Selection & Class Members */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-gray-800 h-full">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
                학급별 학생 목록
              </h2>
              <div className="relative">
                <select 
                  className="pl-6 pr-12 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 font-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-600 dark:focus:border-blue-400 appearance-none transition-all cursor-pointer"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">학급 선택</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {selectedClass ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm font-black text-gray-400 uppercase tracking-widest">
                    총 {selectedClass.students.length}명 배정됨
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedClass.students.map(student => (
                    <div key={student.id} className="flex justify-between items-center p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all group">
                      <div>
                        <p className="text-lg font-black text-gray-900 dark:text-gray-100">{student.name}</p>
                        <p className="text-xs font-bold text-gray-400">
                          부모: {student.parents.map(p => p.name).join(", ") || "없음"}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleAssign(student.id, null)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-red-500 rounded-xl font-bold text-sm shadow-sm hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                      >
                        <UserMinus className="w-4 h-4" /> 배정 취소
                      </button>
                    </div>
                  ))}
                  {selectedClass.students.length === 0 && (
                    <div className="py-20 text-center text-gray-400 dark:text-gray-500 font-bold italic">
                      이 학급에 배정된 학생이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-40 text-center text-gray-400 dark:text-gray-500 font-bold italic">
                학급을 먼저 선택해주세요.
              </div>
            )}
          </div>
        </div>

        {/* Right: Unassigned Students */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-gray-800 h-full">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              미배정 학생 목록
            </h2>

            <div className="relative mb-6">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                className="w-full pl-14 pr-12 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-amber-400 dark:focus:border-amber-500 transition-all outline-none font-bold text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                placeholder="미배정 학생 이름 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredUnassigned.map(student => (
                <div key={student.id} className="flex justify-between items-center p-5 bg-gray-50/50 rounded-2xl border-2 border-transparent hover:border-amber-100 transition-all group">
                  <div>
                    <p className="text-lg font-black text-gray-900">{student.name}</p>
                    <p className="text-xs font-bold text-gray-400">
                      부모: {student.parents.map(p => p.name).join(", ") || "없음"}
                    </p>
                  </div>
                  <button 
                    disabled={!selectedClassId}
                    onClick={() => handleAssign(student.id, selectedClassId)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all border border-transparent
                      ${selectedClassId
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-100 dark:hover:border-blue-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}
                  >
                    <UserPlus className="w-4 h-4" /> 학급 배정
                  </button>
                </div>
              ))}
              {filteredUnassigned.length === 0 && (
                <div className="py-20 text-center text-gray-300 font-bold italic">
                  {searchTerm ? "검색 결과가 없습니다." : "모든 학생이 배정되었습니다."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
