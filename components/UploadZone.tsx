"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Hash, Image as ImageIcon, Loader2, Briefcase, Factory, Cpu, Plus, FileText, LayoutList, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Deterministic multicolor palette (same logic as Sidebar)
const TAG_PALETTES = [
  { bg: "bg-rose-100 dark:bg-rose-950/50",    border: "border-rose-200 dark:border-rose-800/50",    text: "text-rose-700 dark:text-rose-400"    },
  { bg: "bg-orange-100 dark:bg-orange-950/50", border: "border-orange-200 dark:border-orange-800/50", text: "text-orange-700 dark:text-orange-400" },
  { bg: "bg-amber-100 dark:bg-amber-950/50",  border: "border-amber-200 dark:border-amber-800/50",  text: "text-amber-700 dark:text-amber-400"  },
  { bg: "bg-emerald-100 dark:bg-emerald-950/50", border: "border-emerald-200 dark:border-emerald-800/50", text: "text-emerald-700 dark:text-emerald-400" },
  { bg: "bg-teal-100 dark:bg-teal-950/50",    border: "border-teal-200 dark:border-teal-800/50",    text: "text-teal-700 dark:text-teal-400"    },
  { bg: "bg-cyan-100 dark:bg-cyan-950/50",    border: "border-cyan-200 dark:border-cyan-800/50",    text: "text-cyan-700 dark:text-cyan-400"    },
  { bg: "bg-blue-100 dark:bg-blue-950/50",    border: "border-blue-200 dark:border-blue-800/50",    text: "text-blue-700 dark:text-blue-400"    },
  { bg: "bg-violet-100 dark:bg-violet-950/50", border: "border-violet-200 dark:border-violet-800/50", text: "text-violet-700 dark:text-violet-400" },
  { bg: "bg-fuchsia-100 dark:bg-fuchsia-950/50", border: "border-fuchsia-200 dark:border-fuchsia-800/50", text: "text-fuchsia-700 dark:text-fuchsia-400" },
  { bg: "bg-pink-100 dark:bg-pink-950/50",    border: "border-pink-200 dark:border-pink-800/50",    text: "text-pink-700 dark:text-pink-400"    },
];

