import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Search, Package, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { EmptyState } from "../components/ui/EmptyState";
import { downloadCSV, formatDate } from "../lib/utils";
import { toast } from "../components/ui/Toast";

export default function EquipmentPage() {
  const [q, setQ] = useState("");
  const { families, equipments } = useDataStore();

  const rows = useMemo(() => {
    let arr = equipments.map((e) => {
      const f = families.find((x) => x.id === e.familyId);
      return { eq: e, family: f };
    });
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      arr = arr.filter(
        (r) =>
          r.eq.type.toLowerCase().includes(lower) ||
          r.family?.nomFamille?.toLowerCase().includes(lower) ||
          String(r.family?.numeroDossier || "").includes(lower)
      );
    }
    arr.sort((a, b) => new Date(b.eq.dateAttribution).getTime() - new Date(a.eq.dateAttribution).getTime());
    return arr;
  }, [equipments, families, q]);

  const handleExport = () => {
    if (!rows.length) return toast.error("لا توجد بيانات");
    downloadCSV(
      `equipment-${Date.now()}`,
      rows.map((r) => ({
        "رقم الملف": r.family?.numeroDossier || "",
        "اسم العائلة": r.family?.nomFamille || "",
        "التجهيز": r.eq.type,
        "تاريخ التسليم": r.eq.dateAttribution,
        "ملاحظات": r.eq.observations || "",
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
            <Package className="w-7 h-7 text-emerald-600" />
            التجهيزات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            التجهيزات الموزعة على الأسر
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </motion.div>

      <Card>
        <CardContent className="pt-5">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث بالتجهيز أو الأسرة..."
              className="w-full pr-10 pl-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="لا توجد تجهيزات" description="أضف التجهيزات من تبويب التجهيزات داخل الملفات." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>رقم الملف</TH>
              <TH>اسم العائلة</TH>
              <TH>التجهيز</TH>
              <TH>تاريخ التسليم</TH>
              <TH>ملاحظات</TH>
              <TH className="text-left">إجراء</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.eq.id}>
                <TD className="font-mono">#{r.family?.numeroDossier || "—"}</TD>
                <TD className="font-medium">{r.family?.nomFamille || "—"}</TD>
                <TD>{r.eq.type}</TD>
                <TD>{formatDate(r.eq.dateAttribution)}</TD>
                <TD className="text-slate-500 dark:text-slate-400">{r.eq.observations || "—"}</TD>
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
