"use client";

import { useEffect, useState } from "react";
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

export default function ParentPostDetailClient({ id }: { id: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-end mb-6">
          <Link href="/parent/board" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            ← 목록으로
          </Link>
        </div>

        {loading && <div className="text-center py-12 text-gray-400">불러오는 중...</div>}
        {error && <div className="text-center py-12 text-red-500">{error}</div>}

        {post && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{post.title}</h1>
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
