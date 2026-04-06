import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Ersatzteilpreise, TcoBewertung, Produktverwaltung, ReparaturWartung, Wiederverkaufswert } from '@/types/app';
import { LivingAppsService, extractRecordId, cleanFieldsForApi } from '@/services/livingAppsService';
import { ErsatzteilpreiseDialog } from '@/components/dialogs/ErsatzteilpreiseDialog';
import { ErsatzteilpreiseViewDialog } from '@/components/dialogs/ErsatzteilpreiseViewDialog';
import { TcoBewertungDialog } from '@/components/dialogs/TcoBewertungDialog';
import { TcoBewertungViewDialog } from '@/components/dialogs/TcoBewertungViewDialog';
import { ProduktverwaltungDialog } from '@/components/dialogs/ProduktverwaltungDialog';
import { ProduktverwaltungViewDialog } from '@/components/dialogs/ProduktverwaltungViewDialog';
import { ReparaturWartungDialog } from '@/components/dialogs/ReparaturWartungDialog';
import { ReparaturWartungViewDialog } from '@/components/dialogs/ReparaturWartungViewDialog';
import { WiederverkaufswertDialog } from '@/components/dialogs/WiederverkaufswertDialog';
import { WiederverkaufswertViewDialog } from '@/components/dialogs/WiederverkaufswertViewDialog';
import { BulkEditDialog } from '@/components/dialogs/BulkEditDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IconPencil, IconTrash, IconPlus, IconFilter, IconX, IconArrowsUpDown, IconArrowUp, IconArrowDown, IconSearch, IconCopy, IconFileText } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function fmtDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

