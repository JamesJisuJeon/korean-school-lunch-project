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
  available: boolean | null;
  task: string | null;
}

type FilterType = "all" | "available" | "unavailable" | "unanswered" | "me";
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
  { value: "available", label: "가능" },
  { value: "unavailable", label: "불가능" },
  { value: "unanswered", label: "미응답" },
  { value: "me", label: "나" },
];

function AvailableBadge({ available }: { available: boolean | null }) {
  if (available === true) {
    return (
      <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-sm font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
        가능
      </span>
    );
  }
  if (available === false) {
    return (
      <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
        불가능
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
      미응답
    </span>
  );
}

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
        if (data.length > 0) {
          const published = data.find((m: Menu) => m.isPublished);
          setSelectedMenuId(published ? published.id : data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const fetchVolunteers = useCallback((menuId: string) => {
    if (!menuId) return;
    setLoading(true);
    fetch(`/api/pa/volunteer?menuId=${menuId}`)
      .then((r) => r.json())
      .then((data: VolunteerRow[]) => {
        if (!Array.isArray(data)) return;
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
    if (filter === "available") list = list.filter((v) => v.available === true);
    else if (filter === "unavailable") list = list.filter((v) => v.available === false);
    else if (filter === "unanswered") list = list.filter((v) => v.available === null);
    else if (filter === "me") list = list.filter((v) => v.userId === userId);
    list.sort((a, b) => {
      const na = a.name || a.email;
      const nb = b.name || b.email;
      const cmp = na.localeCompare(nb, "ko");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [volunteers, filter, sortDir, userId]);

  async function setAvailable(targetUserId: string, value: boolean | null) {
    if (targetUserId !== userId) return;
    const prev = volunteers.find((v) => v.userId === targetUserId)?.available ?? null;
    setToggling((s) => new Set(s).add(targetUserId));
    setVolunteers((vs) =>
      vs.map((v) => (v.userId === targetUserId ? { ...v, available: value } : v))
    );
    try {
      const res = await fetch("/api/pa/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId: selectedMenuId, available: value }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setVolunteers((vs) =>
        vs.map((v) => (v.userId === targetUserId ? { ...v, available: prev } : v))
      );
    } finally {
      setToggling((s) => { const n = new Set(s); n.delete(targetUserId); return n; });
    }
  }

  async function saveTask(targetUserId: string) {
    if (!isSpa) return;
    const row = volunteers.find((v) => v.userId === targetUserId);
    if (row?.available !== true) return;
    const task = taskDrafts[targetUserId] ?? "";
    setSavingTask((s) => new Set(s).add(targetUserId));
    try {
      await fetch("/api/pa/volunteer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId: selectedMenuId, userId: targetUserId, task }),
      });
      setVolunteers((vs) =>
        vs.map((v) => (v.userId === targetUserId ? { ...v, task: task || null } : v))
      );
    } catch {
      setTaskDrafts((prev) => ({
        ...prev,
        [targetUserId]: volunteers.find((v) => v.userId === targetUserId)?.task ?? "",
      }));
    } finally {
      setSavingTask((s) => { const n = new Set(s); n.delete(targetUserId); return n; });
    }
  }

  const availableCount = volunteers.filter((v) => v.available === true).length;
  const unavailableCount = volunteers.filter((v) => v.available === false).length;
  const unansweredCount = volunteers.filter((v) => v.available === null).length;

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
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    가능{" "}
                    <span className="font-bold text-green-600 dark:text-green-400">{availableCount}</span>
                    명
                  </span>
                  <span>
                    불가능{" "}
                    <span className="font-bold text-red-500 dark:text-red-400">{unavailableCount}</span>
                    명
                  </span>
                  <span>
                    미응답{" "}
                    <span className="font-bold text-gray-500 dark:text-gray-400">{unansweredCount}</span>
                    명
                  </span>
                  <span>전체 {volunteers.length}명</span>
                </div>
              )}
            </div>

            {/* 필터 + 정렬 */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                      filter === opt.value
                        ? "bg-green-500 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                  const canEditTask = isSpa && v.available === true;

                  return (
                    <li
                      key={v.userId}
                      className={`px-5 py-4 transition-colors ${
                        v.available === true ? "bg-green-50 dark:bg-green-900/10" : ""
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
                        {isMe ? (
                          <select
                            value={v.available === null ? "" : String(v.available)}
                            onChange={(e) => {
                              const val =
                                e.target.value === "" ? null : e.target.value === "true";
                              setAvailable(v.userId, val);
                            }}
                            disabled={isTogglingRow}
                            className={`px-2.5 py-1.5 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 ${
                              v.available === true
                                ? "bg-green-500 border-green-500 text-white"
                                : v.available === false
                                ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            <option value="">미응답</option>
                            <option value="true">가능</option>
                            <option value="false">불가능</option>
                          </select>
                        ) : (
                          <AvailableBadge available={v.available} />
                        )}
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
                      ) : v.available === true ? (
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
                      <th className="px-5 py-3 text-center font-semibold text-gray-600 dark:text-gray-400 w-36">
                        봉사 가능여부
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
                      const canEditTask = isSpa && v.available === true;

                      return (
                        <tr
                          key={v.userId}
                          className={`transition-colors ${
                            v.available === true
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
                            {isMe ? (
                              <select
                                value={v.available === null ? "" : String(v.available)}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === "" ? null : e.target.value === "true";
                                  setAvailable(v.userId, val);
                                }}
                                disabled={isTogglingRow}
                                className={`px-2.5 py-1.5 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 ${
                                  v.available === true
                                    ? "bg-green-500 border-green-500 text-white"
                                    : v.available === false
                                    ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                                    : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                <option value="">미응답</option>
                                <option value="true">가능</option>
                                <option value="false">불가능</option>
                              </select>
                            ) : (
                              <AvailableBadge available={v.available} />
                            )}
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
                                    {v.available === true ? "미정" : "—"}
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
