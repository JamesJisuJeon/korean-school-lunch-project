"use client";

import { useEffect, useState } from "react";
import PostList from "@/components/board/PostList";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  createdAt: string;
  author: { name: string | null };
}

export default function SpaBoardClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  function fetchPosts(p: number) {
    setLoading(true);
    fetch(`/api/board?page=${p}`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.data ?? []);
        setTotal(data.meta?.total ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">학부모회 활동 관리</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">활동 기록을 작성하고 관리하세요</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              ← 대시보드
            </Link>
            <Link
              href="/spa/board/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              새 글 쓰기
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">불러오는 중...</div>
          ) : (
            <PostList
              posts={posts}
              basePath="/spa/board"
              total={total}
              page={page}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
