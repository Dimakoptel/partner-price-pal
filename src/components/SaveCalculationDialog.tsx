import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { calcName: string; clientName: string; clientPhone: string; clientEmail: string }) => void;
  saving?: boolean;
}

export default function SaveCalculationDialog({ open, onClose, onConfirm, saving }: Props) {
  const [calcName, setCalcName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const handleConfirm = () => {
    if (!calcName.trim()) return;
    onConfirm({
      calcName: calcName.trim(),
      clientName: clientName.trim() || calcName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
    });
    setCalcName("");
    setClientName("");
    setClientPhone("");
    setClientEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Сохранить расчёт и создать лид</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="calc-name">Название расчёта <span className="text-destructive">*</span></Label>
            <Input
              id="calc-name"
              placeholder="Например: Столешница для ванной"
              value={calcName}
              onChange={(e) => setCalcName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-name">Имя клиента</Label>
            <Input
              id="client-name"
              placeholder="Иванов Иван Иванович"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="client-phone">Телефон</Label>
              <Input
                id="client-phone"
                placeholder="+7 900 000 00 00"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                placeholder="client@email.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            При сохранении автоматически создаётся лид в разделе «Продажи»
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleConfirm} disabled={!calcName.trim() || saving}>
            {saving ? "Сохранение..." : "Сохранить и создать лид"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
