// Central company profile — single source of truth, reused across the header,
// company card and the invoice document (Factures).

export interface CompanyManager {
  fr: string;
  ar: string;
}

export interface CompanyInfo {
  name: string;
  slogan: { fr: string; ar: string };
  managers: CompanyManager[];
  email: string;
  country: { fr: string; ar: string };
}

export const COMPANY: CompanyInfo = {
  name: "Chaafai Emballage",
  slogan: {
    fr: "Solutions d'emballage pour professionnels",
    ar: "حلول التغليف للمهنيين",
  },
  managers: [
    { fr: "Monsieur Chaafai", ar: "السيد الشعفي" },
    { fr: "Monsieur Ait Haddou Oulhaj Med", ar: "السيد آيت حدو أولحاج محمد" },
  ],
  email: "contact@chaafai-emballage.ma",
  country: { fr: "Maroc", ar: "المغرب" },
};
