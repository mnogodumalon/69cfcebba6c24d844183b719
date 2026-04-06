import { useState, useEffect, useRef, useCallback } from 'react';
import type { TcoBewertung, Produktverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, getUserProfile } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IconCamera, IconCircleCheck, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromPhoto, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

interface TcoBewertungDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: TcoBewertung['fields']) => Promise<void>;
  defaultValues?: TcoBewertung['fields'];
  produktverwaltungList: Produktverwaltung[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

export function TcoBewertungDialog({ open, onClose, onSubmit, defaultValues, produktverwaltungList, enablePhotoScan = true, enablePhotoLocation = true }: TcoBewertungDialogProps) {
  const [fields, setFields] = useState<Partial<TcoBewertung['fields']>>({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFields(defaultValues ?? {});
      setPreview(null);
      setScanSuccess(false);
    }
  }, [open, defaultValues]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const clean = cleanFieldsForApi({ ...fields }, 'tco_bewertung');
      await onSubmit(clean as TcoBewertung['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    setScanSuccess(false);
    try {
      const [uri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
      if (file.type.startsWith('image/')) setPreview(uri);
      const gps = enablePhotoLocation ? meta?.gps ?? null : null;
      const parts: string[] = [];
      let geoAddr = '';
      if (gps) {
        geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
        parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
        if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
      }
      if (meta?.dateTime) {
        parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      contextParts.push(`<available-records field="produkt_referenz_tco" entity="Produktverwaltung">\n${JSON.stringify(produktverwaltungList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "produkt_referenz_tco": string | null, // Display name from Produktverwaltung (see <available-records>)\n  "bewertungsdatum_tco": string | null, // YYYY-MM-DD\n  "nutzungsdauer_monate": number | null, // Bisherige Nutzungsdauer (Monate)\n  "gesamte_reparaturkosten": number | null, // Gesamte Reparatur- und Wartungskosten (EUR)\n  "gesamte_ersatzteilkosten": number | null, // Gesamte Ersatzteilkosten (EUR)\n  "aktueller_wiederverkaufswert": number | null, // Aktueller Wiederverkaufswert (EUR)\n  "tco_gesamt": number | null, // Gesamtbetriebskosten TCO (EUR)\n  "monatliche_kosten": number | null, // Monatliche Kosten (EUR)\n  "neuanschaffungskosten": number | null, // Kosten fuer vergleichbares Neugeraet (EUR)\n  "empfehlung": LookupValue | null, // Handlungsempfehlung (select one key: "behalten" | "reparieren" | "verkaufen_ersetzen" | "entsorgen_ersetzen" | "unklar") mapping: behalten=Behalten und weiter nutzen, reparieren=Reparieren und weiter nutzen, verkaufen_ersetzen=Verkaufen und ersetzen, entsorgen_ersetzen=Entsorgen und ersetzen, unklar=Noch keine klare Empfehlung\n  "nachhaltigkeitsbewertung": LookupValue | null, // Nachhaltigkeitsbewertung (select one key: "sehr_nachhaltig" | "nachhaltig" | "neutral" | "wenig_nachhaltig" | "nicht_nachhaltig") mapping: sehr_nachhaltig=Sehr nachhaltig – lange Nutzung lohnt sich, nachhaltig=Nachhaltig – Weiterbetrieb sinnvoll, neutral=Neutral, wenig_nachhaltig=Wenig nachhaltig – Ersatz empfohlen, nicht_nachhaltig=Nicht nachhaltig – sofortiger Ersatz empfohlen\n  "tco_notizen": string | null, // Begruendung und Notizen\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema, photoContext, DIALOG_INTENT);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["produkt_referenz_tco"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const produkt_referenz_tcoName = raw['produkt_referenz_tco'] as string | null;
        if (produkt_referenz_tcoName) {
          const produkt_referenz_tcoMatch = produktverwaltungList.find(r => matchName(produkt_referenz_tcoName!, [String(r.fields.produkt_name ?? '')]));
          if (produkt_referenz_tcoMatch) merged['produkt_referenz_tco'] = createRecordUrl(APP_IDS.PRODUKTVERWALTUNG, produkt_referenz_tcoMatch.record_id);
        }
        return merged as Partial<TcoBewertung['fields']>;
      });
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error('Scan fehlgeschlagen:', err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handlePhotoScan(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handlePhotoScan(file);
    }
  }, []);

  const DIALOG_INTENT = defaultValues ? 'TCO-Bewertung bearbeiten' : 'TCO-Bewertung hinzufügen';

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{DIALOG_INTENT}</DialogTitle>
        </DialogHeader>

        {enablePhotoScan && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-medium">
                <IconSparkles className="h-4 w-4 text-primary" />
                KI-Assistent
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Versteht deine Fotos / Dokumente und füllt alles für dich aus</p>
            </div>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  KI-Assistent darf zusätzlich Informationen zu meiner Person verwenden
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? 'Lade...' : '(mehr Infos)'}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">Folgende Infos über dich können von der KI genutzt werden:</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">Profil konnte nicht geladen werden</span>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">KI analysiert...</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Felder werden automatisch ausgefüllt</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Felder ausgefüllt!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Prüfe die Werte und passe sie ggf. an</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Foto oder Dokument hierher ziehen oder auswählen</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1.5" />Kamera
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1.5" />Foto wählen
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1.5" />Dokument
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="produkt_referenz_tco">Produkt</Label>
            <Select
              value={extractRecordId(fields.produkt_referenz_tco) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, produkt_referenz_tco: v === 'none' ? undefined : createRecordUrl(APP_IDS.PRODUKTVERWALTUNG, v) }))}
            >
              <SelectTrigger id="produkt_referenz_tco"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {produktverwaltungList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.produkt_name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bewertungsdatum_tco">Bewertungsdatum</Label>
            <Input
              id="bewertungsdatum_tco"
              type="date"
              value={fields.bewertungsdatum_tco ?? ''}
              onChange={e => setFields(f => ({ ...f, bewertungsdatum_tco: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nutzungsdauer_monate">Bisherige Nutzungsdauer (Monate)</Label>
            <Input
              id="nutzungsdauer_monate"
              type="number"
              value={fields.nutzungsdauer_monate ?? ''}
              onChange={e => setFields(f => ({ ...f, nutzungsdauer_monate: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gesamte_reparaturkosten">Gesamte Reparatur- und Wartungskosten (EUR)</Label>
            <Input
              id="gesamte_reparaturkosten"
              type="number"
              value={fields.gesamte_reparaturkosten ?? ''}
              onChange={e => setFields(f => ({ ...f, gesamte_reparaturkosten: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gesamte_ersatzteilkosten">Gesamte Ersatzteilkosten (EUR)</Label>
            <Input
              id="gesamte_ersatzteilkosten"
              type="number"
              value={fields.gesamte_ersatzteilkosten ?? ''}
              onChange={e => setFields(f => ({ ...f, gesamte_ersatzteilkosten: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aktueller_wiederverkaufswert">Aktueller Wiederverkaufswert (EUR)</Label>
            <Input
              id="aktueller_wiederverkaufswert"
              type="number"
              value={fields.aktueller_wiederverkaufswert ?? ''}
              onChange={e => setFields(f => ({ ...f, aktueller_wiederverkaufswert: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tco_gesamt">Gesamtbetriebskosten TCO (EUR)</Label>
            <Input
              id="tco_gesamt"
              type="number"
              value={fields.tco_gesamt ?? ''}
              onChange={e => setFields(f => ({ ...f, tco_gesamt: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monatliche_kosten">Monatliche Kosten (EUR)</Label>
            <Input
              id="monatliche_kosten"
              type="number"
              value={fields.monatliche_kosten ?? ''}
              onChange={e => setFields(f => ({ ...f, monatliche_kosten: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="neuanschaffungskosten">Kosten fuer vergleichbares Neugeraet (EUR)</Label>
            <Input
              id="neuanschaffungskosten"
              type="number"
              value={fields.neuanschaffungskosten ?? ''}
              onChange={e => setFields(f => ({ ...f, neuanschaffungskosten: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empfehlung">Handlungsempfehlung</Label>
            <Select
              value={lookupKey(fields.empfehlung) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, empfehlung: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="empfehlung"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="behalten">Behalten und weiter nutzen</SelectItem>
                <SelectItem value="reparieren">Reparieren und weiter nutzen</SelectItem>
                <SelectItem value="verkaufen_ersetzen">Verkaufen und ersetzen</SelectItem>
                <SelectItem value="entsorgen_ersetzen">Entsorgen und ersetzen</SelectItem>
                <SelectItem value="unklar">Noch keine klare Empfehlung</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nachhaltigkeitsbewertung">Nachhaltigkeitsbewertung</Label>
            <Select
              value={lookupKey(fields.nachhaltigkeitsbewertung) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, nachhaltigkeitsbewertung: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="nachhaltigkeitsbewertung"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="sehr_nachhaltig">Sehr nachhaltig – lange Nutzung lohnt sich</SelectItem>
                <SelectItem value="nachhaltig">Nachhaltig – Weiterbetrieb sinnvoll</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="wenig_nachhaltig">Wenig nachhaltig – Ersatz empfohlen</SelectItem>
                <SelectItem value="nicht_nachhaltig">Nicht nachhaltig – sofortiger Ersatz empfohlen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tco_notizen">Begruendung und Notizen</Label>
            <Textarea
              id="tco_notizen"
              value={fields.tco_notizen ?? ''}
              onChange={e => setFields(f => ({ ...f, tco_notizen: e.target.value }))}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichern...' : defaultValues ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}