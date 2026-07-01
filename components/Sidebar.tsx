"use client";

import React, { useMemo } from "react";

import { motion } from "framer-motion";
import {
  Briefcase,
  Factory,
  Cpu,
  Grid,
  ChevronRight,
  Hash,
  LayoutGrid,
  Box,
  FileText,
  PlayCircle,
  Share2,
  Globe,
  LayoutList
} from "lucide-react";
import { toast } from "sonner";
import { cn, copyToClipboard } from "@/lib/utils";
import { getTagPalette } from "@/lib/tagPalette";

interface SidebarProps {
  assets: any[];
  activeFilters: string[];
  onFilterChange: (filter: string) => void;
  isMobileMode?: boolean;
}

const CATEGORIES = [
  { id: "all", label: "Tất cả Media", icon: LayoutGrid },
  { id: "c:project", label: "Năng lực Dự án", icon: Briefcase },
  { id: "c:factory", label: "Nhà máy HGPT", icon: Factory },
  { id: "c:process", label: "Quy trình", icon: LayoutList },
  { id: "c:machine", label: "MMTB - Công nghệ", icon: Cpu },
  { id: "c:document", label: "Docs / Tải về", icon: FileText },
  { id: "c:video", label: "Clip Ngắn (Beta)", icon: PlayCircle },
];

export function Sidebar({ assets, activeFilters, onFilterChange, isMobileMode }: SidebarProps) {
  // Extract unique projects from assets
  const projects = Array.from(
    new Set(
      assets
        .flatMap((a) => a.tags?.split(",") || [])
        .map((t) => t.trim())
        .filter((t) => t.startsWith("p:"))
    )
  ).map((p) => ({
    id: p,
    label: p.replace("p:", ""),
  }));

  // Extract unique hashtags and sort by frequency
  const { popularTags, hashtagCounts, totalHashtags } = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    assets.forEach(a => {
      const tags = a.tags?.split(",") || [];
      tags.forEach((t: string) => {
        const trimmed = t.trim();
        if (trimmed.startsWith("#")) {
          tagCounts[trimmed] = (tagCounts[trimmed] || 0) + 1;
        }
      });
    });

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1]); // Sort by count descending

    return {
      popularTags: sortedTags.slice(0, 40).map(([tag]) => tag),
      hashtagCounts: tagCounts,
      totalHashtags: sortedTags.length
    };
  }, [assets]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: assets.length };
    CATEGORIES.forEach(cat => {
      if (cat.id !== "all") {
        counts[cat.id] = assets.filter(a => a.tags?.includes(cat.id)).length;
      }
    });
    return counts;
  }, [assets]);

  // Calculate project counts
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach(a => {
      const tags = a.tags?.split(",") || [];
      tags.forEach((t: string) => {
        const trimmed = t.trim();
        if (trimmed.startsWith("p:")) {
          counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      });
    });
    return counts;
  }, [assets]);

  const handleShare = async (e: React.MouseEvent, filterValue: string) => {
    e.stopPropagation();
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}?f=${encodeURIComponent(filterValue)}`;

    const success = await copyToClipboard(url);
    if (success) {
      toast.success(`Đã sao chép liên kết cho "${filterValue.replace("p:", "").replace("c:", "")}"`);
    } else {
      toast.error("Không thể sao chép liên kết");
    }
  };

  return (
    <div className={cn(
      "space-y-6 flex-shrink-0",
      isMobileMode
        ? "w-full pb-20" 
        : "w-64 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-6 custom-scrollbar hidden lg:block"
    )}>
      {/* Categories */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-4">
          Phân loại
        </h3>
        <nav className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onFilterChange(cat.id === "all" ? "" : cat.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-medium transition-all group",
                (cat.id === "all" && activeFilters.length === 0) || activeFilters.includes(cat.id)
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <cat.icon size={18} className={cn(
                    "transition-colors",
                    (cat.id === "all" && activeFilters.length === 0) || activeFilters.includes(cat.id) ? "text-white" : "text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                  )} />
                  {cat.label}
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                  (cat.id === "all" && activeFilters.length === 0) || activeFilters.includes(cat.id)
                    ? "bg-white/20 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                )}>
                  {categoryCounts[cat.id]}
                </span>
              </div>
              {((cat.id === "all" && activeFilters.length === 0) || activeFilters.includes(cat.id)) && (
                <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </section>

      {/* Hashtags */}
      {popularTags.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-4 sticky top-0 bg-[#fafafa] dark:bg-[#050505] z-10 pb-2 flex items-center justify-between pr-4">
            Top từ khóa
            <span className="normal-case tracking-normal opacity-50">{totalHashtags}</span>
          </h3>
          <div className="flex flex-wrap gap-1.5 px-4 max-h-[35vh] overflow-y-auto custom-scrollbar pb-2">
            {popularTags.map((tag) => {
              const palette = getTagPalette(tag);
              const isActive = activeFilters.includes(tag);
              return (
                <div key={tag} className="group/tag relative">
                  <button
                    onClick={() => onFilterChange(tag)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border pr-6",
                      isActive
                        ? `${palette.activeBg} ${palette.border} ${palette.text} ring-1 ring-current/20 shadow-sm`
                        : `${palette.bg} ${palette.border} ${palette.text} hover:brightness-95 dark:hover:brightness-110`
                    )}
                  >
                    <Hash size={10} />
                    {tag.replace("#", "")}
                    <span className="ml-1 opacity-60 font-medium">{hashtagCounts[tag]}</span>
                  </button>
                  <button
                    onClick={(e) => handleShare(e, tag)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/tag:opacity-100 text-zinc-400 hover:text-blue-600 transition-all p-0.5"
                    title="Chia sẻ hashtag"
                  >
                    <Share2 size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-4 sticky top-0 bg-[#fafafa] dark:bg-[#050505] z-10 pb-2 flex items-center justify-between pr-4">
            Dự án
            <span className="normal-case tracking-normal opacity-50">{projects.length}</span>
          </h3>
          <div className="space-y-1 max-h-[25vh] overflow-y-auto custom-scrollbar pr-2">
            {projects.map((proj) => (
              <div key={proj.id} className="group/item flex items-center gap-1 pr-1">
                <button
                  onClick={() => onFilterChange(proj.id)}
                  className={cn(
                    "flex-1 flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold transition-all text-left",
                    activeFilters.includes(proj.id)
                      ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-zinc-300 dark:bg-zinc-700" />
                  <span className="truncate flex-1">{proj.label}</span>
                  <span className="text-[10px] opacity-50 group-hover/item:opacity-100 transition-opacity">
                    {projectCounts[proj.id]}
                  </span>
                </button>
                <button
                  onClick={(e) => handleShare(e, proj.id)}
                  className="p-1.5 opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-blue-600 transition-all"
                  title="Chia sẻ dự án này"
                >
                  <Share2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
