import type { TcoBewertung, Produktverwaltung } from '@/types/app';
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

interface TcoBewertungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: TcoBewertung | null;
  onEdit: (record: TcoBewertung) => void;
  produktverwaltungList: Produktverwaltung[];
}

export function TcoBewertungViewDialog({ open, onClose, record, onEdit, produktverwaltungList }: TcoBewertungViewDialogProps) {
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
          <DialogTitle>TCO-Bewertung anzeigen</DialogTitle>
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
            <p className="text-sm">{getProduktverwaltungDisplayName(record.fields.produkt_referenz_tco)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bewertungsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.bewertungsdatum_tco)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bisherige Nutzungsdauer (Monate)</Label>
            <p className="text-sm">{record.fields.nutzungsdauer_monate ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gesamte Reparatur- und Wartungskosten (EUR)</Label>
            <p className="text-sm">{record.fields.gesamte_reparaturkosten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gesamte Ersatzteilkosten (EUR)</Label>
            <p className="text-sm">{record.fields.gesamte_ersatzteilkosten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Aktueller Wiederverkaufswert (EUR)</Label>
            <p className="text-sm">{record.fields.aktueller_wiederverkaufswert ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gesamtbetriebskosten TCO (EUR)</Label>
            <p className="text-sm">{record.fields.tco_gesamt ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Monatliche Kosten (EUR)</Label>
            <p className="text-sm">{record.fields.monatliche_kosten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kosten fuer vergleichbares Neugeraet (EUR)</Label>
            <p className="text-sm">{record.fields.neuanschaffungskosten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Handlungsempfehlung</Label>
            <Badge variant="secondary">{record.fields.empfehlung?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachhaltigkeitsbewertung</Label>
            <Badge variant="secondary">{record.fields.nachhaltigkeitsbewertung?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Begruendung und Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.tco_notizen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}