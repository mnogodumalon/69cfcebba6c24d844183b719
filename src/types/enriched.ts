import type { Ersatzteilpreise, ReparaturWartung, TcoBewertung, Wiederverkaufswert } from './app';

export type EnrichedErsatzteilpreise = Ersatzteilpreise & {
  produkt_referenz_etName: string;
};

export type EnrichedReparaturWartung = ReparaturWartung & {
  produkt_referenz_rwName: string;
  verwendete_ersatzteileName: string;
};

export type EnrichedWiederverkaufswert = Wiederverkaufswert & {
  produkt_referenz_wvwName: string;
};

export type EnrichedTcoBewertung = TcoBewertung & {
  produkt_referenz_tcoName: string;
};
