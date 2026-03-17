import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get caller user_id from auth header
    const authHeader = req.headers.get("Authorization")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // 1. Seed clients
    const { data: clients, error: clientsError } = await supabase.from("clients").insert([
      {
        name: "Иванов Иван",
        phone: "+79131234567",
        email: "ivanov@example.com",
        client_type: "b2c",
        pricing_type: "retail",
        payment_terms: "prepay",
        region: "Новосибирск",
        created_by: userId,
      },
      {
        name: 'ООО "СтройДизайн"',
        phone: "+79137654321",
        email: "info@stroydesign.ru",
        company: 'ООО "СтройДизайн"',
        inn: "5401234567",
        client_type: "b2b",
        pricing_type: "wholesale",
        payment_terms: "postpay",
        credit_limit: 500000,
        region: "Новосибирская обл.",
        created_by: userId,
      },
      {
        name: "Петрова Анна (дизайнер)",
        phone: "+79139876543",
        email: "anna.design@example.com",
        client_type: "agent",
        pricing_type: "dealer",
        payment_terms: "prepay",
        commission_rate: 10,
        region: "Москва",
        created_by: userId,
      },
    ]).select();

    if (clientsError) throw new Error(`Clients: ${clientsError.message}`);

    // 2. Seed leads
    const { data: leads, error: leadsError } = await supabase.from("leads").insert([
      {
        client_id: clients[0].id,
        client_name: "Иванов Иван",
        client_phone: "+79131234567",
        status: "new",
        source: "website",
        amount: 50000,
        notes: "Интересует раковина Лофт",
        user_id: userId,
      },
      {
        client_id: clients[1].id,
        client_name: 'ООО "СтройДизайн"',
        status: "qualified",
        source: "recommendation",
        amount: 300000,
        notes: "Застройщик, интересуют столешницы для ЖК",
        user_id: userId,
      },
      {
        client_name: "Сидоров Пётр",
        client_phone: "+79135551234",
        status: "proposal_sent",
        source: "calculator",
        amount: 85000,
        product_interest: "Столешница 1200x600",
        notes: "Отправлено КП на столешницу",
        user_id: userId,
      },
    ]).select();

    if (leadsError) throw new Error(`Leads: ${leadsError.message}`);

    // 3. Seed orders
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const { data: orders, error: ordersError } = await supabase.from("orders").insert([
      {
        client_id: clients[0].id,
        lead_id: leads[0].id,
        order_type: "serial_stock",
        status: "draft",
        total_amount: 50000,
        paid_amount: 0,
        discount_percent: 0,
        warranty_months: 12,
        delivery_method: "self_pickup",
        notes: "Тестовый заказ — черновик",
        responsible_id: userId,
      },
      {
        client_id: clients[2].id,
        agent_id: clients[2].id,
        order_type: "custom",
        status: "confirmed",
        total_amount: 120000,
        paid_amount: 60000,
        discount_percent: 5,
        warranty_months: 24,
        delivery_method: "city_delivery",
        delivery_address: "г. Москва, ул. Примерная, д. 10",
        notes: "Заказ от агента, комиссия 10%",
        responsible_id: userId,
      },
      {
        client_id: clients[1].id,
        order_type: "serial_stock",
        status: "in_production",
        total_amount: 300000,
        paid_amount: 300000,
        discount_percent: 10,
        warranty_months: 24,
        delivery_method: "to_tc",
        notes: "Оптовый заказ, полностью оплачен",
        responsible_id: userId,
      },
    ]).select();

    if (ordersError) throw new Error(`Orders: ${ordersError.message}`);

    // Update lead → order conversion
    await supabase.from("leads").update({
      converted_to_order_id: orders[0].id,
      status: "won",
    }).eq("id", leads[0].id);

    const result = {
      success: true,
      created: {
        clients: clients.length,
        leads: leads.length,
        orders: orders.length,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
