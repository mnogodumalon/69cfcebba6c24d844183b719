// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Produktverwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    produkt_name?: string;
    marke?: string;
    modell?: string;
    seriennummer?: string;
    kategorie?: LookupValue;
    kaufpreis?: number;
    kaufdatum?: string; // Format: YYYY-MM-DD oder ISO String
    haendler?: string;
    garantiedauer_monate?: number;
    erwartete_lebensdauer_hersteller?: number;
    realistische_lebensdauer?: number;
    produktfoto?: string;
    notizen_produkt?: string;
  };
}

export interface Ersatzteilpreise {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    produkt_referenz_et?: string; // applookup -> URL zu 'Produktverwaltung' Record
    ersatzteil_name?: string;
    teilenummer?: string;
    ersatzteil_preis?: number;
    verfuegbarkeit?: LookupValue;
    ersatzteil_quelle?: string;
    ersatzteil_url?: string;
    preiserhebung_datum?: string; // Format: YYYY-MM-DD oder ISO String
    notizen_ersatzteil?: string;
  };
}

export interface ReparaturWartung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    produkt_referenz_rw?: string; // applookup -> URL zu 'Produktverwaltung' Record
    eintragsart?: LookupValue;
    ereignis_datum?: string; // Format: YYYY-MM-DD oder ISO String
    beschreibung_reparatur?: string;
    kosten_reparatur?: number;
    verwendete_ersatzteile?: string; // applookup -> URL zu 'Ersatzteilpreise' Record
    dienstleister?: string;
    selbst_repariert?: boolean;
    naechster_wartungstermin?: string; // Format: YYYY-MM-DD oder ISO String
    wartungsintervall_monate?: number;
    notizen_reparatur?: string;
  };
}

export interface Wiederverkaufswert {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    produkt_referenz_wvw?: string; // applookup -> URL zu 'Produktverwaltung' Record
    bewertungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    wiederverkaufswert_eur?: number;
    produktzustand?: LookupValue;
    bewertungsquelle?: LookupValue;
    plattform_url?: string;
    notizen_wvw?: string;
  };
}

export interface TcoBewertung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    produkt_referenz_tco?: string; // applookup -> URL zu 'Produktverwaltung' Record
    bewertungsdatum_tco?: string; // Format: YYYY-MM-DD oder ISO String
    nutzungsdauer_monate?: number;
    gesamte_reparaturkosten?: number;
    gesamte_ersatzteilkosten?: number;
    aktueller_wiederverkaufswert?: number;
    tco_gesamt?: number;
    monatliche_kosten?: number;
    neuanschaffungskosten?: number;
    empfehlung?: LookupValue;
    nachhaltigkeitsbewertung?: LookupValue;
    tco_notizen?: string;
  };
}

