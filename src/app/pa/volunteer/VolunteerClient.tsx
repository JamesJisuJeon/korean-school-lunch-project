"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Calendar, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";

interface Menu {
  id: string;
  date: string;
  isPublished: boolean;
}

interface VolunteerRow {
  userId: string;
  name: string | null;
  email: string;
  roles: string[];
  available: boolean;
  task: string | null;
}

type FilterType = "all" | "available" | "unavailable" | "me";
type SortDir = "asc" | "desc";

interface Props {
  userId: string;
  isSpa: boolean;
}

function formatDate(dateStr: string) {
  return formatInTimeZone(new Date(dateStr), "Pacific/Auckland", "yyyy.MM.dd (EEE)");
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "available", label: "봉사 가능" },
  { value: "unavailable", label: "미응답" },
  { value: "me", label: "나" },
];

export default function VolunteerClient({ userId, isSpa }: Props) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [savingTask, setSavingTask] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    fetch("/api/pa/menu")
      .then((r) => r.json())
      .then((data: Menu[]) => {
        setMenus(data);
        if (data.length > 0) setSelectedMenuId(data[0].id);
      })
      .catch(() => {});
  }, []);

  const fetchVolunteers = useCallback((menuId: string) => {
    if (!menuId) return;
    setLoading(true);
    fetch(`/api/pa/volunteer?menuId=${menuId}`)
      .then((r) => r.json())
      .then((data: VolunteerRow[]) => {
        setVolunteers(data);
        const drafts: Record<string, string> = {};
        data.forEach((v) => { drafts[v.userId] = v.task ?? ""; });
        setTaskDrafts(drafts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchVolunteers(selectedMenuId);
  }, [selectedMenuId, fetchVolunteers]);

  const displayedVolunteers = useMemo(() => {
    let list = [...volunteers];
    if (filter === "available") list = list.filter((v) => v.available);
    else if (filter === "unavailable") list = list.filter((v) => !v.available);
    else if (filter === "me") list = list.filter((v) => v.userId === userId);
    list.sort((a, b) => {
      const na = a.name || a.email;
      const nb = b.name || b.email;
      const cmp = na.localeCompare(nb, "ko");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [volunteers, filter, sortDir]);

  async function toggleAvailable(targetUserId: string, current: boolean) {
    if (targetUserId !== userId) return;
    const next = !current;
    setToggling((prev) => new Set(prev).add(targetUserId));
    setVolunteers((prev) =>
      prev.map((v) => (v.userId === targetUserId ? { ...v, available: next } : v))
    );
    try {
      const res = await fetch("/api/pa/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId: selectedMenuId, available: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setVolunteers((prev) =>
        prev.map((v) => (v.userId === targetUserId ? { ...v, available: current } : v))
      );
    } finally {
      setToggling((prev) => { const s = new Set(prev); s.delete(targetUserId); return s; });
    }
  }

  async function saveTask(targetUserId: string) {
    if (!isSpa) return;
    const row = volunteers.find((v) => v.userId === targetUserId);
    if (!row?.available) return;
    const task = taskDrafts[targetUserId] ?? "";
    setSavingTask((prev) => new Set(prev).add(targetUserId));
    try {
      await fetch("/api/pa/volunteer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId: selectedMenuId, userId: targetUserId, task }),
      });
      setVolunteers((prev) =>
        prev.map((v) => (v.userId === targetUserId ? { ...v, task: task || null } : v))
      );
    } catch {
      setTaskDrafts((prev) => ({
        ...prev,
        [targetUserId]: volunteers.find((v) => v.userId === targetUserId)?.task ?? "",
      }));
    } finally {
      setSavingTask((prev) => { const s = new Set(prev); s.delete(targetUserId); return s; });
    }
  }

  const availableCount = volunteers.filter((v) => v.available).length;

  return (
    <div className="space-y-4">
      {/* 메뉴 선택 */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">간식 날짜 선택</span>
        </div>
        <select
          value={selectedMenuId}
          onChange={(e) => setSelectedMenuId(e.target.value)}
          className="w-full sm:w-72 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">날짜를 선택하세요</option>
          {menus.map((m) => (
            <option key={m.id} value={m.id}>
              {formatDate(m.date)}
              {m.isPublished ? " (공개)" : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedMenuId && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* 헤더 */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  학부모회원 봉사 현황
                </span>
                <button
                  onClick={() => fetchVolunteers(selectedMenuId)}
                  disabled={loading}
                  className="p-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="새로고침"
                >
                  <RefreshCw className={`w-4 h-4 transition-transform ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              {!loading && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  봉사 가능{" "}
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {availableCount}
                  </span>
                  명 / 전체 {volunteers.length}명
                </span>
              )}
            </div>

            {/* 필터 + 정렬 */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 필터 버튼 */}
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      filter === opt.value
                        ? "bg-green-500 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* 이름 정렬 버튼 */}
              <button
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {sortDir === "asc" ? (
                  <ArrowUp className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5" />
                )}
                이름
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <span className="animate-pulse">불러오는 중...</span>
            </div>
          ) : displayedVolunteers.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              {filter !== "all" ? "해당하는 회원이 없습니다." : "등록된 학부모회원이 없습니다."}
            </div>
          ) : (
            <>
              {/* 모바일: 카드 리스트 */}
              <ul className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {displayedVolunteers.map((v) => {
                  const isMe = v.userId === userId;
                  const isTogglingRow = toggling.has(v.userId);
                  const isSavingRow = savingTask.has(v.userId);
                  const canEditTask = isSpa && v.available;

                  return (
                    <li
                      key={v.userId}
                      className={`px-5 py-4 transition-colors ${
                        v.available ? "bg-green-50 dark:bg-green-900/10" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {v.name || v.email}
                          </span>
                          {isMe && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                              나
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => isMe && !isTogglingRow && toggleAvailable(v.userId, v.available)}
                          disabled={!isMe || isTogglingRow}
                          title={isMe ? "탭하여 변경" : "본인만 변경할 수 있습니다"}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            v.available
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          } ${isMe ? "active:scale-95" : "opacity-60 cursor-not-allowed"} ${
                            isTogglingRow ? "opacity-50" : ""
                          }`}
                        >
                          {v.available ? "봉사 가능" : "미응답"}
                        </button>
                      </div>
                      {canEditTask ? (
                        <textarea
                          ref={(el) => {
                            if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
                          }}
                          rows={1}
                          value={taskDrafts[v.userId] ?? ""}
                          onChange={(e) => {
                            setTaskDrafts((prev) => ({ ...prev, [v.userId]: e.target.value }));
                            e.target.style.height = "auto";
                            e.target.style.height = e.target.scrollHeight + "px";
                          }}
                          onBlur={() => saveTask(v.userId)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && e.currentTarget.blur()}
                          disabled={isSavingRow}
                          placeholder="담당업무 입력..."
                          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 resize-none overflow-hidden leading-relaxed"
                        />
                      ) : v.task ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 break-words whitespace-pre-wrap">
                          {v.task}
                        </p>
                      ) : v.available ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500">담당업무 미정</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              {/* 데스크탑: 테이블 */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/60">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                        이름
                      </th>
                      <th className="px-5 py-3 text-center font-semibold text-gray-600 dark:text-gray-400 w-32">
                        봉사 가능
                      </th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                        담당업무
                        {isSpa && (
                          <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                            (Enter 또는 포커스 이탈 시 저장)
                          </span>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {displayedVolunteers.map((v) => {
                      const isMe = v.userId === userId;
                      const isTogglingRow = toggling.has(v.userId);
                      const isSavingRow = savingTask.has(v.userId);
                      const canEditTask = isSpa && v.available;

                      return (
                        <tr
                          key={v.userId}
                          className={`transition-colors ${
                            v.available
                              ? "bg-green-50 dark:bg-green-900/10"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                          }`}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {v.name || v.email}
                              </span>
                              {isMe && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                                  나
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => isMe && !isTogglingRow && toggleAvailable(v.userId, v.available)}
                              disabled={!isMe || isTogglingRow}
                              title={isMe ? "클릭하여 변경" : "본인만 변경할 수 있습니다"}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                                isMe ? "cursor-pointer hover:scale-110" : "cursor-not-allowed opacity-60"
                              } ${isTogglingRow ? "opacity-50" : ""}`}
                            >
                              <span
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  v.available
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                }`}
                              >
                                {v.available && (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            {canEditTask ? (
                              <textarea
                                ref={(el) => {
                                  if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
                                }}
                                rows={1}
                                value={taskDrafts[v.userId] ?? ""}
                                onChange={(e) => {
                                  setTaskDrafts((prev) => ({ ...prev, [v.userId]: e.target.value }));
                                  e.target.style.height = "auto";
                                  e.target.style.height = e.target.scrollHeight + "px";
                                }}
                                onBlur={() => saveTask(v.userId)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && e.currentTarget.blur()}
                                disabled={isSavingRow}
                                placeholder="담당업무 입력..."
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 resize-none overflow-hidden leading-relaxed"
                              />
                            ) : (
                              <span className="text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap">
                                {v.task || (
                                  <span className="text-gray-400 dark:text-gray-500 text-xs">
                                    {v.available ? "미정" : "—"}
                                  </span>
                                )}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
