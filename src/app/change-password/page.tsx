"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        alert("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");
        await signOut({ callbackUrl: "/login" });
      } else {
        const data = await response.json();
        setError(data.message || "비밀번호 변경 중 오류가 발생했습니다.");
      }
    } catch (err) {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white dark:bg-gray-900 p-10 shadow-xl dark:shadow-gray-950/50 border border-gray-100 dark:border-gray-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            비밀번호 변경
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            최초 로그인 시 비밀번호를 필수로 변경해야 합니다.
          </p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">새 비밀번호</label>
              <input
                type="password"
                required
                className="block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-3 px-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all sm:text-sm font-medium"
                placeholder="8자 이상 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">비밀번호 확인</label>
              <input
                type="password"
                required
                className="block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-3 px-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all sm:text-sm font-medium"
                placeholder="비밀번호 재입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center rounded-xl bg-blue-600 dark:bg-blue-500 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all shadow-lg shadow-blue-100 dark:shadow-blue-900/30 active:scale-[0.98]"
            >
              {isLoading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
