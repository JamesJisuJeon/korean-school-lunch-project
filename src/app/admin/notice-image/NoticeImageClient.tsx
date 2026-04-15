"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, ImageIcon } from "lucide-react";

interface NoticeImageClientProps {
  currentImage: string | null;
}

export default function NoticeImageClient({ currentImage }: NoticeImageClientProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/admin/notice-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (res.ok) {
      setMessage({ type: "success", text: "공지 이미지가 변경되었습니다." });
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    } else {
      setMessage({ type: "error", text: data.error ?? "업로드에 실패했습니다." });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">공지 이미지 변경</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          새 이미지를 등록하면 기존 이미지는 날짜/시간이 붙은 파일명으로 백업됩니다.
        </p>
      </div>

      {/* 현재 이미지 */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
        <p className="text-sm font-black text-gray-700 dark:text-gray-300">현재 공지 이미지</p>
        {currentImage ? (
          <div className="rounded-xl overflow-hidden aspect-[4/3] border border-gray-100 dark:border-gray-800">
            <Image
              src={currentImage}
              alt="현재 공지 이미지"
              width={900}
              height={600}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <ImageIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-400 dark:text-gray-500">등록된 이미지가 없습니다</p>
          </div>
        )}
      </div>

      {/* 업로드 폼 */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
        <p className="text-sm font-black text-gray-700 dark:text-gray-300">새 이미지 등록</p>

        {/* 파일 선택 */}
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer py-10"
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <div className="w-full px-4 aspect-[4/3]">
              <img src={preview} alt="미리보기" className="w-full h-full object-contain rounded-lg" />
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">클릭하여 이미지 선택</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">png, jpg, jpeg</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800"
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white disabled:text-gray-400 dark:disabled:text-gray-500 font-black text-sm transition-colors"
        >
          {uploading ? "업로드 중..." : "이미지 변경"}
        </button>
      </form>
    </div>
  );
}
