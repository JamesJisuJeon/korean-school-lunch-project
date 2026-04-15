import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { formatInTimeZone } from "date-fns-tz";
import { ko } from "date-fns/locale";
import { Utensils, IceCream, LogIn, MessageSquare, ShoppingCart } from "lucide-react";
import ThemeSelector from "@/components/ThemeSelector";
import fs from "fs";
import path from "path";

function findNoticeBg(): string | null {
  const exts = ["png", "jpg", "jpeg"];
  for (const ext of exts) {
    const filePath = path.join(process.cwd(), "public", "uploads", `notice-bg.${ext}`);
    if (fs.existsSync(filePath)) {
      const mtime = fs.statSync(filePath).mtimeMs;
      return `/uploads/notice-bg.${ext}?v=${mtime}`;
    }
  }
  return null;
}

export const dynamic = "force-dynamic";

export default async function NoticePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  const noticeBg = findNoticeBg();

  const menu = await prisma.menu.findFirst({
    where: { isPublished: true },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            동남한국학교 간식
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-black rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4" />
              로그인
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {menu ? (
          <>
            {/* 간식 날짜 */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-950 dark:text-gray-50">이번주 간식 안내</h1>
              <span className="text-xl sm:text-2xl font-black text-gray-600 dark:text-gray-300">
                {formatInTimeZone(new Date(menu.date), "Pacific/Auckland", "M월 d일 (EEE)", { locale: ko })}
              </span>
            </div>

            {/* 메뉴 카드 */}
            <div className={`grid gap-4 grid-cols-1 ${menu.specialItems ? "sm:grid-cols-2" : ""}`}>
              {menu.mainItems && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-orange-100 dark:border-orange-900 p-5 shadow-sm flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-3">
                    <Utensils className="w-4 h-4" />
                    <p className="text-xs font-black uppercase tracking-wide">간식 메뉴</p>
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-gray-100 whitespace-pre-line leading-relaxed">
                    {menu.mainItems}
                  </p>
                </div>
              )}

              {menu.specialItems && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-yellow-100 dark:border-yellow-900 p-5 shadow-sm flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-3">
                    <IceCream className="w-4 h-4" />
                    <p className="text-xs font-black uppercase tracking-wide">매점 특식 판매</p>
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-gray-100 whitespace-pre-line leading-relaxed">
                    {menu.specialItems}
                  </p>
                </div>
              )}
            </div>

            {/* 공지사항 텍스트 */}
            {menu.notice && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-blue-100 dark:border-blue-900 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
                  <MessageSquare className="w-4 h-4" />
                  <p className="text-xs font-black uppercase tracking-wide">공지사항</p>
                </div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {menu.notice}
                </p>
              </div>
            )}

            {/* 고정 배경 이미지 */}
            {noticeBg && (
              <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 aspect-[4/3]">
                <Image
                  src={noticeBg}
                  alt="공지 배경 이미지"
                  width={900}
                  height={600}
                  className="w-full h-full object-contain"
                  priority
                  unoptimized
                />
              </div>
            )}
          </>
        ) : (
          /* 게시된 메뉴 없을 때 */
          <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
            <div className="p-5 bg-orange-50 dark:bg-orange-900/20 rounded-3xl">
              <Utensils className="w-12 h-12 text-orange-300 dark:text-orange-700" />
            </div>
            <p className="text-xl font-black text-gray-700 dark:text-gray-300">
              현재 게시된 간식 정보가 없습니다
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              간식 메뉴가 등록되면 이 곳에서 확인하실 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
