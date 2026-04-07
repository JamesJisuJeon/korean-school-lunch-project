"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { UserPlus, Search, Shield, Key, Trash2, X, Download, Upload, Users, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import * as XLSX from "xlsx";

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export default function UserManagementClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [newUser, setNewUser] = useState({ name: "", email: "", roles: ["PARENT"] });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: "asc" | "desc" } | null>(null);
  const [filterRoles, setFilterRoles] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  };

  const handleSort = (key: keyof User) => {
    setSortConfig(prev =>
      prev?.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const sortedUsers = useMemo(() => {
    let list = users.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filterRoles.length > 0) {
      const roleFilters = filterRoles.filter(r => r !== "NONE");
      const noRoleFilter = filterRoles.includes("NONE");
      list = list.filter(u =>
        (noRoleFilter && u.roles.length === 0) ||
        (roleFilters.length > 0 && roleFilters.every(r => u.roles.includes(r)))
      );
    }
    if (sortConfig) {
      list = [...list].sort((a, b) => {
        const av = (a[sortConfig.key] || "").toString();
        const bv = (b[sortConfig.key] || "").toString();
        return sortConfig.direction === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return list;
  }, [users, searchTerm, sortConfig, filterRoles]);

  const SortIcon = ({ col }: { col: keyof User }) => {
    if (sortConfig?.key !== col) return <ChevronsUpDown className="w-3 h-3 ml-0.5 text-gray-400" />;
    return sortConfig.direction === "asc"
      ? <ChevronUp className="w-3 h-3 ml-0.5 text-blue-500" />
      : <ChevronDown className="w-3 h-3 ml-0.5 text-blue-500" />;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      alert("사용자가 등록되었습니다.\n초기 비밀번호: password1234");
      setNewUser({ name: "", email: "", roles: ["PARENT"] });
      setShowAddForm(false);
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.message || "등록 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingUser),
    });
    if (res.ok) {
      alert("사용자 정보가 수정되었습니다.");
      setEditingUser(null);
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.message || "수정 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`"${userName}" 사용자를 삭제하시겠습니까?`)) return;
    if (!confirm(`정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });
    if (res.ok) fetchUsers();
    else {
      const data = await res.json();
      alert(data.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  const resetPassword = async (userId: string) => {
    if (!confirm("비밀번호를 password1234로 초기화하시겠습니까?")) return;
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
    if (res.ok) alert("비밀번호가 password1234로 초기화되었습니다.");
  };

  const downloadTemplate = () => {
    const data = [
      { "이름(Name)": "홍길동", "이메일(Email)": "hong@example.com", "권한(Roles)": "PARENT" },
      { "이름(Name)": "김선생", "이메일(Email)": "kim@example.com", "권한(Roles)": "TEACHER" },
      { "이름(Name)": "이학부모선생", "이메일(Email)": "lee@example.com", "권한(Roles)": "PARENT,TEACHER" },
      { "이름(Name)": "박PA관리자", "이메일(Email)": "park@example.com", "권한(Roles)": "PA,ADMIN" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 16 }, { wch: 28 }, { wch: 24 }];
    // 안내 메모를 A6에 추가
    XLSX.utils.sheet_add_aoa(ws, [["※ 권한(Roles): PARENT / TEACHER / PA / ADMIN 중 하나 이상, 쉼표로 구분 (예: PARENT,TEACHER)"]], { origin: "A6" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "user_registration_template.xlsx");
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

        const parsed = raw.map(row => {
          const rawRoles: string = row["권한(Roles)"] || row["권한(Role)"] || row["권한"] || row["roles"] || row["role"] || "PARENT";
          const roles = String(rawRoles).split(",").map((r: string) => r.trim().toUpperCase()).filter(Boolean);
          return {
            name: row["이름(Name)"] || row["이름"] || row["name"] || "",
            email: row["이메일(Email)"] || row["이메일"] || row["email"] || "",
            roles: roles.length > 0 ? roles : ["PARENT"],
          };
        }).filter(r => r.email);

        if (parsed.length === 0) {
          setImportResult({ type: "error", message: "유효한 데이터가 없습니다. 양식을 확인해주세요." });
          return;
        }

        setIsLoading(true);
        const res = await fetch("/api/admin/users/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ users: parsed }),
        });

        const result = await res.json();
        const hasErrors = result.errors?.length > 0;
        let msg = result.message;
        if (hasErrors) {
          msg += "\n\n오류:\n" + result.errors.slice(0, 5).map((e: any) => `- ${e.email}: ${e.error}`).join("\n");
        }
        setImportResult({ type: hasErrors ? "error" : "success", message: msg });
        fetchUsers();
      } catch (err) {
        setImportResult({ type: "error", message: `파일 읽기 오류: ${err}` });
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const inputClass = "w-full rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-base font-black focus:bg-white dark:focus:bg-gray-700 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all outline-none text-gray-900 dark:text-gray-100 shadow-sm";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-[2.5rem] shadow-md dark:shadow-none border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="p-3 sm:p-4 bg-blue-600 rounded-3xl shadow-md shrink-0">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-gray-50 shrink-0">사용자 계정 및 권한 관리</h1>
              <div className="hidden xl:flex gap-2 ml-2">
                <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95">
                  <Download className="w-3.5 h-3.5" /> 양식 다운로드
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-blue-600 dark:bg-gray-700 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-gray-600 transition-all active:scale-95 disabled:opacity-50">
                  <Upload className="w-3.5 h-3.5" /> 엑셀 대량 등록
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">초기 비밀번호는 <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-blue-600 dark:text-blue-400">password1234</code> 입니다.</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 xl:hidden">
          <button onClick={downloadTemplate} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-black bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95">
            <Download className="w-4 h-4" /> 양식 다운로드
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-black bg-blue-600 dark:bg-gray-700 text-white rounded-2xl hover:bg-blue-700 dark:hover:bg-gray-600 transition-all active:scale-95 shadow-md dark:shadow-none disabled:opacity-50">
            <Upload className="w-4 h-4" /> 엑셀 대량 등록
          </button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleExcelUpload} />
      </div>

      {/* 대량 등록 결과 */}
      {importResult && (
        <div className={`p-5 rounded-2xl border-2 flex items-start justify-between gap-4 ${importResult.type === "success" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
          <p className={`text-sm font-bold whitespace-pre-wrap ${importResult.type === "success" ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>{importResult.message}</p>
          <button onClick={() => setImportResult(null)} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* 검색 + 필터 + 정렬 + 신규 등록 버튼 */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
        {/* 검색 + 등록 버튼 */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              className="pl-12 pr-10 w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-base py-3 px-4 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all outline-none font-bold text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="이름 또는 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {!showAddForm && !editingUser && (
            <button
              onClick={() => { setShowAddForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white font-black rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-blue-900/30 active:scale-95 transition-all text-sm md:text-base"
            >
              <UserPlus className="w-5 h-5" /> 신규 사용자 등록
            </button>
          )}
        </div>

        {/* 권한 필터 + 모바일 정렬 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest shrink-0">권한</span>
          <button
            onClick={() => setFilterRoles([])}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all ${
              filterRoles.length === 0
                ? "bg-gray-700 text-white border-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:border-gray-200"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
            }`}
          >
            전체
          </button>
          {["PARENT", "TEACHER", "PA", "ADMIN", "NONE"].map(role => {
            const active = filterRoles.includes(role);
            const colorActive =
              role === "ADMIN"   ? "bg-red-500 text-white border-red-500" :
              role === "PA"      ? "bg-green-500 text-white border-green-500" :
              role === "TEACHER" ? "bg-orange-500 text-white border-orange-500" :
              role === "NONE"    ? "bg-gray-500 text-white border-gray-500" :
                                   "bg-blue-500 text-white border-blue-500";
            return (
              <button
                key={role}
                onClick={() => setFilterRoles(prev => {
                  if (prev.includes(role)) return prev.filter(r => r !== role);
                  if (role === "NONE") return ["NONE"];
                  return [...prev.filter(r => r !== "NONE"), role];
                })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all ${
                  active ? colorActive : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                }`}
              >
                {role === "NONE" ? "권한없음" : role}
              </button>
            );
          })}
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 shrink-0 md:hidden" />
          <button
            onClick={() => handleSort("name")}
            className={`md:hidden flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all ${
              sortConfig?.key === "name" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
            }`}
          >
            이름 <SortIcon col="name" />
          </button>
          <button
            onClick={() => handleSort("email")}
            className={`md:hidden flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all ${
              sortConfig?.key === "email" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
            }`}
          >
            이메일 <SortIcon col="email" />
          </button>
          <span className="ml-auto text-[11px] font-black text-gray-400 dark:text-gray-500 shrink-0">
            {sortedUsers.length}/{users.length}
          </span>
        </div>
      </div>

      {/* 개별 등록/수정 폼 */}
      {(showAddForm || editingUser) && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-2xl border-2 border-blue-50 dark:border-blue-900/30 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-100 dark:shadow-blue-900/30">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <span className="text-gray-900 dark:text-gray-50">{editingUser ? "사용자 정보 수정" : "새 사용자 정보 입력"}</span>
            </h3>
            <button onClick={() => { setShowAddForm(false); setEditingUser(null); }} className="px-5 py-2.5 text-sm font-black bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
              닫기
            </button>
          </div>
          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-widest ml-1">이름</label>
                <input
                  required
                  className={inputClass}
                  placeholder="사용자 이름"
                  value={editingUser ? editingUser.name : newUser.name}
                  onChange={(e) => editingUser ? setEditingUser({ ...editingUser, name: e.target.value }) : setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-widest ml-1">이메일 (로그인 ID)</label>
                <input
                  required
                  type="email"
                  className={inputClass}
                  placeholder="example@email.com"
                  value={editingUser ? editingUser.email : newUser.email}
                  onChange={(e) => editingUser ? setEditingUser({ ...editingUser, email: e.target.value }) : setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest ml-1">부여 권한 (복수 선택 가능)</label>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
                {["PARENT", "TEACHER", "PA", "ADMIN"].map(role => (
                  <label key={role} className="inline-flex items-center gap-2 sm:gap-3 cursor-pointer group px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all">
                    <input
                      type="checkbox"
                      checked={editingUser ? editingUser.roles.includes(role) : newUser.roles.includes(role)}
                      onChange={(e) => {
                        const target = editingUser || newUser;
                        const updated = e.target.checked ? [...target.roles, role] : target.roles.filter((r: string) => r !== role);
                        editingUser ? setEditingUser({ ...editingUser, roles: updated }) : setNewUser({ ...newUser, roles: updated });
                      }}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-offset-0 focus:ring-blue-500"
                    />
                    <span className="text-sm sm:text-base font-black text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white text-lg font-black rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-600 shadow-xl shadow-blue-200 dark:shadow-blue-900/30 transition-all active:scale-95"
              >
                {isLoading ? "처리 중..." : editingUser ? "수정 완료" : "사용자 등록"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 목록 */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* 모바일 카드 레이아웃 */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {sortedUsers.map((u) => (
            <div key={u.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black text-gray-900 dark:text-gray-100">{u.name || "미지정"}</p>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                  <div className="flex gap-1.5 flex-wrap mt-1.5">
                    {u.roles.map(r => (
                      <span key={r} className={`px-2.5 py-1 text-[10px] font-black rounded-lg border tracking-tighter
                        ${r === "ADMIN" ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800" :
                          r === "PA" ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800" :
                          r === "TEACHER" ? "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800" :
                          "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800"}`}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => resetPassword(u.id)} title="비밀번호 초기화" className="p-2.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-xl hover:bg-amber-100 transition-all active:scale-90">
                    <Key className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingUser(u); setShowAddForm(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} title="정보 수정" className="p-2.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 transition-all active:scale-90">
                    <Shield className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteUser(u.id, u.name || u.email)} title="삭제" className="p-2.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl hover:bg-red-100 transition-all active:scale-90">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {sortedUsers.length === 0 && (
            <div className="py-16 text-center text-gray-300 dark:text-gray-600 font-black italic">
              {searchTerm ? "검색 결과가 없습니다." : "등록된 사용자가 없습니다."}
            </div>
          )}
        </div>

        {/* 데스크탑 테이블 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th onClick={() => handleSort("name")} className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  사용자 {sortConfig?.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("email")} className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  이메일 {sortConfig?.key === "email" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">권한</th>
                <th className="px-8 py-5 text-center text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {sortedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap text-base font-black text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {u.name || "미지정"}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-500 dark:text-gray-400">
                    {u.email}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex gap-1.5 flex-wrap">
                      {u.roles.map(r => (
                        <span key={r} className={`px-2.5 py-1 text-[10px] font-black rounded-lg border tracking-tighter
                          ${r === "ADMIN" ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800" :
                            r === "PA" ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800" :
                            r === "TEACHER" ? "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800" :
                            "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800"}`}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => resetPassword(u.id)} title="비밀번호 초기화" className="p-3 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all active:scale-90">
                        <Key className="w-5 h-5" />
                      </button>
                      <button onClick={() => { setEditingUser(u); setShowAddForm(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} title="정보 수정" className="p-3 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all active:scale-90">
                        <Shield className="w-5 h-5" />
                      </button>
                      <button onClick={() => deleteUser(u.id, u.name || u.email)} title="사용자 삭제" className="p-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-all active:scale-90">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedUsers.length === 0 && (
            <div className="text-center py-24 text-gray-300 dark:text-gray-600 font-black italic text-lg">
              {searchTerm ? "검색 결과가 없습니다." : "등록된 사용자가 없습니다."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
