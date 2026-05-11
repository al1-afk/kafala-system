import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Search, Download, BarChart3 } from "lucide-react";
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

export default function IndicatorsView() {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<"total" | "numero">("total");
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
          String(r.family.numeroDossier).includes(lower)
      );
    }
    arr.sort((a, b) => {
      if (sortKey === "total") return b.total - a.total;
      return a.family.numeroDossier - b.family.numeroDossier;
    });
    return arr;
  }, [families, orphans, parents, housings, savings, schoolings, params, q, sortKey]);

  const handleExport = () => {
    if (!rows.length) return toast.error("لا توجد بيانات");
    downloadCSV(
      `indicators-${Date.now()}`,
      rows.map((r) => ({
        "رقم الملف": r.family.numeroDossier,
        "اسم العائلة": r.family.nomFamille,
        "اسم المكلف": r.family.responsable.fullName,
        "نوع الكفالة": r.family.kafalaType,
        "نقطة السن": r.score.ageScore,
        "نقطة الصحة": r.score.healthScore,
        "نقطة الكفالة": r.score.kafalaScore,
        "نقطة السكن": r.score.housingScore,
        "نقطة الادخار": r.score.savingsScore,
        "نقطة التمدرس": r.score.schoolingScore,
        "نقطة المكتب": r.family.pointMoctab,
        "المؤشر العام": r.total.toFixed(2),
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
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            بيان المؤشرات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            تفاصيل المؤشر الاجتماعي لكل ملف
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </motion.div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث بالاسم أو رقم الملف..."
                className="w-full pr-10 pl-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
              <option value="total">ترتيب حسب المؤشر</option>
              <option value="numero">ترتيب حسب رقم الملف</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="لا توجد ملفات"
          description="ابدأ بإنشاء ملف جديد لعرض المؤشرات."
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>رقم الملف</TH>
              <TH>اسم العائلة</TH>
              <TH>السن</TH>
              <TH>الصحة</TH>
              <TH>الكفالة</TH>
              <TH>السكن</TH>
              <TH>الادخار</TH>
              <TH>التمدرس</TH>
              <TH>المكتب</TH>
              <TH>المؤشر العام</TH>
              <TH>التصنيف</TH>
              <TH className="text-left">إجراءات</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.family.id}>
                <TD className="font-mono font-semibold">#{r.family.numeroDossier}</TD>
                <TD className="font-medium">{r.family.nomFamille}</TD>
                <TD>{r.score.ageScore.toFixed(2)}</TD>
                <TD>{r.score.healthScore.toFixed(2)}</TD>
                <TD>{r.score.kafalaScore.toFixed(2)}</TD>
                <TD>{r.score.housingScore.toFixed(2)}</TD>
                <TD>{r.score.savingsScore.toFixed(2)}</TD>
                <TD>{r.score.schoolingScore.toFixed(2)}</TD>
                <TD>{r.family.pointMoctab.toFixed(2)}</TD>
                <TD>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {r.total.toFixed(2)}
                  </span>
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
