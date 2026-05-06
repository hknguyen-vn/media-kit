"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Image as ImageIcon, Loader2, Sparkles, Filter, Share2, X, Hash, Zap, TrendingUp, LayoutGrid, CheckCircle2, Server, Cloud, Database, ChevronLeft, ChevronRight, Expand, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { AssetCard } from "@/components/AssetCard";
import { UploadZone } from "@/components/UploadZone";
import { Sidebar } from "@/components/Sidebar";
import { SocialSidebar } from "@/components/SocialSidebar";
import { copyToClipboard, cn } from "@/lib/utils";

function MediaKitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [assets, setAssets] = useState<any[]>([]);
  const [search, setSearch] = useState(searchParams.get("s") || "");
  const [activeFilters, setActiveFilters] = useState<string[]>(
    searchParams.get("f") ? searchParams.get("f")!.split(",") : []
  );
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Sync state with URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("s", search);
    if (activeFilters.length > 0) params.set("f", activeFilters.join(","));

    const query = params.toString();
    const url = query ? `?${query}` : "/";
    window.history.replaceState(null, "", url);

    // Reset visible count on filter/search change
    setVisibleCount(12);
  }, [search, activeFilters]);

  // Extract unique projects and hashtags for suggestions
  const { projectsList, hashtagsList } = useMemo(() => {
    const pSet = new Set<string>();
    const hSet = new Set<string>();

    assets.forEach(a => {
      const tags = a.tags?.split(",") || [];
      tags.forEach((t: string) => {
        const trimmed = t.trim();
        if (trimmed.startsWith("p:")) pSet.add(trimmed.replace("p:", ""));
        if (trimmed.startsWith("#")) hSet.add(trimmed);
      });
    });

    return {
      projectsList: Array.from(pSet),
      hashtagsList: Array.from(hSet)
    };
  }, [assets]);

  const loadAssets = async (q = "") => {
    try {
      const res = await fetch(`/api/assets?q=${q}`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to fetch assets");
      const data = await res.json();
      setAssets(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách media");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadAssets(search);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // Client-side filtering and grouping
  const { filteredAssets, displayGroups } = useMemo(() => {
    let filtered = assets;

    // Apply normal filters first
    const normalFilters = activeFilters.filter(f => !f.startsWith('cluster:'));
    if (normalFilters.length > 0) {
      filtered = filtered.filter((a) => {
        const tags = (a.tags?.toLowerCase() || "").split(",").map((t: string) => t.trim());
        return normalFilters.every(f => tags.some((tag: string) => tag.includes(f.toLowerCase())));
      });
    }

    // Check if we are in drill-down mode for a specific cluster
    const drillDownFilter = activeFilters.find(f => f.startsWith('cluster:'));
    if (drillDownFilter) {
      const matchKey = drillDownFilter.replace('cluster:', '');

      filtered = assets.filter(a => {
        const tags = a.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];
        const cTag = tags.find((t: string) => t.startsWith('c:')) || 'c:none';
        const pTag = tags.find((t: string) => t.startsWith('p:')) || 'p:none';
        const otherTags = tags.filter((t: string) => !t.startsWith('c:') && !t.startsWith('p:'));

        let assetKey = '';
        if (pTag !== 'p:none') {
          assetKey = `${cTag}:::${pTag}`;
        } else if (otherTags.length > 0) {
          assetKey = `${cTag}:::tags:${otherTags.sort().join('|')}`;
        } else if (cTag !== 'c:none') {
          assetKey = `${cTag}:::general`;
        } else {
          assetKey = `single_${a.id}`;
        }

        return assetKey === matchKey;
      });
      return { filteredAssets: filtered, displayGroups: filtered.map(a => [a]) }; // Ungrouped!
    }

    const hasProjectFilter = normalFilters.some(f => f.startsWith('p:'));
    const isSearching = search.length > 0;

    // If searching or filtering by a specific project, don't group (show individuals)
    if (hasProjectFilter || isSearching) {
      return { filteredAssets: filtered, displayGroups: filtered.map(a => [a]) };
    }

    // Group by combination of Category, Project, or Hashtags
    const groups = new Map<string, any[]>();

    filtered.forEach(asset => {
      const tagsArray = asset.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];
      const cTag = tagsArray.find((t: string) => t.startsWith('c:')) || 'c:none';
      const pTag = tagsArray.find((t: string) => t.startsWith('p:')) || 'p:none';
      const otherTags = tagsArray.filter((t: string) => !t.startsWith('c:') && !t.startsWith('p:'));

      let groupKey = '';

      if (pTag !== 'p:none') {
        // Mode 1: Group by Project
        groupKey = `${cTag}:::${pTag}`;
      } else if (otherTags.length > 0) {
        // Mode 2: Group by Category + Hashtags (when no project)
        groupKey = `${cTag}:::tags:${otherTags.sort().join('|')}`;
      } else if (cTag !== 'c:none') {
        // Mode 3: Group by Category only (General Bucket)
        groupKey = `${cTag}:::general`;
      } else {
        // Mode 4: Truly individual asset
        groupKey = `single_${asset.id}`;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(asset);
    });

    const result: any[][] = [];
    groups.forEach(groupAssets => result.push(groupAssets));

    return {
      filteredAssets: filtered,
      displayGroups: result
    };
  }, [assets, activeFilters, search]);

  const toggleFilter = (f: string, mode: 'single' | 'multi' = 'multi') => {
    if (!f) {
      setActiveFilters([]);
      return;
    }

    if (mode === 'single') {
      // If clicking the same filter that is already the ONLY one, clear it
      if (activeFilters.length === 1 && activeFilters[0] === f) {
        setActiveFilters([]);
      } else {
        setActiveFilters([f]);
      }
      return;
    }

    setActiveFilters(prev =>
      prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]
    );
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    document.body.style.overflow = "hidden";
  };

  const closePreview = () => {
    setPreviewIndex(null);
    document.body.style.overflow = "auto";
  };

  const navigatePreview = (direction: 'next' | 'prev') => {
    if (previewIndex === null) return;
    if (direction === 'next') {
      setPreviewIndex((previewIndex + 1) % filteredAssets.length);
    } else {
      setPreviewIndex((previewIndex - 1 + filteredAssets.length) % filteredAssets.length);
    }
  };

  // Keyboard navigation for preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewIndex === null) return;
      if (e.key === "Escape") closePreview();
      if (e.key === "ArrowRight") navigatePreview('next');
      if (e.key === "ArrowLeft") navigatePreview('prev');
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, filteredAssets.length]);

  const handleUpload = async (files: File[], tagsString: string) => {
    setLoading(true);
    const toastId = toast.loading(`Đang tải lên ${files.length} ảnh...`);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        const data = await uploadToCloudinary(file);
        if (!data?.secure_url) throw new Error("Upload failed");

        const res = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: file.name,
            fileUrl: data.secure_url,
            tags: tagsString,
          }),
        });

        if (!res.ok) throw new Error("Failed to save asset");
        successCount++;
      } catch (err) {
        console.error(err);
        failCount++;
      }
    }

    setLoading(false);

    if (failCount === 0) {
      toast.success(`Tải lên thành công ${successCount} ảnh`, { id: toastId });
    } else {
      toast.warning(`Tải lên ${successCount} thành công, ${failCount} thất bại`, { id: toastId });
    }

    loadAssets();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa file này?")) return;

    try {
      const res = await fetch(`/api/assets?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setAssets((prev) => prev.filter((a) => a.id !== id));
      toast.success("Đã xóa file");
    } catch (err) {
      toast.error("Không thể xóa file");
    }
  };

  const handleUpdate = async (id: number, title: string, tags: string) => {
    try {
      const res = await fetch("/api/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title, tags }),
      });
      if (!res.ok) throw new Error("Update failed");

      const updatedAsset = await res.json();
      setAssets((prev) => prev.map((a) => a.id === id ? updatedAsset : a));
      toast.success("Cập nhật thành công");
    } catch (err) {
      toast.error("Không thể cập nhật thông tin");
    }
  };

  const handleShareCollection = async () => {
    const success = await copyToClipboard(window.location.href);
    if (success) {
      toast.success("Đã sao chép liên kết bộ sưu tập");
    } else {
      toast.error("Không thể sao chép liên kết");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 pb-20">
      {/* Header Area */}
      <div className="relative pt-10 pb-6 px-6">
        <div className="relative max-w-7xl mx-auto text-center space-y-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 mb-2"
          >
            <div className="relative w-32 h-12 md:w-40 md:h-16">
              <img
                src="/logo-hgpt.png"
                alt="HGPT Logo"
                className="w-full h-full object-contain dark:brightness-110"
              />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black tracking-widest uppercase border border-blue-100 dark:border-blue-800">
              <Sparkles size={12} />
              Media Kit System
            </div>
          </motion.div>
        </div>

        {/* System Health Status (Top Left) - Hidden on Mobile */}
        <div className="hidden md:flex absolute top-10 left-6 z-30 flex-col gap-2">
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-100 dark:border-zinc-800/50 group">
            <div className="relative">
              <Database size={13} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">DB Online</span>
          </div>

          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-100 dark:border-zinc-800/50 group">
            <div className="relative">
              <Cloud size={13} className="text-zinc-400 group-hover:text-sky-500 transition-colors" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">Cloudinary Ready</span>
          </div>

          <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
            <div className="relative flex items-center justify-center">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
            </div>
            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Healthy 100%</span>
          </div>
        </div>

        {/* Floating/Corner Upload Zone */}
        <div className="hidden md:block absolute top-10 right-6 z-50 w-full max-w-xs md:max-w-md pointer-events-none">
          <div className="pointer-events-auto">
            <UploadZone 
              onUpload={handleUpload} 
              loading={loading} 
              existingProjects={projectsList} 
              existingHashtags={hashtagsList}
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex gap-8">
          {/* Sidebar */}
          <Sidebar
            assets={assets}
            activeFilters={activeFilters}
            onFilterChange={(f) => toggleFilter(f, 'single')}
          />

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Space reserved for search and gallery */}

            {/* Enhanced Sticky Header Area */}
            <div className="sticky top-6 z-30 space-y-4 pb-4 -mx-4 px-4 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl rounded-b-3xl">
              <div className={cn(
                "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl transition-all duration-500",
                isSearchFocused ? "ring-2 ring-blue-500/20 shadow-blue-500/10" : "shadow-sm"
              )}>
                <div className="flex items-center gap-4 p-2">
                  <div className="relative flex-1">
                    <Search className={cn(
                      "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300",
                      isSearchFocused ? "text-blue-500" : "text-zinc-400"
                    )} size={18} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm dự án, hashtag hoặc tên file..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                      className="w-full pl-12 pr-10 py-4 bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-zinc-400 outline-none"
                    />
                    {search && (
                      <button 
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleShareCollection}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
                  >
                    <Share2 size={14} />
                    Chia sẻ
                  </button>
                </div>

                {/* Unfolding Suggestions (Pushes content down) */}
                <AnimatePresence>
                  {isSearchFocused && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800/50"
                    >
                      <div className="p-5 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {search.length === 0 ? (
                          <div className="space-y-6">
                            {/* Categories Shortcuts */}
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <LayoutGrid size={14} className="text-blue-500" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Chuyên mục nổi bật</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                {[
                                  { id: "c:project", label: "Dự án", icon: Zap, color: "text-blue-500" },
                                  { id: "c:machine", label: "Công nghệ", icon: Zap, color: "text-amber-500" },
                                  { id: "c:factory", label: "Nhà máy", icon: Zap, color: "text-emerald-500" },
                                  { id: "c:process", label: "Quy trình", icon: Zap, color: "text-cyan-500" },
                                  { id: "c:profile", label: "Hồ sơ NL", icon: Zap, color: "text-purple-500" },
                                ].map((cat) => (
                                  <button
                                    key={cat.id}
                                    onClick={() => toggleFilter(cat.id, 'multi')}
                                    className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/30 hover:bg-white dark:hover:bg-zinc-800 rounded-xl text-left transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 group shadow-sm hover:shadow-md"
                                  >
                                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                      <cat.icon size={12} className={cat.color} />
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-200 leading-tight">{cat.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Popular Hashtags */}
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={14} className="text-purple-500" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Hashtag phổ biến</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {hashtagsList.slice(0, 15).map((h) => (
                                  <button
                                    key={h}
                                    onClick={() => toggleFilter(h, 'multi')}
                                    className="px-3 py-2 bg-white dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-800 rounded-xl text-xs font-bold transition-all border border-zinc-100 dark:border-zinc-800 shadow-sm"
                                  >
                                    {h}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Search size={14} className="text-blue-500" />
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Kết quả tìm kiếm hashtags</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {hashtagsList
                                .filter(h => h.toLowerCase().includes(search.toLowerCase().replace('#', '')))
                                .map(h => (
                                  <button
                                    key={h}
                                    onClick={() => {
                                      toggleFilter(h, 'multi');
                                      setSearch("");
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-black transition-all border border-blue-100/50 dark:border-blue-900/50"
                                  >
                                    <Hash size={14} className="opacity-50" />
                                    {h.replace('#', '')}
                                  </button>
                                ))}
                              {hashtagsList.filter(h => h.toLowerCase().includes(search.toLowerCase().replace('#', ''))).length === 0 && (
                                <div className="text-sm text-zinc-400 py-8 text-center italic">Không tìm thấy hashtag nào phù hợp...</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Active Filters Tokens */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-2 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-zinc-400">
                    <Filter size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Đang lọc:</span>
                  </div>
                  {activeFilters.map(f => (
                    <button
                      key={f}
                      onClick={() => toggleFilter(f)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all group shadow-sm"
                    >
                      {f.replace("c:", "").replace("p:", "").replace("tags:", "").toUpperCase()}
                      <X size={10} className="text-blue-400 group-hover:text-red-500 transition-colors" />
                    </button>
                  ))}
                  <button
                    onClick={() => toggleFilter("")}
                    className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 hover:text-red-500 transition-all ml-auto"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}
            </div>

            {/* Gallery Grid */}
            <AnimatePresence mode="popLayout">
              {fetching ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[3/2] bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : filteredAssets.length > 0 ? (
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {displayGroups.slice(0, visibleCount).map((group, index) => {
                    return (
                      <motion.div
                        key={group[0].id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AssetCard
                          assets={group}
                          onDelete={handleDelete}
                          onTagClick={(tag) => toggleFilter(tag, 'multi')}
                          onUpdate={handleUpdate}
                          onPreview={(assetId: number) => {
                            const idx = filteredAssets.findIndex(a => a.id === assetId);
                            openPreview(idx !== -1 ? idx : 0);
                          }}
                          onDrillDown={() => {
                            const tagsArray = group[0].tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];
                            const cTag = tagsArray.find((t: string) => t.startsWith('c:')) || 'c:none';
                            const pTag = tagsArray.find((t: string) => t.startsWith('p:')) || 'p:none';
                            const otherTags = tagsArray.filter((t: string) => !t.startsWith('c:') && !t.startsWith('p:'));

                            let groupKey = '';
                            if (pTag !== 'p:none') {
                              groupKey = `${cTag}:::${pTag}`;
                            } else if (otherTags.length > 0) {
                              groupKey = `${cTag}:::tags:${otherTags.sort().join('|')}`;
                            } else if (cTag !== 'c:none') {
                              groupKey = `${cTag}:::general`;
                            } else {
                              groupKey = `single_${group[0].id}`;
                            }

                            setActiveFilters(prev => {
                              const withoutCluster = prev.filter(f => !f.startsWith('cluster:'));
                              return [...withoutCluster, `cluster:${groupKey}`];
                            });
                            // Reset visible count when drilling down
                            setVisibleCount(24);
                            // Scroll to top smoothly
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center space-y-4"
                >
                  <div className="p-6 rounded-full bg-zinc-100 dark:bg-zinc-900">
                    <ImageIcon size={48} className="text-zinc-300 dark:text-zinc-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-400">Không tìm thấy kết quả</h3>
                    <p className="text-zinc-500 text-sm mt-1">
                      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Load More Button */}
            {visibleCount < displayGroups.length && (
              <div className="flex justify-center mt-12 pb-12">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="px-6 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-800 shadow-sm transition-all"
                >
                  Tải thêm ({displayGroups.length - visibleCount} nhóm/ảnh)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Image Preview Lightbox */}
      <AnimatePresence>
        {previewIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            onClick={closePreview}
          >
            <button
              onClick={closePreview}
              className="absolute top-6 right-6 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-[110]"
            >
              <X size={24} />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); navigatePreview('prev'); }}
              className="absolute left-4 md:left-10 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-[110]"
            >
              <ChevronLeft size={32} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); navigatePreview('next'); }}
              className="absolute right-4 md:right-10 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-[110]"
            >
              <ChevronRight size={32} />
            </button>

            <motion.div
              key={previewIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={filteredAssets[previewIndex].fileUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              />

              {/* Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70 mb-2">Ảnh {previewIndex + 1} / {filteredAssets.length}</p>
                    <div className="flex flex-wrap gap-2">
                      {filteredAssets[previewIndex].tags?.split(",").map((t: string, i: number) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full border border-white/10">
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(filteredAssets[previewIndex].fileUrl);
                        toast.success("Đã sao chép liên kết!");
                      }}
                      className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                      title="Copy Link"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement("a");
                        link.href = filteredAssets[previewIndex].fileUrl;
                        link.download = filteredAssets[previewIndex].title;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => window.open(filteredAssets[previewIndex].fileUrl, "_blank")}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-all shadow-lg"
                    >
                      <Expand size={14} /> Xem Full Size
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SocialSidebar />
    </div>
  );
}

export default function MediaKitPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    }>
      <MediaKitContent />
    </Suspense>
  );
}