export const APP_IDS = {
  PRODUKTVERWALTUNG: '69cfce9261b99eaf5d9c387c',
  ERSATZTEILPREISE: '69cfce988e516fa818e648dd',
  REPARATUR_WARTUNG: '69cfce98377270b96297983d',
  WIEDERVERKAUFSWERT: '69cfce99712efab823a74844',
  TCO_BEWERTUNG: '69cfce9a01bb987b5721b7f0',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'produktverwaltung': {
    kategorie: [{ key: "moebel_einrichtung", label: "Moebel & Einrichtung" }, { key: "sport_freizeit", label: "Sport & Freizeit" }, { key: "sonstiges", label: "Sonstiges" }, { key: "haushaltsgeraet", label: "Haushaltsgeraet" }, { key: "unterhaltungselektronik", label: "Unterhaltungselektronik" }, { key: "computer_it", label: "Computer & IT" }, { key: "smartphone_tablet", label: "Smartphone & Tablet" }, { key: "fahrzeug", label: "Fahrzeug" }, { key: "werkzeug_maschinen", label: "Werkzeug & Maschinen" }],
  },
  'ersatzteilpreise': {
    verfuegbarkeit: [{ key: "verfuegbar", label: "Verfuegbar" }, { key: "eingeschraenkt", label: "Eingeschraenkt verfuegbar" }, { key: "nicht_verfuegbar", label: "Nicht verfuegbar" }],
  },
  'reparatur_&_wartung': {
    eintragsart: [{ key: "reparatur", label: "Reparatur" }, { key: "wartung", label: "Wartung" }, { key: "inspektion", label: "Inspektion" }, { key: "reinigung", label: "Reinigung" }, { key: "software_update", label: "Software-Update" }],
  },
  'wiederverkaufswert': {
    produktzustand: [{ key: "neuwertig", label: "Neuwertig" }, { key: "sehr_gut", label: "Sehr gut" }, { key: "gut", label: "Gut" }, { key: "akzeptabel", label: "Akzeptabel" }, { key: "defekt", label: "Defekt / fuer Ersatzteile" }],
    bewertungsquelle: [{ key: "ebay_kleinanzeigen", label: "eBay Kleinanzeigen" }, { key: "ebay", label: "eBay" }, { key: "rebuy", label: "Rebuy" }, { key: "backmarket", label: "Backmarket" }, { key: "haendler_ankauf", label: "Haendler-Ankauf" }, { key: "eigene_schaetzung", label: "Eigene Schaetzung" }, { key: "sonstiges", label: "Sonstiges" }],
  },
  'tco_bewertung': {
    empfehlung: [{ key: "behalten", label: "Behalten und weiter nutzen" }, { key: "reparieren", label: "Reparieren und weiter nutzen" }, { key: "verkaufen_ersetzen", label: "Verkaufen und ersetzen" }, { key: "entsorgen_ersetzen", label: "Entsorgen und ersetzen" }, { key: "unklar", label: "Noch keine klare Empfehlung" }],
    nachhaltigkeitsbewertung: [{ key: "sehr_nachhaltig", label: "Sehr nachhaltig – lange Nutzung lohnt sich" }, { key: "nachhaltig", label: "Nachhaltig – Weiterbetrieb sinnvoll" }, { key: "neutral", label: "Neutral" }, { key: "wenig_nachhaltig", label: "Wenig nachhaltig – Ersatz empfohlen" }, { key: "nicht_nachhaltig", label: "Nicht nachhaltig – sofortiger Ersatz empfohlen" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'produktverwaltung': {
    'produkt_name': 'string/text',
    'marke': 'string/text',
    'modell': 'string/text',
    'seriennummer': 'string/text',
    'kategorie': 'lookup/select',
    'kaufpreis': 'number',
    'kaufdatum': 'date/date',
    'haendler': 'string/text',
    'garantiedauer_monate': 'number',
    'erwartete_lebensdauer_hersteller': 'number',
    'realistische_lebensdauer': 'number',
    'produktfoto': 'file',
    'notizen_produkt': 'string/textarea',
  },
  'ersatzteilpreise': {
    'produkt_referenz_et': 'applookup/select',
    'ersatzteil_name': 'string/text',
    'teilenummer': 'string/text',
    'ersatzteil_preis': 'number',
    'verfuegbarkeit': 'lookup/radio',
    'ersatzteil_quelle': 'string/text',
    'ersatzteil_url': 'string/url',
    'preiserhebung_datum': 'date/date',
    'notizen_ersatzteil': 'string/textarea',
  },
  'reparatur_&_wartung': {
    'produkt_referenz_rw': 'applookup/select',
    'eintragsart': 'lookup/radio',
    'ereignis_datum': 'date/date',
    'beschreibung_reparatur': 'string/textarea',
    'kosten_reparatur': 'number',
    'verwendete_ersatzteile': 'applookup/select',
    'dienstleister': 'string/text',
    'selbst_repariert': 'bool',
    'naechster_wartungstermin': 'date/date',
    'wartungsintervall_monate': 'number',
    'notizen_reparatur': 'string/textarea',
  },
  'wiederverkaufswert': {
    'produkt_referenz_wvw': 'applookup/select',
    'bewertungsdatum': 'date/date',
    'wiederverkaufswert_eur': 'number',
    'produktzustand': 'lookup/select',
    'bewertungsquelle': 'lookup/select',
    'plattform_url': 'string/url',
    'notizen_wvw': 'string/textarea',
  },
  'tco_bewertung': {
    'produkt_referenz_tco': 'applookup/select',
    'bewertungsdatum_tco': 'date/date',
    'nutzungsdauer_monate': 'number',
    'gesamte_reparaturkosten': 'number',
    'gesamte_ersatzteilkosten': 'number',
    'aktueller_wiederverkaufswert': 'number',
    'tco_gesamt': 'number',
    'monatliche_kosten': 'number',
    'neuanschaffungskosten': 'number',
    'empfehlung': 'lookup/radio',
    'nachhaltigkeitsbewertung': 'lookup/select',
    'tco_notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateProduktverwaltung = StripLookup<Produktverwaltung['fields']>;
export type CreateErsatzteilpreise = StripLookup<Ersatzteilpreise['fields']>;
export type CreateReparaturWartung = StripLookup<ReparaturWartung['fields']>;
export type CreateWiederverkaufswert = StripLookup<Wiederverkaufswert['fields']>;
export type CreateTcoBewertung = StripLookup<TcoBewertung['fields']>;