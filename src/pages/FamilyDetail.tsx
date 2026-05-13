import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  Pencil,
  Printer,
  Plus,
  Trash2,
  Save,
  Phone,
  IdCard,
  MapPin,
  Home as HomeIcon,
  Baby,
  Users as UsersIcon,
  Wallet,
  Package,
  StickyNote,
  CircleDot,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useAuthStore, canEdit } from "../stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Dialog, DialogFooter } from "../components/ui/Dialog";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { PhotoUpload, PhotoDisplay } from "../components/ui/PhotoUpload";
import { computeFamilyScore } from "../lib/indicators";
import { calculateAge, formatDate } from "../lib/utils";
import { toast } from "../components/ui/Toast";
import type {
  Orphan,
  Parent,
  Housing,
  Savings,
  Equipment,
  Sex,
  HealthStatus,
  HousingType,
} from "../types";

export default function FamilyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("aperçu");
  const { params } = useSettingsStore();
  const { currentUser } = useAuthStore();
  const {
    families,
    parents,
    orphans,
    housings,
    savings,
    equipments,
    schoolings,
    deleteFamily,
    upsertParent,
    deleteParent,
    createOrphan,
    updateOrphan,
    deleteOrphan,
    upsertHousing,
    addSavings,
    deleteSavings,
    addEquipment,
    deleteEquipment,
    updateFamily,
  } = useDataStore();

  const family = useMemo(() => families.find((f) => f.id === id), [families, id]);
  const fParents = useMemo(() => parents.filter((p) => p.familyId === id), [parents, id]);
  const fOrphans = useMemo(() => orphans.filter((o) => o.familyId === id), [orphans, id]);
  const fHousing = useMemo(() => housings.find((h) => h.familyId === id) || null, [housings, id]);
  const fSavings = useMemo(() => savings.filter((s) => s.familyId === id), [savings, id]);
  const fEquipment = useMemo(() => equipments.filter((e) => e.familyId === id), [equipments, id]);
  const fSchoolings = useMemo(
    () => schoolings.filter((sc) => fOrphans.some((o) => o.id === sc.orphanId)),
    [schoolings, fOrphans]
  );

  const score = useMemo(
    () =>
      family
        ? computeFamilyScore({
            family,
            orphans: fOrphans,
            parents: fParents,
            housing: fHousing,
            savings: fSavings,
            schoolings: fSchoolings,
            params,
          })
        : null,
    [family, fOrphans, fParents, fHousing, fSavings, fSchoolings, params]
  );

  const [orphanDialog, setOrphanDialog] = useState<{ open: boolean; orphan?: Orphan }>({ open: false });
  const [parentDialog, setParentDialog] = useState<{ open: boolean; parent?: Parent }>({ open: false });
  const [savingsDialog, setSavingsDialog] = useState(false);
  const [equipDialog, setEquipDialog] = useState(false);
  const [deleteFamilyConfirm, setDeleteFamilyConfirm] = useState(false);
  const [deleteOrphanId, setDeleteOrphanId] = useState<string | null>(null);

  if (!family) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">الملف غير موجود.</p>
        <Link to="/families" className="text-emerald-600 hover:underline mt-2 inline-block">
          العودة للملفات
        </Link>
      </div>
    );
  }

  const editable = canEdit(currentUser?.role);

  const handleDeleteFamily = () => {
    deleteFamily(family.id, currentUser?.id, currentUser?.username);
    toast.success("تم حذف الملف");
    navigate("/families");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 no-print">
        <div>
          <button
            onClick={() => navigate("/families")}
            className="text-sm text-slate-500 hover:text-emerald-600 inline-flex items-center gap-1 mb-1"
          >
            <ArrowRight className="w-4 h-4" />
            ملفات الأسر
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-bold">{family.nomFamille}</h1>
            {family.nomFamilleFr && (
              <span className="text-lg text-slate-500 dark:text-slate-400 font-normal" dir="ltr">
                · {family.nomFamilleFr}
              </span>
            )}
            <span className="font-mono text-emerald-600 dark:text-emerald-400 text-lg">#{family.numeroDossier}</span>
            <Badge
              variant={family.statut === "نشيط" ? "success" : family.statut === "معلق" ? "warning" : "danger"}
            >
              {family.statut}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            تم التسجيل في {formatDate(family.dateEnregistrement)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
          {editable && (
            <>
              <Link to={`/families/${family.id}/edit`}>
                <Button>
                  <Pencil className="w-4 h-4" />
                  تعديل
                </Button>
              </Link>
              <Button variant="danger" onClick={() => setDeleteFamilyConfirm(true)}>
                <Trash2 className="w-4 h-4" />
                حذف
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Score card */}
      {score && (
        <Card className="overflow-hidden border-emerald-200 dark:border-emerald-900">
          <div
            className="px-5 py-4 grid md:grid-cols-[auto_1fr] gap-5 items-center"
            style={{
              background:
                "linear-gradient(135deg, #e6f4ec 0%, #fff4e5 100%)",
            }}
          >
            {/* Main score */}
            <div className="flex items-center gap-4 md:border-l md:border-emerald-200 dark:md:border-emerald-900 md:pl-5 md:ml-2">
              <div
                className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-md text-white"
                style={{ background: "linear-gradient(135deg, #229150 0%, #0e6e37 100%)" }}
              >
                <span className="text-2xl font-extrabold leading-none">
                  {(score.total + family.pointMoctab).toFixed(1)}
                </span>
                <span className="text-[10px] font-medium opacity-80 mt-0.5">نقطة</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  المؤشر العام
                </p>
                <Badge
                  className="mt-1.5"
                  variant={
                    score.classification === "ممتاز"
                      ? "success"
                      : score.classification === "جيد"
                      ? "info"
                      : score.classification === "متوسط"
                      ? "warning"
                      : "danger"
                  }
                >
                  تصنيف {score.classification}
                </Badge>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  حساب تلقائي بناء على المؤشرات
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <ScoreBreakdownItem label="السن" value={score.ageScore} />
              <ScoreBreakdownItem label="الصحة" value={score.healthScore} />
              <ScoreBreakdownItem label="نوع الكفالة" value={score.kafalaScore} />
              <ScoreBreakdownItem label="السكن" value={score.housingScore} />
              <ScoreBreakdownItem label="الادخار" value={score.savingsScore} />
              <ScoreBreakdownItem label="التمدرس" value={score.schoolingScore} />
              <ScoreBreakdownItem label="نقطة المكتب" value={family.pointMoctab} highlight />
            </div>
          </div>
        </Card>
      )}

      <Tabs value={tab} onChange={setTab}>
        <TabsList className="overflow-x-auto flex-nowrap max-w-full">
          <TabsTrigger value="aperçu">نظرة عامة</TabsTrigger>
          <TabsTrigger value="responsable">المكلف</TabsTrigger>
          <TabsTrigger value="parents">الأبوين</TabsTrigger>
          <TabsTrigger value="orphans">اليتامى ({fOrphans.length})</TabsTrigger>
          <TabsTrigger value="housing">السكن</TabsTrigger>
          <TabsTrigger value="savings">الادخار ({fSavings.length})</TabsTrigger>
          <TabsTrigger value="equipment">التجهيزات ({fEquipment.length})</TabsTrigger>
          <TabsTrigger value="notes">الملاحظات</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="aperçu">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">معلومات الملف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow label="رقم الملف" value={`#${family.numeroDossier}`} />
                <InfoRow label="تاريخ التسجيل" value={formatDate(family.dateEnregistrement)} />
                <InfoRow label="طبيعة الملف" value={family.natureDossier} />
                <InfoRow label="نوع الكفالة" value={family.kafalaType} />
                <InfoRow label="الحالة" value={family.statut} />
                <InfoRow label="آخر تحديث" value={formatDate(family.updatedAt)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">المكلف بالأسرة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <PhotoDisplay src={family.responsable.photo} name={family.responsable.fullName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{family.responsable.fullName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{family.responsable.natureResponsable || "—"}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <InfoRow icon={<IdCard className="w-4 h-4" />} label="ر.ب.و.ث" value={family.responsable.cin || "—"} />
                  <InfoRow icon={<Phone className="w-4 h-4" />} label="الهاتف" value={family.responsable.phone || "—"} />
                  <InfoRow icon={<MapPin className="w-4 h-4" />} label="العنوان" value={family.responsable.address || "—"} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Baby className="w-4 h-4" />
                  الأيتام ({fOrphans.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fOrphans.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">لا يوجد أيتام مسجلين</p>
                ) : (
                  <ul className="space-y-2">
                    {fOrphans.map((o) => (
                      <li key={o.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <PhotoDisplay src={o.photo} name={`${o.prenom} ${o.nomFamille}`} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{o.prenom} {o.nomFamille}</p>
                          <p className="text-xs text-slate-500">
                            {o.sexe} · {calculateAge(o.dateNaissance) ?? "—"} سنة · {o.health}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HomeIcon className="w-4 h-4" />
                  السكن
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fHousing ? (
                  <div className="space-y-2 text-sm">
                    <InfoRow label="النوع" value={fHousing.type} />
                    <InfoRow label="عدد الغرف" value={String(fHousing.nbPieces)} />
                    <InfoRow label="الحالة" value={fHousing.etat} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">لم يتم تسجيل السكن</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Responsable tab */}
        <TabsContent value="responsable">
          <Card>
            <CardHeader>
              <CardTitle>المكلف بالأسرة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <PhotoDisplay
                  src={family.responsable.photo}
                  name={family.responsable.fullName}
                  size="lg"
                  shape="square"
                />
                <div className="grid md:grid-cols-2 gap-4 text-sm flex-1 w-full">
                  <InfoRow label="الاسم الكامل" value={family.responsable.fullName} />
                  {family.responsable.fullNameFr && (
                    <InfoRow label="Nom complet (FR)" value={family.responsable.fullNameFr} />
                  )}
                  <InfoRow label="طبيعة المكلف" value={family.responsable.natureResponsable || "—"} />
                  <InfoRow label="رقم البطاقة الوطنية" value={family.responsable.cin || "—"} />
                  <InfoRow label="الهاتف" value={family.responsable.phone || "—"} />
                  <div className="md:col-span-2">
                    <InfoRow label="العنوان" value={family.responsable.address || "—"} />
                  </div>
                  {family.responsable.addressFr && (
                    <div className="md:col-span-2">
                      <InfoRow label="Adresse (FR)" value={family.responsable.addressFr} />
                    </div>
                  )}
                </div>
              </div>
              {editable && (
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link to={`/families/${family.id}/edit`}>
                    <Button variant="outline">
                      <Pencil className="w-4 h-4" />
                      تعديل بيانات المكلف
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parents tab */}
        <TabsContent value="parents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>الأبوين</CardTitle>
                {editable && (
                  <Button size="sm" onClick={() => setParentDialog({ open: true, parent: fParents[0] })}>
                    {fParents[0] ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {fParents[0] ? "تعديل" : "إضافة الأبوين"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {fParents.length === 0 ? (
                <EmptyState
                  icon={<UsersIcon className="w-7 h-7" />}
                  title="لم يتم إدخال بيانات الأبوين"
                  description="أضف معلومات الأب والأم لاكتمال الملف."
                />
              ) : (
                fParents.map((p) => (
                  <div key={p.id} className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="border-l border-slate-200 dark:border-slate-700 md:pl-4">
                      <h4 className="font-semibold mb-3 text-emerald-700 dark:text-emerald-400">الأب (المتوفى) / Père</h4>
                      <div className="flex items-start gap-4">
                        <PhotoDisplay src={p.perePhoto} name={p.pereNom} size="md" shape="square" />
                        <div className="space-y-1.5 flex-1">
                          <InfoRow label="الاسم" value={p.pereNom} />
                          {p.pereNomFr && (
                            <InfoRow label="Nom (FR)" value={p.pereNomFr} />
                          )}
                          <InfoRow label="تاريخ الازدياد" value={formatDate(p.pereDateNaissance)} />
                          <InfoRow label="تاريخ الوفاة" value={formatDate(p.pereDateDeces)} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-sky-700 dark:text-sky-400">الأم (الأرملة) / Mère</h4>
                      <div className="flex items-start gap-4">
                        <PhotoDisplay src={p.merePhoto} name={p.mereNom} size="md" shape="square" />
                        <div className="space-y-1.5 flex-1">
                          <InfoRow label="الاسم" value={p.mereNom} />
                          {p.mereNomFr && (
                            <InfoRow label="Nom (FR)" value={p.mereNomFr} />
                          )}
                          <InfoRow label="تاريخ الازدياد" value={formatDate(p.mereDateNaissance)} />
                          <InfoRow label="رقم البطاقة" value={p.mereCin || "—"} />
                          <InfoRow label="الحالة الصحية" value={p.mereSante || "—"} />
                          {p.mereDateDeces && <InfoRow label="تاريخ الوفاة" value={formatDate(p.mereDateDeces)} />}
                        </div>
                      </div>
                    </div>
                    {p.observations && (
                      <div className="md:col-span-2 pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <strong>ملاحظات:</strong> {p.observations}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orphans tab */}
        <TabsContent value="orphans">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>الأيتام</CardTitle>
                {editable && (
                  <Button size="sm" onClick={() => setOrphanDialog({ open: true })}>
                    <Plus className="w-4 h-4" />
                    إضافة يتيم
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {fOrphans.length === 0 ? (
                <EmptyState
                  icon={<Baby className="w-7 h-7" />}
                  title="لا يوجد أيتام مسجلين بهذا الملف"
                />
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <TH>الصورة</TH>
                      <TH>الاسم الكامل</TH>
                      <TH>الجنس</TH>
                      <TH>السن</TH>
                      <TH>تاريخ الازدياد</TH>
                      <TH>المؤسسة</TH>
                      <TH>العنوان</TH>
                      <TH>الحالة الصحية</TH>
                      {editable && <TH className="text-left">إجراءات</TH>}
                    </tr>
                  </THead>
                  <TBody>
                    {fOrphans.map((o) => (
                      <TR key={o.id}>
                        <TD>
                          <PhotoDisplay src={o.photo} name={`${o.prenom} ${o.nomFamille}`} size="sm" />
                        </TD>
                        <TD>
                          <div className="font-medium">{o.prenom} {o.nomFamille}</div>
                          {(o.prenomFr || o.nomFamilleFr) && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400" dir="ltr">
                              {o.prenomFr} {o.nomFamilleFr}
                            </div>
                          )}
                        </TD>
                        <TD>
                          <Badge variant={o.sexe === "ذكر" ? "info" : "default"}>{o.sexe}</Badge>
                        </TD>
                        <TD>{calculateAge(o.dateNaissance) ?? "—"}</TD>
                        <TD>{formatDate(o.dateNaissance)}</TD>
                        <TD className="max-w-[160px]">
                          <div className="truncate">{o.etablissement || "—"}</div>
                          {o.etablissementFr && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate" dir="ltr">
                              {o.etablissementFr}
                            </div>
                          )}
                        </TD>
                        <TD className="max-w-[180px]">
                          <div className="truncate">{o.adresse || "—"}</div>
                          {o.adresseFr && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate" dir="ltr">
                              {o.adresseFr}
                            </div>
                          )}
                        </TD>
                        <TD>
                          <Badge variant={o.health === "سليم" ? "success" : o.health === "إعاقة" ? "danger" : "warning"}>
                            {o.health}
                          </Badge>
                        </TD>
                        {editable && (
                          <TD>
                            <div className="flex gap-1 justify-start">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setOrphanDialog({ open: true, orphan: o })}
                                title="تعديل"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => setDeleteOrphanId(o.id)}
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TD>
                        )}
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Housing tab */}
        <TabsContent value="housing">
          <HousingTab familyId={family.id} housing={fHousing} editable={editable} />
        </TabsContent>

        {/* Savings tab */}
        <TabsContent value="savings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>الادخار</CardTitle>
                {editable && (
                  <Button size="sm" onClick={() => setSavingsDialog(true)}>
                    <Plus className="w-4 h-4" />
                    إيداع جديد
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {fSavings.length === 0 ? (
                <EmptyState icon={<Wallet className="w-7 h-7" />} title="لا توجد إيداعات" />
              ) : (
                <>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium">المجموع</span>
                    <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                      {fSavings.reduce((s, x) => s + x.montant, 0).toLocaleString()} د.م
                    </span>
                  </div>
                  <Table>
                    <THead>
                      <tr>
                        <TH>التاريخ</TH>
                        <TH>المبلغ</TH>
                        <TH>ملاحظات</TH>
                        {editable && <TH className="text-left">إجراءات</TH>}
                      </tr>
                    </THead>
                    <TBody>
                      {fSavings.map((s) => (
                        <TR key={s.id}>
                          <TD>{formatDate(s.dateDepot)}</TD>
                          <TD className="font-semibold">{s.montant.toLocaleString()} د.م</TD>
                          <TD>{s.observations || "—"}</TD>
                          {editable && (
                            <TD>
                              <Button size="icon" variant="ghost" className="text-red-600" onClick={() => { deleteSavings(s.id); toast.success("تم حذف الإيداع"); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TD>
                          )}
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment tab */}
        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>التجهيزات الموزعة</CardTitle>
                {editable && (
                  <Button size="sm" onClick={() => setEquipDialog(true)}>
                    <Plus className="w-4 h-4" />
                    إضافة تجهيز
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {fEquipment.length === 0 ? (
                <EmptyState icon={<Package className="w-7 h-7" />} title="لا توجد تجهيزات مسجلة" />
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <TH>التجهيز</TH>
                      <TH>تاريخ التسليم</TH>
                      <TH>ملاحظات</TH>
                      {editable && <TH className="text-left">إجراءات</TH>}
                    </tr>
                  </THead>
                  <TBody>
                    {fEquipment.map((e) => (
                      <TR key={e.id}>
                        <TD className="font-medium">{e.type}</TD>
                        <TD>{formatDate(e.dateAttribution)}</TD>
                        <TD>{e.observations || "—"}</TD>
                        {editable && (
                          <TD>
                            <Button size="icon" variant="ghost" className="text-red-600" onClick={() => { deleteEquipment(e.id); toast.success("تم الحذف"); }}>
                              <Trash2 className="w-4 h-4" />
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
        </TabsContent>

        {/* Notes tab */}
        <TabsContent value="notes">
          <NotesTab family={family} editable={editable} onSave={(notes) => {
            updateFamily(family.id, { notes }, currentUser?.id, currentUser?.username);
            toast.success("تم حفظ الملاحظات");
          }} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <OrphanDialog
        open={orphanDialog.open}
        onOpenChange={(v) => setOrphanDialog({ open: v })}
        orphan={orphanDialog.orphan}
        familyId={family.id}
        familyName={family.nomFamille}
        onSave={(data, id) => {
          if (id) {
            updateOrphan(id, data);
            toast.success("تم تحديث بيانات اليتيم");
          } else {
            createOrphan(data);
            toast.success("تمت إضافة اليتيم");
          }
          setOrphanDialog({ open: false });
        }}
      />

      <ParentDialog
        open={parentDialog.open}
        onOpenChange={(v) => setParentDialog({ open: v })}
        parent={parentDialog.parent}
        familyId={family.id}
        onSave={(data) => {
          upsertParent(data);
          toast.success("تم حفظ بيانات الأبوين");
          setParentDialog({ open: false });
        }}
      />

      <SavingsDialog
        open={savingsDialog}
        onOpenChange={setSavingsDialog}
        onSave={(data) => {
          addSavings({ ...data, familyId: family.id });
          toast.success("تمت إضافة الإيداع");
          setSavingsDialog(false);
        }}
      />

      <EquipmentDialog
        open={equipDialog}
        onOpenChange={setEquipDialog}
        onSave={(data) => {
          addEquipment({ ...data, familyId: family.id });
          toast.success("تمت إضافة التجهيز");
          setEquipDialog(false);
        }}
      />

      <ConfirmDialog
        open={deleteFamilyConfirm}
        onOpenChange={setDeleteFamilyConfirm}
        title="حذف الملف"
        description={`سيتم حذف الملف رقم ${family.numeroDossier} (${family.nomFamille}) وجميع البيانات المرتبطة به. هذا الإجراء نهائي.`}
        onConfirm={handleDeleteFamily}
      />

      <ConfirmDialog
        open={!!deleteOrphanId}
        onOpenChange={(v) => !v && setDeleteOrphanId(null)}
        title="حذف اليتيم"
        description="سيتم حذف بيانات اليتيم وتسجيلاته في الورشات وسجل تمدرسه."
        onConfirm={() => {
          if (deleteOrphanId) {
            deleteOrphan(deleteOrphanId);
            toast.success("تم الحذف");
          }
          setDeleteOrphanId(null);
        }}
      />
    </motion.div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      {icon && <span className="text-slate-400 mt-0.5">{icon}</span>}
      <span className="text-slate-500 dark:text-slate-400 min-w-[110px]">{label}:</span>
      <span className="font-medium text-slate-900 dark:text-slate-100 flex-1">{value}</span>
    </div>
  );
}

function ScoreBreakdownItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg p-2.5 transition-all ${
        highlight
          ? "bg-white shadow-sm border border-orange-200 dark:bg-slate-900 dark:border-orange-900/50"
          : "bg-white/70 dark:bg-slate-900/70"
      }`}
    >
      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">{label}</p>
      <p
        className={`text-lg font-bold leading-tight mt-1 ${
          highlight ? "text-orange-600 dark:text-orange-400" : "text-slate-900 dark:text-slate-100"
        }`}
      >
        {value.toFixed(2)}
      </p>
    </div>
  );
}

function HousingTab({ familyId, housing, editable }: { familyId: string; housing: Housing | null; editable: boolean }) {
  const { upsertHousing } = useDataStore();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      type: (housing?.type || "ملكية خاصة") as HousingType,
      nbPieces: housing?.nbPieces ?? 1,
      etat: housing?.etat || "حسن",
      observations: housing?.observations || "",
    },
  });

  const onSubmit = (data: any) => {
    upsertHousing({
      familyId,
      type: data.type,
      nbPieces: Number(data.nbPieces),
      etat: data.etat,
      observations: data.observations,
    });
    toast.success("تم حفظ بيانات السكن");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>السكن</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-4">
          <Select label="نوع السكن" {...register("type")} disabled={!editable}>
            <option value="ملكية خاصة">ملكية خاصة</option>
            <option value="ملكية مشتركة">ملكية مشتركة</option>
            <option value="مجاني">مجاني</option>
            <option value="كراء">كراء</option>
            <option value="رهن">رهن</option>
          </Select>
          <Input label="عدد الغرف" type="number" min={0} {...register("nbPieces")} disabled={!editable} />
          <Input label="حالة السكن" {...register("etat")} disabled={!editable} placeholder="حسن / متوسط / يحتاج صيانة" />
          <div className="md:col-span-2">
            <Textarea label="ملاحظات" {...register("observations")} disabled={!editable} />
          </div>
          {editable && (
            <div className="md:col-span-2">
              <Button type="submit">
                <Save className="w-4 h-4" />
                حفظ السكن
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function NotesTab({
  family,
  editable,
  onSave,
}: {
  family: { notes: string };
  editable: boolean;
  onSave: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(family.notes || "");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="w-5 h-5" />
          ملاحظات المكتب
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          placeholder="أضف ملاحظات تتعلق بالملف..."
          disabled={!editable}
        />
        {editable && (
          <Button onClick={() => onSave(notes)}>
            <Save className="w-4 h-4" />
            حفظ الملاحظات
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function OrphanDialog({
  open,
  onOpenChange,
  orphan,
  familyId,
  familyName,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orphan?: Orphan;
  familyId: string;
  familyName: string;
  onSave: (data: Omit<Orphan, "id">, id?: string) => void;
}) {
  const [photo, setPhoto] = useState<string | undefined>(orphan?.photo);
  const { register, handleSubmit, watch } = useForm({
    values: {
      prenom: orphan?.prenom || "",
      prenomFr: orphan?.prenomFr || "",
      nomFamille: orphan?.nomFamille || familyName,
      nomFamilleFr: orphan?.nomFamilleFr || "",
      sexe: (orphan?.sexe || "ذكر") as Sex,
      dateNaissance: orphan?.dateNaissance || "",
      lieuNaissance: orphan?.lieuNaissance || "",
      health: (orphan?.health || "سليم") as HealthStatus,
      adresse: orphan?.adresse || "",
      adresseFr: orphan?.adresseFr || "",
      etablissement: orphan?.etablissement || "",
      etablissementFr: orphan?.etablissementFr || "",
    },
  });

  // Sync photo state when orphan prop changes
  useEffect(() => {
    setPhoto(orphan?.photo);
  }, [orphan?.id, orphan?.photo, open]);

  const watchedPrenom = watch("prenom");
  const watchedNom = watch("nomFamille");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={orphan ? "تعديل يتيم" : "إضافة يتيم"}
      size="lg"
    >
      <form
        onSubmit={handleSubmit((data) => {
          onSave(
            {
              ...data,
              familyId,
              photo,
              prenomFr: data.prenomFr || undefined,
              nomFamilleFr: data.nomFamilleFr || undefined,
              adresse: data.adresse || undefined,
              adresseFr: data.adresseFr || undefined,
              etablissement: data.etablissement || undefined,
              etablissementFr: data.etablissementFr || undefined,
            },
            orphan?.id
          );
        })}
        className="space-y-5"
      >
        <div className="flex justify-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <PhotoUpload
            value={photo}
            onChange={setPhoto}
            label="صورة اليتيم"
            fallbackName={`${watchedPrenom} ${watchedNom}`}
            size="lg"
          />
        </div>

        {/* Identity */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            الهوية / Identité
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="الاسم الشخصي *" {...register("prenom", { required: true })} />
            <Input
              label="Prénom (FR)"
              dir="ltr"
              placeholder="Latin / Français"
              {...register("prenomFr")}
            />
            <Input label="الاسم العائلي *" {...register("nomFamille", { required: true })} />
            <Input
              label="Nom de famille (FR)"
              dir="ltr"
              placeholder="Latin / Français"
              {...register("nomFamilleFr")}
            />
            <Select label="الجنس" {...register("sexe")}>
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </Select>
            <Input
              label="تاريخ الازدياد *"
              type="date"
              {...register("dateNaissance", { required: true })}
            />
            <Input label="مكان الازدياد" {...register("lieuNaissance")} />
            <Select label="الحالة الصحية" {...register("health")}>
              <option value="سليم">سليم</option>
              <option value="مرض مزمن">مرض مزمن</option>
              <option value="إعاقة">إعاقة</option>
            </Select>
          </div>
        </div>

        {/* Address */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            العنوان / Adresse
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="العنوان"
              {...register("adresse")}
              placeholder="حي، شارع، رقم..."
            />
            <Input
              label="Adresse (FR)"
              dir="ltr"
              placeholder="Latin / Français"
              {...register("adresseFr")}
            />
          </div>
        </div>

        {/* Institution */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            المؤسسة / Établissement
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="اسم المؤسسة"
              {...register("etablissement")}
              placeholder="مدرسة، ثانوية، روض..."
            />
            <Input
              label="Nom de l'établissement (FR)"
              dir="ltr"
              placeholder="Latin / Français"
              {...register("etablissementFr")}
            />
          </div>
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

function ParentDialog({
  open,
  onOpenChange,
  parent,
  familyId,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  parent?: Parent;
  familyId: string;
  onSave: (data: Omit<Parent, "id"> & { id?: string }) => void;
}) {
  const [perePhoto, setPerePhoto] = useState<string | undefined>(parent?.perePhoto);
  const [merePhoto, setMerePhoto] = useState<string | undefined>(parent?.merePhoto);
  const { register, handleSubmit, watch } = useForm({
    values: {
      pereNom: parent?.pereNom || "",
      pereNomFr: parent?.pereNomFr || "",
      pereDateNaissance: parent?.pereDateNaissance || "",
      pereDateDeces: parent?.pereDateDeces || "",
      mereNom: parent?.mereNom || "",
      mereNomFr: parent?.mereNomFr || "",
      mereDateNaissance: parent?.mereDateNaissance || "",
      mereCin: parent?.mereCin || "",
      mereSante: (parent?.mereSante || "سليم") as HealthStatus,
      mereDateDeces: parent?.mereDateDeces || "",
      observations: parent?.observations || "",
    },
  });

  useEffect(() => {
    setPerePhoto(parent?.perePhoto);
    setMerePhoto(parent?.merePhoto);
  }, [parent?.id, parent?.perePhoto, parent?.merePhoto, open]);

  const pereName = watch("pereNom");
  const mereName = watch("mereNom");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={parent ? "تعديل بيانات الأبوين" : "إضافة الأبوين"}
      size="lg"
    >
      <form
        onSubmit={handleSubmit((data) => {
          onSave({
            ...data,
            familyId,
            id: parent?.id,
            perePhoto,
            merePhoto,
            pereNomFr: data.pereNomFr || undefined,
            mereNomFr: data.mereNomFr || undefined,
          });
        })}
        className="space-y-4"
      >
        <div className="grid md:grid-cols-2 gap-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-3">الأب (المتوفى)</h3>
            <PhotoUpload value={perePhoto} onChange={setPerePhoto} fallbackName={pereName} size="lg" />
          </div>
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sky-700 dark:text-sky-400 mb-3">الأم (الأرملة)</h3>
            <PhotoUpload value={merePhoto} onChange={setMerePhoto} fallbackName={mereName} size="lg" />
          </div>
        </div>

        <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">الأب (المتوفى) / Père</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="اسم الأب *" {...register("pereNom", { required: true })} />
          <Input
            label="Nom du père (FR)"
            dir="ltr"
            placeholder="Latin / Français"
            {...register("pereNomFr")}
          />
          <Input label="تاريخ الازدياد" type="date" {...register("pereDateNaissance")} />
          <Input label="تاريخ الوفاة *" type="date" {...register("pereDateDeces", { required: true })} />
        </div>

        <h3 className="font-semibold text-sky-700 dark:text-sky-400 mt-4">الأم (الأرملة) / Mère</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="اسم الأم *" {...register("mereNom", { required: true })} />
          <Input
            label="Nom de la mère (FR)"
            dir="ltr"
            placeholder="Latin / Français"
            {...register("mereNomFr")}
          />
          <Input label="تاريخ الازدياد" type="date" {...register("mereDateNaissance")} />
          <Input label="رقم البطاقة الوطنية" {...register("mereCin")} />
          <Select label="الحالة الصحية" {...register("mereSante")}>
            <option value="سليم">سليم</option>
            <option value="مرض مزمن">مرض مزمن</option>
            <option value="إعاقة">إعاقة</option>
          </Select>
          <Input label="تاريخ الوفاة (إن وجد)" type="date" {...register("mereDateDeces")} />
        </div>

        <Textarea label="ملاحظات" {...register("observations")} />

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

function SavingsDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: Omit<Savings, "id" | "familyId">) => void;
}) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      montant: 0,
      dateDepot: new Date().toISOString().slice(0, 10),
      observations: "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="إيداع جديد" size="sm">
      <form
        onSubmit={handleSubmit((d) => {
          onSave({ ...d, montant: Number(d.montant) });
          reset();
        })}
        className="space-y-4"
      >
        <Input label="المبلغ (د.م)" type="number" step="0.01" min={0} {...register("montant", { required: true })} />
        <Input label="تاريخ الإيداع" type="date" {...register("dateDepot", { required: true })} />
        <Textarea label="ملاحظات" {...register("observations")} />
        <DialogFooter>
          <Button type="submit">إضافة</Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function EquipmentDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: Omit<Equipment, "id" | "familyId">) => void;
}) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      type: "",
      dateAttribution: new Date().toISOString().slice(0, 10),
      observations: "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="تجهيز جديد" size="sm">
      <form
        onSubmit={handleSubmit((d) => {
          onSave(d);
          reset();
        })}
        className="space-y-4"
      >
        <Input label="نوع التجهيز *" {...register("type", { required: true })} placeholder="ملابس، أدوات مدرسية..." />
        <Input label="تاريخ التسليم" type="date" {...register("dateAttribution", { required: true })} />
        <Textarea label="ملاحظات" {...register("observations")} />
        <DialogFooter>
          <Button type="submit">إضافة</Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
