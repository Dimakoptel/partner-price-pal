import { useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerDiscounts } from "@/hooks/usePartnerRequests";
import { useNomenclature } from "@/hooks/useNomenclature";
import { useProductCategories } from "@/hooks/useProductCategories";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export default function PartnerPriceListPage() {
  const { partnerClientId } = useAuth();
  const { getDiscountForCategory } = usePartnerDiscounts(partnerClientId);
  const { items, loading } = useNomenclature();
  const { activeCategories } = useProductCategories();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const visibleItems = items
    .filter(item => item.is_active && item.show_in_pricelist)
    .filter(item => {
      if (search) {
        const s = search.toLowerCase();
        return item.name.toLowerCase().includes(s) || item.sku.toLowerCase().includes(s);
      }
      return true;
    })
    .filter(item => categoryFilter === "all" || item.category === categoryFilter);

  // Find category ID from name
  const getCategoryIdByName = (name: string) => {
    return activeCategories.find(c => c.name === name)?.id;
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold mb-1">Прайс-лист</h1>
          <p className="text-muted-foreground text-sm mb-6">Цены с учётом вашей партнёрской скидки</p>
        </motion.div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по названию или артикулу..."
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {activeCategories.map(c => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Загрузка...</div>
        ) : visibleItems.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">Нет позиций для отображения</div>
        ) : (
          <div className="border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium">Артикул</th>
                  <th className="text-left p-3 font-medium">Наименование</th>
                  <th className="text-left p-3 font-medium">Категория</th>
                  <th className="text-right p-3 font-medium">РРЦ</th>
                  <th className="text-right p-3 font-medium">Скидка</th>
                  <th className="text-right p-3 font-medium">Ваша цена</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map(item => {
                  const catId = getCategoryIdByName(item.category);
                  const discount = catId ? getDiscountForCategory(catId) : 0;
                  const rrp = item.price_rrp || 0;
                  const partnerPrice = Math.round(rrp * (1 - discount / 100));

                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/20">
                      <td className="p-3 text-muted-foreground">{item.sku}</td>
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2">
                          {item.photo_url && (
                            <img src={item.photo_url} alt="" className="w-8 h-8 object-cover border border-border" />
                          )}
                          {item.name}
                        </div>
                      </td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3 text-right text-muted-foreground">
                        {rrp > 0 ? `${rrp.toLocaleString("ru-RU")} ₽` : "—"}
                      </td>
                      <td className="p-3 text-right">
                        {discount > 0 ? (
                          <Badge variant="secondary">-{discount}%</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium text-primary">
                        {rrp > 0 ? `${partnerPrice.toLocaleString("ru-RU")} ₽` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
