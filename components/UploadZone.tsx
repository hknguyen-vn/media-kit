"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Hash, Image as ImageIcon, Loader2, Briefcase, Factory, Cpu, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUpload: (files: File[], tags: string) => Promise<void>;
  loading: boolean;
  existingProjects: string[]; // Pass existing projects to suggest
}

const CATEGORIES = [
  { id: "project", label: "Dự án", icon: Briefcase },
  { id: "factory", label: "Nhà máy", icon: Factory },
  { id: "machine", label: "Máy móc", icon: Cpu },
  { id: "profile", label: "Hồ sơ năng lực", icon: FileText },
  { id: "other", label: "Khác", icon: ImageIcon },
];

export function UploadZone({ onUpload, loading, existingProjects }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("project");
  const [projectName, setProjectName] = useState("");
  const [tags, setTags] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Toggle for expanded view
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const finalTags = [
      `c:${category}`,
      projectName ? `p:${projectName.trim()}` : "",
      ...tags.split(",").map(t => t.trim()).filter(Boolean).map(t => t.startsWith("#") ? t : `#${t}`)
    ].filter(Boolean).join(", ");

    await onUpload(selectedFiles, finalTags);
    
    // Reset after success
    setSelectedFiles([]);
    setProjectName("");
    setTags("");
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
                        <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-200">
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
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Phân loại</label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setCategory(cat.id)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                            category === cat.id ? "bg-blue-50 border-blue-600 text-blue-700" : "bg-white dark:bg-zinc-800 border-zinc-200 text-zinc-600"
                          )}
                        >
                          <cat.icon size={12} /> {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Tên Dự án (Gõ hoặc chọn)</label>
                    <input
                      type="text"
                      list="projects-list"
                      placeholder="VD: VinFast Hai Phong..."
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                    <datalist id="projects-list">
                      {existingProjects.map((p, i) => (
                        <option key={i} value={p} />
                      ))}
                    </datalist>
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Hashtag (#)</label>
                    <div className="relative">
                      <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={12} />
                      <input
                        type="text"
                        placeholder="thep, may-cat..."
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-end">
                    <button
                      disabled={loading}
                      onClick={handleUpload}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                      Upload {selectedFiles.length} ảnh
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
