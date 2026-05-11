import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Search, Download, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { useSettingsStore } from "../stores/settingsStore";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { computeFamilyScore } from "../lib/indicators";
import { downloadCSV } from "../lib/utils";
import { toast } from "../components/ui/Toast";

export default function Classification() {
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { params } = useSettingsStore();
  const { families, orphans, parents, housings, savings, schoolings } = useDataStore();

  const rows = useMemo(() => {
    const computed = families.map((f) => {
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
      return { family: f, score, total: score.total + f.pointMoctab };
    });

    let arr = computed;
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      arr = arr.filter(
        (r) =>
          r.family.nomFamille.toLowerCase().includes(lower) ||
          r.family.responsable.fullName.toLowerCase().includes(lower) ||
          r.family.responsable.cin.toLowerCase().includes(lower) ||
          String(r.family.numeroDossier).includes(lower)
      );
    }
    if (classFilter !== "all") arr = arr.filter((r) => r.score.classification === classFilter);
    if (statusFilter !== "all") arr = arr.filter((r) => r.family.statut === statusFilter);
    arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [families, orphans, parents, housings, savings, schoolings, params, q, classFilter, statusFilter]);

  const handleExport = () => {
    if (!rows.length) return toast.error("لا توجد بيانات");
    downloadCSV(
      `classification-${Date.now()}`,
      rows.map((r) => ({
        "رقم الملف": r.family.numeroDossier,
        "اسم العائلة": r.family.nomFamille,
        "اسم المكلف": r.family.responsable.fullName,
        "ر.ب.و.ث": r.family.responsable.cin,
        "الهاتف": r.family.telephone,
        "طبيعة الملف": r.family.natureDossier,
        "نوع الكفالة": r.family.kafalaType,
        "المؤشر العام": r.total.toFixed(2),
        "نقطة المكتب": r.family.pointMoctab,
        "حالة الملف": r.family.statut,
        "التصنيف": r.score.classification,
      }))
    );
    toast.success("تم التصدير");
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">تصنيف الملفات</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ترتيب الملفات حسب المؤشر العام (تصاعديا)
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </motion.div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث..."
                className="w-full pr-10 pl-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="all">كل التصنيفات</option>
              <option value="ممتاز">ممتاز</option>
              <option value="جيد">جيد</option>
              <option value="متوسط">متوسط</option>
              <option value="ضعيف">ضعيف</option>
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">كل الحالات</option>
              <option value="نشيط">نشيط</option>
              <option value="معلق">معلق</option>
              <option value="مغلق">مغلق</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-7 h-7" />}
          title="لا توجد ملفات"
          description="ابدأ بإنشاء ملفات لرؤية التصنيف."
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>الترتيب</TH>
              <TH>رقم الملف</TH>
              <TH>اسم العائلة</TH>
              <TH>اسم المكلف</TH>
              <TH>ر.ب.و.ث</TH>
              <TH>الهاتف</TH>
              <TH>طبيعة الملف</TH>
              <TH>نوع الكفالة</TH>
              <TH>المؤشر العام</TH>
              <TH>نقطة المكتب</TH>
              <TH>حالة الملف</TH>
              <TH>التصنيف</TH>
              <TH className="text-left">إجراء</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r, i) => (
              <TR key={r.family.id}>
                <TD className="font-bold text-slate-500">{i + 1}</TD>
                <TD className="font-mono font-semibold">#{r.family.numeroDossier}</TD>
                <TD className="font-medium">{r.family.nomFamille}</TD>
                <TD>{r.family.responsable.fullName}</TD>
                <TD className="font-mono text-xs">{r.family.responsable.cin || "—"}</TD>
                <TD className="font-mono text-xs">{r.family.telephone || "—"}</TD>
                <TD>{r.family.natureDossier}</TD>
                <TD>{r.family.kafalaType}</TD>
                <TD>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                    {r.total.toFixed(2)}
                  </span>
                </TD>
                <TD>{r.family.pointMoctab.toFixed(2)}</TD>
                <TD>
                  <Badge
                    variant={r.family.statut === "نشيط" ? "success" : r.family.statut === "معلق" ? "warning" : "danger"}
                  >
                    {r.family.statut}
                  </Badge>
                </TD>
                <TD>
                  <Badge
                    variant={
                      r.score.classification === "ممتاز"
                        ? "success"
                        : r.score.classification === "جيد"
                        ? "info"
                        : r.score.classification === "متوسط"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {r.score.classification}
                  </Badge>
                </TD>
                <TD>
                  <Link to={`/families/${r.family.id}`}>
                    <Button size="icon" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
