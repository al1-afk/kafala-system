import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  gradient?: string;
  className?: string;
}

export function KpiCard({ icon, label, value, trend, gradient = "from-emerald-500 to-emerald-700", className }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm p-4 dark:border-slate-800 dark:bg-slate-900 relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">{label}</p>
          <p className="text-2xl md:text-3xl font-bold mt-1 text-slate-900 dark:text-slate-100">{value}</p>
          {trend && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{trend}</p>}
        </div>
        <div className={cn("h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0", gradient)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
