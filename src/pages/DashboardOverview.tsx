import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichErsatzteilpreise, enrichReparaturWartung, enrichWiederverkaufswert, enrichTcoBewertung } from '@/lib/enrich';
import type { EnrichedReparaturWartung, EnrichedTcoBewertung } from '@/types/enriched';
import type { Produktverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconPackage,
  IconCurrencyEuro, IconCalendar, IconChevronRight,
  IconClockHour4, IconRecycle, IconCalculator,
  IconStar, IconArrowRight,
} from '@tabler/icons-react';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { ProduktverwaltungDialog } from '@/components/dialogs/ProduktverwaltungDialog';
import { ReparaturWartungDialog } from '@/components/dialogs/ReparaturWartungDialog';
import { TcoBewertungDialog } from '@/components/dialogs/TcoBewertungDialog';

const APPGROUP_ID = '69cfcebba6c24d844183b719';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const {
    produktverwaltung, ersatzteilpreise, reparaturWartung, wiederverkaufswert, tcoBewertung,
    produktverwaltungMap, ersatzteilpreiseMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedErsatzteilpreise = enrichErsatzteilpreise(ersatzteilpreise, { produktverwaltungMap });
  const enrichedReparaturWartung = enrichReparaturWartung(reparaturWartung, { produktverwaltungMap, ersatzteilpreiseMap });
  const enrichedWiederverkaufswert = enrichWiederverkaufswert(wiederverkaufswert, { produktverwaltungMap });
  const enrichedTcoBewertung = enrichTcoBewertung(tcoBewertung, { produktverwaltungMap });

  const [selectedProduct, setSelectedProduct] = useState<Produktverwaltung | null>(null);
  const [produktDialog, setProduktDialog] = useState(false);
  const [editProdukt, setEditProdukt] = useState<Produktverwaltung | null>(null);
  const [deleteProdukt, setDeleteProdukt] = useState<Produktverwaltung | null>(null);

  const [reparaturDialog, setReparaturDialog] = useState(false);
  const [editReparatur, setEditReparatur] = useState<EnrichedReparaturWartung | null>(null);
  const [deleteReparatur, setDeleteReparatur] = useState<EnrichedReparaturWartung | null>(null);

  const [tcoDialog, setTcoDialog] = useState(false);
  const [editTco, setEditTco] = useState<EnrichedTcoBewertung | null>(null);
  const [deleteTco, setDeleteTco] = useState<EnrichedTcoBewertung | null>(null);

  const productReparaturen = useMemo(() => {
    if (!selectedProduct) return [];
    return enrichedReparaturWartung.filter(r => {
      const id = extractRecordId(r.fields.produkt_referenz_rw);
      return id === selectedProduct.record_id;
    });
  }, [selectedProduct, enrichedReparaturWartung]);

  const productWvw = useMemo(() => {
    if (!selectedProduct) return [];
    return enrichedWiederverkaufswert.filter(r => {
      const id = extractRecordId(r.fields.produkt_referenz_wvw);
      return id === selectedProduct.record_id;
    });
  }, [selectedProduct, enrichedWiederverkaufswert]);

  const productTco = useMemo(() => {
    if (!selectedProduct) return [];
    return enrichedTcoBewertung.filter(r => {
      const id = extractRecordId(r.fields.produkt_referenz_tco);
      return id === selectedProduct.record_id;
    });
  }, [selectedProduct, enrichedTcoBewertung]);

  const productErsatzteile = useMemo(() => {
    if (!selectedProduct) return [];
    return enrichedErsatzteilpreise.filter(r => {
      const id = extractRecordId(r.fields.produkt_referenz_et);
      return id === selectedProduct.record_id;
    });
  }, [selectedProduct, enrichedErsatzteilpreise]);

  // Summary stats
  const totalKaufwert = useMemo(() =>
    produktverwaltung.reduce((s, p) => s + (p.fields.kaufpreis ?? 0), 0),
    [produktverwaltung]
  );
  const totalReparaturkosten = useMemo(() =>
    reparaturWartung.reduce((s, r) => s + (r.fields.kosten_reparatur ?? 0), 0),
    [reparaturWartung]
  );
  const latestTco = useMemo(() => {
    if (!tcoBewertung.length) return null;
    const sorted = [...tcoBewertung].sort((a, b) =>
      (b.fields.bewertungsdatum_tco ?? '').localeCompare(a.fields.bewertungsdatum_tco ?? '')
    );
    return sorted[0];
  }, [tcoBewertung]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleDeleteProdukt = async () => {
    if (!deleteProdukt) return;
    await LivingAppsService.deleteProduktverwaltungEntry(deleteProdukt.record_id);
    if (selectedProduct?.record_id === deleteProdukt.record_id) setSelectedProduct(null);
    setDeleteProdukt(null);
    fetchAll();
  };

  const handleDeleteReparatur = async () => {
    if (!deleteReparatur) return;
    await LivingAppsService.deleteReparaturWartungEntry(deleteReparatur.record_id);
    setDeleteReparatur(null);
    fetchAll();
  };

  const handleDeleteTco = async () => {
    if (!deleteTco) return;
    await LivingAppsService.deleteTcoBewertungEntry(deleteTco.record_id);
    setDeleteTco(null);
    fetchAll();
  };

  const empfehlungColor = (key: string | undefined) => {
    if (key === 'behalten') return 'bg-green-100 text-green-800';
    if (key === 'reparieren') return 'bg-blue-100 text-blue-800';
    if (key === 'verkaufen_ersetzen') return 'bg-orange-100 text-orange-800';
    if (key === 'entsorgen_ersetzen') return 'bg-red-100 text-red-800';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meine Produkte</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Alle Geräte auf einen Blick</p>
        </div>
        <Button onClick={() => { setEditProdukt(null); setProduktDialog(true); }} size="sm">
          <IconPlus size={16} className="mr-1.5 shrink-0" />
          <span>Produkt hinzufügen</span>
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <IconPackage size={16} className="shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wide">Produkte</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{produktverwaltung.length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <IconCurrencyEuro size={16} className="shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wide">Kaufwert</span>
          </div>
          <p className="text-2xl font-bold text-foreground truncate">{formatCurrency(totalKaufwert)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <IconTool size={16} className="shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wide">Reparaturen</span>
          </div>
          <p className="text-2xl font-bold text-foreground truncate">{formatCurrency(totalReparaturkosten)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <IconCalculator size={16} className="shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wide">Letzte TCO</span>
          </div>
          <p className="text-2xl font-bold text-foreground truncate">
            {latestTco ? formatCurrency(latestTco.fields.tco_gesamt) : '—'}
          </p>
        </div>
      </div>

      {/* Main Layout: Product List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Product List */}
        <div className="lg:col-span-4 space-y-2">
          {produktverwaltung.length === 0 ? (
            <div className="rounded-2xl border bg-card p-10 flex flex-col items-center gap-3 text-center">
              <IconPackage size={40} className="text-muted-foreground" stroke={1.5} />
              <p className="text-sm text-muted-foreground">Noch keine Produkte vorhanden. Lege dein erstes Produkt an.</p>
              <Button size="sm" variant="outline" onClick={() => { setEditProdukt(null); setProduktDialog(true); }}>
                <IconPlus size={14} className="mr-1" />Produkt anlegen
              </Button>
            </div>
          ) : (
            produktverwaltung.map(p => {
              const isSelected = selectedProduct?.record_id === p.record_id;
              const tcoEntry = enrichedTcoBewertung.find(t => extractRecordId(t.fields.produkt_referenz_tco) === p.record_id);
              const empfKey = tcoEntry?.fields.empfehlung?.key;
              return (
                <div
                  key={p.record_id}
                  onClick={() => setSelectedProduct(isSelected ? null : p)}
                  className={`rounded-2xl border bg-card p-4 cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <IconPackage size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground truncate text-sm">{p.fields.produkt_name ?? '—'}</p>
                        <IconChevronRight size={14} className={`text-muted-foreground shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.fields.marke} {p.fields.modell}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {p.fields.kategorie && (
                          <span className="inline-block text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{p.fields.kategorie.label}</span>
                        )}
                        {p.fields.kaufpreis != null && (
                          <span className="inline-block text-xs font-medium text-foreground">{formatCurrency(p.fields.kaufpreis)}</span>
                        )}
                        {empfKey && (
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${empfehlungColor(empfKey)}`}>
                            {tcoEntry?.fields.empfehlung?.label?.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-8">
          {!selectedProduct ? (
            <div className="rounded-2xl border bg-card p-12 flex flex-col items-center gap-3 text-center h-full justify-center min-h-[300px]">
              <IconArrowRight size={36} className="text-muted-foreground" stroke={1.5} />
              <p className="text-sm text-muted-foreground">Wähle ein Produkt aus der Liste, um Details anzuzeigen.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Product Header Card */}
              <div className="rounded-2xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground truncate">{selectedProduct.fields.produkt_name ?? '—'}</h2>
                    <p className="text-sm text-muted-foreground">{selectedProduct.fields.marke} {selectedProduct.fields.modell}</p>
                    {selectedProduct.fields.seriennummer && (
                      <p className="text-xs text-muted-foreground mt-0.5">S/N: {selectedProduct.fields.seriennummer}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => { setEditProdukt(selectedProduct); setProduktDialog(true); }}>
                      <IconPencil size={14} className="mr-1 shrink-0" /><span className="hidden sm:inline">Bearbeiten</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteProdukt(selectedProduct)} className="text-destructive hover:text-destructive">
                      <IconTrash size={14} className="shrink-0" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-muted/40 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><IconCurrencyEuro size={12} />Kaufpreis</p>
                    <p className="font-semibold text-sm text-foreground">{formatCurrency(selectedProduct.fields.kaufpreis)}</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><IconCalendar size={12} />Kaufdatum</p>
                    <p className="font-semibold text-sm text-foreground">{formatDate(selectedProduct.fields.kaufdatum)}</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><IconStar size={12} />Garantie</p>
                    <p className="font-semibold text-sm text-foreground">
                      {selectedProduct.fields.garantiedauer_monate != null ? `${selectedProduct.fields.garantiedauer_monate} Mon.` : '—'}
                    </p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><IconClockHour4 size={12} />Lebensdauer</p>
                    <p className="font-semibold text-sm text-foreground">
                      {selectedProduct.fields.realistische_lebensdauer != null ? `${selectedProduct.fields.realistische_lebensdauer} J.` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Reparaturen & Wartung */}
                <div className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm flex items-center gap-1.5">
                      <IconTool size={15} className="text-primary shrink-0" />Reparatur &amp; Wartung
                    </h3>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                      onClick={() => { setEditReparatur(null); setReparaturDialog(true); }}>
                      <IconPlus size={13} className="mr-1" />Neu
                    </Button>
                  </div>
                  {productReparaturen.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Keine Einträge</p>
                  ) : (
                    <div className="space-y-2">
                      {productReparaturen.slice(0, 5).map(r => (
                        <div key={r.record_id} className="flex items-start justify-between gap-2 p-2 rounded-xl bg-muted/30">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {r.fields.eintragsart && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0">{r.fields.eintragsart.label}</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{formatDate(r.fields.ereignis_datum)}</span>
                            </div>
                            {r.fields.beschreibung_reparatur && (
                              <p className="text-xs text-foreground mt-0.5 truncate">{r.fields.beschreibung_reparatur}</p>
                            )}
                            {r.fields.kosten_reparatur != null && (
                              <p className="text-xs font-medium text-foreground mt-0.5">{formatCurrency(r.fields.kosten_reparatur)}</p>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setEditReparatur(r); setReparaturDialog(true); }}
                              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <IconPencil size={13} />
                            </button>
                            <button onClick={() => setDeleteReparatur(r)}
                              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                              <IconTrash size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Wiederverkaufswert */}
                <div className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm flex items-center gap-1.5">
                      <IconRecycle size={15} className="text-primary shrink-0" />Wiederverkaufswert
                    </h3>
                    <a href="#/wiederverkaufswert" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                      Alle<IconChevronRight size={12} />
                    </a>
                  </div>
                  {productWvw.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Keine Bewertungen</p>
                  ) : (
                    <div className="space-y-2">
                      {productWvw.slice(0, 3).map(w => (
                        <div key={w.record_id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/30">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{formatCurrency(w.fields.wiederverkaufswert_eur)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(w.fields.bewertungsdatum)} · {w.fields.produktzustand?.label ?? '—'}</p>
                          </div>
                          {w.fields.bewertungsquelle && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground shrink-0 truncate max-w-[80px]">{w.fields.bewertungsquelle.label}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* TCO Bewertung */}
              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <IconCalculator size={15} className="text-primary shrink-0" />TCO-Bewertung
                  </h3>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                    onClick={() => { setEditTco(null); setTcoDialog(true); }}>
                    <IconPlus size={13} className="mr-1" />Neu
                  </Button>
                </div>
                {productTco.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Noch keine TCO-Bewertung</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {productTco.slice(0, 2).map(t => (
                      <div key={t.record_id} className="bg-muted/30 rounded-xl p-3 relative">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-xs text-muted-foreground">{formatDate(t.fields.bewertungsdatum_tco)}</p>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setEditTco(t); setTcoDialog(true); }}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <IconPencil size={12} />
                            </button>
                            <button onClick={() => setDeleteTco(t)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                              <IconTrash size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">TCO Gesamt</p>
                            <p className="text-base font-bold text-foreground">{formatCurrency(t.fields.tco_gesamt)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Monatl. Kosten</p>
                            <p className="text-base font-bold text-foreground">{formatCurrency(t.fields.monatliche_kosten)}</p>
                          </div>
                        </div>
                        {t.fields.empfehlung && (
                          <div className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${empfehlungColor(t.fields.empfehlung.key)}`}>
                            {t.fields.empfehlung.label}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ersatzteile */}
              {productErsatzteile.length > 0 && (
                <div className="rounded-2xl border bg-card p-4">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-3">
                    <IconTool size={15} className="text-primary shrink-0" />Ersatzteile ({productErsatzteile.length})
                  </h3>
                  <div className="space-y-2">
                    {productErsatzteile.map(e => (
                      <div key={e.record_id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-muted/30">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{e.fields.ersatzteil_name ?? '—'}</p>
                          {e.fields.teilenummer && <p className="text-xs text-muted-foreground">Nr: {e.fields.teilenummer}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(e.fields.ersatzteil_preis)}</p>
                          {e.fields.verfuegbarkeit && (
                            <span className="text-xs text-muted-foreground">{e.fields.verfuegbarkeit.label}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ProduktverwaltungDialog
        open={produktDialog}
        onClose={() => { setProduktDialog(false); setEditProdukt(null); }}
        onSubmit={async (fields) => {
          if (editProdukt) {
            await LivingAppsService.updateProduktverwaltungEntry(editProdukt.record_id, fields);
          } else {
            await LivingAppsService.createProduktverwaltungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editProdukt?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Produktverwaltung']}
      />

      <ReparaturWartungDialog
        open={reparaturDialog}
        onClose={() => { setReparaturDialog(false); setEditReparatur(null); }}
        onSubmit={async (fields) => {
          if (editReparatur) {
            await LivingAppsService.updateReparaturWartungEntry(editReparatur.record_id, fields);
          } else {
            const productUrl = selectedProduct
              ? createRecordUrl(APP_IDS.PRODUKTVERWALTUNG, selectedProduct.record_id)
              : undefined;
            await LivingAppsService.createReparaturWartungEntry({
              ...fields,
              produkt_referenz_rw: productUrl,
            });
          }
          fetchAll();
        }}
        defaultValues={editReparatur
          ? editReparatur.fields
          : selectedProduct
            ? { produkt_referenz_rw: createRecordUrl(APP_IDS.PRODUKTVERWALTUNG, selectedProduct.record_id) }
            : undefined
        }
        produktverwaltungList={produktverwaltung}
        ersatzteilpreiseList={ersatzteilpreise}
        enablePhotoScan={AI_PHOTO_SCAN['ReparaturWartung']}
      />

      <TcoBewertungDialog
        open={tcoDialog}
        onClose={() => { setTcoDialog(false); setEditTco(null); }}
        onSubmit={async (fields) => {
          if (editTco) {
            await LivingAppsService.updateTcoBewertungEntry(editTco.record_id, fields);
          } else {
            const productUrl = selectedProduct
              ? createRecordUrl(APP_IDS.PRODUKTVERWALTUNG, selectedProduct.record_id)
              : undefined;
            await LivingAppsService.createTcoBewertungEntry({
              ...fields,
              produkt_referenz_tco: productUrl,
            });
          }
          fetchAll();
        }}
        defaultValues={editTco
          ? editTco.fields
          : selectedProduct
            ? { produkt_referenz_tco: createRecordUrl(APP_IDS.PRODUKTVERWALTUNG, selectedProduct.record_id) }
            : undefined
        }
        produktverwaltungList={produktverwaltung}
        enablePhotoScan={AI_PHOTO_SCAN['TcoBewertung']}
      />

      <ConfirmDialog
        open={!!deleteProdukt}
        title="Produkt löschen"
        description={`"${deleteProdukt?.fields.produkt_name ?? 'Produkt'}" wirklich löschen? Alle verknüpften Daten bleiben erhalten.`}
        onConfirm={handleDeleteProdukt}
        onClose={() => setDeleteProdukt(null)}
      />

      <ConfirmDialog
        open={!!deleteReparatur}
        title="Eintrag löschen"
        description="Diesen Reparatur-/Wartungseintrag wirklich löschen?"
        onConfirm={handleDeleteReparatur}
        onClose={() => setDeleteReparatur(null)}
      />

      <ConfirmDialog
        open={!!deleteTco}
        title="TCO-Bewertung löschen"
        description="Diese TCO-Bewertung wirklich löschen?"
        onConfirm={handleDeleteTco}
        onClose={() => setDeleteTco(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
