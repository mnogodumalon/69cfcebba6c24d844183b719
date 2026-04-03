import type { Wiederverkaufswert, Produktverwaltung } from '@/types/app';
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

interface WiederverkaufswertViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Wiederverkaufswert | null;
  onEdit: (record: Wiederverkaufswert) => void;
  produktverwaltungList: Produktverwaltung[];
}

export function WiederverkaufswertViewDialog({ open, onClose, record, onEdit, produktverwaltungList }: WiederverkaufswertViewDialogProps) {
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
          <DialogTitle>Wiederverkaufswert anzeigen</DialogTitle>
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
            <p className="text-sm">{getProduktverwaltungDisplayName(record.fields.produkt_referenz_wvw)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bewertungsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.bewertungsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geschaetzter Wiederverkaufswert (EUR)</Label>
            <p className="text-sm">{record.fields.wiederverkaufswert_eur ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zustand des Produkts</Label>
            <Badge variant="secondary">{record.fields.produktzustand?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bewertungsquelle</Label>
            <Badge variant="secondary">{record.fields.bewertungsquelle?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Link zum Angebot</Label>
            <p className="text-sm">{record.fields.plattform_url ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen_wvw ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}