// Field metadata per entity for bulk edit and column filters
const ERSATZTEILPREISE_FIELDS = [
  { key: 'produkt_referenz_et', label: 'Produkt', type: 'applookup/select', targetEntity: 'produktverwaltung', targetAppId: 'PRODUKTVERWALTUNG', displayField: 'produkt_name' },
  { key: 'ersatzteil_name', label: 'Ersatzteilbezeichnung', type: 'string/text' },
  { key: 'teilenummer', label: 'Teilenummer', type: 'string/text' },
  { key: 'ersatzteil_preis', label: 'Preis (EUR)', type: 'number' },
  { key: 'verfuegbarkeit', label: 'Verfuegbarkeit', type: 'lookup/radio', options: [{ key: 'verfuegbar', label: 'Verfuegbar' }, { key: 'eingeschraenkt', label: 'Eingeschraenkt verfuegbar' }, { key: 'nicht_verfuegbar', label: 'Nicht verfuegbar' }] },
  { key: 'ersatzteil_quelle', label: 'Quelle / Haendler', type: 'string/text' },
  { key: 'ersatzteil_url', label: 'Link zur Quelle', type: 'string/url' },
  { key: 'preiserhebung_datum', label: 'Datum der Preiserhebung', type: 'date/date' },
  { key: 'notizen_ersatzteil', label: 'Notizen', type: 'string/textarea' },
];
const TCOBEWERTUNG_FIELDS = [
  { key: 'produkt_referenz_tco', label: 'Produkt', type: 'applookup/select', targetEntity: 'produktverwaltung', targetAppId: 'PRODUKTVERWALTUNG', displayField: 'produkt_name' },
  { key: 'bewertungsdatum_tco', label: 'Bewertungsdatum', type: 'date/date' },
  { key: 'nutzungsdauer_monate', label: 'Bisherige Nutzungsdauer (Monate)', type: 'number' },
  { key: 'gesamte_reparaturkosten', label: 'Gesamte Reparatur- und Wartungskosten (EUR)', type: 'number' },
  { key: 'gesamte_ersatzteilkosten', label: 'Gesamte Ersatzteilkosten (EUR)', type: 'number' },
  { key: 'aktueller_wiederverkaufswert', label: 'Aktueller Wiederverkaufswert (EUR)', type: 'number' },
  { key: 'tco_gesamt', label: 'Gesamtbetriebskosten TCO (EUR)', type: 'number' },
  { key: 'monatliche_kosten', label: 'Monatliche Kosten (EUR)', type: 'number' },
  { key: 'neuanschaffungskosten', label: 'Kosten fuer vergleichbares Neugeraet (EUR)', type: 'number' },
  { key: 'empfehlung', label: 'Handlungsempfehlung', type: 'lookup/radio', options: [{ key: 'behalten', label: 'Behalten und weiter nutzen' }, { key: 'reparieren', label: 'Reparieren und weiter nutzen' }, { key: 'verkaufen_ersetzen', label: 'Verkaufen und ersetzen' }, { key: 'entsorgen_ersetzen', label: 'Entsorgen und ersetzen' }, { key: 'unklar', label: 'Noch keine klare Empfehlung' }] },
  { key: 'nachhaltigkeitsbewertung', label: 'Nachhaltigkeitsbewertung', type: 'lookup/select', options: [{ key: 'sehr_nachhaltig', label: 'Sehr nachhaltig – lange Nutzung lohnt sich' }, { key: 'nachhaltig', label: 'Nachhaltig – Weiterbetrieb sinnvoll' }, { key: 'neutral', label: 'Neutral' }, { key: 'wenig_nachhaltig', label: 'Wenig nachhaltig – Ersatz empfohlen' }, { key: 'nicht_nachhaltig', label: 'Nicht nachhaltig – sofortiger Ersatz empfohlen' }] },
  { key: 'tco_notizen', label: 'Begruendung und Notizen', type: 'string/textarea' },
];
const PRODUKTVERWALTUNG_FIELDS = [
  { key: 'produkt_name', label: 'Produktname', type: 'string/text' },
  { key: 'marke', label: 'Marke', type: 'string/text' },
  { key: 'modell', label: 'Modell', type: 'string/text' },
  { key: 'seriennummer', label: 'Seriennummer', type: 'string/text' },
  { key: 'kategorie', label: 'Kategorie', type: 'lookup/select', options: [{ key: 'moebel_einrichtung', label: 'Moebel & Einrichtung' }, { key: 'sport_freizeit', label: 'Sport & Freizeit' }, { key: 'sonstiges', label: 'Sonstiges' }, { key: 'haushaltsgeraet', label: 'Haushaltsgeraet' }, { key: 'unterhaltungselektronik', label: 'Unterhaltungselektronik' }, { key: 'computer_it', label: 'Computer & IT' }, { key: 'smartphone_tablet', label: 'Smartphone & Tablet' }, { key: 'fahrzeug', label: 'Fahrzeug' }, { key: 'werkzeug_maschinen', label: 'Werkzeug & Maschinen' }] },
  { key: 'kaufpreis', label: 'Kaufpreis (EUR)', type: 'number' },
  { key: 'kaufdatum', label: 'Kaufdatum', type: 'date/date' },
  { key: 'haendler', label: 'Haendler / Kaufort', type: 'string/text' },
  { key: 'garantiedauer_monate', label: 'Garantiedauer (Monate)', type: 'number' },
  { key: 'erwartete_lebensdauer_hersteller', label: 'Erwartete Lebensdauer laut Hersteller (Jahre)', type: 'number' },
  { key: 'realistische_lebensdauer', label: 'Realistische Lebensdauer (Jahre, eigene Einschaetzung)', type: 'number' },
  { key: 'produktfoto', label: 'Produktfoto', type: 'file' },
  { key: 'notizen_produkt', label: 'Notizen', type: 'string/textarea' },
];
const REPARATURWARTUNG_FIELDS = [
  { key: 'produkt_referenz_rw', label: 'Produkt', type: 'applookup/select', targetEntity: 'produktverwaltung', targetAppId: 'PRODUKTVERWALTUNG', displayField: 'produkt_name' },
  { key: 'eintragsart', label: 'Art des Eintrags', type: 'lookup/radio', options: [{ key: 'reparatur', label: 'Reparatur' }, { key: 'wartung', label: 'Wartung' }, { key: 'inspektion', label: 'Inspektion' }, { key: 'reinigung', label: 'Reinigung' }, { key: 'software_update', label: 'Software-Update' }] },
  { key: 'ereignis_datum', label: 'Datum des Ereignisses', type: 'date/date' },
  { key: 'beschreibung_reparatur', label: 'Beschreibung', type: 'string/textarea' },
  { key: 'kosten_reparatur', label: 'Kosten (EUR)', type: 'number' },
  { key: 'verwendete_ersatzteile', label: 'Verwendetes Ersatzteil', type: 'applookup/select', targetEntity: 'ersatzteilpreise', targetAppId: 'ERSATZTEILPREISE', displayField: 'ersatzteil_name' },
  { key: 'dienstleister', label: 'Dienstleister / Werkstatt', type: 'string/text' },
  { key: 'selbst_repariert', label: 'Selbst repariert / gewartet', type: 'bool' },
  { key: 'naechster_wartungstermin', label: 'Naechster Wartungstermin', type: 'date/date' },
  { key: 'wartungsintervall_monate', label: 'Wartungsintervall (Monate)', type: 'number' },
  { key: 'notizen_reparatur', label: 'Notizen', type: 'string/textarea' },
];
const WIEDERVERKAUFSWERT_FIELDS = [
  { key: 'produkt_referenz_wvw', label: 'Produkt', type: 'applookup/select', targetEntity: 'produktverwaltung', targetAppId: 'PRODUKTVERWALTUNG', displayField: 'produkt_name' },
  { key: 'bewertungsdatum', label: 'Bewertungsdatum', type: 'date/date' },
  { key: 'wiederverkaufswert_eur', label: 'Geschaetzter Wiederverkaufswert (EUR)', type: 'number' },
  { key: 'produktzustand', label: 'Zustand des Produkts', type: 'lookup/select', options: [{ key: 'neuwertig', label: 'Neuwertig' }, { key: 'sehr_gut', label: 'Sehr gut' }, { key: 'gut', label: 'Gut' }, { key: 'akzeptabel', label: 'Akzeptabel' }, { key: 'defekt', label: 'Defekt / fuer Ersatzteile' }] },
  { key: 'bewertungsquelle', label: 'Bewertungsquelle', type: 'lookup/select', options: [{ key: 'ebay_kleinanzeigen', label: 'eBay Kleinanzeigen' }, { key: 'ebay', label: 'eBay' }, { key: 'rebuy', label: 'Rebuy' }, { key: 'backmarket', label: 'Backmarket' }, { key: 'haendler_ankauf', label: 'Haendler-Ankauf' }, { key: 'eigene_schaetzung', label: 'Eigene Schaetzung' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'plattform_url', label: 'Link zum Angebot', type: 'string/url' },
  { key: 'notizen_wvw', label: 'Notizen', type: 'string/textarea' },
];

const ENTITY_TABS = [
  { key: 'ersatzteilpreise', label: 'Ersatzteilpreise', pascal: 'Ersatzteilpreise' },
  { key: 'tco_bewertung', label: 'TCO-Bewertung', pascal: 'TcoBewertung' },
  { key: 'produktverwaltung', label: 'Produktverwaltung', pascal: 'Produktverwaltung' },
  { key: 'reparatur_wartung', label: 'Reparatur & Wartung', pascal: 'ReparaturWartung' },
  { key: 'wiederverkaufswert', label: 'Wiederverkaufswert', pascal: 'Wiederverkaufswert' },
] as const;

type EntityKey = typeof ENTITY_TABS[number]['key'];

export default function AdminPage() {
  const data = useDashboardData();
  const { loading, error, fetchAll } = data;

  const [activeTab, setActiveTab] = useState<EntityKey>('ersatzteilpreise');
  const [selectedIds, setSelectedIds] = useState<Record<EntityKey, Set<string>>>(() => ({
    'ersatzteilpreise': new Set(),
    'tco_bewertung': new Set(),
    'produktverwaltung': new Set(),
    'reparatur_wartung': new Set(),
    'wiederverkaufswert': new Set(),
  }));
  const [filters, setFilters] = useState<Record<EntityKey, Record<string, string>>>(() => ({
    'ersatzteilpreise': {},
    'tco_bewertung': {},
    'produktverwaltung': {},
    'reparatur_wartung': {},
    'wiederverkaufswert': {},
  }));
  const [showFilters, setShowFilters] = useState(false);
  const [dialogState, setDialogState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [createEntity, setCreateEntity] = useState<EntityKey | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<{ entity: EntityKey; ids: string[] } | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState<EntityKey | null>(null);
  const [viewState, setViewState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const getRecords = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'ersatzteilpreise': return (data as any).ersatzteilpreise as Ersatzteilpreise[] ?? [];
      case 'tco_bewertung': return (data as any).tcoBewertung as TcoBewertung[] ?? [];
      case 'produktverwaltung': return (data as any).produktverwaltung as Produktverwaltung[] ?? [];
      case 'reparatur_wartung': return (data as any).reparaturWartung as ReparaturWartung[] ?? [];
      case 'wiederverkaufswert': return (data as any).wiederverkaufswert as Wiederverkaufswert[] ?? [];
      default: return [];
    }
  }, [data]);

  const getLookupLists = useCallback((entity: EntityKey) => {
    const lists: Record<string, any[]> = {};
    switch (entity) {
      case 'ersatzteilpreise':
        lists.produktverwaltungList = (data as any).produktverwaltung ?? [];
        break;
      case 'tco_bewertung':
        lists.produktverwaltungList = (data as any).produktverwaltung ?? [];
        break;
      case 'reparatur_wartung':
        lists.produktverwaltungList = (data as any).produktverwaltung ?? [];
        lists.ersatzteilpreiseList = (data as any).ersatzteilpreise ?? [];
        break;
      case 'wiederverkaufswert':
        lists.produktverwaltungList = (data as any).produktverwaltung ?? [];
        break;
    }
    return lists;
  }, [data]);

  const getApplookupDisplay = useCallback((entity: EntityKey, fieldKey: string, url?: unknown) => {
    if (!url) return '—';
    const id = extractRecordId(url);
    if (!id) return '—';
    const lists = getLookupLists(entity);
    void fieldKey; // ensure used for noUnusedParameters
    if (entity === 'ersatzteilpreise' && fieldKey === 'produkt_referenz_et') {
      const match = (lists.produktverwaltungList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.produkt_name ?? '—';
    }
    if (entity === 'tco_bewertung' && fieldKey === 'produkt_referenz_tco') {
      const match = (lists.produktverwaltungList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.produkt_name ?? '—';
    }
    if (entity === 'reparatur_wartung' && fieldKey === 'produkt_referenz_rw') {
      const match = (lists.produktverwaltungList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.produkt_name ?? '—';
    }
    if (entity === 'reparatur_wartung' && fieldKey === 'verwendete_ersatzteile') {
      const match = (lists.ersatzteilpreiseList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.ersatzteil_name ?? '—';
    }
    if (entity === 'wiederverkaufswert' && fieldKey === 'produkt_referenz_wvw') {
      const match = (lists.produktverwaltungList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.produkt_name ?? '—';
    }
    return String(url);
  }, [getLookupLists]);

  const getFieldMeta = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'ersatzteilpreise': return ERSATZTEILPREISE_FIELDS;
      case 'tco_bewertung': return TCOBEWERTUNG_FIELDS;
      case 'produktverwaltung': return PRODUKTVERWALTUNG_FIELDS;
      case 'reparatur_wartung': return REPARATURWARTUNG_FIELDS;
      case 'wiederverkaufswert': return WIEDERVERKAUFSWERT_FIELDS;
      default: return [];
    }
  }, []);

  const getFilteredRecords = useCallback((entity: EntityKey) => {
    const records = getRecords(entity);
    const s = search.toLowerCase();
    const searched = !s ? records : records.filter((r: any) => {
      return Object.values(r.fields).some((v: any) => {
        if (v == null) return false;
        if (Array.isArray(v)) return v.some((item: any) => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
        if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
        return String(v).toLowerCase().includes(s);
      });
    });
    const entityFilters = filters[entity] ?? {};
    const fieldMeta = getFieldMeta(entity);
    return searched.filter((r: any) => {
      return fieldMeta.every((fm: any) => {
        const fv = entityFilters[fm.key];
        if (!fv || fv === '') return true;
        const val = r.fields?.[fm.key];
        if (fm.type === 'bool') {
          if (fv === 'true') return val === true;
          if (fv === 'false') return val !== true;
          return true;
        }
        if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
          const label = val && typeof val === 'object' && 'label' in val ? val.label : '';
          return String(label).toLowerCase().includes(fv.toLowerCase());
        }
        if (fm.type.includes('multiplelookup')) {
          if (!Array.isArray(val)) return false;
          return val.some((item: any) => String(item?.label ?? '').toLowerCase().includes(fv.toLowerCase()));
        }
        if (fm.type.includes('applookup')) {
          const display = getApplookupDisplay(entity, fm.key, val);
          return String(display).toLowerCase().includes(fv.toLowerCase());
        }
        return String(val ?? '').toLowerCase().includes(fv.toLowerCase());
      });
    });
  }, [getRecords, filters, getFieldMeta, getApplookupDisplay, search]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(''); setSortDir('asc'); }
    } else { setSortKey(key); setSortDir('asc'); }
  }

  function sortRecords<T extends { fields: Record<string, any> }>(recs: T[]): T[] {
    if (!sortKey) return recs;
    return [...recs].sort((a, b) => {
      let va: any = a.fields[sortKey], vb: any = b.fields[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'object' && 'label' in va) va = va.label;
      if (typeof vb === 'object' && 'label' in vb) vb = vb.label;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  const toggleSelect = useCallback((entity: EntityKey, id: string) => {
    setSelectedIds(prev => {
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (next[entity].has(id)) next[entity].delete(id);
      else next[entity].add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((entity: EntityKey) => {
    const filtered = getFilteredRecords(entity);
    setSelectedIds(prev => {
      const allSelected = filtered.every((r: any) => prev[entity].has(r.record_id));
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (allSelected) {
        filtered.forEach((r: any) => next[entity].delete(r.record_id));
      } else {
        filtered.forEach((r: any) => next[entity].add(r.record_id));
      }
      return next;
    });
  }, [getFilteredRecords]);

  const clearSelection = useCallback((entity: EntityKey) => {
    setSelectedIds(prev => ({ ...prev, [entity]: new Set() }));
  }, []);

  const getServiceMethods = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'ersatzteilpreise': return {
        create: (fields: any) => LivingAppsService.createErsatzteilpreiseEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateErsatzteilpreiseEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteErsatzteilpreiseEntry(id),
      };
      case 'tco_bewertung': return {
        create: (fields: any) => LivingAppsService.createTcoBewertungEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateTcoBewertungEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteTcoBewertungEntry(id),
      };
      case 'produktverwaltung': return {
        create: (fields: any) => LivingAppsService.createProduktverwaltungEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateProduktverwaltungEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteProduktverwaltungEntry(id),
      };
      case 'reparatur_wartung': return {
        create: (fields: any) => LivingAppsService.createReparaturWartungEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateReparaturWartungEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteReparaturWartungEntry(id),
      };
      case 'wiederverkaufswert': return {
        create: (fields: any) => LivingAppsService.createWiederverkaufswertEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateWiederverkaufswertEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteWiederverkaufswertEntry(id),
      };
      default: return null;
    }
  }, []);

  async function handleCreate(entity: EntityKey, fields: any) {
    const svc = getServiceMethods(entity);
    if (!svc) return;
    await svc.create(fields);
    fetchAll();
    setCreateEntity(null);
  }

  async function handleUpdate(fields: any) {
    if (!dialogState) return;
    const svc = getServiceMethods(dialogState.entity);
    if (!svc) return;
    await svc.update(dialogState.record.record_id, fields);
    fetchAll();
    setDialogState(null);
  }

  async function handleBulkDelete() {
    if (!deleteTargets) return;
    const svc = getServiceMethods(deleteTargets.entity);
    if (!svc) return;
    setBulkLoading(true);
    try {
      for (const id of deleteTargets.ids) {
        await svc.remove(id);
      }
      clearSelection(deleteTargets.entity);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setDeleteTargets(null);
    }
  }

  async function handleBulkClone() {
    const svc = getServiceMethods(activeTab);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const records = getRecords(activeTab);
      const ids = Array.from(selectedIds[activeTab]);
      for (const id of ids) {
        const rec = records.find((r: any) => r.record_id === id);
        if (!rec) continue;
        const clean = cleanFieldsForApi(rec.fields, activeTab);
        await svc.create(clean as any);
      }
      clearSelection(activeTab);
      fetchAll();
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkEdit(fieldKey: string, value: any) {
    if (!bulkEditOpen) return;
    const svc = getServiceMethods(bulkEditOpen);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds[bulkEditOpen]);
      for (const id of ids) {
        await svc.update(id, { [fieldKey]: value });
      }
      clearSelection(bulkEditOpen);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setBulkEditOpen(null);
    }
  }

  function updateFilter(entity: EntityKey, fieldKey: string, value: string) {
    setFilters(prev => ({
      ...prev,
      [entity]: { ...prev[entity], [fieldKey]: value },
    }));
  }

  function clearEntityFilters(entity: EntityKey) {
    setFilters(prev => ({ ...prev, [entity]: {} }));
  }

  const activeFilterCount = useMemo(() => {
    const f = filters[activeTab] ?? {};
    return Object.values(f).filter(v => v && v !== '').length;
  }, [filters, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-destructive">{error.message}</p>
        <Button onClick={fetchAll}>Erneut versuchen</Button>
      </div>
    );
  }

  const filtered = getFilteredRecords(activeTab);
  const sel = selectedIds[activeTab];
  const allFiltered = filtered.every((r: any) => sel.has(r.record_id)) && filtered.length > 0;
  const fieldMeta = getFieldMeta(activeTab);

  return (
    <PageShell
      title="Verwaltung"
      subtitle="Alle Daten verwalten"
      action={
        <Button onClick={() => setCreateEntity(activeTab)} className="shrink-0">
          <IconPlus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="flex gap-2 flex-wrap">
        {ENTITY_TABS.map(tab => {
          const count = getRecords(tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(''); setSortKey(''); setSortDir('asc'); fetchAll(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)} className="gap-2">
            <IconFilter className="h-4 w-4" />
            Filtern
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearEntityFilters(activeTab)}>
              Filter zurücksetzen
            </Button>
          )}
        </div>
        {sel.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-muted/60 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium">{sel.size} ausgewählt</span>
            <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(activeTab)}>
              <IconPencil className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Feld bearbeiten</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkClone()}>
              <IconCopy className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Kopieren</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteTargets({ entity: activeTab, ids: Array.from(sel) })}>
              <IconTrash className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Ausgewählte löschen</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clearSelection(activeTab)}>
              <IconX className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Auswahl aufheben</span>
            </Button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg border bg-muted/30">
          {fieldMeta.map((fm: any) => (
            <div key={fm.key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{fm.label}</label>
              {fm.type === 'bool' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="true">Ja</SelectItem>
                    <SelectItem value="false">Nein</SelectItem>
                  </SelectContent>
                </Select>
              ) : fm.type === 'lookup/select' || fm.type === 'lookup/radio' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {fm.options?.map((o: any) => (
                      <SelectItem key={o.key} value={o.label}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs"
                  placeholder="Filtern..."
                  value={filters[activeTab]?.[fm.key] ?? ''}
                  onChange={e => updateFilter(activeTab, fm.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[27px] bg-card shadow-lg overflow-x-auto">
        <Table className="[&_tbody_td]:px-6 [&_tbody_td]:py-2 [&_tbody_td]:text-base [&_tbody_td]:font-medium [&_tbody_tr:first-child_td]:pt-6 [&_tbody_tr:last-child_td]:pb-10">
          <TableHeader className="bg-secondary">
            <TableRow className="border-b border-input">
              <TableHead className="w-10 px-6">
                <Checkbox
                  checked={allFiltered}
                  onCheckedChange={() => toggleSelectAll(activeTab)}
                />
              </TableHead>
              {fieldMeta.map((fm: any) => (
                <TableHead key={fm.key} className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort(fm.key)}>
                  <span className="inline-flex items-center gap-1">
                    {fm.label}
                    {sortKey === fm.key ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-24 uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortRecords(filtered).map((record: any) => (
              <TableRow key={record.record_id} className={`transition-colors cursor-pointer ${sel.has(record.record_id) ? "bg-primary/5" : "hover:bg-muted/50"}`} onClick={(e) => { if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return; setViewState({ entity: activeTab, record }); }}>
                <TableCell>
                  <Checkbox
                    checked={sel.has(record.record_id)}
                    onCheckedChange={() => toggleSelect(activeTab, record.record_id)}
                  />
                </TableCell>
                {fieldMeta.map((fm: any) => {
                  const val = record.fields?.[fm.key];
                  if (fm.type === 'bool') {
                    return (
                      <TableCell key={fm.key}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          val ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {val ? 'Ja' : 'Nein'}
                        </span>
                      </TableCell>
                    );
                  }
                  if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{val?.label ?? '—'}</span></TableCell>;
                  }
                  if (fm.type.includes('multiplelookup')) {
                    return <TableCell key={fm.key}>{Array.isArray(val) ? val.map((v: any) => v?.label ?? v).join(', ') : '—'}</TableCell>;
                  }
                  if (fm.type.includes('applookup')) {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getApplookupDisplay(activeTab, fm.key, val)}</span></TableCell>;
                  }
                  if (fm.type.includes('date')) {
                    return <TableCell key={fm.key} className="text-muted-foreground">{fmtDate(val)}</TableCell>;
                  }
                  if (fm.type.startsWith('file')) {
                    return (
                      <TableCell key={fm.key}>
                        {val ? (
                          <div className="relative h-8 w-8 rounded bg-muted overflow-hidden">
                            <img src={val} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        ) : '—'}
                      </TableCell>
                    );
                  }
                  if (fm.type === 'string/textarea') {
                    return <TableCell key={fm.key} className="max-w-xs"><span className="truncate block">{val ?? '—'}</span></TableCell>;
                  }
                  if (fm.type === 'geo') {
                    return (
                      <TableCell key={fm.key} className="max-w-[200px]">
                        <span className="truncate block" title={val ? `${val.lat}, ${val.long}` : undefined}>
                          {val?.info ?? (val ? `${val.lat?.toFixed(4)}, ${val.long?.toFixed(4)}` : '—')}
                        </span>
                      </TableCell>
                    );
                  }
                  return <TableCell key={fm.key}>{val ?? '—'}</TableCell>;
                })}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDialogState({ entity: activeTab, record })}>
                      <IconPencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargets({ entity: activeTab, ids: [record.record_id] })}>
                      <IconTrash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={fieldMeta.length + 2} className="text-center py-16 text-muted-foreground">
                  Keine Ergebnisse gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(createEntity === 'ersatzteilpreise' || dialogState?.entity === 'ersatzteilpreise') && (
        <ErsatzteilpreiseDialog
          open={createEntity === 'ersatzteilpreise' || dialogState?.entity === 'ersatzteilpreise'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'ersatzteilpreise' ? handleUpdate : (fields: any) => handleCreate('ersatzteilpreise', fields)}
          defaultValues={dialogState?.entity === 'ersatzteilpreise' ? dialogState.record?.fields : undefined}
          produktverwaltungList={(data as any).produktverwaltung ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Ersatzteilpreise']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Ersatzteilpreise']}
        />
      )}
      {(createEntity === 'tco_bewertung' || dialogState?.entity === 'tco_bewertung') && (
        <TcoBewertungDialog
          open={createEntity === 'tco_bewertung' || dialogState?.entity === 'tco_bewertung'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'tco_bewertung' ? handleUpdate : (fields: any) => handleCreate('tco_bewertung', fields)}
          defaultValues={dialogState?.entity === 'tco_bewertung' ? dialogState.record?.fields : undefined}
          produktverwaltungList={(data as any).produktverwaltung ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['TcoBewertung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['TcoBewertung']}
        />
      )}
      {(createEntity === 'produktverwaltung' || dialogState?.entity === 'produktverwaltung') && (
        <ProduktverwaltungDialog
          open={createEntity === 'produktverwaltung' || dialogState?.entity === 'produktverwaltung'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'produktverwaltung' ? handleUpdate : (fields: any) => handleCreate('produktverwaltung', fields)}
          defaultValues={dialogState?.entity === 'produktverwaltung' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Produktverwaltung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Produktverwaltung']}
        />
      )}
      {(createEntity === 'reparatur_wartung' || dialogState?.entity === 'reparatur_wartung') && (
        <ReparaturWartungDialog
          open={createEntity === 'reparatur_wartung' || dialogState?.entity === 'reparatur_wartung'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'reparatur_wartung' ? handleUpdate : (fields: any) => handleCreate('reparatur_wartung', fields)}
          defaultValues={dialogState?.entity === 'reparatur_wartung' ? dialogState.record?.fields : undefined}
          produktverwaltungList={(data as any).produktverwaltung ?? []}
          ersatzteilpreiseList={(data as any).ersatzteilpreise ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['ReparaturWartung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['ReparaturWartung']}
        />
      )}
      {(createEntity === 'wiederverkaufswert' || dialogState?.entity === 'wiederverkaufswert') && (
        <WiederverkaufswertDialog
          open={createEntity === 'wiederverkaufswert' || dialogState?.entity === 'wiederverkaufswert'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'wiederverkaufswert' ? handleUpdate : (fields: any) => handleCreate('wiederverkaufswert', fields)}
          defaultValues={dialogState?.entity === 'wiederverkaufswert' ? dialogState.record?.fields : undefined}
          produktverwaltungList={(data as any).produktverwaltung ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Wiederverkaufswert']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Wiederverkaufswert']}
        />
      )}
      {viewState?.entity === 'ersatzteilpreise' && (
        <ErsatzteilpreiseViewDialog
          open={viewState?.entity === 'ersatzteilpreise'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'ersatzteilpreise', record: r }); }}
          produktverwaltungList={(data as any).produktverwaltung ?? []}
        />
      )}
      {viewState?.entity === 'tco_bewertung' && (
        <TcoBewertungViewDialog
          open={viewState?.entity === 'tco_bewertung'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'tco_bewertung', record: r }); }}
          produktverwaltungList={(data as any).produktverwaltung ?? []}
        />
      )}
      {viewState?.entity === 'produktverwaltung' && (
        <ProduktverwaltungViewDialog
          open={viewState?.entity === 'produktverwaltung'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'produktverwaltung', record: r }); }}
        />
      )}
      {viewState?.entity === 'reparatur_wartung' && (
        <ReparaturWartungViewDialog
          open={viewState?.entity === 'reparatur_wartung'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'reparatur_wartung', record: r }); }}
          produktverwaltungList={(data as any).produktverwaltung ?? []}
          ersatzteilpreiseList={(data as any).ersatzteilpreise ?? []}
        />
      )}
      {viewState?.entity === 'wiederverkaufswert' && (
        <WiederverkaufswertViewDialog
          open={viewState?.entity === 'wiederverkaufswert'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'wiederverkaufswert', record: r }); }}
          produktverwaltungList={(data as any).produktverwaltung ?? []}
        />
      )}

      <BulkEditDialog
        open={!!bulkEditOpen}
        onClose={() => setBulkEditOpen(null)}
        onApply={handleBulkEdit}
        fields={bulkEditOpen ? getFieldMeta(bulkEditOpen) : []}
        selectedCount={bulkEditOpen ? selectedIds[bulkEditOpen].size : 0}
        loading={bulkLoading}
        lookupLists={bulkEditOpen ? getLookupLists(bulkEditOpen) : {}}
      />

      <ConfirmDialog
        open={!!deleteTargets}
        onClose={() => setDeleteTargets(null)}
        onConfirm={handleBulkDelete}
        title="Ausgewählte löschen"
        description={`Sollen ${deleteTargets?.ids.length ?? 0} Einträge wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
      />
    </PageShell>
  );
}