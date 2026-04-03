import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { usePartnerRequests, usePartnerRequestMessages } from "@/hooks/usePartnerRequests";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "Новый", variant: "default" },
  in_progress: { label: "В работе", variant: "secondary" },
  quoted: { label: "Просчитан", variant: "outline" },
  approved: { label: "Одобрен", variant: "default" },
  rejected: { label: "Отклонён", variant: "destructive" },
  ordered: { label: "В заказе", variant: "secondary" },
};

const PARAM_LABELS: Record<string, string> = {
  length: "Длина (мм)",
  width: "Ширина (мм)",
  height: "Высота (мм)",
  thickness: "Толщина (мм)",
  diameter: "Диаметр (мм)",
  color: "Цвет",
  quantity: "Количество",
  bowlCount: "Чаши",
  drainType: "Тип слива",
  isRound: "Круглая форма",
  hasRiser: "Подступенок",
};

export default function PartnerRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests } = usePartnerRequests();
  const { messages, sendMessage, subscribeToMessages } = usePartnerRequestMessages(id || null);
  const { categories } = useProductCategories();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const request = requests.find(r => r.id === id);

  useEffect(() => {
    if (id) {
      const unsub = subscribeToMessages(id);
      return unsub;
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      await sendMessage.mutateAsync({ message: newMessage.trim() });
      setNewMessage("");
    } catch {
      toast.error("Не удалось отправить сообщение");
    }
  };

  if (!request) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-muted-foreground">Запрос не найден</div>
      </AppLayout>
    );
  }

  const st = STATUS_MAP[request.status] || { label: request.status, variant: "outline" as const };
  const categoryName = categories.find(c => c.id === request.category_id)?.name || "—";

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/partner/requests")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад
        </Button>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-2xl font-bold">{request.number}</h1>
            <Badge variant={st.variant}>{st.label}</Badge>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 mb-6 border border-border p-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase">Категория</div>
              <div className="text-sm font-medium">{categoryName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Тип изделия</div>
              <div className="text-sm font-medium">{request.product_type || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Дата</div>
              <div className="text-sm">{format(new Date(request.created_at), "dd.MM.yyyy HH:mm", { locale: ru })}</div>
            </div>
            {request.partner_price != null && (
              <>
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Розничная цена</div>
                  <div className="text-sm line-through text-muted-foreground">{request.retail_price?.toLocaleString("ru-RU")} ₽</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Партнёрская цена</div>
                  <div className="text-sm font-medium text-primary">{request.partner_price.toLocaleString("ru-RU")} ₽</div>
                </div>
              </>
            )}
          </div>

          {/* Params */}
          <div className="border border-border p-4 mb-6">
            <h3 className="text-sm font-medium mb-3">Параметры</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(request.params || {}).map(([key, val]) => {
                if (val === false || val === "" || val === null || val === undefined) return null;
                const label = PARAM_LABELS[key] || key;
                const display = val === true ? "Да" : String(val);
                return (
                  <div key={key}>
                    <span className="text-xs text-muted-foreground">{label}: </span>
                    <span className="text-sm">{display}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {request.notes && (
            <div className="border border-border p-4 mb-6">
              <h3 className="text-sm font-medium mb-2">Комментарий</h3>
              <p className="text-sm text-muted-foreground">{request.notes}</p>
            </div>
          )}

          {/* Attachments */}
          {request.attachment_urls.length > 0 && (
            <div className="border border-border p-4 mb-6">
              <h3 className="text-sm font-medium mb-3">Вложения</h3>
              <div className="flex gap-2 flex-wrap">
                {request.attachment_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`attachment ${i + 1}`} className="w-24 h-24 object-cover border border-border hover:border-primary/50 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Messages / Chat */}
          <div className="border border-border mb-6">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-medium">Обсуждение</h3>
            </div>
            <div className="max-h-80 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Сообщений пока нет</p>
              ) : (
                messages.map(msg => {
                  const isOwn = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 text-sm ${isOwn ? "bg-primary/10 border-primary/20" : "bg-muted"} border`}>
                        <p>{msg.message}</p>
                        {msg.attachment_urls?.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {msg.attachment_urls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <Paperclip className="w-3 h-3 inline" /> Файл {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(msg.created_at), "HH:mm, dd.MM", { locale: ru })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <Textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Написать сообщение..."
                className="min-h-[40px] max-h-[80px]"
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button size="icon" onClick={handleSend} disabled={sendMessage.isPending || !newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
