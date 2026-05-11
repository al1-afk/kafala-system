import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Save, UserPlus, UserMinus, Printer, ClipboardList, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { useAuthStore, canEdit } from "../stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Dialog, DialogFooter } from "../components/ui/Dialog";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { calculateAge, formatDate } from "../lib/utils";
import { toast } from "../components/ui/Toast";
import type { Workshop } from "../types";

export default function Workshops() {
  const [selected, setSelected] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Workshop }>({ open: false });
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [orphanQ, setOrphanQ] = useState("");

  const { currentUser } = useAuthStore();
  const editable = canEdit(currentUser?.role);
  const {
    workshops,
    registrations,
    orphans,
    families,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    enrollOrphan,
    unenrollOrphan,
  } = useDataStore();

  // Default-select first active workshop
  const activeWorkshop = workshops.find((w) => w.id === selected) || workshops[0];
  const currentId = activeWorkshop?.id;

  const participants = useMemo(() => {
    if (!currentId) return [];
    return registrations
      .filter((r) => r.workshopId === currentId && r.actif)
      .map((r) => {
        const o = orphans.find((x) => x.id === r.orphanId);
        const f = o ? families.find((x) => x.id === o.familyId) : undefined;
        return { reg: r, orphan: o, family: f };
      })
      .filter((x) => x.orphan);
  }, [currentId, registrations, orphans, families]);

  const enrolledOrphanIds = useMemo(
    () => new Set(participants.map((p) => p.orphan!.id)),
    [participants]
  );

  const availableOrphans = useMemo(() => {
    let arr = orphans.filter((o) => !enrolledOrphanIds.has(o.id));
    if (orphanQ.trim()) {
      const lower = orphanQ.trim().toLowerCase();
      arr = arr.filter((o) =>
        `${o.prenom} ${o.nomFamille}`.toLowerCase().includes(lower)
      );
    }
    return arr;
  }, [orphans, enrolledOrphanIds, orphanQ]);

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3 no-print"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-emerald-600" />
            تدبير الورشات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة الورشات وتسجيل اليتامى
          </p>
        </div>
        {editable && (
          <Button onClick={() => setDialog({ open: true })}>
            <Plus className="w-4 h-4" />
            ورشة جديدة
          </Button>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Workshops list */}
        <Card className="lg:col-span-1 no-print">
          <CardHeader>
            <CardTitle>الورشات ({workshops.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workshops.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">لا توجد ورشات</p>
            ) : (
              workshops.map((w) => {
                const count = registrations.filter((r) => r.workshopId === w.id && r.actif).length;
                const isActive = currentId === w.id;
                return (
                  <div
                    key={w.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(w.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(w.id);
                      }
                    }}
                    className={`w-full text-right p-3 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800"
                        : "bg-white border-slate-200 hover:border-emerald-300 dark:bg-slate-900 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{w.nom}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {w.horaire}
                        </p>
                        <div className="flex gap-2 mt-1.5">
                          <Badge variant="info" className="text-[10px]">
                            {count}/{w.capaciteMax}
                          </Badge>
                          {!w.active && <Badge variant="neutral" className="text-[10px]">معطل</Badge>}
                        </div>
                      </div>
                      {editable && (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDialog({ open: true, edit: w }); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="تعديل"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDeleteId(w.id); }}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded text-red-600"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Workshop details */}
        <div className="lg:col-span-2 space-y-4">
          {!activeWorkshop ? (
            <EmptyState
              icon={<ClipboardList className="w-7 h-7" />}
              title="اختر ورشة"
              description="حدد ورشة من القائمة لعرض المسجلين وإدارتها."
            />
          ) : (
            <>
              <Card>
                <CardHeader className="no-print">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{activeWorkshop.nom}</CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{activeWorkshop.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm">
                        <Badge variant="info">{activeWorkshop.horaire}</Badge>
                        <Badge variant={participants.length >= activeWorkshop.capaciteMax ? "danger" : "default"}>
                          {participants.length}/{activeWorkshop.capaciteMax} مسجل
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" />
                        طباعة
                      </Button>
                      {editable && (
                        <Button onClick={() => setEnrollOpen(true)} disabled={participants.length >= activeWorkshop.capaciteMax}>
                          <UserPlus className="w-4 h-4" />
                          تسجيل يتيم
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="print-only mb-4 border-b pb-3">
                    <h2 className="text-xl font-bold text-center">لائحة المسجلين - {activeWorkshop.nom}</h2>
                    <p className="text-center text-sm mt-1">{activeWorkshop.horaire}</p>
                    <p className="text-center text-xs mt-1">{formatDate(new Date())}</p>
                  </div>

                  {participants.length === 0 ? (
                    <EmptyState
                      title="لا يوجد مسجلون بعد"
                      description="ابدأ بتسجيل اليتامى في هذه الورشة."
                    />
                  ) : (
                    <Table>
                      <THead>
                        <tr>
                          <TH>#</TH>
                          <TH>اليتيم</TH>
                          <TH>السن</TH>
                          <TH>الجنس</TH>
                          <TH>رقم الملف</TH>
                          <TH>تاريخ التسجيل</TH>
                          {editable && <TH className="text-left no-print">إجراءات</TH>}
                        </tr>
                      </THead>
                      <TBody>
                        {participants.map((p, i) => (
                          <TR key={p.reg.id}>
                            <TD className="font-mono text-slate-500">{i + 1}</TD>
                            <TD className="font-medium">{p.orphan!.prenom} {p.orphan!.nomFamille}</TD>
                            <TD>{calculateAge(p.orphan!.dateNaissance) ?? "—"}</TD>
                            <TD>
                              <Badge variant={p.orphan!.sexe === "ذكر" ? "info" : "default"}>{p.orphan!.sexe}</Badge>
                            </TD>
                            <TD className="font-mono">#{p.family?.numeroDossier || "—"}</TD>
                            <TD>{formatDate(p.reg.dateInscription)}</TD>
                            {editable && (
                              <TD className="no-print">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => { unenrollOrphan(p.reg.id); toast.success("تم إلغاء التسجيل"); }}
                                  title="إلغاء التسجيل"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              </TD>
                            )}
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Workshop CRUD dialog */}
      <WorkshopDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog({ open: v })}
        edit={dialog.edit}
        onSave={(data) => {
          if (dialog.edit) {
            updateWorkshop(dialog.edit.id, data);
            toast.success("تم تحديث الورشة");
          } else {
            createWorkshop(data);
            toast.success("تمت إضافة الورشة");
          }
          setDialog({ open: false });
        }}
      />

      {/* Enroll dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen} title="تسجيل يتيم في الورشة" size="lg">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={orphanQ}
              onChange={(e) => setOrphanQ(e.target.value)}
              placeholder="ابحث باسم اليتيم..."
              className="w-full pr-10 pl-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              autoFocus
            />
          </div>
          {availableOrphans.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">لا يوجد أيتام متاحين</p>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
              {availableOrphans.map((o) => {
                const f = families.find((x) => x.id === o.familyId);
                return (
                  <div key={o.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div>
                      <p className="font-medium text-sm">{o.prenom} {o.nomFamille}</p>
                      <p className="text-xs text-slate-500">
                        {o.sexe} · {calculateAge(o.dateNaissance) ?? "—"} سنة · ملف #{f?.numeroDossier || "—"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!currentId) return;
                        const res = enrollOrphan(currentId, o.id);
                        if (res) toast.success("تم التسجيل");
                        else toast.error("اليتيم مسجل بالفعل");
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                      تسجيل
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="حذف الورشة"
        description="سيتم حذف الورشة وجميع تسجيلاتها."
        onConfirm={() => {
          if (deleteId) {
            deleteWorkshop(deleteId);
            toast.success("تم الحذف");
            if (currentId === deleteId) setSelected(null);
          }
          setDeleteId(null);
        }}
      />
    </div>
  );
}

function WorkshopDialog({
  open,
  onOpenChange,
  edit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  edit?: Workshop;
  onSave: (data: Omit<Workshop, "id">) => void;
}) {
  const { register, handleSubmit } = useForm({
    values: {
      nom: edit?.nom || "",
      description: edit?.description || "",
      horaire: edit?.horaire || "",
      capaciteMax: edit?.capaciteMax ?? 20,
      active: edit?.active ?? true,
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={edit ? "تعديل ورشة" : "ورشة جديدة"} size="md">
      <form
        onSubmit={handleSubmit((d) => onSave({ ...d, capaciteMax: Number(d.capaciteMax), active: !!d.active }))}
        className="space-y-4"
      >
        <Input label="اسم الورشة *" {...register("nom", { required: true })} />
        <Textarea label="وصف الورشة" {...register("description")} />
        <Input label="الجدول الزمني" {...register("horaire")} placeholder="السبت 14:00 - 16:00" />
        <Input label="السعة القصوى" type="number" min={1} {...register("capaciteMax", { required: true })} />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register("active")} className="rounded text-emerald-600 focus:ring-emerald-500" />
          <span className="text-sm">الورشة فعالة</span>
        </label>
        <DialogFooter>
          <Button type="submit">
            <Save className="w-4 h-4" />
            حفظ
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
