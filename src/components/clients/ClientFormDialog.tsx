import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Client } from "@/hooks/useClients";

const CLIENT_TYPES = [
  { value: "b2c", label: "B2C (частное лицо)" },
  { value: "b2b", label: "B2B (компания)" },
  { value: "agent", label: "Агент" },
  { value: "designer", label: "Дизайнер" },
  { value: "partner", label: "Партнёр" },
  { value: "developer", label: "Застройщик" },
];

const PRICING_TYPES = [
  { value: "retail", label: "Розница" },
  { value: "wholesale1", label: "Опт 1" },
  { value: "wholesale2", label: "Опт 2" },
  { value: "dealer", label: "Дилер" },
  { value: "agent", label: "Агентский" },
];

const PAYMENT_TERMS = [
  { value: "prepay", label: "Предоплата" },
  { value: "postpay", label: "Постоплата" },
  { value: "delay30", label: "Отсрочка 30 дн." },
  { value: "delay60", label: "Отсрочка 60 дн." },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

export default function ClientFormDialog({ open, onOpenChange, client, onSubmit, isPending }: Props) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    telegram: "",
    company: "",
    address: "",
    notes: "",
    client_type: "b2c",
    inn: "",
    kpp: "",
    ogrn: "",
    legal_address: "",
    bank_name: "",
    bank_bik: "",
    bank_account: "",
    bank_corr_account: "",
    pricing_type: "retail",
    discount_default: "",
    credit_limit: "",
    payment_terms: "prepay",
    commission_rate: "",
    region: "",
    source: "",
  });

  useEffect(() => {
    if (client) {
      const c = client as any;
      setForm({
        name: client.name,
        phone: client.phone ?? "",
        email: client.email ?? "",
        telegram: client.telegram ?? "",
        company: client.company ?? "",
        address: client.address ?? "",
        notes: client.notes ?? "",
        client_type: c.client_type ?? "b2c",
        inn: c.inn ?? "",
        kpp: c.kpp ?? "",
        ogrn: c.ogrn ?? "",
        legal_address: c.legal_address ?? "",
        bank_name: c.bank_name ?? "",
        bank_bik: c.bank_bik ?? "",
        bank_account: c.bank_account ?? "",
        bank_corr_account: c.bank_corr_account ?? "",
        pricing_type: c.pricing_type ?? "retail",
        discount_default: c.discount_default?.toString() ?? "",
        credit_limit: c.credit_limit?.toString() ?? "",
        payment_terms: c.payment_terms ?? "prepay",
        commission_rate: c.commission_rate?.toString() ?? "",
        region: c.region ?? "",
        source: c.source ?? "",
      });
    } else {
      setForm({
        name: "", phone: "", email: "", telegram: "", company: "", address: "", notes: "",
        client_type: "b2c", inn: "", kpp: "", ogrn: "", legal_address: "",
        bank_name: "", bank_bik: "", bank_account: "", bank_corr_account: "",
        pricing_type: "retail", discount_default: "",
        credit_limit: "", payment_terms: "prepay", commission_rate: "", region: "", source: "",
      });
    }
  }, [client, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      ...form,
      discount_default: parseFloat(form.discount_default) || 0,
      credit_limit: parseFloat(form.credit_limit) || 0,
      commission_rate: parseFloat(form.commission_rate) || 0,
      inn: form.inn || null,
      kpp: form.kpp || null,
      ogrn: form.ogrn || null,
      legal_address: form.legal_address || null,
      bank_name: form.bank_name || null,
      bank_bik: form.bank_bik || null,
      bank_account: form.bank_account || null,
      bank_corr_account: form.bank_corr_account || null,
      source: form.source || null,
      region: form.region || null,
    });
  };

  const isAgent = form.client_type === "agent";
  const isB2B = ["b2b", "developer", "partner"].includes(form.client_type);
  const showRequisites = isB2B || isAgent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Редактировать клиента" : "Новый клиент"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Type & Name */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Тип *</Label>
              <Select value={form.client_type} onValueChange={(v) => setForm({ ...form, client_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLIENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Имя / ФИО *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>

          {/* Contacts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Телефон</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Telegram</Label>
              <Input value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Компания</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
          </div>

          {/* Юридические реквизиты */}
          {showRequisites && (
            <>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Юридические реквизиты</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">ИНН</Label>
                  <Input value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} placeholder="1234567890" />
                </div>
                <div>
                  <Label className="text-xs">КПП</Label>
                  <Input value={form.kpp} onChange={(e) => setForm({ ...form, kpp: e.target.value })} placeholder="123456789" />
                </div>
                <div>
                  <Label className="text-xs">ОГРН</Label>
                  <Input value={form.ogrn} onChange={(e) => setForm({ ...form, ogrn: e.target.value })} placeholder="1234567890123" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Юридический адрес</Label>
                <Input value={form.legal_address} onChange={(e) => setForm({ ...form, legal_address: e.target.value })} placeholder="г. Москва, ул. Примерная, д. 1" />
              </div>
              <div>
                <Label className="text-xs">Регион</Label>
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Новосибирская обл." />
              </div>

              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Банковские реквизиты</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Банк</Label>
                  <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="ПАО Сбербанк" />
                </div>
                <div>
                  <Label className="text-xs">БИК</Label>
                  <Input value={form.bank_bik} onChange={(e) => setForm({ ...form, bank_bik: e.target.value })} placeholder="044525225" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Расчётный счёт</Label>
                  <Input value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} placeholder="40702810..." />
                </div>
                <div>
                  <Label className="text-xs">Корр. счёт</Label>
                  <Input value={form.bank_corr_account} onChange={(e) => setForm({ ...form, bank_corr_account: e.target.value })} placeholder="30101810..." />
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Тип цен</Label>
              <Select value={form.pricing_type} onValueChange={(v) => setForm({ ...form, pricing_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRICING_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Скидка (%)</Label>
              <Input type="number" value={form.discount_default} onChange={(e) => setForm({ ...form, discount_default: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Условия оплаты</Label>
              <Select value={form.payment_terms} onValueChange={(v) => setForm({ ...form, payment_terms: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Agent commission */}
          {isAgent && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Комиссия агента (%)</Label>
                <Input type="number" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} placeholder="10" />
              </div>
              <div>
                <Label className="text-xs">Кредитный лимит (₽)</Label>
                <Input type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} placeholder="0" />
              </div>
            </div>
          )}

          {isB2B && (
            <div>
              <Label className="text-xs">Кредитный лимит (₽)</Label>
              <Input type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} placeholder="0" />
            </div>
          )}

          <div>
            <Label className="text-xs">Фактический адрес</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Источник</Label>
            <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Сайт, выставка, рекомендация..." />
          </div>
          <div>
            <Label className="text-xs">Заметки</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={isPending || !form.name.trim()}>
              {isPending ? "Сохранение..." : client ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
