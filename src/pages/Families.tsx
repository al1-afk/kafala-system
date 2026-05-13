import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Trash2, Eye, Pencil, Download, Filter, X } from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { useAuthStore, canEdit } from "../stores/authStore";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { EmptyState } from "../components/ui/EmptyState";
import { PhotoDisplay } from "../components/ui/PhotoUpload";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { formatDate, downloadCSV } from "../lib/utils";
import { toast } from "../components/ui/Toast";

export default function Families() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [natureFilter, setNatureFilter] = useState<string>("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { families, orphans, deleteFamily } = useDataStore();
  const { currentUser } = useAuthStore();

  const filtered = useMemo(() => {
    let arr = [...families];
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      arr = arr.filter(
        (f) =>
          f.nomFamille.toLowerCase().includes(lower) ||
          f.responsable.fullName.toLowerCase().includes(lower) ||
          f.responsable.cin.toLowerCase().includes(lower) ||
          String(f.numeroDossier).includes(lower) ||
          f.telephone?.includes(lower)
      );
    }
    if (statusFilter !== "all") arr = arr.filter((f) => f.statut === statusFilter);
    if (natureFilter !== "all") arr = arr.filter((f) => f.natureDossier === natureFilter);
    return arr.sort((a, b) => b.numeroDossier - a.numeroDossier);
  }, [families, q, statusFilter, natureFilter]);

  const handleSearch = (val: string) => {
    setQ(val);
    if (val) setSearchParams({ q: val });
    else setSearchParams({});
  };

  const handleDelete = () => {
    if (!confirmId) return;
    deleteFamily(confirmId, currentUser?.id, currentUser?.username);
    toast.success("تم حذف الملف");
    setConfirmId(null);
  };

  const handleExport = () => {
    if (!filtered.length) return toast.error("لا توجد بيانات للتصدير");
    const rows = filtered.map((f) => ({
      "رقم الملف": f.numeroDossier,
      "تاريخ التسجيل": f.dateEnregistrement,
      "اسم العائلة": f.nomFamille,
      "اسم المكلف": f.responsable.fullName,
      "ر.ب.و.ث": f.responsable.cin,
      "الهاتف": f.telephone,
      "طبيعة الملف": f.natureDossier,
      "نوع الكفالة": f.kafalaType,
      "حالة الملف": f.statut,
      "عدد الأيتام": orphans.filter((o) => o.familyId === f.id).length,
    }));
    downloadCSV(`families-${Date.now()}`, rows);
    toast.success("تم تصدير الملفات");
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">ملفات الأسر</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {filtered.length} من أصل {families.length} ملف
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4" />
            تصدير
          </Button>
          {canEdit(currentUser?.role) && (
            <Link to="/families/new">
              <Button>
                <Plus className="w-4 h-4" />
                ملف جديد
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="البحث بالاسم، الرقم، رقم البطاقة..."
                className="w-full pr-10 pl-10 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-sm"
              />
              {q && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">كل الحالات</option>
              <option value="نشيط">نشيط</option>
              <option value="معلق">معلق</option>
              <option value="مغلق">مغلق</option>
            </Select>
            <Select value={natureFilter} onChange={(e) => setNatureFilter(e.target.value)}>
              <option value="all">كل أنواع الملفات</option>
              <option value="كفالة شهرية">كفالة شهرية</option>
              <option value="كفالة عامة">كفالة عامة</option>
              <option value="حماية القاصر">حماية القاصر</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-7 h-7" />}
          title={families.length === 0 ? "لا توجد ملفات بعد" : "لا توجد نتائج"}
          description={
            families.length === 0
              ? "ابدأ بإضافة ملف جديد لإدارة بيانات الأسرة والأيتام."
              : "حاول تعديل مصطلحات البحث أو المرشحات."
          }
          action={
            families.length === 0 && canEdit(currentUser?.role) ? (
              <Link to="/families/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  إضافة أول ملف
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((f) => {
              const orphanCount = orphans.filter((o) => o.familyId === f.id).length;
              return (
                <Link
                  key={f.id}
                  to={`/families/${f.id}`}
                  className="block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <PhotoDisplay src={f.responsable.photo} name={f.responsable.fullName} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          #{f.numeroDossier}
                        </span>
                        <span className="font-bold text-base truncate">{f.nomFamille}</span>
                        <Badge
                          variant={
                            f.statut === "نشيط" ? "success" : f.statut === "معلق" ? "warning" : "danger"
                          }
                        >
                          {f.statut}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 truncate">
                        {f.responsable.fullName}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-2 text-xs">
                        <Badge variant="info" className="text-[10px]">{f.natureDossier}</Badge>
                        <span className="text-slate-500 dark:text-slate-400">
                          {orphanCount} يتيم · {formatDate(f.dateEnregistrement)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <Table>
              <THead>
                <tr>
                  <TH>رقم الملف</TH>
                  <TH>تاريخ التسجيل</TH>
                  <TH>اسم العائلة</TH>
                  <TH>اسم المكلف</TH>
                  <TH>الهاتف</TH>
                  <TH>طبيعة الملف</TH>
                  <TH>الأيتام</TH>
                  <TH>الحالة</TH>
                  <TH className="text-left">إجراءات</TH>
                </tr>
              </THead>
              <TBody>
                {filtered.map((f) => {
                  const orphanCount = orphans.filter((o) => o.familyId === f.id).length;
                  return (
                    <TR key={f.id}>
                      <TD className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        #{f.numeroDossier}
                      </TD>
                      <TD className="text-slate-600 dark:text-slate-400">{formatDate(f.dateEnregistrement)}</TD>
                      <TD className="font-medium">{f.nomFamille}</TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <PhotoDisplay src={f.responsable.photo} name={f.responsable.fullName} size="sm" />
                          <span>{f.responsable.fullName}</span>
                        </div>
                      </TD>
                      <TD className="font-mono text-sm">{f.telephone || "—"}</TD>
                      <TD>
                        <Badge variant="info">{f.natureDossier}</Badge>
                      </TD>
                      <TD className="text-center font-semibold">{orphanCount}</TD>
                      <TD>
                        <Badge
                          variant={
                            f.statut === "نشيط" ? "success" : f.statut === "معلق" ? "warning" : "danger"
                          }
                        >
                          {f.statut}
                        </Badge>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-1 justify-start">
                          <Link to={`/families/${f.id}`}>
                            <Button size="icon" variant="ghost" title="عرض">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {canEdit(currentUser?.role) && (
                            <>
                              <Link to={`/families/${f.id}/edit`}>
                                <Button size="icon" variant="ghost" title="تعديل">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                title="حذف"
                                onClick={() => setConfirmId(f.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(v) => !v && setConfirmId(null)}
        title="حذف الملف"
        description="سيتم حذف الملف وجميع البيانات المرتبطة به (الأبوين، الأيتام، السكن، الادخار...). لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف نهائي"
        onConfirm={handleDelete}
      />
    </div>
  );
}
