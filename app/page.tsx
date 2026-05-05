"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Image as ImageIcon, Loader2, Sparkles, Filter, Share2, X, Hash } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { AssetCard } from "@/components/AssetCard";
import { UploadZone } from "@/components/UploadZone";
import { Sidebar } from "@/components/Sidebar";
import { copyToClipboard } from "@/lib/utils";

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

  // Client-side filtering for Sidebar and Multi-select
  const filteredAssets = useMemo(() => {
    if (activeFilters.length === 0) return assets;
    return assets.filter((a) => {
      const tags = (a.tags?.toLowerCase() || "").split(",").map((t: string) => t.trim());
      return activeFilters.every(f => tags.some((tag: string) => tag.includes(f.toLowerCase())));
    });
  }, [assets, activeFilters]);

  const toggleFilter = (f: string) => {
    if (!f) {
      setActiveFilters([]);
      return;
    }
    setActiveFilters(prev => 
      prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]
    );
  };

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
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black tracking-widest uppercase border border-blue-100 dark:border-blue-800"
          >
            <Sparkles size={12} />
            Hệ thống Quản lý Năng lực Media
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-black tracking-tight"
          >
            Visual <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Assets</span>
          </motion.h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-12">
          {/* Sidebar */}
          <Sidebar 
            assets={assets} 
            activeFilters={activeFilters} 
            onFilterChange={toggleFilter} 
          />

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Upload Area */}
            <section>
              <UploadZone onUpload={handleUpload} loading={loading} existingProjects={projectsList} />
            </section>

            {/* Toolbar */}
            <div className="space-y-3 sticky top-6 z-20">
              <div className="flex items-center gap-4 p-2 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm dự án, máy móc, vật liệu hoặc #hashtag..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 text-sm placeholder:text-zinc-400 outline-none"
                  />
                  
                  {/* Hashtag Suggestions */}
                  {search.length >= 1 && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                      <div className="text-[10px] font-black text-zinc-400 px-1 pb-3 uppercase tracking-[0.2em]">Hashtags liên quan</div>
                      <div className="flex flex-wrap gap-2">
                        {hashtagsList
                          .filter(h => h.toLowerCase().includes(search.toLowerCase().replace('#', '')))
                          .map(h => (
                            <button
                              key={h}
                              onClick={() => {
                                toggleFilter(h);
                                setSearch(""); // Clear search after picking a tag
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                            >
                              <Hash size={12} className="opacity-50" />
                              {h.replace('#', '')}
                            </button>
                          ))}
                        {hashtagsList.filter(h => h.toLowerCase().includes(search.toLowerCase().replace('#', ''))).length === 0 && (
                          <div className="text-xs text-zinc-400 py-2 px-1">Không tìm thấy hashtag nào...</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={handleShareCollection}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
                >
                  <Share2 size={14} />
                  Chia sẻ
                </button>
              </div>

              {/* Active Filters Tokens */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  {activeFilters.map(f => (
                    <button 
                      key={f}
                      onClick={() => toggleFilter(f)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all group"
                    >
                      <Filter size={10} className="text-zinc-400 group-hover:text-blue-500" />
                      {f.replace("c:", "").replace("p:", "").toUpperCase()}
                      <X size={10} className="text-zinc-400 group-hover:text-red-500" />
                    </button>
                  ))}
                  <button 
                    onClick={() => toggleFilter("")}
                    className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all"
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
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {filteredAssets.slice(0, visibleCount).map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onDelete={handleDelete}
                      onTagClick={(tag) => toggleFilter(tag)}
                      onUpdate={handleUpdate}
                    />
                  ))}
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
            {filteredAssets.length > visibleCount && (
              <div className="flex justify-center pt-8 pb-4">
                <button
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="px-6 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-800 shadow-sm transition-all"
                >
                  Tải thêm ({filteredAssets.length - visibleCount} ảnh)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
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