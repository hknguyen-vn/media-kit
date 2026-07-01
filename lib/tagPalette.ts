export const TAG_PALETTES = [
  { bg: "bg-rose-100 dark:bg-rose-950/40", border: "border-rose-200 dark:border-rose-800/50", text: "text-rose-700 dark:text-rose-400", activeBg: "bg-rose-200 dark:bg-rose-900/60" },
  { bg: "bg-orange-100 dark:bg-orange-950/40", border: "border-orange-200 dark:border-orange-800/50", text: "text-orange-700 dark:text-orange-400", activeBg: "bg-orange-200 dark:bg-orange-900/60" },
  { bg: "bg-amber-100 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800/50", text: "text-amber-700 dark:text-amber-400", activeBg: "bg-amber-200 dark:bg-amber-900/60" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800/50", text: "text-emerald-700 dark:text-emerald-400", activeBg: "bg-emerald-200 dark:bg-emerald-900/60" },
  { bg: "bg-teal-100 dark:bg-teal-950/40", border: "border-teal-200 dark:border-teal-800/50", text: "text-teal-700 dark:text-teal-400", activeBg: "bg-teal-200 dark:bg-teal-900/60" },
  { bg: "bg-cyan-100 dark:bg-cyan-950/40", border: "border-cyan-200 dark:border-cyan-800/50", text: "text-cyan-700 dark:text-cyan-400", activeBg: "bg-cyan-200 dark:bg-cyan-900/60" },
  { bg: "bg-blue-100 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800/50", text: "text-blue-700 dark:text-blue-400", activeBg: "bg-blue-200 dark:bg-blue-900/60" },
  { bg: "bg-violet-100 dark:bg-violet-950/40", border: "border-violet-200 dark:border-violet-800/50", text: "text-violet-700 dark:text-violet-400", activeBg: "bg-violet-200 dark:bg-violet-900/60" },
  { bg: "bg-fuchsia-100 dark:bg-fuchsia-950/40", border: "border-fuchsia-200 dark:border-fuchsia-800/50", text: "text-fuchsia-700 dark:text-fuchsia-400", activeBg: "bg-fuchsia-200 dark:bg-fuchsia-900/60" },
  { bg: "bg-pink-100 dark:bg-pink-950/40", border: "border-pink-200 dark:border-pink-800/50", text: "text-pink-700 dark:text-pink-400", activeBg: "bg-pink-200 dark:bg-pink-900/60" },
];

export function getTagPalette(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return TAG_PALETTES[hash % TAG_PALETTES.length];
}
