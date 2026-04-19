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

export default function ParentBoardClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/board?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.data ?? []);
        setTotal(data.meta?.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">학부모회 활동 이야기</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">학부모회의 활동 소식을 확인하세요</p>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            ← 대시보드
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">불러오는 중...</div>
          ) : (
            <PostList
              posts={posts}
              basePath="/parent/board"
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
