import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search, Save, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { useAuthStore, canEdit } from "../stores/authStore";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Dialog, DialogFooter } from "../components/ui/Dialog";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { downloadCSV } from "../lib/utils";
import { toast } from "../components/ui/Toast";
import type { KafalaType, Schooling } from "../types";

interface FormValues {
  orphanId: string;
  anneeScolaire: string;
  etablissement: string;
  niveau: string;
  moyenne: number;
  kafalaType: KafalaType;
  telephone: string;
}

export default function SchoolingPage() {
  const [q, setQ] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Schooling }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { orphans, schoolings, families, upsertSchooling, deleteSchooling } = useDataStore();
  const { currentUser } = useAuthStore();
  const editable = canEdit(currentUser?.role);

  const rows = useMemo(() => {
    const enriched = schoolings.map((s) => {
      const orphan = orphans.find((o) => o.id === s.orphanId);
      const family = orphan ? families.find((f) => f.id === orphan.familyId) : undefined;
      return { sc: s, orphan, family };
    });
    if (!q.trim()) return enriched;
    const lower = q.trim().toLowerCase();
    return enriched.filter(
      (r) =>
        r.orphan?.prenom.toLowerCase().includes(lower) ||
        r.orphan?.nomFamille.toLowerCase().includes(lower) ||
        r.sc.etablissement.toLowerCase().includes(lower) ||
        r.sc.niveau.toLowerCase().includes(lower)
    );
  }, [schoolings, orphans, families, q]);

  const handleExport = () => {
    if (!rows.length) return toast.error("لا توجد بيانات");
    downloadCSV(
      `schooling-${Date.now()}`,
      rows.map((r) => ({
        "الاسم": r.orphan ? `${r.orphan.prenom} ${r.orphan.nomFamille}` : "—",
        "رقم الملف": r.family?.numeroDossier ?? "",
        "السنة الدراسية": r.sc.anneeScolaire,
        "المؤسسة": r.sc.etablissement,
        "المستوى": r.sc.niveau,
        "المعدل": r.sc.moyenne,
        "نوع الكفالة": r.sc.kafalaType,
        "الهاتف": r.sc.telephone,
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
          <h1 className="text-2xl lg:text-3xl font-bold">تمدرس اليتامى</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            متابعة المسار الدراسي للأيتام
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4" />
            تصدير
          </Button>
          {editable && (
            <Button onClick={() => setDialog({ open: true })} disabled={orphans.length === 0}>
              <Plus className="w-4 h-4" />
              تسجيل تمدرس
            </Button>
          )}
        </div>
      </motion.div>

      <Card>
        <CardContent className="pt-5">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث بالاسم أو المؤسسة..."
              className="w-full pr-10 pl-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="لا توجد تسجيلات تمدرس"
          description={orphans.length === 0 ? "أضف أيتاما أولا." : "ابدأ بتسجيل المسار الدراسي."}
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>اليتيم</TH>
              <TH>رقم الملف</TH>
              <TH>السنة الدراسية</TH>
              <TH>المؤسسة</TH>
              <TH>المستوى</TH>
              <TH>المعدل</TH>
              <TH>المنحة</TH>
              <TH>نوع الكفالة</TH>
              <TH>الهاتف</TH>
              {editable && <TH className="text-left">إجراءات</TH>}
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => {
              const mention =
                r.sc.moyenne >= 8 ? { label: "جيد جدا", variant: "success" as const } :
                r.sc.moyenne >= 7 ? { label: "حسن", variant: "info" as const } :
                r.sc.moyenne >= 5 ? { label: "مقبول", variant: "warning" as const } :
                { label: "ضعيف", variant: "danger" as const };
              return (
                <TR key={r.sc.id}>
                  <TD className="font-medium">{r.orphan ? `${r.orphan.prenom} ${r.orphan.nomFamille}` : "—"}</TD>
                  <TD className="font-mono">#{r.family?.numeroDossier || "—"}</TD>
                  <TD>{r.sc.anneeScolaire}</TD>
                  <TD>{r.sc.etablissement}</TD>
                  <TD>{r.sc.niveau}</TD>
                  <TD className="font-semibold">{r.sc.moyenne}/10</TD>
                  <TD>
                    <Badge variant={mention.variant}>{mention.label}</Badge>
                  </TD>
                  <TD>{r.sc.kafalaType}</TD>
                  <TD className="font-mono text-xs">{r.sc.telephone || "—"}</TD>
                  {editable && (
                    <TD>
                      <div className="flex gap-1 justify-start">
                        <Button size="icon" variant="ghost" onClick={() => setDialog({ open: true, edit: r.sc })}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-600" onClick={() => setDeleteId(r.sc.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TD>
                  )}
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      <SchoolingDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog({ open: v })}
        edit={dialog.edit}
        onSave={(data, id) => {
          upsertSchooling({ ...data, id });
          toast.success(id ? "تم التحديث" : "تم التسجيل");
          setDialog({ open: false });
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="حذف تسجيل تمدرس"
        description="هل تريد حذف هذا التسجيل؟"
        onConfirm={() => {
          if (deleteId) {
            deleteSchooling(deleteId);
            toast.success("تم الحذف");
          }
          setDeleteId(null);
        }}
      />
    </div>
  );
}

function SchoolingDialog({
  open,
  onOpenChange,
  edit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  edit?: Schooling;
  onSave: (data: FormValues, id?: string) => void;
}) {
  const { orphans, families } = useDataStore();
  const { register, handleSubmit, reset } = useForm<FormValues>({
    values: {
      orphanId: edit?.orphanId || orphans[0]?.id || "",
      anneeScolaire: edit?.anneeScolaire || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      etablissement: edit?.etablissement || "",
      niveau: edit?.niveau || "",
      moyenne: edit?.moyenne ?? 0,
      kafalaType: edit?.kafalaType || "شهرية",
      telephone: edit?.telephone || "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={edit ? "تعديل تمدرس" : "تسجيل تمدرس جديد"} size="lg">
      <form
        onSubmit={handleSubmit((data) => {
          onSave({ ...data, moyenne: Number(data.moyenne) }, edit?.id);
          reset();
        })}
        className="space-y-4"
      >
        <Select label="اليتيم *" {...register("orphanId", { required: true })}>
          {orphans.map((o) => {
            const f = families.find((x) => x.id === o.familyId);
            return (
              <option key={o.id} value={o.id}>
                {o.prenom} {o.nomFamille} {f ? `(ملف ${f.numeroDossier})` : ""}
              </option>
            );
          })}
        </Select>
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="السنة الدراسية" {...register("anneeScolaire", { required: true })} placeholder="2024-2025" />
          <Input label="المؤسسة *" {...register("etablissement", { required: true })} />
          <Input label="المستوى *" {...register("niveau", { required: true })} />
          <Input label="المعدل (من 10)" type="number" step="0.1" min={0} max={10} {...register("moyenne", { required: true })} />
          <Select label="نوع الكفالة" {...register("kafalaType")}>
            <option value="شهرية">شهرية</option>
            <option value="عامة">عامة</option>
            <option value="حماية القاصر">حماية القاصر</option>
          </Select>
          <Input label="هاتف المؤسسة" {...register("telephone")} />
        </div>
        <DialogFooter>
          <Button type="submit">
            <Save className="w-4 h-4" />
            حفظ
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
