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
  onConfirm: (name: string) => void;
  saving?: boolean;
}

export default function SaveCalculationDialog({ open, onClose, onConfirm, saving }: Props) {
  const [name, setName] = useState("");

  const handleConfirm = () => {
    if (!name.trim()) return;
    onConfirm(name.trim());
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Сохранить расчёт</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="calc-name">Название расчёта <span className="text-destructive">*</span></Label>
          <Input
            id="calc-name"
            placeholder="Например: Иванов И.И., ванная комната"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Укажите имя клиента или описание для идентификации расчёта
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleConfirm} disabled={!name.trim() || saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
