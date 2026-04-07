import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INVOICE_TEMPLATE = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1a1a1a; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #666; margin-bottom: 24px; }
  .info { margin-bottom: 20px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #f1f5f9; text-align: left; padding: 8px 12px; font-size: 13px; border-bottom: 2px solid #e2e8f0; }
  td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
  .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 16px; }
  .warranty { color: #666; font-size: 13px; margin-top: 8px; }
</style></head><body>
  <h1>Счёт на оплату №{{order_number}}</h1>
  <p class="subtitle">от {{order_date}}</p>
  <div class="info">
    <p><strong>Плательщик:</strong> {{client_name}}</p>
    <p><strong>ИНН:</strong> {{client_inn}}</p>
    <p><strong>Адрес:</strong> {{client_address}}</p>
  </div>
  <table>
    <thead><tr><th>№</th><th>Наименование</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead>
    <tbody>{{items_rows}}</tbody>
  </table>
  <p class="total">Итого: {{order_total}} ₽</p>
  <p class="warranty">Гарантия: {{order_warranty}} мес.</p>
</body></html>`;

const WARRANTY_TEMPLATE = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1a1a1a; }
  h1 { text-align: center; font-size: 24px; margin-bottom: 20px; }
  .order-info { text-align: center; color: #666; margin-bottom: 24px; }
  .client { margin-bottom: 20px; line-height: 1.6; }
  .item-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .item-card p { margin: 4px 0; font-size: 14px; }
  .disclaimer { margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #666; line-height: 1.5; }
</style></head><body>
  <h1>ГАРАНТИЙНЫЙ ТАЛОН</h1>
  <p class="order-info">Заказ №{{order_number}} от {{order_date}}</p>
  <div class="client">
    <p><strong>Клиент:</strong> {{client_name}}</p>
    <p><strong>Телефон:</strong> {{client_phone}}</p>
  </div>
  {{items_cards}}
  <div class="disclaimer">
    Гарантия распространяется на производственные дефекты.
    Не является гарантийным случаем: механические повреждения,
    нарушение условий эксплуатации.
  </div>
</body></html>`;

function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { order_id, document_type } = await req.json();

    if (!order_id || !document_type) {
      return new Response(JSON.stringify({ error: "order_id and document_type required" }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Load order with client and items
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, client:clients(*)")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: corsHeaders });
    }

    // Load order items with variant info
    const { data: items } = await supabase
      .from("order_items")
      .select("*, variant:product_variants(sku_variant, size_cm, color, texture, product:products(name, sku_base))")
      .eq("order_id", order_id)
      .order("created_at");

    // Load production orders for batch numbers
    const { data: productionOrders } = await supabase
      .from("production_orders")
      .select("batch_number, order_item_id")
      .eq("sales_order_id", order_id);

    const orderDate = new Date(order.created_at).toLocaleDateString("ru-RU");
    const client = order.client || {};

    let html: string;

    if (document_type === "invoice") {
      const itemsRows = (items || [])
        .map((item: any, i: number) => {
          const name = item.variant?.product?.name
            ? `${item.variant.product.name} (${[item.variant.color, item.variant.size_cm].filter(Boolean).join(", ")})`
            : `Позиция ${i + 1}`;
          return `<tr><td>${i + 1}</td><td>${name}</td><td>${item.quantity}</td><td>${formatNumber(item.price_unit)} ₽</td><td>${formatNumber(item.total_line)} ₽</td></tr>`;
        })
        .join("\n");

      html = INVOICE_TEMPLATE
        .replace("{{order_number}}", order.number)
        .replace("{{order_date}}", orderDate)
        .replace("{{client_name}}", client.name || "—")
        .replace("{{client_inn}}", client.inn || "—")
        .replace("{{client_address}}", client.address || "—")
        .replace("{{items_rows}}", itemsRows)
        .replace("{{order_total}}", formatNumber(order.total_amount || 0))
        .replace("{{order_warranty}}", String(order.warranty_months || 12));
    } else {
      const itemsCards = (items || [])
        .map((item: any) => {
          const name = item.variant?.product?.name || "Изделие";
          const sku = item.variant?.sku_variant || "—";
          const batch = productionOrders?.find((po: any) => po.order_item_id === item.id)?.batch_number;
          return `<div class="item-card">
            <p><strong>Изделие:</strong> ${name}</p>
            <p><strong>Артикул:</strong> ${sku}</p>
            ${batch ? `<p><strong>Партия:</strong> ${batch}</p>` : ""}
            <p><strong>Гарантия:</strong> ${item.warranty_months} мес.</p>
          </div>`;
        })
        .join("\n");

      html = WARRANTY_TEMPLATE
        .replace("{{order_number}}", order.number)
        .replace("{{order_date}}", orderDate)
        .replace("{{client_name}}", client.name || "—")
        .replace("{{client_phone}}", client.phone || "—")
        .replace("{{items_cards}}", itemsCards);
    }

    const filename = document_type === "invoice"
      ? `invoice_${order.number || order_id}.html`
      : `warranty_${order.number || order_id}.html`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
