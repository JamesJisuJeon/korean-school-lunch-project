"use client";

import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";

const NZ_TZ = "Pacific/Auckland";

interface Post {
  id: string;
  title: string;
  createdAt: string;
}

interface PostListProps {
  posts: Post[];
  basePath: string;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

export default function PostList({ posts, basePath, total, page, onPageChange }: PostListProps) {
  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <div className="flex items-center justify-between py-2 px-2 mb-1 border-b border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-500 dark:text-gray-400">
        <span className="flex-1">제목</span>
        <span className="shrink-0 w-24 text-right">작성일</span>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          등록된 게시글이 없습니다.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`${basePath}/${post.id}`}
                className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100 truncate flex-1 mr-4">
                  {post.title}
                </span>
                <span className="shrink-0 w-24 text-right text-sm text-gray-400 dark:text-gray-500">
                  {formatInTimeZone(new Date(post.createdAt), NZ_TZ, "yyyy.MM.dd")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
