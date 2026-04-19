"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const PostEditor = dynamic(() => import("@/components/board/PostEditor"), { ssr: false });

interface SpaPostFormClientProps {
  initialTitle?: string;
  initialContent?: string;
  postId?: string;
}

export default function SpaPostFormClient({ initialTitle = "", initialContent = "", postId }: SpaPostFormClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const uploadedImages = useRef<string[]>([]);

  const isEdit = !!postId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setSaving(true);
    setError("");

    const url = isEdit ? `/api/board/${postId}` : "/api/board";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, uploadedImages: uploadedImages.current }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "저장에 실패했습니다.");
      return;
    }

    router.push("/spa/board");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "활동 기록 수정" : "새 활동 기록 작성"}
          </h1>
          <button
            type="button"
            onClick={() => router.push("/spa/board")}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ← 취소
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full px-4 py-3 text-lg font-medium border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <PostEditor
            content={content}
            onChange={setContent}
            postId={postId}
            onImageUpload={(url) => { uploadedImages.current = [...uploadedImages.current, url]; }}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {saving ? "저장 중..." : isEdit ? "수정 완료" : "등록하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
