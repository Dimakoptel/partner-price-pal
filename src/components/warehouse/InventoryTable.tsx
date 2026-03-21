import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle } from "lucide-react";
import type { InventoryItem } from "@/hooks/useInventory";

interface Props {
  items: InventoryItem[];
  onSelect?: (item: InventoryItem) => void;
}

export default function InventoryTable({ items, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => {
      const v = i.variant as any;
      const p = v?.product as any;
      return (
        p?.name?.toLowerCase().includes(q) ||
        v?.sku_variant?.toLowerCase().includes(q) ||
        v?.color?.toLowerCase().includes(q) ||
        (i.location || "").toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Поиск по товару, артикулу..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
          {search ? "Ничего не найдено" : "Склад пуст. Создайте приход для добавления остатков."}
        </div>
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товар</TableHead>
                <TableHead>Вариант</TableHead>
                <TableHead className="text-right w-24">На складе</TableHead>
                <TableHead className="text-right w-24">Резерв</TableHead>
                <TableHead className="text-right w-24">Свободно</TableHead>
                <TableHead className="w-20">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const v = item.variant as any;
                const p = v?.product as any;
                const free = item.quantity_on_hand - item.quantity_reserved;
                const isLow = item.min_stock_level > 0 && free <= item.min_stock_level;

                const variantParts = [v?.color, v?.size_cm, v?.texture].filter(Boolean);
                const variantLabel = variantParts.length > 0 ? variantParts.join(" / ") : v?.sku_variant || "—";

                return (
                  <TableRow
                    key={item.id}
                    className={`cursor-pointer ${isLow ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}`}
                    onClick={() => onSelect?.(item)}
                  >
                    <TableCell className="font-medium text-sm">{p?.name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{variantLabel}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{item.quantity_on_hand}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{item.quantity_reserved}</TableCell>
                    <TableCell className={`text-right font-mono text-sm font-medium ${free < 0 ? "text-destructive" : ""}`}>{free}</TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600 gap-1">
                          <AlertTriangle className="w-3 h-3" /> Мало
                        </Badge>
                      ) : free > 0 ? (
                        <Badge variant="outline" className="text-[10px] border-green-400 text-green-600">В наличии</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Нет</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
