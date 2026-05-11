import { useState } from "react";
import { useForm } from "react-hook-form";
import { Save, Lock, Sun, Moon, Trash2, Database, Download, Upload, UserCog, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore, canManageUsers, roleLabels } from "../stores/authStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useDataStore } from "../stores/dataStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Dialog, DialogFooter } from "../components/ui/Dialog";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { toast } from "../components/ui/Toast";
import type { Role } from "../types";

export default function Settings() {
  const { currentUser, changePassword, users, addUser, updateUser, deleteUser } = useAuthStore();
  const { theme, setTheme } = useSettingsStore();
  const dataStore = useDataStore();
  const [userDialog, setUserDialog] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleExportData = () => {
    const data = {
      families: dataStore.families,
      parents: dataStore.parents,
      orphans: dataStore.orphans,
      schoolings: dataStore.schoolings,
      housings: dataStore.housings,
      savings: dataStore.savings,
      equipments: dataStore.equipments,
      workshops: dataStore.workshops,
      registrations: dataStore.registrations,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kafala-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("تم تصدير النسخة الاحتياطية");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 max-w-4xl"
    >
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">الإعدادات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">إدارة الحساب والمظهر والنظام</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الحساب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">اسم المستخدم</span>
            <span className="font-medium">{currentUser?.username}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">الاسم الكامل</span>
            <span className="font-medium">{currentUser?.fullName}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500">الدور</span>
            <Badge variant="info">{roleLabels[currentUser?.role || "lecteur"]}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>المظهر</CardTitle>
          <CardDescription>اختر مظهر الواجهة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition ${
                theme === "light"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <Sun className="w-4 h-4" />
              فاتح
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition ${
                theme === "dark"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <Moon className="w-4 h-4" />
              داكن
            </button>
          </div>
        </CardContent>
      </Card>

      {/* User management (directeur only) */}
      {canManageUsers(currentUser?.role) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <UserCog className="w-5 h-5" />
                إدارة المستخدمين
              </CardTitle>
              <Button size="sm" onClick={() => setUserDialog(true)}>
                <Plus className="w-4 h-4" />
                مستخدم جديد
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <tr>
                  <TH>اسم المستخدم</TH>
                  <TH>الاسم الكامل</TH>
                  <TH>الدور</TH>
                  <TH>الحالة</TH>
                  <TH className="text-left">إجراءات</TH>
                </tr>
              </THead>
              <TBody>
                {users.map((u) => (
                  <TR key={u.id}>
                    <TD className="font-mono">{u.username}</TD>
                    <TD>{u.fullName}</TD>
                    <TD>
                      <Badge variant="info">{roleLabels[u.role]}</Badge>
                    </TD>
                    <TD>
                      <Badge variant={u.active ? "success" : "neutral"}>{u.active ? "فعال" : "معطل"}</Badge>
                    </TD>
                    <TD>
                      <div className="flex gap-1 justify-start">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateUser(u.id, { active: !u.active })}
                        >
                          {u.active ? "تعطيل" : "تفعيل"}
                        </Button>
                        {u.id !== currentUser?.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => setDeleteUserId(u.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Data management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            إدارة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4" />
              نسخة احتياطية
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                dataStore.loadSeed();
                toast.success("تم تحميل بيانات تجريبية");
              }}
            >
              <Upload className="w-4 h-4" />
              بيانات تجريبية
            </Button>
            <Button variant="danger" onClick={() => setResetConfirm(true)}>
              <Trash2 className="w-4 h-4" />
              مسح كل البيانات
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            البيانات مخزنة محليا في متصفحك. ينصح بإجراء نسخ احتياطية بانتظام.
          </p>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserDialog
        open={userDialog}
        onOpenChange={setUserDialog}
        onSave={(data) => {
          addUser(data);
          toast.success("تمت إضافة المستخدم");
          setUserDialog(false);
        }}
      />
      <ConfirmDialog
        open={!!deleteUserId}
        onOpenChange={(v) => !v && setDeleteUserId(null)}
        title="حذف المستخدم"
        description="هل تريد حذف هذا المستخدم؟"
        onConfirm={() => {
          if (deleteUserId) {
            deleteUser(deleteUserId);
            toast.success("تم الحذف");
          }
          setDeleteUserId(null);
        }}
      />
      <ConfirmDialog
        open={resetConfirm}
        onOpenChange={setResetConfirm}
        title="مسح كل البيانات"
        description="سيتم مسح جميع الملفات والأيتام والورشات. هذا الإجراء لا يمكن التراجع عنه."
        onConfirm={() => {
          dataStore.resetAll();
          toast.success("تم مسح كل البيانات");
        }}
      />
    </motion.div>
  );
}

function PasswordForm() {
  const { changePassword } = useAuthStore();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      return toast.error("كلمة المرور الجديدة وتأكيدها غير متطابقتين");
    }
    const res = changePassword(data.oldPassword, data.newPassword);
    if (res.ok) {
      toast.success("تم تغيير كلمة المرور");
      reset();
    } else {
      toast.error(res.error || "خطأ");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-3 gap-4">
      <Input
        label="كلمة المرور الحالية"
        type="password"
        {...register("oldPassword", { required: "مطلوب" })}
        error={errors.oldPassword?.message as string}
      />
      <Input
        label="كلمة المرور الجديدة"
        type="password"
        {...register("newPassword", { required: "مطلوب", minLength: { value: 4, message: "4 خانات على الأقل" } })}
        error={errors.newPassword?.message as string}
      />
      <Input
        label="تأكيد كلمة المرور"
        type="password"
        {...register("confirmPassword", { required: "مطلوب" })}
        error={errors.confirmPassword?.message as string}
      />
      <div className="md:col-span-3">
        <Button type="submit">
          <Save className="w-4 h-4" />
          تغيير كلمة المرور
        </Button>
      </div>
    </form>
  );
}

function UserDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: { username: string; fullName: string; password: string; role: Role }) => void;
}) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { username: "", fullName: "", password: "", role: "assistante" as Role },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="مستخدم جديد" size="md">
      <form
        onSubmit={handleSubmit((data) => {
          onSave(data);
          reset();
        })}
        className="space-y-4"
      >
        <Input label="اسم المستخدم *" {...register("username", { required: true })} />
        <Input label="الاسم الكامل *" {...register("fullName", { required: true })} />
        <Input label="كلمة المرور *" type="password" {...register("password", { required: true, minLength: 4 })} />
        <Select label="الدور" {...register("role")}>
          <option value="directeur">المدير</option>
          <option value="assistante">مسؤولة الملفات</option>
          <option value="lecteur">قارئ</option>
        </Select>
        <DialogFooter>
          <Button type="submit">
            <Save className="w-4 h-4" />
            إنشاء
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
