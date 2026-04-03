import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Produktverwaltung, Ersatzteilpreise, ReparaturWartung, Wiederverkaufswert, TcoBewertung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [produktverwaltung, setProduktverwaltung] = useState<Produktverwaltung[]>([]);
  const [ersatzteilpreise, setErsatzteilpreise] = useState<Ersatzteilpreise[]>([]);
  const [reparaturWartung, setReparaturWartung] = useState<ReparaturWartung[]>([]);
  const [wiederverkaufswert, setWiederverkaufswert] = useState<Wiederverkaufswert[]>([]);
  const [tcoBewertung, setTcoBewertung] = useState<TcoBewertung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [produktverwaltungData, ersatzteilpreiseData, reparaturWartungData, wiederverkaufswertData, tcoBewertungData] = await Promise.all([
        LivingAppsService.getProduktverwaltung(),
        LivingAppsService.getErsatzteilpreise(),
        LivingAppsService.getReparaturWartung(),
        LivingAppsService.getWiederverkaufswert(),
        LivingAppsService.getTcoBewertung(),
      ]);
      setProduktverwaltung(produktverwaltungData);
      setErsatzteilpreise(ersatzteilpreiseData);
      setReparaturWartung(reparaturWartungData);
      setWiederverkaufswert(wiederverkaufswertData);
      setTcoBewertung(tcoBewertungData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [produktverwaltungData, ersatzteilpreiseData, reparaturWartungData, wiederverkaufswertData, tcoBewertungData] = await Promise.all([
          LivingAppsService.getProduktverwaltung(),
          LivingAppsService.getErsatzteilpreise(),
          LivingAppsService.getReparaturWartung(),
          LivingAppsService.getWiederverkaufswert(),
          LivingAppsService.getTcoBewertung(),
        ]);
        setProduktverwaltung(produktverwaltungData);
        setErsatzteilpreise(ersatzteilpreiseData);
        setReparaturWartung(reparaturWartungData);
        setWiederverkaufswert(wiederverkaufswertData);
        setTcoBewertung(tcoBewertungData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const produktverwaltungMap = useMemo(() => {
    const m = new Map<string, Produktverwaltung>();
    produktverwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [produktverwaltung]);

  const ersatzteilpreiseMap = useMemo(() => {
    const m = new Map<string, Ersatzteilpreise>();
    ersatzteilpreise.forEach(r => m.set(r.record_id, r));
    return m;
  }, [ersatzteilpreise]);

  return { produktverwaltung, setProduktverwaltung, ersatzteilpreise, setErsatzteilpreise, reparaturWartung, setReparaturWartung, wiederverkaufswert, setWiederverkaufswert, tcoBewertung, setTcoBewertung, loading, error, fetchAll, produktverwaltungMap, ersatzteilpreiseMap };
}