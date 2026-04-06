import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Ersatzteilpreise, TcoBewertung, Produktverwaltung, ReparaturWartung, Wiederverkaufswert } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [ersatzteilpreise, setErsatzteilpreise] = useState<Ersatzteilpreise[]>([]);
  const [tcoBewertung, setTcoBewertung] = useState<TcoBewertung[]>([]);
  const [produktverwaltung, setProduktverwaltung] = useState<Produktverwaltung[]>([]);
  const [reparaturWartung, setReparaturWartung] = useState<ReparaturWartung[]>([]);
  const [wiederverkaufswert, setWiederverkaufswert] = useState<Wiederverkaufswert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [ersatzteilpreiseData, tcoBewertungData, produktverwaltungData, reparaturWartungData, wiederverkaufswertData] = await Promise.all([
        LivingAppsService.getErsatzteilpreise(),
        LivingAppsService.getTcoBewertung(),
        LivingAppsService.getProduktverwaltung(),
        LivingAppsService.getReparaturWartung(),
        LivingAppsService.getWiederverkaufswert(),
      ]);
      setErsatzteilpreise(ersatzteilpreiseData);
      setTcoBewertung(tcoBewertungData);
      setProduktverwaltung(produktverwaltungData);
      setReparaturWartung(reparaturWartungData);
      setWiederverkaufswert(wiederverkaufswertData);
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
        const [ersatzteilpreiseData, tcoBewertungData, produktverwaltungData, reparaturWartungData, wiederverkaufswertData] = await Promise.all([
          LivingAppsService.getErsatzteilpreise(),
          LivingAppsService.getTcoBewertung(),
          LivingAppsService.getProduktverwaltung(),
          LivingAppsService.getReparaturWartung(),
          LivingAppsService.getWiederverkaufswert(),
        ]);
        setErsatzteilpreise(ersatzteilpreiseData);
        setTcoBewertung(tcoBewertungData);
        setProduktverwaltung(produktverwaltungData);
        setReparaturWartung(reparaturWartungData);
        setWiederverkaufswert(wiederverkaufswertData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const ersatzteilpreiseMap = useMemo(() => {
    const m = new Map<string, Ersatzteilpreise>();
    ersatzteilpreise.forEach(r => m.set(r.record_id, r));
    return m;
  }, [ersatzteilpreise]);

  const produktverwaltungMap = useMemo(() => {
    const m = new Map<string, Produktverwaltung>();
    produktverwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [produktverwaltung]);

  return { ersatzteilpreise, setErsatzteilpreise, tcoBewertung, setTcoBewertung, produktverwaltung, setProduktverwaltung, reparaturWartung, setReparaturWartung, wiederverkaufswert, setWiederverkaufswert, loading, error, fetchAll, ersatzteilpreiseMap, produktverwaltungMap };
}