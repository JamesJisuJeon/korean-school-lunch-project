"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import dynamic from "next/dynamic";

const PostViewer = dynamic(() => import("@/components/board/PostViewer"), { ssr: false });

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { name: string | null };
}

export default function SpaPostDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/board/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPost(data.data);
        else setError(data.error ?? "게시글을 불러올 수 없습니다.");
      })
      .catch(() => setError("게시글을 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return;
    setDeleting(true);
    const res = await fetch(`/api/board/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/spa/board");
      router.refresh();
    } else {
      setDeleting(false);
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-end mb-6">
          <Link href="/spa/board" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            ← 목록으로
          </Link>
        </div>

        {loading && <div className="text-center py-12 text-gray-400">불러오는 중...</div>}
        {error && <div className="text-center py-12 text-red-500">{error}</div>}

        {post && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">{post.title}</h1>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <Link
                  href={`/spa/board/${id}/edit`}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  수정
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-400 dark:text-gray-500 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              {formatInTimeZone(new Date(post.createdAt), "Pacific/Auckland", "yyyy년 M월 d일")}
            </div>

            <PostViewer content={post.content} />
          </div>
        )}
      </div>
    </div>
  );
}
