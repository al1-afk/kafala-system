import { calculateAge } from "./utils";
import type {
  Family,
  Orphan,
  Housing,
  Savings,
  Schooling,
  IndicatorParams,
  Parent,
} from "../types";

export const defaultIndicatorParams: IndicatorParams = {
  ageMaxOrphan: 18,
  ageThreshold: 14,
  scoreAgeYoung: 10,
  scoreAgeOld: 5,

  scoreSante: 0,
  scoreMaladieChronique: 5,
  scoreInvalidite: 10,

  scoreKafalaMensuelle: 20,
  scoreKafalaGenerale: 10,
  scoreKafalaProtection: 10,

  scoreLogementPropriete: 0,
  scoreLogementCopropriete: 0,
  scoreLogementGratuit: 0,
  scoreLogementLocation: 5,

  epargneNiveau1Max: 500,
  scoreEpargneNiveau1: 5,
  epargneNiveau2Max: 1000,
  scoreEpargneNiveau2: 0,
  epargneNiveau3Max: 2000,
  scoreEpargneNiveau3: 0,
  scoreEpargneNiveau4: 0,

  mentionBienMin: 7,
  scoreMentionBien: 2,
  mentionTresBienMin: 8,
  scoreMentionTresBien: 3,

  minMembresAllocation: 3,
};

interface ScoreBreakdown {
  ageScore: number;
  healthScore: number;
  kafalaScore: number;
  housingScore: number;
  savingsScore: number;
  schoolingScore: number;
  total: number;
  classification: "ممتاز" | "جيد" | "متوسط" | "ضعيف";
}

export function classifyScore(total: number): ScoreBreakdown["classification"] {
  if (total >= 35) return "ممتاز";
  if (total >= 25) return "جيد";
  if (total >= 15) return "متوسط";
  return "ضعيف";
}

export function computeFamilyScore(args: {
  family: Family;
  orphans: Orphan[];
  parents: Parent[];
  housing?: Housing | null;
  savings: Savings[];
  schoolings: Schooling[];
  params: IndicatorParams;
}): ScoreBreakdown {
  const { family, orphans, housing, savings, schoolings, params } = args;

  // AGE: use youngest orphan classification - average per orphan
  let ageScore = 0;
  if (orphans.length > 0) {
    const ages = orphans.map((o) => calculateAge(o.dateNaissance) ?? 0);
    const eligibleAges = ages.filter((a) => a <= params.ageMaxOrphan);
    const useAges = eligibleAges.length > 0 ? eligibleAges : ages;
    if (useAges.length > 0) {
      const avg = useAges.reduce((s, a) => s + a, 0) / useAges.length;
      ageScore = avg <= params.ageThreshold ? params.scoreAgeYoung : params.scoreAgeOld;
    }
  }

  // HEALTH: worst case across orphans
  let healthScore = params.scoreSante;
  for (const o of orphans) {
    if (o.health === "إعاقة") {
      healthScore = Math.max(healthScore, params.scoreInvalidite);
    } else if (o.health === "مرض مزمن") {
      healthScore = Math.max(healthScore, params.scoreMaladieChronique);
    }
  }

  // KAFALA TYPE
  let kafalaScore = 0;
  if (family.kafalaType === "شهرية") kafalaScore = params.scoreKafalaMensuelle;
  else if (family.kafalaType === "عامة") kafalaScore = params.scoreKafalaGenerale;
  else if (family.kafalaType === "حماية القاصر") kafalaScore = params.scoreKafalaProtection;

  // HOUSING
  let housingScore = 0;
  if (housing) {
    switch (housing.type) {
      case "ملكية خاصة":
        housingScore = params.scoreLogementPropriete;
        break;
      case "ملكية مشتركة":
        housingScore = params.scoreLogementCopropriete;
        break;
      case "مجاني":
        housingScore = params.scoreLogementGratuit;
        break;
      case "كراء":
      case "رهن":
        housingScore = params.scoreLogementLocation;
        break;
    }
  }

  // SAVINGS: latest total
  const totalSavings = savings.reduce((sum, s) => sum + (s.montant || 0), 0);
  let savingsScore = 0;
  if (totalSavings <= params.epargneNiveau1Max) {
    savingsScore = params.scoreEpargneNiveau1;
  } else if (totalSavings <= params.epargneNiveau2Max) {
    savingsScore = params.scoreEpargneNiveau2;
  } else if (totalSavings <= params.epargneNiveau3Max) {
    savingsScore = params.scoreEpargneNiveau3;
  } else {
    savingsScore = params.scoreEpargneNiveau4;
  }

  // SCHOOLING: best score across all orphans/years
  let schoolingScore = 0;
  for (const s of schoolings) {
    if (s.moyenne >= params.mentionTresBienMin) {
      schoolingScore = Math.max(schoolingScore, params.scoreMentionTresBien);
    } else if (s.moyenne >= params.mentionBienMin) {
      schoolingScore = Math.max(schoolingScore, params.scoreMentionBien);
    }
  }

  const total =
    ageScore + healthScore + kafalaScore + housingScore + savingsScore + schoolingScore;

  return {
    ageScore,
    healthScore,
    kafalaScore,
    housingScore,
    savingsScore,
    schoolingScore,
    total,
    classification: classifyScore(total),
  };
}
