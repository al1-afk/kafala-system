import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Search, Wallet, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { useSettingsStore } from "../stores/settingsStore";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { downloadCSV } from "../lib/utils";
import { toast } from "../components/ui/Toast";

export default function SavingsPage() {
  const [q, setQ] = useState("");
  const { families, savings } = useDataStore();
  const { params } = useSettingsStore();

  const rows = useMemo(() => {
    let arr = families
      .map((f) => {
        const fs = savings.filter((s) => s.familyId === f.id);
        const total = fs.reduce((sum, s) => sum + s.montant, 0);
        let level = 1;
        if (total > params.epargneNiveau3Max) level = 4;
        else if (total > params.epargneNiveau2Max) level = 3;
        else if (total > params.epargneNiveau1Max) level = 2;
        return { family: f, count: fs.length, total, level };
      });
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      arr = arr.filter(
        (r) =>
          r.family.nomFamille.toLowerCase().includes(lower) ||
          String(r.family.numeroDossier).includes(lower)
      );
    }
    arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [families, savings, params, q]);

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  const handleExport = () => {
    if (!rows.length) return toast.error("لا توجد بيانات");
    downloadCSV(
      `savings-${Date.now()}`,
      rows.map((r) => ({
        "رقم الملف": r.family.numeroDossier,
        "اسم العائلة": r.family.nomFamille,
        "عدد الإيداعات": r.count,
        "المجموع (د.م)": r.total,
        "المستوى": r.level,
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
            <Wallet className="w-7 h-7 text-emerald-600" />
            الادخار
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ملخص إيداعات الأسر
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">إجمالي الادخار</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
              {grandTotal.toLocaleString()} د.م
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">عدد الأسر التي تدخر</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{rows.filter((r) => r.total > 0).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">عدد الإيداعات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{savings.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الملف..."
              className="w-full pr-10 pl-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="لا توجد بيانات" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>رقم الملف</TH>
              <TH>اسم العائلة</TH>
              <TH>عدد الإيداعات</TH>
              <TH>المجموع</TH>
              <TH>المستوى</TH>
              <TH className="text-left">إجراء</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.family.id}>
                <TD className="font-mono">#{r.family.numeroDossier}</TD>
                <TD className="font-medium">{r.family.nomFamille}</TD>
                <TD>{r.count}</TD>
                <TD className="font-semibold">{r.total.toLocaleString()} د.م</TD>
                <TD>
                  <Badge variant={r.level >= 3 ? "success" : r.level === 2 ? "info" : "warning"}>
                    المستوى {r.level}
                  </Badge>
                </TD>
                <TD>
                  <Link to={`/families/${r.family.id}`}>
                    <Button size="icon" variant="ghost" title="فتح الملف">
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
