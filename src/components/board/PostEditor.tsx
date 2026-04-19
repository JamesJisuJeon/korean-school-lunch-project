"use client";

import { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";

interface PostEditorProps {
  content: string;
  onChange: (html: string) => void;
  postId?: string;
  onImageUpload?: (url: string) => void;
}

export default function PostEditor({ content, onChange, postId, onImageUpload }: PostEditorProps) {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const initialValueRef = useRef(content);

  async function handleImageUpload(blobInfo: { blob: () => Blob; filename: () => string }): Promise<string> {
    const formData = new FormData();
    formData.append("image", blobInfo.blob(), blobInfo.filename());
    if (postId) formData.append("postId", postId);
    const res = await fetch("/api/board/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("이미지 업로드 실패");
    const data = await res.json();
    onImageUpload?.(data.url);
    return data.url;
  }

  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      licenseKey="gpl"
      onInit={(_evt, editor) => { editorRef.current = editor; }}
      initialValue={initialValueRef.current}
      onEditorChange={onChange}
      init={{
        height: 400,
        menubar: false,
        plugins: ["lists", "image", "link", "autolink", "colorpicker", "table"],
        toolbar: "bold italic underline | forecolor backcolor | fontsize | alignleft aligncenter alignright | bullist numlist | outdent indent | table | image | link",
        images_upload_handler: handleImageUpload,
        directionality: "ltr",
        convert_urls: false,
        relative_urls: false,
        document_base_url: "/",
        content_style: "body { font-family: -apple-system, sans-serif; font-size: 14px; line-height: 1.6; direction: ltr; }",
        toolbar_mode: "wrap",
        branding: false,
        resize: false,
        statusbar: false,
      }}
    />
  );
}
