"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Hash, Image as ImageIcon, Loader2, Briefcase, Factory, Cpu, Plus, FileText, LayoutList, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUpload: (files: File[], tags: string, linkData?: { title: string; url: string }) => Promise<void>;
  loading: boolean;
  existingProjects: string[];
  existingHashtags: string[];
}

const CATEGORIES = [
  { id: "project", label: "Dự án", icon: Briefcase },
  { id: "factory", label: "Nhà máy HGPT", icon: Factory },
  { id: "machine", label: "MMTB - Công nghệ", icon: Cpu },
  { id: "process", label: "Quy trình", icon: LayoutList },
  { id: "document", label: "Docs / Tải về", icon: FileText },
  { id: "other", label: "Khác", icon: ImageIcon },
];

export function UploadZone({ onUpload, loading, existingProjects, existingHashtags }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("project");
  const [projectName, setProjectName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
  const [externalUrl, setExternalUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Toggle for expanded view
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredSuggestions = useMemo(() => {
    const input = tagInput.toLowerCase().replace("#", "");
    if (!input) return existingHashtags.filter(h => !tags.includes(h)).slice(0, 5);
    return existingHashtags
      .filter(h => h.toLowerCase().includes(input) && !tags.includes(h))
      .slice(0, 10);
  }, [tagInput, existingHashtags, tags]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
      setIsExpanded(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        setSelectedFiles(prev => [...prev, ...files]);
        setIsExpanded(true);
      } else {
        toast.error("Vui lòng chọn file");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
      setIsExpanded(true);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length === 1) {
      setIsExpanded(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().replace(/^#/, "");
    if (!trimmed) return;

    const cleanTag = `#${trimmed}`;
    if (!tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput("");
    // Re-focus to keep suggestions active
    tagInputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " " || e.key === ",") && tagInput) {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleLinkAdd = async () => {
    if (!externalUrl || !linkTitle) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và đường dẫn!");
      return;
    }

    // Ensure URL has a protocol to avoid relative path 404s
    let finalUrl = externalUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    const tagsString = [
      `c:${category}`,
      projectName ? `p:${projectName.trim()}` : "",
      ...tags
    ].filter(Boolean).join(", ");

    try {
      await onUpload([], tagsString, { title: linkTitle, url: finalUrl });
      setExternalUrl("");
      setLinkTitle("");
      setTags([]);
      setProjectName("");
      toast.success("Đã thêm tài liệu thành công!");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thêm link!");
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const finalTags = [
      `c:${category}`,
      projectName ? `p:${projectName.trim()}` : "",
      ...tags
    ].filter(Boolean).join(", ");

    await onUpload(selectedFiles, finalTags);

    // Reset after success
    setSelectedFiles([]);
    setProjectName("");
    setTags([]);
    setTagInput("");
    setIsExpanded(false);
  };

  return (
    <div className={cn(
      "w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl transition-all overflow-hidden",
      !isExpanded ? "w-fit ml-auto" : "w-full shadow-2xl"
    )}>
      {/* Compact Header Bar */}
      <div
        className={cn(
          "flex items-center gap-3 cursor-pointer transition-colors px-4 py-2.5",
          !isExpanded ? "hover:bg-blue-50 dark:hover:bg-blue-900/20" : "bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={cn(
          "p-2 rounded-xl transition-colors",
          !isExpanded ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
        )}>
          <Upload size={16} />
        </div>

        {isExpanded ? (
          <div className="flex-1 min-w-[200px]">
            <h3 className="font-black text-xs uppercase tracking-tight">Upload Media</h3>
            <p className="text-[10px] text-zinc-500">{selectedFiles.length} file đã chọn</p>
          </div>
        ) : (
          <span className="text-xs font-black text-blue-600 pr-2">Tải lên</span>
        )}

        {isExpanded && (
          <button className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <X size={14} className="text-zinc-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-100 dark:border-zinc-800"
          >
            <div className="p-4 space-y-4">
              {/* 1. Category Selection (Always First) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">1. Phân loại nội dung</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id);
                        if (cat.id === "document") {
                          setUploadMode("link");
                        } else {
                          setUploadMode("file");
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                        category === cat.id
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400"
                      )}
                    >
                      <cat.icon size={14} /> {cat.label}
                    </button>
                  ))}
                </div>
              </div>


              {/* 3. Content Input (File or Link) */}
              {uploadMode === "file" ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "relative rounded-xl border-2 border-dashed transition-all p-4",
                    dragActive ? "border-blue-500 bg-blue-50/50" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30"
                  )}
                >
                  <input ref={inputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple onChange={handleChange} className="hidden" />

                  {selectedFiles.length === 0 ? (
                    <div className="py-6 text-center cursor-pointer" onClick={() => inputRef.current?.click()}>
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Click hoặc kéo thả nhiều ảnh/tài liệu vào đây</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500">{selectedFiles.length} file đã chọn</span>
                        <button onClick={() => inputRef.current?.click()} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline">
                          <Plus size={12} /> Thêm ảnh
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
                            {file.type.startsWith("image/") ? (
                              <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-blue-500">
                                <FileText size={24} />
                                <span className="text-[8px] truncate px-1 mt-1 font-bold w-full text-center">
                                  {file.name.split('.').pop()?.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <button onClick={() => removeFile(idx)} className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tiêu đề tài liệu</label>
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="VD: Company Profile 2024"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Link Google Drive</label>
                    <input
                      type="text"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* 4. Common Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tên dự án</label>
                  <input
                    type="text"
                    list="projects-list-up"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="VD: VinFast..."
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                  <datalist id="projects-list-up">
                    {existingProjects.map((p, i) => <option key={i} value={p} />)}
                  </datalist>
                </div>

                <div className="md:col-span-7 space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Hashtags</label>
                  <div className="relative">
                    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-lg min-h-[38px]">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-[10px] font-bold border border-blue-200/50">
                          {tag}
                          <button onClick={() => removeTag(tag)}><X size={10} /></button>
                        </span>
                      ))}
                      <input
                        ref={tagInputRef}
                        type="text"
                        value={tagInput}
                        onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true); }}
                        onFocus={() => setShowTagSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Gõ tag..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-xs outline-none min-w-[80px]"
                      />
                    </div>

                    {/* Suggestion Dropdown */}
                    {showTagSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                        <div className="p-1.5 flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                          {filteredSuggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (!tags.includes(s)) setTags([...tags, s]);
                                setTagInput("");
                                setShowTagSuggestions(false);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 rounded-lg text-[10px] font-bold transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                            >
                              <Hash size={9} strokeWidth={3} />{s.replace("#", "")}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Submit Button */}
              <button
                disabled={loading || (uploadMode === "file" ? selectedFiles.length === 0 : !externalUrl)}
                onClick={uploadMode === "file" ? handleUpload : handleLinkAdd}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-3",
                  loading
                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span className="uppercase tracking-widest">Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    {uploadMode === "file" ? <Upload size={18} /> : <Plus size={18} />}
                    <span className="uppercase tracking-widest">
                      {uploadMode === "file" ? `Upload ${selectedFiles.length} file` : "Thêm tài liệu Drive"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
