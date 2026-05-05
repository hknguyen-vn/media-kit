"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Trash2, Download, ExternalLink, Hash, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn, copyToClipboard } from "@/lib/utils";

interface AssetCardProps {
  assets: any[];
  onDelete: (id: number) => Promise<void>;
  onTagClick: (tag: string) => void;
  onUpdate: (id: number, title: string, tags: string) => Promise<void>;
  onPreview: (assetId: number) => void;
}

export function AssetCard({ assets, onDelete, onTagClick, onUpdate, onPreview }: AssetCardProps) {
  const asset = assets[0]; // Main asset
  const isGroup = assets.length > 1;
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(asset.title);
  const [editTags, setEditTags] = useState(asset.tags || "");
  const [isSaving, setIsSaving] = useState(false);

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
    return url.replace("/upload/", "/upload/w_600,h_400,c_fill,q_auto,f_auto/");
  };

  const isImage = asset.fileUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) != null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-500"
    >
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
        ) : (
          <div className="flex flex-col items-center gap-2 text-blue-500 transition-transform duration-700 group-hover:scale-110">
            <FileText size={48} />
            <span className="text-xs font-bold text-zinc-500 uppercase">{asset.title?.split('.').pop()}</span>
          </div>
        )}
        
        {isGroup && (
          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md z-10 shadow-lg border border-white/10">
            <span className="text-[10px] font-bold text-white tracking-wide">{assets.length} images</span>
          </div>
        )}

        {/* Overlay Controls */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/10 transition-colors flex items-center justify-center gap-2 p-4"
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                className="p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-md transition-all hover:scale-110 active:scale-95"
                title="Copy Link"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                className="p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-md transition-all hover:scale-110 active:scale-95"
                title="Download"
              >
                <Download size={14} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); window.open(asset.fileUrl, "_blank"); }}
                className="p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-md transition-all hover:scale-110 active:scale-95"
                title="Open Original"
              >
                <ExternalLink size={14} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }}
                className="p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-full shadow-md transition-all hover:scale-110 active:scale-95"
                title="Delete"
              >
                <Trash2 size={14} />
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
                <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800"><FileText size={20} className="text-zinc-400"/></div>
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
              {asset.tags?.split(",").filter(Boolean).map((tag: string, i: number) => (
                <button
                  key={i}
                  onClick={() => onTagClick(tag.trim())}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-50 dark:bg-zinc-800/50 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors border border-zinc-100 dark:border-zinc-800"
                >
                  {tag.trim().startsWith("#") ? <Hash size={9} /> : null}
                  {tag.trim().replace("#", "")}
                </button>
              ))}
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
