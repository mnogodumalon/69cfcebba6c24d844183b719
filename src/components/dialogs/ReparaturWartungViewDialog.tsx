import type { ReparaturWartung, Produktverwaltung, Ersatzteilpreise } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface ReparaturWartungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: ReparaturWartung | null;
  onEdit: (record: ReparaturWartung) => void;
  produktverwaltungList: Produktverwaltung[];
  ersatzteilpreiseList: Ersatzteilpreise[];
}

export function ReparaturWartungViewDialog({ open, onClose, record, onEdit, produktverwaltungList, ersatzteilpreiseList }: ReparaturWartungViewDialogProps) {
  function getProduktverwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return produktverwaltungList.find(r => r.record_id === id)?.fields.produkt_name ?? '—';
  }

  function getErsatzteilpreiseDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return ersatzteilpreiseList.find(r => r.record_id === id)?.fields.ersatzteil_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reparatur & Wartung anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Produkt</Label>
            <p className="text-sm">{getProduktverwaltungDisplayName(record.fields.produkt_referenz_rw)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Art des Eintrags</Label>
            <Badge variant="secondary">{record.fields.eintragsart?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum des Ereignisses</Label>
            <p className="text-sm">{formatDate(record.fields.ereignis_datum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.beschreibung_reparatur ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kosten (EUR)</Label>
            <p className="text-sm">{record.fields.kosten_reparatur ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verwendetes Ersatzteil</Label>
            <p className="text-sm">{getErsatzteilpreiseDisplayName(record.fields.verwendete_ersatzteile)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dienstleister / Werkstatt</Label>
            <p className="text-sm">{record.fields.dienstleister ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Selbst repariert / gewartet</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.selbst_repariert ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.selbst_repariert ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Naechster Wartungstermin</Label>
            <p className="text-sm">{formatDate(record.fields.naechster_wartungstermin)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wartungsintervall (Monate)</Label>
            <p className="text-sm">{record.fields.wartungsintervall_monate ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen_reparatur ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}