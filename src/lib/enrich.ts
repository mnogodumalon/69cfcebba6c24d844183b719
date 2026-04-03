import type { EnrichedErsatzteilpreise, EnrichedReparaturWartung, EnrichedTcoBewertung, EnrichedWiederverkaufswert } from '@/types/enriched';
import type { Ersatzteilpreise, Produktverwaltung, ReparaturWartung, TcoBewertung, Wiederverkaufswert } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface ErsatzteilpreiseMaps {
  produktverwaltungMap: Map<string, Produktverwaltung>;
}

export function enrichErsatzteilpreise(
  ersatzteilpreise: Ersatzteilpreise[],
  maps: ErsatzteilpreiseMaps
): EnrichedErsatzteilpreise[] {
  return ersatzteilpreise.map(r => ({
    ...r,
    produkt_referenz_etName: resolveDisplay(r.fields.produkt_referenz_et, maps.produktverwaltungMap, 'produkt_name'),
  }));
}

interface ReparaturWartungMaps {
  produktverwaltungMap: Map<string, Produktverwaltung>;
  ersatzteilpreiseMap: Map<string, Ersatzteilpreise>;
}

export function enrichReparaturWartung(
  reparaturWartung: ReparaturWartung[],
  maps: ReparaturWartungMaps
): EnrichedReparaturWartung[] {
  return reparaturWartung.map(r => ({
    ...r,
    produkt_referenz_rwName: resolveDisplay(r.fields.produkt_referenz_rw, maps.produktverwaltungMap, 'produkt_name'),
    verwendete_ersatzteileName: resolveDisplay(r.fields.verwendete_ersatzteile, maps.ersatzteilpreiseMap, 'ersatzteil_name'),
  }));
}

interface WiederverkaufswertMaps {
  produktverwaltungMap: Map<string, Produktverwaltung>;
}

export function enrichWiederverkaufswert(
  wiederverkaufswert: Wiederverkaufswert[],
  maps: WiederverkaufswertMaps
): EnrichedWiederverkaufswert[] {
  return wiederverkaufswert.map(r => ({
    ...r,
    produkt_referenz_wvwName: resolveDisplay(r.fields.produkt_referenz_wvw, maps.produktverwaltungMap, 'produkt_name'),
  }));
}

interface TcoBewertungMaps {
  produktverwaltungMap: Map<string, Produktverwaltung>;
}

export function enrichTcoBewertung(
  tcoBewertung: TcoBewertung[],
  maps: TcoBewertungMaps
): EnrichedTcoBewertung[] {
  return tcoBewertung.map(r => ({
    ...r,
    produkt_referenz_tcoName: resolveDisplay(r.fields.produkt_referenz_tco, maps.produktverwaltungMap, 'produkt_name'),
  }));
}
