import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Baby,
  BookOpen,
  Settings,
  LogOut,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  Home,
  BarChart3,
  Sprout,
  Wallet,
  ListChecks,
  Building2,
  Package,
  ClipboardList,
  ChevronLeft,
} from "lucide-react";
import { useAuthStore, roleLabels } from "../stores/authStore";
import { useSettingsStore } from "../stores/settingsStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { toast } from "./ui/Toast";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", label: "لوحة القيادة", icon: <LayoutDashboard className="w-5 h-5" />, end: true },
  { to: "/families", label: "الملفات", icon: <Home className="w-5 h-5" /> },
  { to: "/families/new", label: "ملف جديد", icon: <Users className="w-5 h-5" /> },
  { to: "/parents", label: "الأبوين", icon: <Users className="w-5 h-5" /> },
  { to: "/orphans", label: "اليتامى", icon: <Baby className="w-5 h-5" /> },
  { to: "/schooling", label: "تمدرس اليتامى", icon: <BookOpen className="w-5 h-5" /> },
  { to: "/workshops", label: "تدبير الورشات", icon: <ClipboardList className="w-5 h-5" /> },
  { to: "/classification", label: "تصنيف الملفات", icon: <BarChart3 className="w-5 h-5" /> },
  { to: "/indicators", label: "بيان المؤشرات", icon: <BarChart3 className="w-5 h-5" /> },
  { to: "/housing", label: "السكن", icon: <Building2 className="w-5 h-5" /> },
  { to: "/savings", label: "الادخار", icon: <Wallet className="w-5 h-5" /> },
  { to: "/equipment", label: "التجهيزات", icon: <Package className="w-5 h-5" /> },
  { to: "/settings/indicators", label: "ضبط المؤشرات", icon: <ListChecks className="w-5 h-5" /> },
  { to: "/settings", label: "الإعدادات", icon: <Settings className="w-5 h-5" /> },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { currentUser, logout } = useAuthStore();
  const { theme, toggleTheme } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/families?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100" dir="rtl">
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden no-print"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-40 transform transition-transform duration-300 lg:translate-x-0 no-print",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Brand */}
          <div
            className="px-4 py-4 border-b border-slate-200 dark:border-slate-800"
            style={{
              background:
                "linear-gradient(to left, rgba(34, 145, 80, 0.08), transparent)",
            }}
          >
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="جمعية بسمة"
                className="h-14 w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <p
                  className="font-extrabold text-sm leading-tight truncate"
                  style={{ color: "#0e6e37" }}
                >
                  جمعية بسمة
                </p>
                <p
                  className="text-[11px] font-bold leading-tight"
                  style={{ color: "#d97f00" }}
                >
                  للتنمية البشرية
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  كفالة ورعاية اليتيم
                </p>
              </div>
            </Link>
          </div>

          {/* User info */}
          {currentUser && (
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{currentUser.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabels[currentUser.role]}</p>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                    isActive
                      ? "text-emerald-800 dark:text-emerald-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                        background:
                          "linear-gradient(to left, rgba(34, 145, 80, 0.12), rgba(34, 145, 80, 0.02))",
                        borderRight: "3px solid #229150",
                      }
                    : {}
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      style={isActive ? { color: "#187f43" } : undefined}
                      className={!isActive ? "text-slate-500 dark:text-slate-400" : ""}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronLeft className="w-4 h-4" style={{ color: "#229150" }} />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer actions */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:mr-72 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print">
          <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="فتح القائمة"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث عن ملف، اسم، رقم..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border-0 rounded-lg pr-10 pl-4 py-2 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
                />
              </div>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>

        <footer className="px-4 lg:px-6 py-4 border-t border-slate-200 dark:border-slate-800 text-center no-print">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="جمعية بسمة"
              className="h-6 w-auto object-contain opacity-70"
            />
            <span>
              <strong className="text-brand-700 dark:text-brand-300">جمعية بسمة للتنمية البشرية</strong>
              <span className="mx-1.5">·</span>
              كفالة ورعاية اليتيم - الكردان الكبير
              <span className="mx-1.5">·</span>
              © {new Date().getFullYear()}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
