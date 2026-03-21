import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MOVEMENT_TYPES, type StockMovement } from "@/hooks/useInventory";

interface Props {
  movements: StockMovement[];
}

export default function MovementsTable({ movements }: Props) {
  const typeInfo = (t: string) => MOVEMENT_TYPES.find((m) => m.value === t) || { label: t, color: "#888" };

  if (movements.length === 0) {
    return (
      <div className="border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
        Нет движений. Создайте приход или расход.
      </div>
    );
  }

  return (
    <div className="border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Товар</TableHead>
            <TableHead className="text-right w-20">Кол-во</TableHead>
            <TableHead>Документ</TableHead>
            <TableHead>Основание</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((m) => {
            const ti = typeInfo(m.movement_type);
            const v = m.variant as any;
            const p = v?.product as any;
            const isIncoming = ["receipt", "return"].includes(m.movement_type);

            return (
              <TableRow key={m.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(m.created_at), "d MMM HH:mm", { locale: ru })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" style={{ borderColor: ti.color, color: ti.color }} className="text-[10px]">
                    {ti.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium">{p?.name || "—"}</span>
                  {v && (
                    <span className="text-xs text-muted-foreground ml-1.5">
                      {[v.color, v.size_cm].filter(Boolean).join(" / ")}
                    </span>
                  )}
                </TableCell>
                <TableCell className={`text-right font-mono text-sm font-medium ${isIncoming ? "text-green-600" : "text-red-500"}`}>
                  {isIncoming ? "+" : "−"}{m.quantity}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{m.document_number || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{m.reason || m.notes || "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
