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
} from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { useSettingsStore } from "../stores/settingsStore";
import { KpiCard } from "../components/ui/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
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
    { name: "نشيط", value: stats.active, color: "#22c55e" },
    { name: "معلق", value: stats.suspended, color: "#f59e0b" },
    { name: "مغلق", value: stats.closed, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const natureData = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of families) {
      map.set(f.natureDossier, (map.get(f.natureDossier) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [families]);

  const workshopData = useMemo(() => {
    return workshops
      .filter((w) => w.active)
      .map((w) => ({
        name: w.nom,
        count: registrations.filter((r) => r.actif && r.workshopId === w.id).length,
      }));
  }, [workshops, registrations]);

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
        return { orphan: o, date: next };
      })
      .filter(Boolean)
      .sort((a, b) => a!.date.getTime() - b!.date.getTime())
      .slice(0, 5) as { orphan: typeof orphans[0]; date: Date }[];
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
          msg: `الملف ${f.numeroDossier} يحتاج إلى تحديث (${Math.floor(monthsSince)} أشهر)`,
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">لوحة القيادة</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            نظرة شاملة على نشاط الجمعية وحالة الملفات
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/families/new">
            <Button>
              <Plus className="w-4 h-4" />
              ملف جديد
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={<Users className="w-5 h-5" />}
          label="إجمالي الملفات"
          value={stats.total}
          trend={`${stats.active} نشيط`}
          gradient="from-emerald-500 to-emerald-700"
        />
        <KpiCard
          icon={<Baby className="w-5 h-5" />}
          label="الأيتام"
          value={stats.orphansTotal}
          gradient="from-sky-500 to-sky-700"
        />
        <KpiCard
          icon={<ClipboardList className="w-5 h-5" />}
          label="التسجيلات بالورشات"
          value={stats.registrations}
          trend={`${stats.familiesInWorkshops} أسرة`}
          gradient="from-amber-500 to-amber-700"
        />
        <KpiCard
          icon={<Wallet className="w-5 h-5" />}
          label="إجمالي الادخار"
          value={`${stats.totalSavings.toLocaleString()} د.م`}
          gradient="from-violet-500 to-violet-700"
        />
        <KpiCard
          icon={<Building2 className="w-5 h-5" />}
          label="ملفات معلقة"
          value={stats.suspended}
          gradient="from-rose-500 to-rose-700"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>توزيع حالات الملفات</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <EmptyState title="لا توجد بيانات" description="أضف ملفات لرؤية الإحصائيات" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} label>
                    {statusData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>التسجيلات بالورشات</CardTitle>
          </CardHeader>
          <CardContent>
            {workshopData.length === 0 ? (
              <EmptyState title="لا توجد ورشات" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={workshopData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#16a34a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              التنبيهات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                لا توجد تنبيهات
              </p>
            ) : (
              <ul className="space-y-2">
                {alerts.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p>{a.msg}</p>
                      {a.link && (
                        <Link to={a.link} className="text-emerald-600 hover:underline text-xs mt-1 inline-block">
                          عرض الملف ←
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="w-5 h-5 text-pink-500" />
              أعياد ميلاد قادمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                لا توجد أعياد قريبة
              </p>
            ) : (
              <ul className="space-y-2">
                {upcomingBirthdays.map(({ orphan, date }) => (
                  <li key={orphan.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm">
                    <div>
                      <Link to={`/families/${orphan.familyId}`} className="font-medium hover:text-emerald-600">
                        {orphan.prenom} {orphan.nomFamille}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {calculateAge(orphan.dateNaissance) ?? "—"} سنة
                      </p>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {formatDate(date.toISOString())}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              أعلى الملفات حسب المؤشر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topFamilies.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                لا توجد ملفات
              </p>
            ) : (
              <ul className="space-y-2">
                {topFamilies.map(({ family, total, classification }) => (
                  <li
                    key={family.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="min-w-0">
                      <Link to={`/families/${family.id}`} className="font-medium text-sm hover:text-emerald-600 truncate block">
                        {family.nomFamille} (#{family.numeroDossier})
                      </Link>
                      <Badge variant={
                        classification === "ممتاز" ? "success" : classification === "جيد" ? "info" : classification === "متوسط" ? "warning" : "danger"
                      } className="mt-1">
                        {classification}
                      </Badge>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{total.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">نقطة</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: "/families", label: "إدارة الملفات", icon: <Users className="w-5 h-5" /> },
          { to: "/orphans", label: "إدارة الأيتام", icon: <Baby className="w-5 h-5" /> },
          { to: "/workshops", label: "تدبير الورشات", icon: <ClipboardList className="w-5 h-5" /> },
          { to: "/schooling", label: "تمدرس اليتامى", icon: <GraduationCap className="w-5 h-5" /> },
        ].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-600 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                {l.icon}
              </div>
              <span className="font-medium text-sm">{l.label}</span>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
