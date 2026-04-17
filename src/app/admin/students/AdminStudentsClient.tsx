"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { UserPlus, GraduationCap, Key, Trash2, Search, X, CheckCircle2, PowerOff, Power, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { matchesSearch } from "@/lib/chosungUtils";

interface Class {
  id: string;
  name: string;
  academicYear: {
    name: string;
  };
}

interface Parent {
  id: string;
  name: string | null;
  email: string;
  roles: string[];
}

interface Student {
  id: string;
  name: string;
  isPAChild: boolean;
  isActive: boolean;
  class?: Class;
  classId?: string | null;
  parents: Parent[];
}

interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
  classes: { id: string; name: string }[];
}

export default function AdminStudentsClient() {
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  
  // 폼 상태
  const [name, setName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 검색 및 정렬 상태
  const [parentSearch, setParentSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [studentListSearch, setStudentListSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [importResult, setImportResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [parentUpdateResult, setParentUpdateResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parentUpdateFileInputRef = useRef<HTMLInputElement>(null);

  // 삭제 모달 상태
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [studentRes, yearRes, userRes] = await Promise.all([
      fetch("/api/admin/students"),
      fetch("/api/admin/school"),
      fetch("/api/admin/users")
    ]);
    if (studentRes.ok) setStudents(await studentRes.json());
    if (yearRes.ok) setYears(await yearRes.json());
    if (userRes.ok) {
      const allUsers = await userRes.json();
      setParents(allUsers.filter((u: any) => u.roles.includes("PARENT")));
    }
    setIsLoading(false);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const activeYearClasses = useMemo(() => {
    const activeYear = years.find(y => y.isActive);
    return activeYear ? activeYear.classes : [];
  }, [years]);

  const sortedStudents = useMemo(() => {
    let result = [...students.filter(s => {
      const matchesSearch_ =
        matchesSearch(s.name, studentListSearch) ||
        matchesSearch(s.class?.name || "", studentListSearch) ||
        s.parents.some(p => matchesSearch(p.name || "", studentListSearch));
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'active' && s.isActive) ||
        (activeFilter === 'inactive' && !s.isActive);
      return matchesSearch_ && matchesFilter;
    })];

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = "";
        let bValue: any = "";

        if (sortConfig.key === "name") {
          aValue = a.name;
          bValue = b.name;
        } else if (sortConfig.key === "class") {
          aValue = a.class?.name || "";
          bValue = b.class?.name || "";
        } else if (sortConfig.key === "parents") {
          aValue = a.parents.map(p => p.name).join(", ");
          bValue = b.parents.map(p => p.name).join(", ");
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [students, studentListSearch, sortConfig, activeFilter]);

  const filteredParents = useMemo(() => {
    if (!parentSearch) return [];
    return parents.filter(p => 
      !selectedParentIds.includes(p.id) &&
      (matchesSearch(p.name || "", parentSearch) ||
       matchesSearch(p.email, parentSearch))
    ).slice(0, 5);
  }, [parents, parentSearch, selectedParentIds]);

  const selectedParentsData = useMemo(() => {
    return parents.filter(p => selectedParentIds.includes(p.id));
  }, [parents, selectedParentIds]);

  const resetForm = () => {
    setName("");
    setSelectedClassId("");
    setSelectedParentIds([]);
    setEditingStudent(null);
    setParentSearch("");
    setShowAddForm(false);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setSelectedClassId(student.class?.id || (student as any).classId || "");
    setSelectedParentIds(student.parents.map(p => p.id));
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddOrUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || selectedParentIds.length === 0) {
      alert("학생 이름과 하나 이상의 학부모를 선택해주세요.");
      return;
    }

    setIsLoading(true);
    const method = editingStudent ? "PUT" : "POST";
    const res = await fetch("/api/admin/students", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: editingStudent?.id,
        name, 
        classId: selectedClassId || null, 
        parentIds: selectedParentIds 
      }),
    });
    
    if (res.ok) {
      alert(editingStudent ? "학생 정보가 수정되었습니다." : "학생이 등록되었습니다.");
      resetForm();
      fetchData();
    } else {
      const data = await res.json();
      alert(data.message || "오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  const handleDeleteRequest = (student: Student) => {
    setDeleteTarget(student);
    setDeleteConfirmText("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    const res = await fetch("/api/admin/students", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    if (res.ok) {
      setDeleteTarget(null);
      fetchData();
    } else {
      alert("삭제 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  const handleToggleActive = async (student: Student) => {
    const next = !student.isActive;
    const label = next ? "활성화" : "비활성화";
    if (!confirm(`${student.name} 학생을 ${label}하시겠습니까?`)) return;

    const res = await fetch("/api/admin/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: student.id, isActive: next }),
    });
    if (res.ok) {
      fetchData();
    } else {
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const downloadTemplate = () => {
    const activeYear = years.find(y => y.isActive);
    const classNames = activeYear ? activeYear.classes.map(c => c.name) : [];
    const data = [
      { "학생이름(Name)": "홍길동", "학급(Class)": classNames[0] ?? "무궁화반", "학부모이메일(ParentEmails)": "parent1@example.com" },
      { "학생이름(Name)": "김영희", "학급(Class)": classNames[1] ?? "해바라기반", "학부모이메일(ParentEmails)": "parent2@example.com,parent3@example.com" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 16 }, { wch: 16 }, { wch: 40 }];
    XLSX.utils.sheet_add_aoa(ws, [
      [`※ 학급: 활성 학사연도(${activeYear?.name ?? "설정 필요"})의 학급명과 정확히 일치해야 합니다.`],
      ["※ 학부모이메일: 이미 등록된 계정 이메일, 복수일 경우 쉼표로 구분 (예: a@b.com,c@d.com)"],
    ], { origin: `A${data.length + 2}` });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_registration_template.xlsx");
  };

  const handleExcelExport = () => {
    const data = sortedStudents.map(s => ({
      "학생이름(Name)": s.name,
      "학급(Class)": s.class?.name ?? "",
      "학부모이메일(ParentEmails)": s.parents.map(p => p.email).join(","),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 16 }, { wch: 16 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `students_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[] = XLSX.utils.sheet_to_json(ws);

        const parsed = raw
          .filter(row => row["학생이름(Name)"] || row["학생이름"] || row["name"])
          .map(row => ({
            name: row["학생이름(Name)"] || row["학생이름"] || row["name"] || "",
            className: row["학급(Class)"] || row["학급"] || row["class"] || "",
            parentEmails: row["학부모이메일(ParentEmails)"] || row["학부모이메일"] || row["parentEmails"] || "",
          }));

        if (parsed.length === 0) {
          setImportResult({ type: "error", message: "유효한 데이터가 없습니다. 양식을 확인해주세요." });
          return;
        }

        setIsLoading(true);
        const res = await fetch("/api/admin/students/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ students: parsed }),
        });

        const result = await res.json();
        const hasErrors = result.errors?.length > 0;
        let msg = result.message;
        if (hasErrors) {
          msg += "\n\n오류:\n" + result.errors.slice(0, 5).map((e: any) => `- ${e.row}행 ${e.name}: ${e.error}`).join("\n");
          if (result.errors.length > 5) msg += `\n... 외 ${result.errors.length - 5}건`;
        }
        setImportResult({ type: hasErrors && result.successCount === 0 ? "error" : "success", message: msg });
        fetchData();
      } catch (err) {
        setImportResult({ type: "error", message: `파일 읽기 오류: ${err}` });
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleParentUpdateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[] = XLSX.utils.sheet_to_json(ws);

        const parsed = raw
          .filter(row => row["학생이름(Name)"] || row["학생이름"] || row["name"])
          .map(row => ({
            name: row["학생이름(Name)"] || row["학생이름"] || row["name"] || "",
            className: row["학급(Class)"] || row["학급"] || row["class"] || "",
            parentEmails: row["학부모이메일(ParentEmails)"] || row["학부모이메일"] || row["parentEmails"] || "",
          }));

        if (parsed.length === 0) {
          setParentUpdateResult({ type: "error", message: "유효한 데이터가 없습니다. 양식을 확인해주세요." });
          return;
        }

        setIsLoading(true);
        const res = await fetch("/api/admin/students/update-parents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ students: parsed }),
        });

        const result = await res.json();
        const hasErrors = result.errors?.length > 0;
        const hasSkips = result.skips?.length > 0;
        let msg = result.message;
        if (hasSkips) {
          msg += "\n\n스킵:\n" + result.skips.map((s: any) => `- ${s.row}행 ${s.name}: ${s.message}`).join("\n");
        }
        if (hasErrors) {
          msg += "\n\n오류 사유:\n" + result.errors.map((e: any) => `- ${e.row}행 ${e.name}: ${e.error}`).join("\n");
        }
        setParentUpdateResult({ type: hasErrors && result.successCount === 0 ? "error" : "success", message: msg });
        fetchData();
      } catch (err) {
        setParentUpdateResult({ type: "error", message: `파일 읽기 오류: ${err}` });
      } finally {
        setIsLoading(false);
        if (parentUpdateFileInputRef.current) parentUpdateFileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const toggleParent = (parentId: string) => {
    if (selectedParentIds.includes(parentId)) {
      setSelectedParentIds(selectedParentIds.filter(id => id !== parentId));
    } else {
      setSelectedParentIds([...selectedParentIds, parentId]);
      setParentSearch("");
      setIsSearchOpen(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-[2.5rem] shadow-md dark:shadow-none border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="p-3 sm:p-4 bg-blue-600 rounded-3xl shadow-md shrink-0">
            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-gray-50 shrink-0">학생 관리</h1>
              <div className="hidden xl:flex gap-2 ml-2">
                <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95">
                  <Download className="w-3.5 h-3.5" /> 양식 다운로드
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                  <Upload className="w-3.5 h-3.5" /> 엑셀 대량 등록
                </button>
                <button onClick={handleExcelExport} disabled={sortedStudents.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-300 transition-all active:scale-95 disabled:opacity-40">
                  <Download className="w-3.5 h-3.5" /> 자료 엑셀 추출
                </button>
                <button onClick={() => parentUpdateFileInputRef.current?.click()} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50">
                  <Upload className="w-3.5 h-3.5" /> 학부모 일괄 수정
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">학생 정보를 등록하고 학부모 계정과 연결합니다.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 xl:hidden">
          <button onClick={downloadTemplate} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-black bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95">
            <Download className="w-3.5 h-3.5 shrink-0" /> 양식 다운로드
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-black bg-blue-600 text-white rounded-xl border-2 border-transparent hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
            <Upload className="w-3.5 h-3.5 shrink-0" /> 엑셀 대량 등록
          </button>
          <button onClick={handleExcelExport} disabled={sortedStudents.length === 0} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-black bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-xl border-2 border-transparent hover:bg-gray-700 dark:hover:bg-gray-300 transition-all active:scale-95 disabled:opacity-40">
            <Download className="w-3.5 h-3.5 shrink-0" /> 자료 엑셀 추출
          </button>
          <button onClick={() => parentUpdateFileInputRef.current?.click()} disabled={isLoading} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-black bg-purple-600 text-white rounded-xl border-2 border-transparent hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50">
            <Upload className="w-3.5 h-3.5 shrink-0" /> 학부모 일괄 수정
          </button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleExcelUpload} />
        <input type="file" ref={parentUpdateFileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleParentUpdateUpload} />
      </div>

      {/* 대량 등록 결과 */}
      {importResult && (
        <div className={`p-5 rounded-2xl border-2 flex items-start justify-between gap-4 ${importResult.type === "success" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
          <p className={`text-sm font-bold whitespace-pre-wrap ${importResult.type === "success" ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>{importResult.message}</p>
          <button onClick={() => setImportResult(null)} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* 학부모 일괄 수정 결과 */}
      {parentUpdateResult && (
        <div className={`p-5 rounded-2xl border-2 flex items-start justify-between gap-4 ${parentUpdateResult.type === "success" ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
          <div>
            <p className={`text-xs font-black uppercase tracking-widest mb-1.5 ${parentUpdateResult.type === "success" ? "text-purple-500 dark:text-purple-400" : "text-red-500 dark:text-red-400"}`}>학부모 일괄 수정 결과</p>
            <p className={`text-sm font-bold whitespace-pre-wrap ${parentUpdateResult.type === "success" ? "text-purple-800 dark:text-purple-300" : "text-red-800 dark:text-red-300"}`}>{parentUpdateResult.message}</p>
          </div>
          <button onClick={() => setParentUpdateResult(null)} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* 검색/필터 바 */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              className="pl-12 pr-10 w-full rounded-xl border-gray-200 dark:border-gray-700 bg-transparent text-base py-3 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 transition-all outline-none font-bold"
              placeholder="학생, 학급, 학부모 검색..."
              value={studentListSearch}
              onChange={(e) => setStudentListSearch(e.target.value)}
            />
            {studentListSearch && (
              <button
                onClick={() => setStudentListSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0 self-center">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 text-xs font-black transition-colors ${activeFilter === f ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                {f === 'all' ? '전체' : f === 'active' ? '활성' : '비활성'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-[11px] font-black text-gray-400 dark:text-gray-500">
            {sortedStudents.length}/{students.length}
          </span>
          {!showAddForm && (
            <button
              onClick={() => { setShowAddForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full md:w-auto px-8 py-3.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-none active:scale-95 transition-all text-base"
            >
              <UserPlus className="w-5 h-5" /> 신규 학생 등록
            </button>
          )}
        </div>
      </div>

      {/* 등록/수정 섹션 - 높이 축소 및 스타일 통일 */}
      {showAddForm && (
        <section className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-2xl border-2 border-blue-50 dark:border-blue-900/20 transition-all animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none dark:shadow-blue-900/20">
                <GraduationCap className="w-6 h-6 text-white" /> 
              </div>
              {editingStudent ? "학생 정보 수정" : "새로 등록하기"}
            </h2>
            <button onClick={resetForm} className="px-5 py-2.5 text-sm font-black bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all">
              닫기
            </button>
          </div>
          
          <form onSubmit={handleAddOrUpdateStudent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">학생 이름</label>
                <input
                  required
                  className="w-full rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 text-base font-black focus:bg-white dark:focus:bg-gray-700 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all outline-none text-gray-900 dark:text-gray-100 shadow-sm"
                  placeholder="학생 성함을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">소속 학급 (현재 활성 연도)</label>
                <select
                  className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-3.5 text-base font-black focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900 shadow-sm appearance-none"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">학급 미배정 (선택사항)</option>
                  {activeYearClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">학부모 연결 (검색 추가)</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  className="w-full pl-11 pr-10 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm font-bold focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all outline-none"
                  placeholder="성함 또는 이메일로 검색하세요..."
                  value={parentSearch}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={(e) => { setParentSearch(e.target.value); setIsSearchOpen(true); }}
                />
                {parentSearch && (
                  <button 
                    type="button"
                    onClick={() => setParentSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                {isSearchOpen && parentSearch && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    {filteredParents.length > 0 ? (
                      filteredParents.map(p => (
                        <button key={p.id} type="button" onClick={() => toggleParent(p.id)} className="w-full px-5 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 flex justify-between items-center transition-colors group border-b border-gray-50 dark:border-gray-700 last:border-0">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{p.name || "이름없음"}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{p.email}</span>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-transparent group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                        </button>
                      ))
                    ) : (
                      <div className="px-5 py-6 text-center text-gray-400 font-bold text-xs italic">결과가 없습니다.</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 min-h-[3rem] p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border-2 border-gray-50 dark:border-gray-700">
                {selectedParentsData.map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm animate-in zoom-in-95">
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300">{p.name || "이름없음"}</span>
                    <button type="button" onClick={() => toggleParent(p.id)} className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-md transition-colors"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {selectedParentsData.length === 0 && <div className="text-[11px] text-gray-300 font-bold italic w-full text-center">연결된 학부모가 없습니다.</div>}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-black rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 transition-all active:scale-95"
              >
                {isLoading ? "처리 중..." : editingStudent ? "수정 완료" : "학생 등록 완료"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 목록 */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* 모바일 카드 레이아웃 */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {sortedStudents.map((student) => (
            <div key={student.id} className={`p-4 space-y-2 ${!student.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-black text-gray-900 dark:text-gray-100">{student.name}</p>
                    {student.isPAChild && <span className="text-[9px] px-1.5 py-0.5 bg-yellow-400 text-white rounded-md font-black">PA</span>}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${student.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {student.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                  {student.class ? (
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-bold inline-block mt-1">
                      {student.class.academicYear.name} / {student.class.name}
                    </span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600 italic text-xs">미배정</span>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {student.parents.map(p => (
                      <span key={p.id} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800 text-[10px] font-black">
                        {p.name || '이름없음'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(student)}
                    title={student.isActive ? '비활성화' : '활성화'}
                    className={`p-2.5 rounded-xl transition-all active:scale-90 ${student.isActive ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100' : 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100'}`}
                  >
                    {student.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(student)}
                    className="p-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-all active:scale-90"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(student)}
                    className="p-2.5 text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-100 transition-all active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {sortedStudents.length === 0 && (
            <div className="py-16 text-center text-gray-300 font-black italic">
              검색 결과가 없습니다.
            </div>
          )}
        </div>

        {/* 데스크탑 테이블 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    학생이름 {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('class')}
                  className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    소속 학급 {sortConfig?.key === 'class' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('parents')}
                  className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    학부모 {sortConfig?.key === 'parents' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="px-8 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {sortedStudents.map((student) => (
                <tr key={student.id} className={`hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group ${!student.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-black text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {student.name}
                          {student.isPAChild && <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-yellow-400 text-white rounded-md font-black">PA</span>}
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${student.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {student.isActive ? '활성' : '비활성'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-600 dark:text-gray-400">
                      {student.class ? (
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs">
                          {student.class.academicYear.name} / {student.class.name}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 italic">미배정</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      {student.parents.map(p => (
                        <span key={p.id} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100 text-[10px] font-black">
                          {p.name || '이름없음'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleToggleActive(student)}
                        title={student.isActive ? '비활성화' : '활성화'}
                        className={`p-3 rounded-xl transition-all active:scale-90 ${student.isActive ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100' : 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100'}`}
                      >
                        {student.isActive ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleEdit(student)}
                        className="p-3 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all active:scale-90"
                      >
                        <Key className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(student)}
                        className="p-3 text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-all active:scale-90"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedStudents.length === 0 && (
            <div className="text-center py-24 text-gray-300 font-black italic text-lg">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>

      {isSearchOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-red-200 dark:border-red-800 p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400 shrink-0" />
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-50">학생 삭제 경고</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-bold mb-2">
              아래 학생 정보를 정말로 삭제하시겠습니까?
            </p>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 mb-4">
               <p className="text-red-700 dark:text-red-400 font-black text-lg text-center">
                 {deleteTarget.name}
                 {deleteTarget.class ? ` (${deleteTarget.class.name})` : ''}
               </p>
               <p className="text-xs text-red-600 dark:text-red-500 font-bold mt-2 text-center">
                 주의: 학생이 등록했던 간식 신청 및 쿠폰 구매 내역의 연결이 해제됩니다. 이 작업은 되돌릴 수 없습니다.
               </p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              삭제를 확인하려면 아래에 <span className="font-black text-red-600 dark:text-red-400">삭제</span>를 입력하세요.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="삭제"
              className="mt-1 block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-bold focus:border-red-500 dark:focus:border-red-400 focus:ring-4 focus:ring-red-50 dark:focus:ring-red-900/30 sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-800 outline-none transition-all mb-6 text-center"
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
                className="flex-1 py-3 bg-red-600 dark:bg-red-700 text-white font-black rounded-xl hover:bg-red-700 dark:hover:bg-red-800 transition-colors border-2 border-red-700 dark:border-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? "삭제 중..." : "삭제 확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
