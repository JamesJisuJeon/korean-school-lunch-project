"use client";

import { useEffect, useState, useMemo } from "react";
import { UserPlus, Search, Shield, Key, Mail, Trash2, X } from "lucide-react";

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

  const [newUser, setNewUser] = useState({ name: "", email: "", roles: ["PARENT"] });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  };

  const handleSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = useMemo(() => {
    let sortableUsers = [...users.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )];
    if (sortConfig !== null) {
      sortableUsers.sort((a, b) => {
        const aValue = (a[sortConfig.key] || "").toString();
        const bValue = (b[sortConfig.key] || "").toString();
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableUsers;
  }, [users, searchTerm, sortConfig]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`사용자가 등록되었습니다.\n임시 비밀번호: ${data.user.tempPassword}\n사용자에게 이 비밀번호를 안내해 주세요.`);
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

  const deleteUser = async (userId: string) => {
    if (!confirm("해당 사용자를 정말 삭제하시겠습니까? 데이터가 모두 삭제됩니다.")) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });
    if (res.ok) {
      alert("사용자가 삭제되었습니다.");
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  const resetPassword = async (userId: string) => {
    if (!confirm("해당 사용자의 비밀번호를 초기화하시겠습니까?")) return;
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      alert(`비밀번호가 초기화되었습니다.\n새 임시 비밀번호: ${data.tempPassword}\n사용자에게 이 비밀번호를 안내해 주세요.`);
    }
  };

  const inputClass = "w-full rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-base font-black focus:bg-white dark:focus:bg-gray-700 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all outline-none text-gray-900 dark:text-gray-100 shadow-sm";

  return (
    <div className="space-y-8">
      {/* 액션 바 */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            className="pl-12 pr-10 w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-base py-3 px-4 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all outline-none font-bold text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="이름 또는 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {!showAddForm && !editingUser && (
          <button
            onClick={() => { setShowAddForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="w-full md:w-auto px-8 py-3.5 bg-blue-600 dark:bg-blue-500 text-white font-black rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-blue-900/30 active:scale-95 transition-all text-base"
          >
            <UserPlus className="w-5 h-5" /> 신규 사용자 등록
          </button>
        )}
      </div>

      {/* 가입/수정 폼 */}
      {(showAddForm || editingUser) && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-2xl border-2 border-blue-50 dark:border-blue-900/30 transition-all animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-100 dark:shadow-blue-900/30">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <span className="text-gray-900 dark:text-gray-50">{editingUser ? "사용자 정보 수정" : "새 사용자 정보 입력"}</span>
            </h3>
            <button
              onClick={() => { setShowAddForm(false); setEditingUser(null); }}
              className="px-5 py-2.5 text-sm font-black bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
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
                  placeholder="사용자 이름을 입력하세요"
                  value={editingUser ? editingUser.name : newUser.name}
                  onChange={(e) => editingUser
                    ? setEditingUser({...editingUser, name: e.target.value})
                    : setNewUser({...newUser, name: e.target.value})
                  }
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
                  onChange={(e) => editingUser
                    ? setEditingUser({...editingUser, email: e.target.value})
                    : setNewUser({...newUser, email: e.target.value})
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest ml-1">부여 권한 (복수 선택 가능)</label>
              <div className="flex flex-wrap gap-4 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
                {["PARENT", "TEACHER", "PA", "ADMIN"].map(role => (
                  <label key={role} className="inline-flex items-center gap-3 cursor-pointer group px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all">
                    <input
                      type="checkbox"
                      checked={editingUser ? editingUser.roles.includes(role) : newUser.roles.includes(role)}
                      onChange={(e) => {
                        const targetUser = editingUser || newUser;
                        const newRoles = e.target.checked
                          ? [...targetUser.roles, role]
                          : targetUser.roles.filter((r: string) => r !== role);
                        if (editingUser) setEditingUser({...editingUser, roles: newRoles});
                        else setNewUser({...newUser, roles: newRoles});
                      }}
                      className="w-6 h-6 rounded-lg text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-offset-0 focus:ring-blue-500 transition-all"
                    />
                    <span className="text-base font-black text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 tracking-tight">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white text-lg font-black rounded-2xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-600 shadow-xl shadow-blue-200 dark:shadow-blue-900/30 transition-all active:scale-95"
              >
                {isLoading ? "처리 중..." : editingUser ? "사용자 정보 수정 완료" : "사용자 생성 및 비밀번호 발급"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 목록 테이블 */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  사용자 {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('email')}
                  className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  이메일 {sortConfig?.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">권한</th>
                <th className="px-8 py-5 text-center text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {sortedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-base font-black text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {u.name || "미지정"}
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-tight">{u.email}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      {u.roles.map(r => (
                        <span key={r} className={`px-2.5 py-1 text-[10px] font-black rounded-lg border tracking-tighter
                          ${r === 'ADMIN' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800' :
                            r === 'PA' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800' :
                            r === 'TEACHER' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800' :
                            'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'}`}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => resetPassword(u.id)}
                        title="비밀번호 초기화"
                        className="p-3 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all active:scale-90"
                      >
                        <Key className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => { setEditingUser(u); setShowAddForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        title="정보 수정"
                        className="p-3 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all active:scale-90"
                      >
                        <Shield className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        title="사용자 삭제"
                        className="p-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-all active:scale-90"
                      >
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
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
