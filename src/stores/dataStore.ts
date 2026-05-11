import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Family,
  Orphan,
  Parent,
  Housing,
  Savings,
  Equipment,
  Workshop,
  WorkshopRegistration,
  Schooling,
  AuditEntry,
} from "../types";
import { uid } from "../lib/utils";

interface DataState {
  families: Family[];
  parents: Parent[];
  orphans: Orphan[];
  schoolings: Schooling[];
  housings: Housing[];
  savings: Savings[];
  equipments: Equipment[];
  workshops: Workshop[];
  registrations: WorkshopRegistration[];
  auditLog: AuditEntry[];
  nextDossierNumber: number;

  // Families
  createFamily: (data: Omit<Family, "id" | "numeroDossier" | "createdAt" | "updatedAt">, userId?: string, username?: string) => Family;
  updateFamily: (id: string, patch: Partial<Family>, userId?: string, username?: string) => void;
  deleteFamily: (id: string, userId?: string, username?: string) => void;
  getFamily: (id: string) => Family | undefined;

  // Parents
  upsertParent: (parent: Omit<Parent, "id"> & { id?: string }) => Parent;
  deleteParent: (id: string) => void;

  // Orphans
  createOrphan: (data: Omit<Orphan, "id">) => Orphan;
  updateOrphan: (id: string, patch: Partial<Orphan>) => void;
  deleteOrphan: (id: string) => void;

  // Schoolings
  upsertSchooling: (s: Omit<Schooling, "id"> & { id?: string }) => Schooling;
  deleteSchooling: (id: string) => void;

  // Housing
  upsertHousing: (h: Omit<Housing, "id"> & { id?: string }) => Housing;

  // Savings
  addSavings: (s: Omit<Savings, "id">) => Savings;
  deleteSavings: (id: string) => void;

  // Equipment
  addEquipment: (e: Omit<Equipment, "id">) => Equipment;
  deleteEquipment: (id: string) => void;

  // Workshops
  createWorkshop: (w: Omit<Workshop, "id">) => Workshop;
  updateWorkshop: (id: string, patch: Partial<Workshop>) => void;
  deleteWorkshop: (id: string) => void;

  // Registrations
  enrollOrphan: (workshopId: string, orphanId: string) => WorkshopRegistration | null;
  unenrollOrphan: (id: string) => void;

  // Reset / seed
  resetAll: () => void;
  loadSeed: () => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

function audit(state: DataState, userId: string, username: string, action: string, entity: string, entityId: string, details?: string): AuditEntry[] {
  return [
    {
      id: uid("a_"),
      userId,
      username,
      action,
      entity,
      entityId,
      timestamp: nowIso(),
      details,
    },
    ...state.auditLog,
  ].slice(0, 500);
}

const defaultWorkshops: Workshop[] = [
  { id: uid("w_"), nom: "درس الدعم", description: "حصص الدعم المدرسي", horaire: "السبت 14:00 - 16:00", capaciteMax: 30, active: true },
  { id: uid("w_"), nom: "حفظ القرآن الكريم", description: "تحفيظ القرآن الكريم", horaire: "يوميا 18:00 - 19:30", capaciteMax: 40, active: true },
  { id: uid("w_"), nom: "الإنشاد", description: "إيقاع الكلام والأناشيد", horaire: "الأحد 10:00 - 12:00", capaciteMax: 20, active: true },
  { id: uid("w_"), nom: "الرقصات", description: "ورشة الرقصات الفولكلورية", horaire: "الأحد 14:00 - 16:00", capaciteMax: 20, active: true },
  { id: uid("w_"), nom: "المسرح", description: "ورشة المسرح", horaire: "الجمعة 16:00 - 18:00", capaciteMax: 25, active: true },
];

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      families: [],
      parents: [],
      orphans: [],
      schoolings: [],
      housings: [],
      savings: [],
      equipments: [],
      workshops: defaultWorkshops,
      registrations: [],
      auditLog: [],
      nextDossierNumber: 1,

