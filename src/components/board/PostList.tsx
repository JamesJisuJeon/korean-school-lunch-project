"use client";

import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";

const NZ_TZ = "Pacific/Auckland";

interface Post {
  id: string;
  title: string;
  createdAt: string;
  published?: boolean;
}

interface PostListProps {
  posts: Post[];
  basePath: string;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onTogglePublish?: (id: string, currentPublished: boolean) => void;
  togglingIds?: Set<string>;
}

export default function PostList({ posts, basePath, total, page, onPageChange, onTogglePublish, togglingIds }: PostListProps) {
  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <div className="flex items-center justify-between py-2 px-2 mb-1 border-b border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-500 dark:text-gray-400">
        <span className="flex-1">제목</span>
        {onTogglePublish && <span className="shrink-0 w-16 text-center">공개</span>}
        <span className="shrink-0 w-24 text-right">작성일</span>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          등록된 게시글이 없습니다.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center gap-2 py-3 px-2">
              <Link
                href={`${basePath}/${post.id}`}
                className="flex-1 min-w-0 flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {onTogglePublish && (
                  <span
                    className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                      post.published
                        ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {post.published ? "공개" : "비공개"}
                  </span>
                )}
                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {post.title}
                </span>
              </Link>

              {onTogglePublish && (
                <button
                  onClick={() => onTogglePublish(post.id, post.published ?? false)}
                  disabled={togglingIds?.has(post.id)}
                  className={`shrink-0 w-16 text-xs font-medium px-2 py-1 rounded-lg transition-colors disabled:opacity-50 ${
                    post.published
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50"
                  }`}
                >
                  {togglingIds?.has(post.id) ? "..." : post.published ? "비공개" : "공개"}
                </button>
              )}

              <span className="shrink-0 w-24 text-right text-sm text-gray-400 dark:text-gray-500">
                {formatInTimeZone(new Date(post.createdAt), NZ_TZ, "yyyy.MM.dd")}
              </span>
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
