"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Trash2, Download, ExternalLink, Hash, Check, FileText, Plus, Loader2, Layers } from "lucide-react";
import { toast } from "sonner";
import { cn, copyToClipboard } from "@/lib/utils";

interface AssetCardProps {
  assets: any[];
  onDelete: (id: number) => void;
  onTagClick: (tag: string) => void;
  onUpdate: (id: number, title: string, tags: string) => Promise<void>;
  onPreview: (id: number) => void;
  onDrillDown?: () => void;
  onUploadFiles?: (files: FileList, tags: string) => Promise<void>;
}

export function AssetCard({
  assets,
  onDelete,
  onTagClick,
  onUpdate,
  onPreview,
  onDrillDown,
  onUploadFiles
}: AssetCardProps) {
  const asset = assets[0]; // Main asset
  const isGroup = assets.length > 1;
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(asset.title);
  const [editTags, setEditTags] = useState(asset.tags || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0 && onUploadFiles) {
      const files = e.target.files;
      setIsUploading(true);
      try {
        await onUploadFiles(files, asset.tags || "");
      } catch (err) {
        toast.error("Lỗi upload nhanh");
        console.error("Quick upload error:", err);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(asset.fileUrl);
    if (success) {
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy link");
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = asset.fileUrl;
    link.download = asset.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info("Starting download...");
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(asset.id, editTitle, editTags);
    setIsSaving(false);
    setIsEditing(false);
  };

  const getThumb = (url?: string) => {
    if (!url) return "https://via.placeholder.com/600x400?text=No+Image";

    if (url.includes('drive.google.com')) {
      const isFolder = url.includes('/folders/');
      let driveId = "";

      if (url.includes('/file/d/')) {
        driveId = url.split('/file/d/')[1].split('/')[0];
      } else if (url.includes('/folders/')) {
        driveId = url.split('/folders/')[1].split('?')[0];
      } else if (url.includes('id=')) {
        const urlObj = new URL(url);
        driveId = urlObj.searchParams.get('id') || "";
      }

      if (isFolder) {
        return "https://cdn-icons-png.flaticon.com/512/2965/2965306.png"; // Nice Google Drive Folder Icon
      }

      if (driveId) {
        return `https://drive.google.com/thumbnail?id=${driveId}&sz=w600`;
      }

      return "https://www.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png";
    }

    // If PDF, convert to image for thumbnail (Cloudinary feature)
    if (url.toLowerCase().split('?')[0].split('#')[0].endsWith('.pdf')) {
      return url.replace(/\.pdf($|\?|#)/, ".jpg$1").replace("/upload/", "/upload/w_600,h_800,c_fill,pg_1,q_auto,f_auto/");
    }
    return url.replace("/upload/", "/upload/w_600,h_400,c_fill,q_auto,f_auto/");
  };

  const isDrive = asset.fileUrl?.includes('drive.google.com');
  const isFolder = asset.fileUrl?.includes('/folders/');
  const isImage = !isDrive && asset.fileUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) != null;
  const isPDF = isDrive || asset.fileUrl?.toLowerCase().split('?')[0].split('#')[0].endsWith('.pdf');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-2xl hover:-translate-y-1",
        isGroup ? "ring-2 ring-blue-500/10" : ""
      )}
    >
      {/* Hidden input for quick upload - Keep outside hover to avoid unmounting */}
      <input
        type="file"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={handleQuickUpload}
      />

      {/* Image Container */}
      <div
        onClick={() => onPreview(asset.id)}
        className="relative aspect-[3/2] overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center cursor-zoom-in"
      >
        {isImage ? (
          <img
            src={getThumb(asset.fileUrl)}
            alt={asset.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : isPDF ? (
          <div className={cn(
            "w-full h-full relative flex items-center justify-center group/pdf",
            isDrive ? "bg-zinc-50 dark:bg-zinc-800/50" : "bg-white dark:bg-zinc-900"
          )}>
            <img
              src={getThumb(asset.fileUrl)}
              alt={asset.title}
              className={cn(
                "transition-transform duration-700 group-hover:scale-110",
                isFolder
                  ? "w-16 h-16 object-contain"
                  : "w-full h-full object-cover opacity-90 group-hover:opacity-100"
              )}
            />
            {/* Visual indicator that it's a PDF */}
            {!isDrive && <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />}
            <div className={cn(
              "absolute top-3 left-3 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg border border-white/20 z-10",
              isFolder ? "bg-blue-600 shadow-blue-500/20" :
                isDrive ? "bg-emerald-600 shadow-emerald-500/20" : "bg-red-600 shadow-red-500/20"
            )}>
              {isFolder ? "FOLDER" : isDrive ? "DRIVE" : "PDF"}
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white shadow-2xl">
                <FileText size={24} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-blue-500 transition-transform duration-700 group-hover:scale-110">
            <FileText size={48} />
            <span className="text-xs font-bold text-zinc-500 uppercase">{asset.title?.split('.').pop()}</span>
          </div>
        )}

        {/* Document Title Overlay - only for c:document category */}
        {asset.tags?.includes('c:document') && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-3 pt-6 pb-3 z-20 pointer-events-none">
            <p className="text-white text-[11px] font-black leading-tight line-clamp-2 drop-shadow-lg tracking-tight">
              {asset.title}
            </p>
          </div>
        )}

        {isGroup && (
          <button
            onClick={(e) => { e.stopPropagation(); onDrillDown?.(); }}
            className="absolute top-3 right-3 bg-gray/40 hover:bg-blue-600 backdrop-blur-md px-2.5 py-1.5 rounded-md z-10 shadow-lg border border-white/10 transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
            title="Xem tất cả hình ảnh"
          >
            <span className="text-[10px] font-bold text-white tracking-wide">{assets.length} more pics</span>
            <span className="text-[10px] font-bold text-blue-200 ml-1">➔</span>
          </button>
        )}

        {/* Overlay Controls */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/5 flex items-end justify-start gap-2 p-3"
            >
              <button
                onClick={(e) => { e.stopPropagation(); window.open(asset.fileUrl, "_blank"); }}
                className="p-1.5 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white/80 hover:text-white rounded-md transition-all border border-white/10"
                title="Open Original"
              >
                <ExternalLink size={13} />
              </button>

              {onUploadFiles && (
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  disabled={isUploading}
                  className="p-1.5 bg-blue-600/80 backdrop-blur-md hover:bg-blue-600 text-white rounded-md transition-all border border-white/10 flex items-center justify-center min-w-[28px]"
                  title="Upload nhanh vào album này"
                >
                  {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Bạn có chắc chắn muốn xóa tệp này? Thao tác này không thể hoàn tác.")) {
                    onDelete(asset.id);
                  }
                }}
                className="p-1.5 bg-black/40 backdrop-blur-md hover:bg-red-500 text-white/80 hover:text-white rounded-md transition-all border border-white/10"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Thumbnails for Groups */}
      {isGroup && (
        <div className={cn(
          "grid gap-[2px] mt-[2px]",
          assets.length === 2 ? "grid-cols-1" :
            assets.length === 3 ? "grid-cols-2" :
              "grid-cols-3"
        )}>
          {assets.slice(1, 4).map((subAsset, idx) => (
            <div
              key={idx}
              className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 overflow-hidden cursor-zoom-in"
              onClick={(e) => { e.stopPropagation(); onPreview(subAsset.id); }}
            >
              {subAsset.fileUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                <img src={getThumb(subAsset.fileUrl)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800"><FileText size={20} className="text-zinc-400" /></div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="p-3 space-y-2">
        {isEditing ? (
          <div className="space-y-2">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="Tên tài liệu..."
            />
            <textarea
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[60px]"
              placeholder="Nhập hashtag, phân cách bằng dấu phẩy..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
              >
                {isSaving ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(asset.title);
                  setEditTags(asset.tags || "");
                }}
                className="flex-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-bold py-1.5 rounded-lg transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            {/* Tags */}
            <div className="flex flex-wrap gap-1 flex-1">
              {asset.tags?.split(",").filter(Boolean).map((tagStr: string, i: number) => {
                const tag = tagStr.trim();
                const isCategory = tag.startsWith("c:");
                const isProject = tag.startsWith("p:");
                const isHash = tag.startsWith("#");

                let tagStyles = "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-100 dark:border-zinc-800";

                if (isCategory) {
                  const cat = tag.replace("c:", "").toLowerCase();
                  if (cat.includes("project") || cat.includes("dự án")) tagStyles = "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100/50 dark:border-blue-900/50 hover:bg-blue-100";
                  else if (cat.includes("factory") || cat.includes("nhà máy")) tagStyles = "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/50 hover:bg-emerald-100";
                  else if (cat.includes("machine") || cat.includes("công nghệ")) tagStyles = "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/50 hover:bg-amber-100";
                  else if (cat.includes("process") || cat.includes("quy trình")) tagStyles = "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 border-cyan-100/50 dark:border-cyan-900/50 hover:bg-cyan-100";
                  else if (cat.includes("profile") || cat.includes("hồ sơ") || cat.includes("document")) tagStyles = "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100/50 dark:border-red-900/50 hover:bg-red-100";
                  else tagStyles = "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200";
                } else if (isProject) {
                  tagStyles = "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/50 hover:bg-indigo-100";
                } else if (isHash) {
                  tagStyles = "bg-white dark:bg-transparent text-zinc-400 dark:text-zinc-500 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-800 border-zinc-100 dark:border-zinc-800";
                }

                return (
                  <button
                    key={i}
                    onClick={() => onTagClick(tag)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all border shadow-sm uppercase tracking-tight",
                      tagStyles
                    )}
                  >
                    {isHash ? <Hash size={9} strokeWidth={3} /> : null}
                    {tag.replace("c:", "").replace("p:", "").replace("#", "")}
                  </button>
                );
              })}
            </div>

            {/* Edit Button */}
            {!isGroup && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[9px] font-black text-blue-600/70 hover:text-blue-600 dark:text-blue-400/70 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-all whitespace-nowrap uppercase tracking-wider"
              >
                Sửa
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
