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

interface SidebarProps {
  assets: any[];
  activeFilters: string[];
  onFilterChange: (filter: string) => void;
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

export function Sidebar({ assets, activeFilters, onFilterChange }: SidebarProps) {
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
    <div className="w-64 flex-shrink-0 space-y-8 sticky top-24 h-fit hidden lg:block">
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

      {/* Hashtags */}
      {popularTags.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-4 sticky top-0 bg-[#fafafa] dark:bg-[#050505] z-10 pb-2 flex items-center justify-between pr-4">
            Top từ khóa
            <span className="normal-case tracking-normal opacity-50">{totalHashtags}</span>
          </h3>
          <div className="flex flex-wrap gap-1.5 px-4 max-h-[25vh] overflow-y-auto custom-scrollbar pb-2">
            {popularTags.map((tag) => (
              <div key={tag} className="group/tag relative">
                <button
                  onClick={() => onFilterChange(tag)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors border pr-6",
                    activeFilters.includes(tag)
                      ? "bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-800/50 dark:text-blue-400"
                      : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                  )}
                >
                  <Hash size={10} />
                  {tag.replace("#", "")}
                  <span className="ml-1 opacity-50 font-medium">{hashtagCounts[tag]}</span>
                </button>
                <button
                  onClick={(e) => handleShare(e, tag)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/tag:opacity-100 text-zinc-400 hover:text-blue-600 transition-all p-0.5"
                  title="Chia sẻ hashtag"
                >
                  <Share2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
