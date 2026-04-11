"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-gray-900 p-10 shadow-xl dark:shadow-gray-950/50 border border-gray-100 dark:border-gray-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            동남한국학교
          </h2>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            간식관리 시스템
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">계정 정보를 입력하여 로그인하세요</p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">이메일 주소</label>
              <input
                type="email"
                required
                className="block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-3 px-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all sm:text-sm font-medium"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">비밀번호</label>
              <input
                type="password"
                required
                className="block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-3 px-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all sm:text-sm font-medium"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex justify-center rounded-xl bg-blue-600 dark:bg-blue-500 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all shadow-lg shadow-blue-100 dark:shadow-blue-900/30 active:scale-[0.98]"
            >
              로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
