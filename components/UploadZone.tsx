"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Hash, Image as ImageIcon, Loader2, Briefcase, Factory, Cpu, Plus, FileText, LayoutList, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUpload: (files: File[], tags: string) => Promise<void>;
  loading: boolean;
  existingProjects: string[]; 
  existingHashtags: string[];
}

const CATEGORIES = [
  { id: "project", label: "Dự án", icon: Briefcase },
  { id: "factory", label: "Nhà máy HGPT", icon: Factory },
  { id: "machine", label: "MMTB - Công nghệ", icon: Cpu },
  { id: "process", label: "Quy trình", icon: LayoutList },
  { id: "profile", label: "Hồ sơ năng lực", icon: FileText },
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
          <span className="text-xs font-black text-blue-600 pr-2">Tải ảnh lên</span>
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
              {/* Drop Zone & File List */}
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

              {/* Form Config */}
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Category Selection */}
                  <div className="md:col-span-12 space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">1. Phân loại nội dung</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setCategory(cat.id)}
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

                  {/* Project Name */}
                  <div className="md:col-span-5 space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">2. Tên dự án (Nếu có)</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                        <Briefcase size={14} />
                      </div>
                      <input
                        type="text"
                        list="projects-list"
                        placeholder="VD: VinFast Hai Phong..."
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      />
                      <datalist id="projects-list">
                        {existingProjects.map((p, i) => (
                          <option key={i} value={p} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Hashtags Selection */}
                  <div className="md:col-span-7 space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">3. Hashtag (#)</label>
                    <div 
                      onClick={() => tagInputRef.current?.focus()}
                      className={cn(
                        "flex flex-wrap items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl min-h-[42px] focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all cursor-text",
                        showTagSuggestions && "rounded-b-none"
                      )}
                    >
                      <AnimatePresence>
                        {tags.map((tag) => (
                          <motion.span
                            key={tag}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-200/50 dark:border-blue-800/50"
                          >
                            {tag}
                            <button onClick={() => removeTag(tag)} className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors">
                              <X size={10} />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      
                      <div className="relative flex-1 min-w-[120px]">
                        <input
                          ref={tagInputRef}
                          type="text"
                          placeholder="Gõ tag..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          onFocus={() => setShowTagSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                          className="w-full bg-transparent border-none focus:ring-0 text-sm outline-none py-1"
                        />
                        
                        {/* Suggestions Dropdown */}
                        <AnimatePresence>
                          {showTagSuggestions && filteredSuggestions.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-[-8px] right-[-8px] mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden"
                            >
                              <div className="p-1 max-h-48 overflow-y-auto">
                                <p className="text-[9px] font-black text-zinc-400 uppercase p-2 tracking-widest">Gợi ý hashtag</p>
                                  {filteredSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion}
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevent blur
                                      addTag(suggestion);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Hash size={12} className="text-zinc-400 group-hover:text-blue-500" />
                                      {suggestion.replace("#", "")}
                                    </div>
                                    <Plus size={12} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-all" />
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    {tags.length === 0 && !tagInput && (
                      <p className="text-[10px] text-zinc-400 italic">Nhấn Enter để thêm tag mới hoặc chọn từ gợi ý</p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="md:col-span-12 pt-2">
                    <button
                      disabled={loading || selectedFiles.length === 0}
                      onClick={handleUpload}
                      className={cn(
                        "w-full py-3 rounded-xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-3",
                        loading 
                          ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" 
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.98]"
                      )}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          <span>Đang xử lý {selectedFiles.length} file...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          <span>Bắt đầu Upload ({selectedFiles.length} file)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
