import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Sprout, User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/Button";
import { toast } from "../components/ui/Toast";

interface LoginForm {
  username: string;
  password: string;
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const res = login(data.username.trim(), data.password);
    setLoading(false);
    if (res.ok) {
      toast.success("مرحبا بك في نظام الكفالة");
      navigate("/", { replace: true });
    } else {
      toast.error(res.error || "خطأ في تسجيل الدخول");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-sky-200/30 dark:bg-sky-900/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3"
            >
              <Sprout className="w-9 h-9" />
            </motion.div>
            <h1 className="text-2xl font-bold">نظام الكفالة</h1>
            <p className="text-emerald-100 text-sm mt-1">إدارة دعم الأيتام</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">اسم المستخدم</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  {...register("username", { required: "اسم المستخدم مطلوب" })}
                  placeholder="admin"
                  className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-600 mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", { required: "كلمة المرور مطلوبة" })}
                  placeholder="••••"
                  className="w-full pr-10 pl-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  aria-label="عرض كلمة المرور"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              تسجيل الدخول
            </Button>
          </form>

          <div className="px-6 pb-6">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center space-y-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="font-medium text-slate-700 dark:text-slate-300">حسابات تجريبية</p>
              <p><span className="font-mono">admin</span> / <span className="font-mono">modp</span> — مدير</p>
              <p><span className="font-mono">assistante</span> / <span className="font-mono">assist123</span> — مسؤولة ملفات</p>
              <p><span className="font-mono">lecteur</span> / <span className="font-mono">view123</span> — قارئ</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