function getTagPalette(tag: string) {
  let hash = 0;
  const str = tag.replace(/^#/, "");
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return TAG_PALETTES[hash % TAG_PALETTES.length];
}

interface UploadZoneProps {
  onUpload: (files: File[], tags: string, linkData?: { title: string; url: string }) => Promise<void>;
  loading: boolean;
  existingProjects: string[];
  existingHashtags: string[];
  isMobileMode?: boolean;
}

const CATEGORIES = [
  { id: "project", label: "Dự án", icon: Briefcase },
  { id: "factory", label: "Nhà máy HGPT", icon: Factory },
  { id: "machine", label: "MMTB - Công nghệ", icon: Cpu },
  { id: "process", label: "Quy trình", icon: LayoutList },
  { id: "document", label: "Docs / Tải về", icon: FileText },
  { id: "video", label: "Clip Ngắn 🎬", icon: PlayCircle },
  { id: "other", label: "Khác", icon: ImageIcon },
];

export function UploadZone({ onUpload, loading, existingProjects, existingHashtags, isMobileMode }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("project");
  const [projectName, setProjectName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
  const [externalUrl, setExternalUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isNewProject = useMemo(() => {
    if (!projectName.trim()) return false;
    return !existingProjects.some(p => p.toLowerCase() === projectName.trim().toLowerCase());
  }, [projectName, existingProjects]);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowTagSuggestions(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
      setIsOpen(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
      setIsOpen(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      setIsOpen(true);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().replace(/^#/, "");
    if (!trimmed) return;
    const cleanTag = `#${trimmed}`;
    if (!tags.includes(cleanTag)) setTags([...tags, cleanTag]);
    setTagInput("");
    tagInputRef.current?.focus();
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " " || e.key === ",") && tagInput) {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const buildTagsString = () =>
    [
      `c:${category}`,
      projectName ? `p:${projectName.trim()}` : "",
      tagInput.trim() || "",
      ...tags,
    ].filter(Boolean).join(", ");

  const handleLinkAdd = async () => {
    if (!externalUrl || !linkTitle) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và đường dẫn!");
      return;
    }
    let finalUrl = externalUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    try {
      await onUpload([], buildTagsString(), { title: linkTitle, url: finalUrl });
      setExternalUrl(""); setLinkTitle(""); setTags([]); setProjectName("");
      toast.success("Đã thêm tài liệu thành công!");
    } catch {
      toast.error("Có lỗi xảy ra khi thêm link!");
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    await onUpload(selectedFiles, buildTagsString());
    setSelectedFiles([]); setProjectName(""); setTags([]); setTagInput(""); setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", isMobileMode && "w-full h-full")}>
      {/* ── Trigger Button ── */}
      {!isMobileMode && (
        <button
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all border shadow-sm select-none",
          isOpen
            ? "bg-blue-600 border-blue-600 text-white shadow-blue-500/30"
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
        )}
      >
        <span className={cn(
          "p-1 rounded-lg flex items-center justify-center transition-colors",
          isOpen ? "bg-white/20" : "bg-blue-600 text-white"
        )}>
          <Upload size={13} />
        </span>
        <span>Tải lên</span>
        {selectedFiles.length > 0 && !isOpen && (
          <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-black leading-none">
            {selectedFiles.length}
          </span>
        )}
      </button>
      )}

      {/* ── Floating Panel ── */}
      <AnimatePresence>
        {(isOpen || isMobileMode) && (
          <>
            {/* Transparent backdrop to catch outside clicks (Desktop Only) */}
            {!isMobileMode && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}

            <motion.div
              initial={isMobileMode ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: -6 }}
              animate={isMobileMode ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobileMode ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "bg-white dark:bg-zinc-900 overflow-y-auto",
                isMobileMode 
                  ? "relative w-full h-full" 
                  : "absolute right-0 top-full mt-2 z-50 w-[440px] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl"
              )}
              style={!isMobileMode ? { maxHeight: "85vh" } : undefined}
            >
              {/* Header (Desktop Only) */}
              {!isMobileMode && (
                <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/70 border-b border-zinc-100 dark:border-zinc-800 backdrop-blur">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-md shadow-blue-500/30">
                  <Upload size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-xs uppercase tracking-tight text-zinc-800 dark:text-zinc-100">Upload Media</h3>
                  <p className="text-[10px] text-zinc-500">
                    {selectedFiles.length > 0 ? `${selectedFiles.length} file đã chọn` : "Chọn file hoặc dán link"}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <X size={14} className="text-zinc-400" />
                </button>
              </div>
              )}

              <div className={cn("space-y-4", !isMobileMode && "p-4")}>
                {/* 1. Category */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phân loại nội dung</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategory(cat.id);
                          setUploadMode(cat.id === "document" || cat.id === "video" ? "link" : "file");
                          if (cat.id !== "project" && cat.id !== "video") setProjectName("");
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                          category === cat.id
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400"
                        )}
                      >
                        <cat.icon size={12} /> {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. File or Link */}
                {uploadMode === "file" ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={cn(
                      "rounded-xl border-2 border-dashed transition-all p-3",
                      dragActive ? "border-blue-500 bg-blue-50/50" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30"
                    )}
                  >
                    <input ref={inputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple onChange={handleChange} className="hidden" />
                    {selectedFiles.length === 0 ? (
                      <div className="py-5 text-center cursor-pointer" onClick={() => inputRef.current?.click()}>
                        <Upload size={24} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Click hoặc kéo thả file vào đây</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Hỗ trợ ảnh, PDF, Word, Excel</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-500">{selectedFiles.length} file đã chọn</span>
                          <button onClick={() => inputRef.current?.click()} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline">
                            <Plus size={12} /> Thêm
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
                          {selectedFiles.map((file, idx) => (
                            <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 shadow-sm flex-shrink-0">
                              {file.type.startsWith("image/") ? (
                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-blue-500">
                                  <FileText size={20} />
                                  <span className="text-[8px] truncate px-1 mt-1 font-bold w-full text-center">
                                    {file.name.split(".").pop()?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <button
                                onClick={() => removeFile(idx)}
                                className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tiêu đề tài liệu</label>
                      <input
                        type="text"
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                        placeholder="VD: Company Profile 2024"
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {category === "video" ? "Link Google Drive (Video)" : "Link Google Drive"}
                      </label>
                      <input
                        type="text"
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-blue-500"
                      />
                      {category === "video" && (
                        <p className="text-[10px] text-purple-500 font-medium">
                          🎬 Chia sẻ link Google Drive có chế độ "Anyone with link" — hệ thống sẽ tự xử lý xem trước và tải nhanh!
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Metadata */}
                <div className="grid grid-cols-12 gap-3">
                  {(category === "project" || category === "video") && (
                    <div className="col-span-5 space-y-1.5">
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
                      {isNewProject && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1 animate-pulse">
                          <Plus size={9} strokeWidth={3} />
                          Tạo mới: "{projectName.trim()}"
                        </div>
                      )}
                    </div>
                  )}

                  <div className={cn(
                    category === "project" || category === "video" ? "col-span-7" : "col-span-12",
                    "space-y-1.5"
                  )}>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Hashtags</label>
                    <div className="relative">
                      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-lg min-h-[38px]">
                        {tags.map((tag) => {
                          const p = getTagPalette(tag);
                          return (
                            <span key={tag} className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border",
                              p.bg, p.border, p.text
                            )}>
                              {tag}
                              <button onClick={() => removeTag(tag)}><X size={9} /></button>
                            </span>
                          );
                        })}
                        <input
                          ref={tagInputRef}
                          type="text"
                          value={tagInput}
                          onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true); }}
                          onFocus={() => setShowTagSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                          onKeyDown={handleTagKeyDown}
                          placeholder="Gõ tag..."
                          className="flex-1 bg-transparent border-none focus:ring-0 text-xs outline-none min-w-[60px]"
                        />
                      </div>

                      {showTagSuggestions && (filteredSuggestions.length > 0 || tagInput.trim()) && (
                        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                          <div className="p-1.5 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                            {tagInput.trim() && !tags.includes(`#${tagInput.trim().replace(/^#/, "")}`) && (
                              <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); addTag(tagInput); setShowTagSuggestions(false); }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-200/50 dark:border-blue-900/50 text-left hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                              >
                                <span className="flex items-center gap-1">
                                  <Plus size={12} strokeWidth={3} />
                                  Thêm tag mới: <span className="underline">#{tagInput.trim().replace(/^#/, "")}</span>
                                </span>
                                <span className="text-[10px] text-blue-500 font-normal">Nhấn Enter</span>
                              </button>
                            )}
                            {filteredSuggestions.length > 0 && (
                              <div className={cn(
                                "flex flex-wrap gap-1",
                                tagInput.trim() && !tags.includes(`#${tagInput.trim().replace(/^#/, "")}`) && "pt-1 border-t border-zinc-100 dark:border-zinc-800"
                              )}>
                                {filteredSuggestions.map((s) => {
                                  const p = getTagPalette(s);
                                  return (
                                    <button
                                      key={s}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        if (!tags.includes(s)) setTags([...tags, s]);
                                        setTagInput(""); setShowTagSuggestions(false);
                                      }}
                                      className={cn(
                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors border hover:brightness-95",
                                        p.bg, p.border, p.text
                                      )}
                                    >
                                      <Hash size={9} strokeWidth={3} />{s.replace("#", "")}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Submit */}
                <button
                  disabled={loading || (uploadMode === "file" ? selectedFiles.length === 0 : !externalUrl)}
                  onClick={uploadMode === "file" ? handleUpload : handleLinkAdd}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2.5 uppercase tracking-widest",
                    loading
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.98]"
                  )}
                >
                  {loading ? (
                    <><Loader2 className="animate-spin" size={16} /><span>Đang xử lý...</span></>
                  ) : (
                    <>
                      {uploadMode === "file" ? <Upload size={16} /> : <Plus size={16} />}
                      <span>
                        {uploadMode === "file"
                          ? `Upload ${selectedFiles.length} file`
                          : category === "video" ? "Thêm Clip Drive" : "Thêm tài liệu Drive"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
