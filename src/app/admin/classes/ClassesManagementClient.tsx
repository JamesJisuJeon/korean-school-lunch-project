"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, BookOpen, Trash2, Edit2, Download, Upload, Check, X, Search, User, Filter, GraduationCap, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import * as XLSX from "xlsx";

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Class {
  id: string;
  name: string;
  grade: string | null;
  teacherName: string | null;
  teacherId: string | null;
  sortOrder: number | null;
  academicYear: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
  classes: Class[];
}

export default function ClassesManagementClient() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

  const [selectedYearId, setSelectedYearId] = useState("");
  const [newClass, setNewClass] = useState({ name: "", grade: "", teacherName: "", teacherId: "", sortOrder: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [searchYear, setSearchYear] = useState("");

  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [showTeacherSuggestions, setShowTeacherSuggestions] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "", grade: "", teacherName: "", teacherId: "", sortOrder: "" });
  const [editTeacherSearch, setEditTeacherSearch] = useState("");
  const [showEditTeacherSuggestions, setShowEditTeacherSuggestions] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sortKey, setSortKey] = useState<"sortOrder" | "academicYear" | "grade" | "name" | "teacherName">("sortOrder");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newClassSearchRef = useRef<HTMLDivElement>(null);
  const editClassSearchRef = useRef<HTMLDivElement>(null);
  const editMobileSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    fetchTeachers();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (newClassSearchRef.current && !newClassSearchRef.current.contains(target)) {
        setShowTeacherSuggestions(false);
      }
      const inDesktopEdit = editClassSearchRef.current?.contains(target);
      const inMobileEdit = editMobileSearchRef.current?.contains(target);
      if (!inDesktopEdit && !inMobileEdit) {
        setShowEditTeacherSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allClasses, searchTerm, searchYear, sortKey, sortDir]);

  const fetchData = async () => {
    const res = await fetch("/api/admin/school");
    if (res.ok) {
      const yearsData = await res.json();
      setYears(yearsData);

      const all: Class[] = [];
      yearsData.forEach((y: AcademicYear) => {
        y.classes.forEach(c => {
          all.push({ ...c, academicYear: { id: y.id, name: y.name, isActive: y.isActive } });
        });
      });
      setAllClasses(all);

      const activeYear = yearsData.find((y: AcademicYear) => y.isActive);
      if (activeYear) {
         if (!selectedYearId) setSelectedYearId(activeYear.id);
         if (!searchYear || searchYear === "") setSearchYear(activeYear.id);
      }
    }
  };

  const fetchTeachers = async () => {
    const res = await fetch("/api/admin/teachers");
    if (res.ok) setTeachers(await res.json());
  };

  const applyFilters = () => {
    let result = [...allClasses];
    if (searchYear !== "ALL") result = result.filter(c => c.academicYear.id === searchYear);
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(lower) ||
        (c.grade && c.grade.toLowerCase().includes(lower)) ||
        (c.teacherName && c.teacherName.toLowerCase().includes(lower))
      );
    }
    result.sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      if (sortKey === "sortOrder") {
        aVal = a.sortOrder ?? Infinity;
        bVal = b.sortOrder ?? Infinity;
      } else if (sortKey === "academicYear") {
        aVal = a.academicYear.name;
        bVal = b.academicYear.name;
      } else if (sortKey === "grade") {
        aVal = a.grade ?? "";
        bVal = b.grade ?? "";
      } else if (sortKey === "name") {
        aVal = a.name;
        bVal = b.name;
      } else {
        aVal = a.teacherName ?? "";
        bVal = b.teacherName ?? "";
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredClasses(result);
  };

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: typeof sortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYearId || !newClass.name) return;
    setIsLoading(true);
    const res = await fetch("/api/admin/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newClass, academicYearId: selectedYearId }),
    });
    if (res.ok) {
      setNewClass({ name: "", grade: "", teacherName: "", teacherId: "", sortOrder: "" });
      setTeacherSearchQuery("");
      fetchData();
    }
    setIsLoading(false);
  };

  const deleteClass = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await fetch("/api/admin/classes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchData();
  };

  const saveEdit = async (id: string, yearId: string) => {
    const res = await fetch("/api/admin/classes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editFormData, id, academicYearId: yearId }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchData();
    }
  };

  const downloadTemplate = () => {
    const data = [{ "순서": 1, "학사연도": "2026", "학년": "유치1", "학급이름": "무궁화반", "담임선생님": "홍길동" }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "class_registration_template.xlsx");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        const formattedData = data.map((item: any) => ({
          sortOrder: item["순서"] ?? item["순서(SortOrder)"] ?? item["sortOrder"] ?? "",
          yearName: item["학사연도"] || item["학사연도(SchoolYear)"] || item["yearName"] || "",
          grade: item["학년"] || item["학년(Grade)"] || item["grade"] || "",
          name: item["학급이름"] || item["학급이름(ClassName)"] || item["name"] || "",
          teacherName: item["담임선생님"] || item["담임선생님(TeacherName)"] || item["teacherName"] || "",
        })).filter(item => item.yearName && item.name);

        console.log("파싱된 데이터:", formattedData);

        if (formattedData.length === 0) {
          setImportResult({ type: "error", message: "등록할 유효한 데이터가 없습니다. 양식을 확인해주세요.\n\n파싱된 원본 데이터를 브라우저 콘솔(F12)에서 확인할 수 있습니다." });
          return;
        }

        setIsLoading(true);
        const res = await fetch("/api/admin/classes/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classes: formattedData }),
        });

        if (res.ok) {
          const result = await res.json();
          let msg = result.message || "성공적으로 등록되었습니다.";
          if (result.errors && result.errors.length > 0) {
            msg += "\n\n오류 상세 (최대 5건):\n" + result.errors.slice(0, 5).map((e: any) => `- ${e.item.name || '알수없음'}: ${e.error}`).join("\n");
          }
          setImportResult({ type: result.errors?.length > 0 ? "error" : "success", message: msg });
          setSearchYear("ALL");
          fetchData();
        } else {
          const err = await res.json();
          const msg = err.message || "업로드 중 오류가 발생했습니다.";
          console.error("업로드 오류:", msg);
          setImportResult({ type: "error", message: msg });
        }
      } catch (error) {
        console.error("파일 읽기 오류:", error);
        setImportResult({ type: "error", message: `파일 읽기 중 오류가 발생했습니다.\n${error}` });
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const inputStyles = "w-full rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 font-black focus:bg-white dark:focus:bg-gray-700 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all outline-none text-gray-900 dark:text-gray-100";
  const labelStyles = "block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="space-y-10 pb-20 max-w-[1400px] mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-[2.5rem] shadow-md dark:shadow-none border border-gray-200 dark:border-gray-800 gap-4 sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="p-3 sm:p-4 bg-blue-600 rounded-3xl shadow-md">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-gray-50">학급 운영 관리</h1>
            <p className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">학사연도별 학급과 담임 선생님을 배정하고 관리합니다.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <button onClick={downloadTemplate} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95">
            <Download className="w-5 h-5" /> 양식 다운로드
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 dark:bg-gray-700 text-white rounded-2xl font-black hover:bg-blue-700 dark:hover:bg-gray-600 transition-all active:scale-95 shadow-md dark:shadow-none">
            <Upload className="w-5 h-5" /> 엑셀 대량 등록
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleExcelUpload} />
        </div>
      </div>

      {importResult && (
        <div className={`p-5 rounded-2xl border-2 flex items-start justify-between gap-4 ${importResult.type === "success" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
          <p className={`text-sm font-bold whitespace-pre-wrap ${importResult.type === "success" ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>{importResult.message}</p>
          <button onClick={() => setImportResult(null)} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* 좌측: 등록 폼 */}
        <div className="xl:col-span-3 space-y-6">
          <section className="bg-white dark:bg-gray-900 p-7 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Plus className="w-5 h-5" /> 학급 신규 등록
            </h2>
            <form onSubmit={addClass} className="space-y-5">
              <div>
                <label className={labelStyles}>학사연도 선택</label>
                <select required className={inputStyles} value={selectedYearId} onChange={e => setSelectedYearId(e.target.value)}>
                  <option value="">선택해주세요</option>
                  {years.map(y => <option key={y.id} value={y.id}>{y.name} 학사연도 {y.isActive ? '(현재 활성)' : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelStyles}>순서</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" className={inputStyles} placeholder="1" value={newClass.sortOrder} onChange={e => setNewClass({ ...newClass, sortOrder: e.target.value.replace(/[^0-9]/g, "") })} />
                </div>
                <div>
                  <label className={labelStyles}>학년</label>
                  <input className={inputStyles} placeholder="초등1" value={newClass.grade} onChange={e => setNewClass({ ...newClass, grade: e.target.value })} />
                </div>
                <div>
                  <label className={labelStyles}>학급명</label>
                  <input required className={inputStyles} placeholder="1반" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} />
                </div>
              </div>

              <div className="relative" ref={newClassSearchRef}>
                <label className={labelStyles}>담임선생님 지정</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    required
                    autoComplete="off"
                    className={`${inputStyles} pl-12`}
                    placeholder="성함으로 검색..."
                    value={teacherSearchQuery}
                    onFocus={() => setShowTeacherSuggestions(true)}
                    onChange={e => {
                      setTeacherSearchQuery(e.target.value);
                      setNewClass({ ...newClass, teacherName: e.target.value, teacherId: "" });
                      setShowTeacherSuggestions(true);
                    }}
                  />
                </div>
                {showTeacherSuggestions && (
                  <div className="absolute z-30 left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[2rem] shadow-md max-h-60 overflow-y-auto p-2 animate-in slide-in-from-top-1 duration-200">
                    {teachers.filter(t => t.name.includes(teacherSearchQuery)).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        className="w-full p-4 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-colors group"
                        onClick={() => {
                          setNewClass({ ...newClass, teacherName: t.name, teacherId: t.id });
                          setTeacherSearchQuery(t.name);
                          setShowTeacherSuggestions(false);
                        }}
                      >
                        <p className="font-black text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{t.name}</p>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500">{t.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black hover:bg-blue-700 transition-all active:scale-95">학급 등록 완료</button>
            </form>
          </section>
        </div>

        {/* 우측: 목록 */}
        <div className="xl:col-span-9 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                className="w-full pl-16 pr-12 py-5 rounded-[2rem] border-none shadow-md dark:shadow-none bg-white dark:bg-gray-800 font-bold text-gray-950 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all outline-none"
                placeholder="학년, 학급 이름, 담임교사로 검색하세요"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/70 w-5 h-5 pointer-events-none" />
              <select
                className="w-full pl-12 pr-6 py-5 rounded-[2rem] border-none shadow-md dark:shadow-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-black appearance-none outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-600 transition-all cursor-pointer"
                value={searchYear}
                onChange={e => setSearchYear(e.target.value)}
              >
                <option value="ALL">모든 학사연도</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name} 학사연도</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* 모바일 카드 레이아웃 */}
            <div className="xl:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {filteredClasses.map(cls => (
                <div key={cls.id} className={`p-4 ${editingId === cls.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                  {editingId === cls.id ? (
                    /* 수정 폼 */
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black tracking-tighter ${cls.academicYear.isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                          {cls.academicYear.name}
                        </span>
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400">수정 중</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className={labelStyles}>순서</label>
                          <input type="text" inputMode="numeric" className="w-full bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5 font-black text-gray-900 dark:text-gray-100 text-center text-sm outline-none" value={editFormData.sortOrder} onChange={e => setEditFormData({ ...editFormData, sortOrder: e.target.value.replace(/[^0-9]/g, "") })} />
                        </div>
                        <div>
                          <label className={labelStyles}>학년</label>
                          <input className="w-full bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5 font-black text-gray-900 dark:text-gray-100 text-sm outline-none" value={editFormData.grade} onChange={e => setEditFormData({ ...editFormData, grade: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelStyles}>학급명</label>
                          <input className="w-full bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5 font-black text-gray-900 dark:text-gray-100 text-sm outline-none" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
                        </div>
                      </div>
                      <div className="relative" ref={editMobileSearchRef}>
                        <label className={labelStyles}>담임선생님</label>
                        <input
                          className="w-full bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2.5 font-black text-gray-900 dark:text-gray-100 text-sm outline-none"
                          value={editTeacherSearch}
                          autoComplete="off"
                          onFocus={() => setShowEditTeacherSuggestions(true)}
                          onChange={e => {
                            setEditTeacherSearch(e.target.value);
                            setEditFormData({ ...editFormData, teacherName: e.target.value, teacherId: "" });
                            setShowEditTeacherSuggestions(true);
                          }}
                        />
                        {showEditTeacherSuggestions && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md max-h-40 overflow-y-auto p-1">
                            {teachers.filter(t => t.name.includes(editTeacherSearch)).map(t => (
                              <button
                                key={t.id}
                                className="w-full p-3 text-left text-sm font-black rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-gray-900 dark:text-gray-100"
                                onClick={() => {
                                  setEditFormData({ ...editFormData, teacherName: t.name, teacherId: t.id });
                                  setEditTeacherSearch(t.name);
                                  setShowEditTeacherSuggestions(false);
                                }}
                              >
                                {t.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={() => saveEdit(cls.id, cls.academicYear.id)} className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white rounded-xl font-black text-sm">
                          <Check className="w-4 h-4" /> 저장
                        </button>
                        <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-black text-sm">
                          <X className="w-4 h-4" /> 취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 일반 카드 뷰 */
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black tracking-tighter ${cls.academicYear.isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                            {cls.academicYear.name}
                          </span>
                          {cls.sortOrder && <span className="text-xs font-black text-gray-400 dark:text-gray-500">#{cls.sortOrder}</span>}
                        </div>
                        <p className="text-base font-black text-gray-950 dark:text-gray-50">{cls.name}</p>
                        {cls.grade && <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{cls.grade}</p>}
                        {cls.teacherName && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs">
                              {cls.teacherName[0]}
                            </div>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{cls.teacherName}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(cls.id);
                            setEditFormData({ name: cls.name, grade: cls.grade || "", teacherName: cls.teacherName || "", teacherId: cls.teacherId || "", sortOrder: cls.sortOrder?.toString() ?? "" });
                            setEditTeacherSearch(cls.teacherName || "");
                          }}
                          className="p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteClass(cls.id)} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredClasses.length === 0 && (
                <div className="px-8 py-20 text-center text-gray-400 dark:text-gray-500 font-black italic">
                  등록된 학급 정보가 없습니다.
                </div>
              )}
            </div>

            {/* 데스크탑 테이블 */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                    <th className="px-8 py-6"><button onClick={() => handleSort("academicYear")} className="flex items-center gap-1 text-xs font-black text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><span>학사연도</span><SortIcon col="academicYear" /></button></th>
                    <th className="px-4 py-6 w-20"><button onClick={() => handleSort("sortOrder")} className="flex items-center gap-1 text-xs font-black text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mx-auto"><span>순서</span><SortIcon col="sortOrder" /></button></th>
                    <th className="px-8 py-6"><button onClick={() => handleSort("grade")} className="flex items-center gap-1 text-xs font-black text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><span>학년</span><SortIcon col="grade" /></button></th>
                    <th className="px-8 py-6"><button onClick={() => handleSort("name")} className="flex items-center gap-1 text-xs font-black text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><span>학급 이름</span><SortIcon col="name" /></button></th>
                    <th className="px-8 py-6"><button onClick={() => handleSort("teacherName")} className="flex items-center gap-1 text-xs font-black text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><span>담임교사</span><SortIcon col="teacherName" /></button></th>
                    <th className="px-8 py-6 text-right text-xs font-black text-gray-400 uppercase tracking-widest">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredClasses.map(cls => (
                    <tr key={cls.id} className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group ${editingId === cls.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                      {editingId === cls.id ? (
                        <>
                          <td className="px-8 py-6 text-sm font-black text-blue-600 dark:text-blue-400">{cls.academicYear.name}</td>
                          <td className="px-4 py-6"><input type="text" inputMode="numeric" pattern="[0-9]*" className="w-full bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2 font-black text-gray-900 dark:text-gray-100 text-center" value={editFormData.sortOrder} onChange={e => setEditFormData({ ...editFormData, sortOrder: e.target.value.replace(/[^0-9]/g, "") })} /></td>
                          <td className="px-8 py-6"><input className="w-full bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2 font-black text-gray-900 dark:text-gray-100" value={editFormData.grade} onChange={e => setEditFormData({ ...editFormData, grade: e.target.value })} /></td>
                          <td className="px-8 py-6"><input className="w-full bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2 font-black text-gray-900 dark:text-gray-100" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} /></td>
                          <td className="px-8 py-6">
                            <div className="relative" ref={editClassSearchRef}>
                              <input
                                className="w-full bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2 font-black text-gray-900 dark:text-gray-100"
                                value={editTeacherSearch}
                                autoComplete="off"
                                onFocus={() => setShowEditTeacherSuggestions(true)}
                                onChange={e => {
                                  setEditTeacherSearch(e.target.value);
                                  setEditFormData({ ...editFormData, teacherName: e.target.value, teacherId: "" });
                                  setShowEditTeacherSuggestions(true);
                                }}
                              />
                              {showEditTeacherSuggestions && (
                                <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md max-h-40 overflow-y-auto p-1 animate-in slide-in-from-top-1 duration-200 min-w-[180px]">
                                  {teachers.filter(t => t.name.includes(editTeacherSearch)).map(t => (
                                    <button
                                      key={t.id}
                                      className="w-full p-3 text-left text-sm font-black rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-gray-900 dark:text-gray-100"
                                      onClick={() => {
                                        setEditFormData({ ...editFormData, teacherName: t.name, teacherId: t.id });
                                        setEditTeacherSearch(t.name);
                                        setShowEditTeacherSuggestions(false);
                                      }}
                                    >
                                      {t.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex justify-end gap-2">
                               <button onClick={() => saveEdit(cls.id, cls.academicYear.id)} className="p-3 bg-green-500 text-white rounded-xl shadow-sm"><Check className="w-5 h-5" /></button>
                               <button onClick={() => setEditingId(null)} className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl"><X className="w-5 h-5" /></button>
                             </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-2 rounded-2xl text-[10px] font-black tracking-tighter ${cls.academicYear.isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                              {cls.academicYear.name}
                            </span>
                          </td>
                          <td className="px-4 py-6 text-center text-base font-black text-gray-400 dark:text-gray-500">
                            {cls.sortOrder ?? <span className="text-gray-300 dark:text-gray-700">-</span>}
                          </td>
                          <td className="px-8 py-6 text-base font-black text-gray-900 dark:text-gray-100">{cls.grade}</td>
                          <td className="px-8 py-6 text-base font-black text-gray-950 dark:text-gray-50">{cls.name}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm">
                                {cls.teacherName?.[0]}
                              </div>
                              <span className="font-black text-gray-800 dark:text-gray-200">{cls.teacherName}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                              <button
                                onClick={() => {
                                  setEditingId(cls.id);
                                  setEditFormData({ name: cls.name, grade: cls.grade || "", teacherName: cls.teacherName || "", teacherId: cls.teacherId || "", sortOrder: cls.sortOrder?.toString() ?? "" });
                                  setEditTeacherSearch(cls.teacherName || "");
                                }}
                                className="p-3 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button onClick={() => deleteClass(cls.id)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {filteredClasses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-32 text-center text-gray-400 dark:text-gray-500 font-black italic text-lg">
                        등록된 학급 정보가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
