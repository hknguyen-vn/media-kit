"use client";

import { motion } from "framer-motion";
import { PlayCircle, Users, Globe, MessageCircle } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/social-config";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  Youtube: PlayCircle,
  Facebook: Users,
  Globe: Globe,
  Zalo: MessageCircle,
};

export function SocialSidebar() {
  return (
    <div className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-50 flex-col gap-2 p-3 pr-0 group">
      {SOCIAL_LINKS.map((link, index) => {
        const Icon = iconMap[link.icon] || Globe;
        return (
          <motion.a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className={cn(
              "flex items-center gap-3 pl-4 pr-3 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 border-r-0 rounded-l-2xl shadow-xl transition-all duration-300 hover:-translate-x-2 group/item",
              link.textColor,
              link.color,
              "hover:text-white"
            )}
            title={link.label}
          >
            <Icon size={20} className="transition-transform group-hover/item:scale-110" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block whitespace-nowrap overflow-hidden">
              {link.label}
            </span>
          </motion.a>
        );
      })}
    </div>
  );
}
