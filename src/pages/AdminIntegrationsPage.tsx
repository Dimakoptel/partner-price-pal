import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useIntegrationQueue, useRetryIntegration } from "@/hooks/useIntegrationQueue";
import { RefreshCw, AlertCircle, CheckCircle, Clock, Send } from "lucide-react";

export default function AdminIntegrationsPage() {
  const { data: queue, isLoading } = useIntegrationQueue();
  const retryMutation = useRetryIntegration();

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-amber-500" />;
      case "sent": return <Send className="h-4 w-4 text-blue-500" />;
      case "confirmed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const stats = {
    pending: queue?.filter((q) => q.status === "pending").length || 0,
    sent: queue?.filter((q) => q.status === "sent").length || 0,
    confirmed: queue?.filter((q) => q.status === "confirmed").length || 0,
    error: queue?.filter((q) => q.status === "error").length || 0,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Интеграции</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "В очереди", count: stats.pending, color: "text-amber-500" },
            { label: "Отправлено", count: stats.sent, color: "text-blue-500" },
            { label: "Подтверждено", count: stats.confirmed, color: "text-green-500" },
            { label: "Ошибки", count: stats.error, color: "text-destructive" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6 text-center">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Queue table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Очередь обмена с 1С</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Загрузка...</p>
            ) : !queue?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Очередь пуста</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Время</TableHead>
                      <TableHead className="text-xs">Направление</TableHead>
                      <TableHead className="text-xs">Сущность</TableHead>
                      <TableHead className="text-xs">Статус</TableHead>
                      <TableHead className="text-xs">Попытки</TableHead>
                      <TableHead className="text-xs w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queue.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs">
                          {new Date(item.created_at).toLocaleString("ru-RU")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.direction === "to_1c" ? "→ 1С" : "← 1С"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.entity_type}
                          {item.entity_id && (
                            <span className="text-muted-foreground ml-1">
                              ({item.entity_id.slice(0, 8)}…)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {statusIcon(item.status)}
                            <span className="text-xs">{item.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.retry_count} / {item.max_retries}
                        </TableCell>
                        <TableCell>
                          {item.status === "error" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => retryMutation.mutate(item.id)}
                              disabled={retryMutation.isPending}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Повтор
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WordPress webhook info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Webhook для WordPress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Для приёма заявок с сайта используйте следующий endpoint:
            </p>
            <code className="block bg-muted px-3 py-2 rounded text-xs break-all">
              POST {import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-wordpress-lead
            </code>
            <p className="text-muted-foreground">
              Заголовок: <code className="bg-muted px-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
            </p>
            <p className="text-muted-foreground">
              Тело: <code className="bg-muted px-1 rounded">{"{ name, phone, email, source, message }"}</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
