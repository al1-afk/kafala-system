import { useForm } from "react-hook-form";
import { Save, RotateCcw, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { useSettingsStore } from "../stores/settingsStore";
import { useAuthStore, canManageUsers, canEdit } from "../stores/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { toast } from "../components/ui/Toast";
import type { IndicatorParams } from "../types";
import { defaultIndicatorParams } from "../lib/indicators";

export default function IndicatorsSettings() {
  const { params, updateParams, resetParams } = useSettingsStore();
  const { currentUser } = useAuthStore();
  const editable = canEdit(currentUser?.role);

  const { register, handleSubmit, reset } = useForm<IndicatorParams>({
    values: params,
  });

  const onSubmit = (data: IndicatorParams) => {
    const normalized = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, typeof v === "number" || !isNaN(Number(v)) ? Number(v) : v])
    ) as IndicatorParams;
    updateParams(normalized);
    toast.success("تم حفظ ضبط المؤشرات");
  };

  const handleReset = () => {
    resetParams();
    reset(defaultIndicatorParams);
    toast.success("تم استعادة القيم الافتراضية");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 max-w-5xl"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Calculator className="w-7 h-7 text-emerald-600" />
            ضبط المؤشرات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            تعديل قيم النقط المستعملة في حساب المؤشر الاجتماعي لكل ملف
          </p>
        </div>
        {editable && (
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
            القيم الافتراضية
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>مؤشر سن الأبناء</CardTitle>
            <CardDescription>
              يعتمد على متوسط أعمار الأيتام في الملف. يستثنى اليتامى البالغون السن الأقصى.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <Input
              label="السن الأقصى لليتيم"
              type="number"
              {...register("ageMaxOrphan", { valueAsNumber: true })}
              disabled={!editable}
              hint="بالسنوات"
            />
            <Input
              label="عتبة السن"
              type="number"
              {...register("ageThreshold", { valueAsNumber: true })}
              disabled={!editable}
              hint="السن الفاصل بين الصغار والكبار"
            />
            <Input
              label="نقطة للسن ≤ العتبة"
              type="number"
              step="0.01"
              {...register("scoreAgeYoung", { valueAsNumber: true })}
              disabled={!editable}
            />
            <Input
              label="نقطة للسن > العتبة"
              type="number"
              step="0.01"
              {...register("scoreAgeOld", { valueAsNumber: true })}
              disabled={!editable}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مؤشر الصحة</CardTitle>
            <CardDescription>يحتسب بأسوأ حالة صحية بين الأيتام</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <Input label="سليم" type="number" step="0.01" {...register("scoreSante", { valueAsNumber: true })} disabled={!editable} />
            <Input label="مرض مزمن" type="number" step="0.01" {...register("scoreMaladieChronique", { valueAsNumber: true })} disabled={!editable} />
            <Input label="إعاقة" type="number" step="0.01" {...register("scoreInvalidite", { valueAsNumber: true })} disabled={!editable} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سلم نوع الكفالة</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <Input label="كفالة شهرية" type="number" step="0.01" {...register("scoreKafalaMensuelle", { valueAsNumber: true })} disabled={!editable} />
            <Input label="كفالة عامة" type="number" step="0.01" {...register("scoreKafalaGenerale", { valueAsNumber: true })} disabled={!editable} />
            <Input label="حماية القاصر" type="number" step="0.01" {...register("scoreKafalaProtection", { valueAsNumber: true })} disabled={!editable} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مؤشر السكن</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4">
            <Input label="ملكية خاصة" type="number" step="0.01" {...register("scoreLogementPropriete", { valueAsNumber: true })} disabled={!editable} />
            <Input label="ملكية مشتركة" type="number" step="0.01" {...register("scoreLogementCopropriete", { valueAsNumber: true })} disabled={!editable} />
            <Input label="مجاني" type="number" step="0.01" {...register("scoreLogementGratuit", { valueAsNumber: true })} disabled={!editable} />
            <Input label="كراء / رهن" type="number" step="0.01" {...register("scoreLogementLocation", { valueAsNumber: true })} disabled={!editable} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مؤشر الادخار</CardTitle>
            <CardDescription>المستويات حسب مجموع الإيداعات</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="المستوى 1 - السقف (د.م)" type="number" {...register("epargneNiveau1Max", { valueAsNumber: true })} disabled={!editable} />
            <Input label="نقطة المستوى 1" type="number" step="0.01" {...register("scoreEpargneNiveau1", { valueAsNumber: true })} disabled={!editable} />
            <Input label="المستوى 2 - السقف" type="number" {...register("epargneNiveau2Max", { valueAsNumber: true })} disabled={!editable} />
            <Input label="نقطة المستوى 2" type="number" step="0.01" {...register("scoreEpargneNiveau2", { valueAsNumber: true })} disabled={!editable} />
            <Input label="المستوى 3 - السقف" type="number" {...register("epargneNiveau3Max", { valueAsNumber: true })} disabled={!editable} />
            <Input label="نقطة المستوى 3" type="number" step="0.01" {...register("scoreEpargneNiveau3", { valueAsNumber: true })} disabled={!editable} />
            <Input label="نقطة المستوى 4 (أعلى)" type="number" step="0.01" {...register("scoreEpargneNiveau4", { valueAsNumber: true })} disabled={!editable} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مؤشر النتائج الدراسية</CardTitle>
            <CardDescription>يحتسب بأفضل نتيجة بين تسجيلات اليتامى</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4">
            <Input label="عتبة حسن" type="number" step="0.1" {...register("mentionBienMin", { valueAsNumber: true })} disabled={!editable} />
            <Input label="نقطة حسن" type="number" step="0.01" {...register("scoreMentionBien", { valueAsNumber: true })} disabled={!editable} />
            <Input label="عتبة جيد جدا" type="number" step="0.1" {...register("mentionTresBienMin", { valueAsNumber: true })} disabled={!editable} />
            <Input label="نقطة جيد جدا" type="number" step="0.01" {...register("scoreMentionTresBien", { valueAsNumber: true })} disabled={!editable} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إعدادات أخرى</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="عدد أفراد الأسرة الأدنى للاستفادة من المنحة الكاملة"
              type="number"
              {...register("minMembresAllocation", { valueAsNumber: true })}
              disabled={!editable}
              hint="إذا كان عدد الأفراد أقل، تخفض المنحة"
            />
          </CardContent>
        </Card>

        {editable && (
          <div className="sticky bottom-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md flex gap-2">
            <Button type="submit" size="lg">
              <Save className="w-4 h-4" />
              حفظ الإعدادات
            </Button>
          </div>
        )}
      </form>
    </motion.div>
  );
}
