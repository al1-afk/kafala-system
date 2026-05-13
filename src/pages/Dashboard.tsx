import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Baby,
  Building2,
  Wallet,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  Cake,
  Plus,
  ArrowLeft,
  GraduationCap,
  CalendarDays,
  PieChart as PieIcon,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { useSettingsStore } from "../stores/settingsStore";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { PhotoDisplay } from "../components/ui/PhotoUpload";
import { calculateAge, formatDate } from "../lib/utils";
import { computeFamilyScore } from "../lib/indicators";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Dashboard() {
  const { families, orphans, registrations, workshops, savings, parents, housings, schoolings } = useDataStore();
  const { params } = useSettingsStore();

  const stats = useMemo(() => {
    const active = families.filter((f) => f.statut === "نشيط").length;
    const closed = families.filter((f) => f.statut === "مغلق").length;
    const suspended = families.filter((f) => f.statut === "معلق").length;
    const activeRegistrations = registrations.filter((r) => r.actif).length;
    const familiesInWorkshops = new Set(
      registrations
        .filter((r) => r.actif)
        .map((r) => orphans.find((o) => o.id === r.orphanId)?.familyId)
        .filter(Boolean)
    ).size;
    const totalSavings = savings.reduce((sum, s) => sum + s.montant, 0);
    return {
      total: families.length,
      active,
      closed,
      suspended,
      orphansTotal: orphans.length,
      registrations: activeRegistrations,
      familiesInWorkshops,
      totalSavings,
    };
  }, [families, orphans, registrations, savings]);

  const statusData = [
    { name: "نشيط", value: stats.active, color: "#229150" },
    { name: "معلق", value: stats.suspended, color: "#f39200" },
    { name: "مغلق", value: stats.closed, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const workshopData = useMemo(() => {
    return workshops
      .filter((w) => w.active)
      .map((w) => ({
        name: w.nom,
        count: registrations.filter((r) => r.actif && r.workshopId === w.id).length,
        capacity: w.capaciteMax,
      }));
  }, [workshops, registrations]);

  const hasWorkshopRegistrations = workshopData.some((w) => w.count > 0);

  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const next30 = new Date();
    next30.setDate(next30.getDate() + 30);
    return orphans
      .map((o) => {
        if (!o.dateNaissance) return null;
        const birth = new Date(o.dateNaissance);
        const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        if (next < today) next.setFullYear(today.getFullYear() + 1);
        if (next > next30) return null;
        const daysUntil = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { orphan: o, date: next, daysUntil };
      })
      .filter(Boolean)
      .sort((a, b) => a!.date.getTime() - b!.date.getTime())
      .slice(0, 5) as { orphan: typeof orphans[0]; date: Date; daysUntil: number }[];
  }, [orphans]);

  const alerts = useMemo(() => {
    const out: { type: "warning" | "info" | "danger"; msg: string; link?: string }[] = [];
    families.forEach((f) => {
      const fOrphans = orphans.filter((o) => o.familyId === f.id);
      if (f.statut === "نشيط" && fOrphans.length === 0) {
        out.push({
          type: "warning",
          msg: `الملف ${f.numeroDossier} (${f.nomFamille}) لا يحتوي على أيتام`,
          link: `/families/${f.id}`,
        });
      }
      const upgrade = new Date(f.updatedAt);
      const monthsSince = (Date.now() - upgrade.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsSince > 6 && f.statut === "نشيط") {
        out.push({
          type: "info",
          msg: `الملف ${f.numeroDossier} يحتاج تحديثا (${Math.floor(monthsSince)} أشهر)`,
          link: `/families/${f.id}`,
        });
      }
    });
    return out.slice(0, 4);
  }, [families, orphans]);

  const topFamilies = useMemo(() => {
    return families
      .map((f) => {
        const fOrphans = orphans.filter((o) => o.familyId === f.id);
        const fParents = parents.filter((p) => p.familyId === f.id);
        const fHousing = housings.find((h) => h.familyId === f.id) || null;
        const fSavings = savings.filter((s) => s.familyId === f.id);
        const orphanIds = fOrphans.map((o) => o.id);
        const fSchoolings = schoolings.filter((s) => orphanIds.includes(s.orphanId));
        const score = computeFamilyScore({
          family: f,
          orphans: fOrphans,
          parents: fParents,
          housing: fHousing,
          savings: fSavings,
          schoolings: fSchoolings,
          params,
        });
        return { family: f, total: score.total + f.pointMoctab, classification: score.classification };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [families, orphans, parents, housings, savings, schoolings, params]);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background:
            "linear-gradient(135deg, #0e6e37 0%, #187f43 45%, #005020 100%)",
        }}
        className="relative overflow-hidden rounded-2xl p-5 lg:p-7 shadow-xl"
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-orange-400/20 blur-3xl pointer-events-none -translate-y-1/3 -translate-x-1/3" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_30%,_rgba(255,255,255,0.08),_transparent_50%)] pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-20 h-20 rounded-2xl bg-white shadow-2xl p-2.5 items-center justify-center shrink-0 ring-4 ring-white/20">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="جمعية بسمة"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-orange-300 text-xs font-bold tracking-wider mb-1">
                جمعية بسمة للتنمية البشرية، كفالة ورعاية اليتيم
              </p>
              <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight text-white" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
                لوحة القيادة
              </h1>
              <p className="text-white/85 text-sm mt-1.5 font-medium">
                نظرة شاملة على نشاط الجمعية وحالة الملفات
              </p>
            </div>
          </div>
          <Link to="/families/new">
            <button
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg, #ff9d29 0%, #f39200 100%)",
                color: "white",
              }}
            >
              <Plus className="w-4 h-4" />
              ملف جديد
            </button>
          </Link>
        </div>
      </motion.div>

      {/* KPI Grid - cleaner, branded */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        <KpiTile
          icon={<Users className="w-5 h-5" />}
          label="الملفات"
          value={stats.total}
          sublabel={`${stats.active} نشيط · ${stats.suspended} معلق`}
          color="green"
        />
        <KpiTile
          icon={<Baby className="w-5 h-5" />}
          label="الأيتام"
          value={stats.orphansTotal}
          sublabel="مسجلون"
          color="orange"
        />
        <KpiTile
          icon={<ClipboardList className="w-5 h-5" />}
          label="تسجيلات الورشات"
          value={stats.registrations}
          sublabel={`${stats.familiesInWorkshops} أسرة`}
          color="amber"
        />
        <KpiTile
          icon={<Wallet className="w-5 h-5" />}
          label="الادخار"
          value={`${stats.totalSavings.toLocaleString()}`}
          sublabel="درهم مغربي"
          color="violet"
        />
        <KpiTile
          icon={<Building2 className="w-5 h-5" />}
          label="ملفات معلقة"
          value={stats.suspended}
          sublabel="تحتاج متابعة"
          color="rose"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieIcon className="w-5 h-5 text-emerald-600" />
              حالات الملفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <ChartEmpty icon={<PieIcon />} title="لا توجد بيانات" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={48}
                      paddingAngle={2}
                      label={(entry) => `${entry.value}`}
                    >
                      {statusData.map((d, i) => (
                        <Cell key={i} fill={d.color} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {statusData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{d.name}</span>
                      <span className="text-slate-500 dark:text-slate-400">({d.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              التسجيلات بالورشات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workshopData.length === 0 ? (
              <ChartEmpty icon={<ClipboardList />} title="لا توجد ورشات" />
            ) : !hasWorkshopRegistrations ? (
              <div className="space-y-3">
                <ChartEmpty
                  icon={<ClipboardList />}
                  title="لا توجد تسجيلات بعد"
                  description={`${workshopData.length} ورشات جاهزة لاستقبال اليتامى`}
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {workshopData.slice(0, 6).map((w) => (
                    <div
                      key={w.name}
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs"
                    >
                      <p className="font-medium truncate">{w.name}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">السعة: {w.capacity}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={workshopData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={{ fill: "rgba(34, 145, 80, 0.08)" }} />
                  <Bar dataKey="count" fill="#229150" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              التنبيهات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center text-center py-6 text-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 mb-2">
                  ✓
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium">كل شيء على ما يرام</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">لا توجد تنبيهات حاليا</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {alerts.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p>{a.msg}</p>
                      {a.link && (
                        <Link
                          to={a.link}
                          className="text-emerald-600 hover:underline text-xs mt-1 inline-flex items-center gap-1"
                        >
                          عرض الملف <ArrowLeft className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cake className="w-5 h-5 text-pink-500" />
              أعياد ميلاد قادمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <div className="flex flex-col items-center py-6">
                <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد أعياد خلال 30 يوما</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {upcomingBirthdays.map(({ orphan, date, daysUntil }) => (
                  <li
                    key={orphan.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <PhotoDisplay src={orphan.photo} name={`${orphan.prenom} ${orphan.nomFamille}`} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/families/${orphan.familyId}`}
                        className="font-medium text-sm hover:text-emerald-600 truncate block"
                      >
                        {orphan.prenom} {orphan.nomFamille}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {calculateAge(orphan.dateNaissance) ?? "—"} سنة
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <Badge variant={daysUntil <= 7 ? "warning" : "neutral"}>
                        {daysUntil === 0 ? "اليوم" : `${daysUntil} ي`}
                      </Badge>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {formatDate(date.toISOString())}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top Families */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              أعلى الملفات حسب المؤشر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topFamilies.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">لا توجد ملفات</p>
            ) : (
              <ul className="space-y-2">
                {topFamilies.map(({ family, total, classification }, i) => (
                  <li
                    key={family.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                        i === 0
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : i === 1
                          ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                          : i === 2
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/families/${family.id}`}
                        className="font-medium text-sm hover:text-emerald-600 truncate block"
                      >
                        {family.nomFamille}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ملف #{family.numeroDossier}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-base leading-none">
                        {total.toFixed(2)}
                      </p>
                      <Badge
                        variant={
                          classification === "ممتاز"
                            ? "success"
                            : classification === "جيد"
                            ? "info"
                            : classification === "متوسط"
                            ? "warning"
                            : "danger"
                        }
                        className="mt-1 text-[10px]"
                      >
                        {classification}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: "/families", label: "إدارة الملفات", icon: <Users className="w-5 h-5" /> },
          { to: "/orphans", label: "إدارة الأيتام", icon: <Baby className="w-5 h-5" /> },
          { to: "/workshops", label: "تدبير الورشات", icon: <ClipboardList className="w-5 h-5" /> },
          { to: "/schooling", label: "تمدرس اليتامى", icon: <GraduationCap className="w-5 h-5" /> },
        ].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-600 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                {l.icon}
              </div>
              <span className="font-medium text-sm truncate">{l.label}</span>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  color: "green" | "orange" | "amber" | "violet" | "rose";
}) {
  const colorMap = {
    green: { bg: "linear-gradient(135deg, #229150 0%, #0e6e37 100%)", ring: "ring-emerald-500/10" },
    orange: { bg: "linear-gradient(135deg, #ff9d29 0%, #d97f00 100%)", ring: "ring-orange-500/10" },
    amber: { bg: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)", ring: "ring-amber-500/10" },
    violet: { bg: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", ring: "ring-violet-500/10" },
    rose: { bg: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)", ring: "ring-rose-500/10" },
  };
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-sm hover:shadow-md transition-shadow ring-1 ${c.ring}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow"
          style={{ background: c.bg }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">{label}</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight mt-0.5">{value}</p>
          {sublabel && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">{sublabel}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ChartEmpty({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
        {icon}
      </div>
      <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">{title}</p>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
      )}
    </div>
  );
}
