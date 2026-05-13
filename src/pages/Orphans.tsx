import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Plus, Search, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { useAuthStore, canEdit } from "../stores/authStore";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { PhotoDisplay } from "../components/ui/PhotoUpload";
import { calculateAge, downloadCSV, formatDate } from "../lib/utils";
import { toast } from "../components/ui/Toast";

export default function Orphans() {
  const [q, setQ] = useState("");
  const [sexFilter, setSexFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const { orphans, families } = useDataStore();
  const { currentUser } = useAuthStore();

  const rows = useMemo(() => {
    const enriched = orphans.map((o, i) => {
      const family = families.find((f) => f.id === o.familyId);
      return { rt: i + 1, orphan: o, family };
    });
    let arr = [...enriched];
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      arr = arr.filter(
        (r) =>
          r.orphan.prenom.toLowerCase().includes(lower) ||
          r.orphan.nomFamille.toLowerCase().includes(lower) ||
          String(r.family?.numeroDossier || "").includes(lower)
      );
    }
    if (sexFilter !== "all") arr = arr.filter((r) => r.orphan.sexe === sexFilter);
    if (healthFilter !== "all") arr = arr.filter((r) => r.orphan.health === healthFilter);
    return arr;
  }, [orphans, families, q, sexFilter, healthFilter]);

  const handleExport = () => {
    if (!rows.length) return toast.error("لا توجد بيانات");
    downloadCSV(
      `orphans-${Date.now()}`,
      rows.map((r) => ({
        "ر.ت": r.rt,
        "الاسم العائلي": r.orphan.nomFamille,
        "Nom de famille (FR)": r.orphan.nomFamilleFr || "",
        "الاسم الشخصي": r.orphan.prenom,
        "Prénom (FR)": r.orphan.prenomFr || "",
        "الجنس": r.orphan.sexe,
        "السن": calculateAge(r.orphan.dateNaissance) ?? "",
        "تاريخ الازدياد": r.orphan.dateNaissance,
        "مكان الازدياد": r.orphan.lieuNaissance,
        "العنوان": r.orphan.adresse || "",
        "Adresse (FR)": r.orphan.adresseFr || "",
        "المؤسسة": r.orphan.etablissement || "",
        "Établissement (FR)": r.orphan.etablissementFr || "",
        "الحالة الصحية": r.orphan.health,
        "رقم الملف": r.family?.numeroDossier || "",
        "طبيعة الملف": r.family?.natureDossier || "",
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
          <h1 className="text-2xl lg:text-3xl font-bold">تعريف اليتامى</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {rows.length} يتيم/يتيمة
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4" />
            تصدير
          </Button>
        </div>
      </motion.div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث بالاسم أو رقم الملف..."
                className="w-full pr-10 pl-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <Select value={sexFilter} onChange={(e) => setSexFilter(e.target.value)}>
              <option value="all">كل الجنسين</option>
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </Select>
            <Select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}>
              <option value="all">كل الحالات الصحية</option>
              <option value="سليم">سليم</option>
              <option value="مرض مزمن">مرض مزمن</option>
              <option value="إعاقة">إعاقة</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title={orphans.length === 0 ? "لا يوجد أيتام" : "لا توجد نتائج"}
          description="افتح ملفا وأضف الأيتام عبر تبويب اليتامى."
          action={
            canEdit(currentUser?.role) && families.length === 0 ? (
              <Link to="/families/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  ملف جديد
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>ر.ت</TH>
              <TH>الصورة</TH>
              <TH>الاسم العائلي</TH>
              <TH>الاسم الشخصي</TH>
              <TH>الجنس</TH>
              <TH>السن</TH>
              <TH>تاريخ الازدياد</TH>
              <TH>رقم الملف</TH>
              <TH>طبيعة الملف</TH>
              <TH>تاريخ التسجيل</TH>
              <TH>الحالة الصحية</TH>
              <TH className="text-left">إجراءات</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.orphan.id}>
                <TD className="font-mono text-slate-500">{r.rt}</TD>
                <TD>
                  <PhotoDisplay
                    src={r.orphan.photo}
                    name={`${r.orphan.prenom} ${r.orphan.nomFamille}`}
                    size="sm"
                  />
                </TD>
                <TD className="font-medium">{r.orphan.nomFamille}</TD>
                <TD className="font-medium">{r.orphan.prenom}</TD>
                <TD>
                  <Badge variant={r.orphan.sexe === "ذكر" ? "info" : "default"}>{r.orphan.sexe}</Badge>
                </TD>
                <TD>{calculateAge(r.orphan.dateNaissance) ?? "—"}</TD>
                <TD>{formatDate(r.orphan.dateNaissance)}</TD>
                <TD className="font-mono">#{r.family?.numeroDossier || "—"}</TD>
                <TD>{r.family?.natureDossier || "—"}</TD>
                <TD>{r.family ? formatDate(r.family.dateEnregistrement) : "—"}</TD>
                <TD>
                  <Badge variant={r.orphan.health === "سليم" ? "success" : r.orphan.health === "إعاقة" ? "danger" : "warning"}>
                    {r.orphan.health}
                  </Badge>
                </TD>
                <TD>
                  {r.family && (
                    <Link to={`/families/${r.family.id}`}>
                      <Button size="icon" variant="ghost" title="فتح الملف">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
