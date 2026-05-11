import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Search, Building2, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useDataStore } from "../stores/dataStore";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { downloadCSV } from "../lib/utils";
import { toast } from "../components/ui/Toast";

export default function HousingPage() {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const { families, housings } = useDataStore();

  const rows = useMemo(() => {
    let arr = families.map((f) => {
      const h = housings.find((x) => x.familyId === f.id);
      return { family: f, housing: h };
    });
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      arr = arr.filter(
        (r) =>
          r.family.nomFamille.toLowerCase().includes(lower) ||
          String(r.family.numeroDossier).includes(lower)
      );
    }
    if (typeFilter !== "all") arr = arr.filter((r) => r.housing?.type === typeFilter);
    return arr;
  }, [families, housings, q, typeFilter]);

  const handleExport = () => {
    if (!rows.length) return toast.error("لا توجد بيانات");
    downloadCSV(
      `housing-${Date.now()}`,
      rows.map((r) => ({
        "رقم الملف": r.family.numeroDossier,
        "اسم العائلة": r.family.nomFamille,
        "نوع السكن": r.housing?.type || "",
        "عدد الغرف": r.housing?.nbPieces ?? "",
        "الحالة": r.housing?.etat || "",
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
            <Building2 className="w-7 h-7 text-emerald-600" />
            السكن
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            بيانات سكن الأسر
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </motion.div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث..."
                className="w-full pr-10 pl-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">كل أنواع السكن</option>
              <option value="ملكية خاصة">ملكية خاصة</option>
              <option value="ملكية مشتركة">ملكية مشتركة</option>
              <option value="مجاني">مجاني</option>
              <option value="كراء">كراء</option>
              <option value="رهن">رهن</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="لا توجد بيانات" description="أضف ملفات وحدد بيانات السكن." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>رقم الملف</TH>
              <TH>اسم العائلة</TH>
              <TH>نوع السكن</TH>
              <TH>عدد الغرف</TH>
              <TH>الحالة</TH>
              <TH className="text-left">إجراء</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.family.id}>
                <TD className="font-mono">#{r.family.numeroDossier}</TD>
                <TD className="font-medium">{r.family.nomFamille}</TD>
                <TD>
                  {r.housing ? (
                    <Badge
                      variant={
                        r.housing.type === "ملكية خاصة" || r.housing.type === "ملكية مشتركة"
                          ? "success"
                          : r.housing.type === "مجاني"
                          ? "info"
                          : "warning"
                      }
                    >
                      {r.housing.type}
                    </Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TD>
                <TD>{r.housing?.nbPieces ?? "—"}</TD>
                <TD>{r.housing?.etat || "—"}</TD>
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
