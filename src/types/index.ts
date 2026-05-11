export type Role = "directeur" | "assistante" | "lecteur";

export interface User {
  id: string;
  username: string;
  fullName: string;
  password: string;
  role: Role;
  active: boolean;
  lastLogin?: string;
}

export type FamilyStatus = "نشيط" | "مغلق" | "معلق";
export type FamilyNature = "كفالة شهرية" | "كفالة عامة" | "حماية القاصر";
export type Sex = "ذكر" | "أنثى";
export type HealthStatus = "سليم" | "مرض مزمن" | "إعاقة";
export type HousingType = "ملكية خاصة" | "ملكية مشتركة" | "مجاني" | "كراء" | "رهن";
export type ResponsibleNature = "الأم" | "الجد" | "الجدة" | "العم" | "الخال" | "الأخ" | "الأخت" | "آخر";
export type KafalaType = "شهرية" | "عامة" | "حماية القاصر";

export interface Responsable {
  fullName: string;
  natureResponsable: ResponsibleNature | "";
  cin: string;
  address: string;
  phone: string;
}

export interface Parent {
  id: string;
  familyId: string;
  pereNom: string;
  pereDateNaissance: string;
  pereDateDeces: string;
  mereNom: string;
  mereDateNaissance: string;
  mereCin: string;
  mereSante: HealthStatus | "";
  mereDateDeces?: string;
  observations?: string;
}

export interface Orphan {
  id: string;
  familyId: string;
  nomFamille: string;
  prenom: string;
  sexe: Sex;
  dateNaissance: string;
  lieuNaissance: string;
  health: HealthStatus;
}

export interface Schooling {
  id: string;
  orphanId: string;
  anneeScolaire: string;
  etablissement: string;
  niveau: string;
  moyenne: number;
  kafalaType: KafalaType;
  telephone: string;
}

export interface Housing {
  id: string;
  familyId: string;
  type: HousingType;
  nbPieces: number;
  etat: string;
  observations?: string;
}

export interface Savings {
  id: string;
  familyId: string;
  montant: number;
  dateDepot: string;
  observations?: string;
}

export interface Equipment {
  id: string;
  familyId: string;
  type: string;
  dateAttribution: string;
  observations?: string;
}

export interface Workshop {
  id: string;
  nom: string;
  description: string;
  horaire: string;
  capaciteMax: number;
  active: boolean;
}

export interface WorkshopRegistration {
  id: string;
  workshopId: string;
  orphanId: string;
  dateInscription: string;
  actif: boolean;
}

export interface Family {
  id: string;
  numeroDossier: number;
  dateEnregistrement: string;
  statut: FamilyStatus;
  natureDossier: FamilyNature;
  nomFamille: string;
  responsable: Responsable;
  notes: string;
  pointMoctab: number;
  telephone: string;
  kafalaType: KafalaType;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface IndicatorParams {
  ageMaxOrphan: number;
  ageThreshold: number;
  scoreAgeYoung: number;
  scoreAgeOld: number;

  scoreSante: number;
  scoreMaladieChronique: number;
  scoreInvalidite: number;

  scoreKafalaMensuelle: number;
  scoreKafalaGenerale: number;
  scoreKafalaProtection: number;

  scoreLogementPropriete: number;
  scoreLogementCopropriete: number;
  scoreLogementGratuit: number;
  scoreLogementLocation: number;

  epargneNiveau1Max: number;
  scoreEpargneNiveau1: number;
  epargneNiveau2Max: number;
  scoreEpargneNiveau2: number;
  epargneNiveau3Max: number;
  scoreEpargneNiveau3: number;
  scoreEpargneNiveau4: number;

  mentionBienMin: number;
  scoreMentionBien: number;
  mentionTresBienMin: number;
  scoreMentionTresBien: number;

  minMembresAllocation: number;
}

export interface AuditEntry {
  id: string;
  userId: string;
  username: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  details?: string;
}

export interface ClassificationRow {
  numeroDossier: number;
  nomFamille: string;
  responsableNom: string;
  cin: string;
  telephone: string;
  natureDossier: string;
  kafalaType: string;
  scoreTotal: number;
  pointMoctab: number;
  scoreGlobal: number;
  statut: string;
  classification: "ممتاز" | "جيد" | "متوسط" | "ضعيف";
}
