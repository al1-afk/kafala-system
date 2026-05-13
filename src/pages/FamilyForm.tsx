import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Save, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { useAuthStore, canEdit } from "../stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { PhotoUpload } from "../components/ui/PhotoUpload";
import { toast } from "../components/ui/Toast";
import type { Family, FamilyStatus, FamilyNature, KafalaType, ResponsibleNature } from "../types";

interface FormValues {
  nomFamille: string;
  nomFamilleFr: string;
  dateEnregistrement: string;
  statut: FamilyStatus;
  natureDossier: FamilyNature;
  kafalaType: KafalaType;
  telephone: string;
  pointMoctab: number;
  notes: string;
  responsableNom: string;
  responsableNomFr: string;
  responsableNature: ResponsibleNature;
  responsableCin: string;
  responsableAddress: string;
  responsableAddressFr: string;
  responsablePhone: string;
}

export default function FamilyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { createFamily, updateFamily, getFamily } = useDataStore();
  const { currentUser } = useAuthStore();

  const existing = id ? getFamily(id) : undefined;
  const [responsablePhoto, setResponsablePhoto] = useState<string | undefined>(existing?.responsable.photo);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: existing
      ? {
          nomFamille: existing.nomFamille,
          nomFamilleFr: existing.nomFamilleFr || "",
          dateEnregistrement: existing.dateEnregistrement,
          statut: existing.statut,
          natureDossier: existing.natureDossier,
          kafalaType: existing.kafalaType,
          telephone: existing.telephone,
          pointMoctab: existing.pointMoctab,
          notes: existing.notes,
          responsableNom: existing.responsable.fullName,
          responsableNomFr: existing.responsable.fullNameFr || "",
          responsableNature: (existing.responsable.natureResponsable || "الأم") as ResponsibleNature,
          responsableCin: existing.responsable.cin,
          responsableAddress: existing.responsable.address,
          responsableAddressFr: existing.responsable.addressFr || "",
          responsablePhone: existing.responsable.phone,
        }
      : {
          nomFamille: "",
          nomFamilleFr: "",
          dateEnregistrement: new Date().toISOString().slice(0, 10),
          statut: "نشيط",
          natureDossier: "كفالة شهرية",
          kafalaType: "شهرية",
          telephone: "",
          pointMoctab: 0,
          notes: "",
          responsableNom: "",
          responsableNomFr: "",
          responsableNature: "الأم",
          responsableCin: "",
          responsableAddress: "",
          responsableAddressFr: "",
          responsablePhone: "",
        },
  });

  if (!canEdit(currentUser?.role)) {
    return (
      <Card>
        <CardContent className="pt-5">
          <p className="text-slate-600 dark:text-slate-400">ليس لديك صلاحية لإنشاء أو تعديل ملف.</p>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = (data: FormValues) => {
    const payload: Omit<Family, "id" | "numeroDossier" | "createdAt" | "updatedAt"> = {
      nomFamille: data.nomFamille,
      nomFamilleFr: data.nomFamilleFr || undefined,
      dateEnregistrement: data.dateEnregistrement,
      statut: data.statut,
      natureDossier: data.natureDossier,
      kafalaType: data.kafalaType,
      telephone: data.telephone,
      pointMoctab: Number(data.pointMoctab) || 0,
      notes: data.notes,
      responsable: {
        fullName: data.responsableNom,
        fullNameFr: data.responsableNomFr || undefined,
        natureResponsable: data.responsableNature,
        cin: data.responsableCin,
        address: data.responsableAddress,
        addressFr: data.responsableAddressFr || undefined,
        phone: data.responsablePhone || data.telephone,
        photo: responsablePhoto,
      },
    };

    if (isEdit && existing) {
      updateFamily(existing.id, payload, currentUser?.id, currentUser?.username);
      toast.success("تم تحديث الملف بنجاح");
      navigate(`/families/${existing.id}`);
    } else {
      const created = createFamily(payload, currentUser?.id, currentUser?.username);
      toast.success(`تم إنشاء الملف رقم ${created.numeroDossier}`);
      navigate(`/families/${created.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 max-w-4xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-emerald-600 inline-flex items-center gap-1 mb-1"
          >
            <ArrowRight className="w-4 h-4" />
            رجوع
          </button>
          <h1 className="text-2xl lg:text-3xl font-bold">
            {isEdit ? `تعديل الملف #${existing?.numeroDossier}` : "ملف جديد"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>معلومات الملف</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="اسم العائلة *"
              {...register("nomFamille", { required: "هذا الحقل مطلوب" })}
              error={errors.nomFamille?.message}
            />
            <Input
              label="Nom de famille (FR)"
              dir="ltr"
              placeholder="Latin / Français"
              {...register("nomFamilleFr")}
            />
            <Input
              label="تاريخ التسجيل *"
              type="date"
              {...register("dateEnregistrement", { required: "هذا الحقل مطلوب" })}
              error={errors.dateEnregistrement?.message}
            />
            <Input
              label="الهاتف"
              type="tel"
              {...register("telephone")}
              placeholder="05XXXXXXXX"
            />
            <Select label="حالة الملف" {...register("statut")}>
              <option value="نشيط">نشيط</option>
              <option value="معلق">معلق</option>
              <option value="مغلق">مغلق</option>
            </Select>
            <Select label="طبيعة الملف" {...register("natureDossier")}>
              <option value="كفالة شهرية">كفالة شهرية</option>
              <option value="كفالة عامة">كفالة عامة</option>
              <option value="حماية القاصر">حماية القاصر</option>
            </Select>
            <Select label="نوع الكفالة (للمؤشر)" {...register("kafalaType")}>
              <option value="شهرية">شهرية</option>
              <option value="عامة">عامة</option>
              <option value="حماية القاصر">حماية القاصر</option>
            </Select>
            <Input
              label="نقطة المكتب"
              type="number"
              step="0.5"
              {...register("pointMoctab", { valueAsNumber: true })}
              hint="نقطة تقديرية يضيفها المكتب"
            />
            <div className="md:col-span-2 lg:col-span-3">
              <Textarea label="ملاحظات المكتب" {...register("notes")} rows={3} placeholder="ملاحظات حول الملف..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المكلف بالأسرة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center md:justify-start pb-2 border-b border-slate-100 dark:border-slate-800">
              <PhotoUpload
                value={responsablePhoto}
                onChange={setResponsablePhoto}
                label="صورة المكلف"
                fallbackName={watch("responsableNom") || ""}
                size="lg"
              />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="الاسم الكامل *"
              {...register("responsableNom", { required: "هذا الحقل مطلوب" })}
              error={errors.responsableNom?.message}
            />
            <Input
              label="Nom complet (FR)"
              dir="ltr"
              placeholder="Latin / Français"
              {...register("responsableNomFr")}
            />
            <Select label="طبيعة المكلف" {...register("responsableNature")}>
              <option value="الأم">الأم</option>
              <option value="الجد">الجد</option>
              <option value="الجدة">الجدة</option>
              <option value="العم">العم</option>
              <option value="الخال">الخال</option>
              <option value="الأخ">الأخ</option>
              <option value="الأخت">الأخت</option>
              <option value="آخر">آخر</option>
            </Select>
            <Input label="رقم البطاقة الوطنية" {...register("responsableCin")} />
            <Input label="الهاتف" {...register("responsablePhone")} type="tel" />
            <Input label="العنوان" {...register("responsableAddress")} />
            <div className="md:col-span-2 lg:col-span-3">
              <Input
                label="Adresse (FR)"
                dir="ltr"
                placeholder="Latin / Français"
                {...register("responsableAddressFr")}
              />
            </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-start sticky bottom-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
          <Button type="submit" size="lg">
            <Save className="w-4 h-4" />
            {isEdit ? "حفظ التعديلات" : "إنشاء الملف"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>
            إلغاء
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
