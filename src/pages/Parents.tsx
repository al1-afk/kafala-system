import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Plus, Search, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { useAuthStore, canEdit } from "../stores/authStore";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { PhotoDisplay } from "../components/ui/PhotoUpload";
import { calculateAge, downloadCSV, formatDate } from "../lib/utils";
import { toast } from "../components/ui/Toast";

export default function Parents() {
  const [q, setQ] = useState("");
  const { families, parents } = useDataStore();
  const { currentUser } = useAuthStore();

  const rows = useMemo(() => {
    const list = families.map((f) => {
      const parent = parents.find((p) => p.familyId === f.id);
      return { family: f, parent };
    });
    if (!q.trim()) return list;
    const lower = q.trim().toLowerCase();
    return list.filter((r) => {
      return (
        r.family.nomFamille.toLowerCase().includes(lower) ||
        r.parent?.pereNom?.toLowerCase().includes(lower) ||
        r.parent?.mereNom?.toLowerCase().includes(lower) ||
        r.parent?.mereCin?.toLowerCase().includes(lower) ||
        String(r.family.numeroDossier).includes(lower)
      );
    });
  }, [families, parents, q]);

  const handleExport = () => {
    if (!rows.length) return toast.error("لا توجد بيانات");
    downloadCSV(
      `parents-${Date.now()}`,
      rows.map((r) => ({
        "رقم الملف": r.family.numeroDossier,
        "تاريخ التسجيل": r.family.dateEnregistrement,
        "اسم العائلة": r.family.nomFamille,
        "اسم الأب": r.parent?.pereNom || "",
        "تاريخ ازدياد الأب": r.parent?.pereDateNaissance || "",
        "تاريخ وفاة الأب": r.parent?.pereDateDeces || "",
        "اسم الأم (الأرملة)": r.parent?.mereNom || "",
        "تاريخ ازدياد الأم": r.parent?.mereDateNaissance || "",
        "السن (الأم)": r.parent?.mereDateNaissance ? calculateAge(r.parent.mereDateNaissance) ?? "" : "",
        "ر.ب.و.ث": r.parent?.mereCin || "",
        "الحالة الصحية": r.parent?.mereSante || "",
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
          <h1 className="text-2xl lg:text-3xl font-bold">الأبوين</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            قائمة الأبوين لجميع الملفات
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
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث بالاسم، رقم الملف، رقم البطاقة..."
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title={families.length === 0 ? "لا توجد ملفات" : "لا توجد نتائج"}
          description="ابدأ بإنشاء ملف جديد لإضافة بيانات الأبوين."
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
              <TH>رقم الملف</TH>
              <TH>تاريخ التسجيل</TH>
              <TH>الاسم العائلي</TH>
              <TH>صورة الأب</TH>
              <TH>اسم الأب</TH>
              <TH>تاريخ الوفاة</TH>
              <TH>صورة الأم</TH>
              <TH>اسم الأرملة</TH>
              <TH>السن</TH>
              <TH>رقم ب.و.ث</TH>
              <TH>الحالة الصحية</TH>
              <TH className="text-left">إجراءات</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map(({ family, parent }) => (
              <TR key={family.id}>
                <TD className="font-mono">#{family.numeroDossier}</TD>
                <TD>{formatDate(family.dateEnregistrement)}</TD>
                <TD className="font-medium">{family.nomFamille}</TD>
                <TD>
                  <PhotoDisplay src={parent?.perePhoto} name={parent?.pereNom} size="sm" />
                </TD>
                <TD>{parent?.pereNom || "—"}</TD>
                <TD>{parent?.pereDateDeces ? formatDate(parent.pereDateDeces) : "—"}</TD>
                <TD>
                  <PhotoDisplay src={parent?.merePhoto} name={parent?.mereNom} size="sm" />
                </TD>
                <TD>{parent?.mereNom || "—"}</TD>
                <TD>{parent?.mereDateNaissance ? calculateAge(parent.mereDateNaissance) ?? "—" : "—"}</TD>
                <TD className="font-mono text-xs">{parent?.mereCin || "—"}</TD>
                <TD>
                  {parent?.mereSante ? (
                    <Badge variant={parent.mereSante === "سليم" ? "success" : parent.mereSante === "إعاقة" ? "danger" : "warning"}>
                      {parent.mereSante}
                    </Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TD>
                <TD>
                  <Link to={`/families/${family.id}`}>
                    <Button size="icon" variant="ghost" title="عرض الملف">
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
