import type { Ersatzteilpreise, Produktverwaltung } from '@/types/app';
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

interface ErsatzteilpreiseViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Ersatzteilpreise | null;
  onEdit: (record: Ersatzteilpreise) => void;
  produktverwaltungList: Produktverwaltung[];
}

export function ErsatzteilpreiseViewDialog({ open, onClose, record, onEdit, produktverwaltungList }: ErsatzteilpreiseViewDialogProps) {
  function getProduktverwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return produktverwaltungList.find(r => r.record_id === id)?.fields.produkt_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ersatzteilpreise anzeigen</DialogTitle>
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
            <p className="text-sm">{getProduktverwaltungDisplayName(record.fields.produkt_referenz_et)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ersatzteilbezeichnung</Label>
            <p className="text-sm">{record.fields.ersatzteil_name ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Teilenummer</Label>
            <p className="text-sm">{record.fields.teilenummer ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Preis (EUR)</Label>
            <p className="text-sm">{record.fields.ersatzteil_preis ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verfuegbarkeit</Label>
            <Badge variant="secondary">{record.fields.verfuegbarkeit?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Quelle / Haendler</Label>
            <p className="text-sm">{record.fields.ersatzteil_quelle ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Link zur Quelle</Label>
            <p className="text-sm">{record.fields.ersatzteil_url ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum der Preiserhebung</Label>
            <p className="text-sm">{formatDate(record.fields.preiserhebung_datum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen_ersatzteil ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}