      createFamily: (data, userId, username) => {
        const family: Family = {
          ...data,
          id: uid("f_"),
          numeroDossier: get().nextDossierNumber,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          createdBy: userId,
        };
        set((s) => ({
          families: [family, ...s.families],
          nextDossierNumber: s.nextDossierNumber + 1,
          auditLog: userId && username ? audit(s, userId, username, "إنشاء", "ملف", family.id, `الملف رقم ${family.numeroDossier}`) : s.auditLog,
        }));
        return family;
      },
      updateFamily: (id, patch, userId, username) => {
        set((s) => ({
          families: s.families.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: nowIso() } : f)),
          auditLog: userId && username ? audit(s, userId, username, "تعديل", "ملف", id) : s.auditLog,
        }));
      },
      deleteFamily: (id, userId, username) => {
        set((s) => ({
          families: s.families.filter((f) => f.id !== id),
          parents: s.parents.filter((p) => p.familyId !== id),
          orphans: s.orphans.filter((o) => o.familyId !== id),
          schoolings: s.schoolings.filter((sc) => {
            const orphan = s.orphans.find((o) => o.id === sc.orphanId);
            return orphan?.familyId !== id;
          }),
          housings: s.housings.filter((h) => h.familyId !== id),
          savings: s.savings.filter((sv) => sv.familyId !== id),
          equipments: s.equipments.filter((e) => e.familyId !== id),
          auditLog: userId && username ? audit(s, userId, username, "حذف", "ملف", id) : s.auditLog,
        }));
      },
      getFamily: (id) => get().families.find((f) => f.id === id),

      upsertParent: (parent) => {
        const id = parent.id || uid("p_");
        const newParent: Parent = { ...parent, id };
        set((s) => ({
          parents: s.parents.some((p) => p.id === id)
            ? s.parents.map((p) => (p.id === id ? newParent : p))
            : [...s.parents, newParent],
        }));
        return newParent;
      },
      deleteParent: (id) => set((s) => ({ parents: s.parents.filter((p) => p.id !== id) })),

      createOrphan: (data) => {
        const orphan: Orphan = { ...data, id: uid("o_") };
        set((s) => ({ orphans: [...s.orphans, orphan] }));
        return orphan;
      },
      updateOrphan: (id, patch) =>
        set((s) => ({
          orphans: s.orphans.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),
      deleteOrphan: (id) =>
        set((s) => ({
          orphans: s.orphans.filter((o) => o.id !== id),
          schoolings: s.schoolings.filter((sc) => sc.orphanId !== id),
          registrations: s.registrations.filter((r) => r.orphanId !== id),
        })),

      upsertSchooling: (s) => {
        const id = s.id || uid("sc_");
        const sch: Schooling = { ...s, id };
        set((st) => ({
          schoolings: st.schoolings.some((x) => x.id === id)
            ? st.schoolings.map((x) => (x.id === id ? sch : x))
            : [...st.schoolings, sch],
        }));
        return sch;
      },
      deleteSchooling: (id) => set((s) => ({ schoolings: s.schoolings.filter((x) => x.id !== id) })),

      upsertHousing: (h) => {
        const id = h.id || uid("h_");
        const housing: Housing = { ...h, id };
        set((s) => ({
          housings: s.housings.some((x) => x.familyId === h.familyId)
            ? s.housings.map((x) => (x.familyId === h.familyId ? { ...housing, id: x.id } : x))
            : [...s.housings, housing],
        }));
        return housing;
      },

      addSavings: (s) => {
        const sv: Savings = { ...s, id: uid("sv_") };
        set((st) => ({ savings: [sv, ...st.savings] }));
        return sv;
      },
      deleteSavings: (id) => set((s) => ({ savings: s.savings.filter((x) => x.id !== id) })),

      addEquipment: (e) => {
        const eq: Equipment = { ...e, id: uid("eq_") };
        set((s) => ({ equipments: [eq, ...s.equipments] }));
        return eq;
      },
      deleteEquipment: (id) => set((s) => ({ equipments: s.equipments.filter((x) => x.id !== id) })),

      createWorkshop: (w) => {
        const ws: Workshop = { ...w, id: uid("w_") };
        set((s) => ({ workshops: [...s.workshops, ws] }));
        return ws;
      },
      updateWorkshop: (id, patch) =>
        set((s) => ({
          workshops: s.workshops.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),
      deleteWorkshop: (id) =>
        set((s) => ({
          workshops: s.workshops.filter((w) => w.id !== id),
          registrations: s.registrations.filter((r) => r.workshopId !== id),
        })),

      enrollOrphan: (workshopId, orphanId) => {
        const exists = get().registrations.find(
          (r) => r.workshopId === workshopId && r.orphanId === orphanId && r.actif
        );
        if (exists) return null;
        const reg: WorkshopRegistration = {
          id: uid("r_"),
          workshopId,
          orphanId,
          dateInscription: nowIso(),
          actif: true,
        };
        set((s) => ({ registrations: [...s.registrations, reg] }));
        return reg;
      },
      unenrollOrphan: (id) =>
        set((s) => ({
          registrations: s.registrations.map((r) =>
            r.id === id ? { ...r, actif: false } : r
          ),
        })),

      resetAll: () =>
        set({
          families: [],
          parents: [],
          orphans: [],
          schoolings: [],
          housings: [],
          savings: [],
          equipments: [],
          workshops: defaultWorkshops,
          registrations: [],
          auditLog: [],
          nextDossierNumber: 1,
        }),

      loadSeed: () => {
        const state = get();
        if (state.families.length > 0) return;
        const f1 = state.createFamily({
          dateEnregistrement: "2024-09-12",
          statut: "نشيط",
          natureDossier: "كفالة شهرية",
          nomFamille: "العلوي",
          telephone: "0612345678",
          kafalaType: "شهرية",
          pointMoctab: 5,
          notes: "ملف نشيط - يتم متابعته شهريا",
          responsable: {
            fullName: "فاطمة الزهراء العلوي",
            natureResponsable: "الأم",
            cin: "F123456",
            address: "حي السلام، شارع المغرب العربي، وجدة",
            phone: "0612345678",
          },
        });
        const o1 = state.createOrphan({
          familyId: f1.id,
          nomFamille: "العلوي",
          prenom: "محمد",
          sexe: "ذكر",
          dateNaissance: "2014-03-22",
          lieuNaissance: "وجدة",
          health: "سليم",
        });
        const o2 = state.createOrphan({
          familyId: f1.id,
          nomFamille: "العلوي",
          prenom: "سارة",
          sexe: "أنثى",
          dateNaissance: "2017-07-15",
          lieuNaissance: "وجدة",
          health: "سليم",
        });
        state.upsertParent({
          familyId: f1.id,
          pereNom: "أحمد العلوي",
          pereDateNaissance: "1975-04-10",
          pereDateDeces: "2022-11-03",
          mereNom: "فاطمة الزهراء العلوي",
          mereDateNaissance: "1980-08-25",
          mereCin: "F123456",
          mereSante: "سليم",
        });
        state.upsertHousing({
          familyId: f1.id,
          type: "كراء",
          nbPieces: 3,
          etat: "متوسط",
          observations: "يحتاج إلى صيانة",
        });
        state.addSavings({
          familyId: f1.id,
          montant: 200,
          dateDepot: "2024-12-01",
          observations: "إيداع شهر دجنبر",
        });
        state.upsertSchooling({
          orphanId: o1.id,
          anneeScolaire: "2024-2025",
          etablissement: "مدرسة الفتح الابتدائية",
          niveau: "السنة الرابعة ابتدائي",
          moyenne: 7.5,
          kafalaType: "شهرية",
          telephone: "0536123456",
        });
        state.upsertSchooling({
          orphanId: o2.id,
          anneeScolaire: "2024-2025",
          etablissement: "روض الأطفال السلام",
          niveau: "التعليم الأولي",
          moyenne: 8,
          kafalaType: "شهرية",
          telephone: "0536123456",
        });

        const f2 = state.createFamily({
          dateEnregistrement: "2023-05-04",
          statut: "نشيط",
          natureDossier: "كفالة عامة",
          nomFamille: "البكاري",
          telephone: "0698765432",
          kafalaType: "عامة",
          pointMoctab: 3,
          notes: "",
          responsable: {
            fullName: "خديجة البكاري",
            natureResponsable: "الأم",
            cin: "BK7891011",
            address: "حي القدس، تجزئة الحياة، وجدة",
            phone: "0698765432",
          },
        });
        const o3 = state.createOrphan({
          familyId: f2.id,
          nomFamille: "البكاري",
          prenom: "ياسين",
          sexe: "ذكر",
          dateNaissance: "2010-01-18",
          lieuNaissance: "وجدة",
          health: "مرض مزمن",
        });
        state.upsertParent({
          familyId: f2.id,
          pereNom: "عبد الكريم البكاري",
          pereDateNaissance: "1972-02-15",
          pereDateDeces: "2021-06-30",
          mereNom: "خديجة البكاري",
          mereDateNaissance: "1978-12-05",
          mereCin: "BK7891011",
          mereSante: "سليم",
        });
        state.upsertHousing({
          familyId: f2.id,
          type: "ملكية خاصة",
          nbPieces: 4,
          etat: "جيد",
        });
        state.addSavings({
          familyId: f2.id,
          montant: 750,
          dateDepot: "2024-11-20",
        });
        state.upsertSchooling({
          orphanId: o3.id,
          anneeScolaire: "2024-2025",
          etablissement: "ثانوية ابن سينا الإعدادية",
          niveau: "السنة الثانية إعدادي",
          moyenne: 8.2,
          kafalaType: "عامة",
          telephone: "0536987654",
        });

        const f3 = state.createFamily({
          dateEnregistrement: "2022-08-15",
          statut: "نشيط",
          natureDossier: "حماية القاصر",
          nomFamille: "الإدريسي",
          telephone: "0655443322",
          kafalaType: "حماية القاصر",
          pointMoctab: 4,
          notes: "ملاحظات المكتب",
          responsable: {
            fullName: "محمد الإدريسي",
            natureResponsable: "العم",
            cin: "ID445566",
            address: "وجدة، حي الأندلس",
            phone: "0655443322",
          },
        });
        state.createOrphan({
          familyId: f3.id,
          nomFamille: "الإدريسي",
          prenom: "أمين",
          sexe: "ذكر",
          dateNaissance: "2012-05-30",
          lieuNaissance: "وجدة",
          health: "إعاقة",
        });
        state.upsertParent({
          familyId: f3.id,
          pereNom: "يوسف الإدريسي",
          pereDateNaissance: "1968-09-09",
          pereDateDeces: "2020-03-12",
          mereNom: "زينب الإدريسي",
          mereDateNaissance: "1972-11-22",
          mereCin: "ID778899",
          mereSante: "مرض مزمن",
        });
        state.upsertHousing({
          familyId: f3.id,
          type: "ملكية مشتركة",
          nbPieces: 3,
          etat: "حسن",
        });
      },
    }),
    { name: "kafala-data", version: 1 }
  )
);
