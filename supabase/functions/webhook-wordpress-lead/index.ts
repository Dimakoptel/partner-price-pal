import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const API_KEY = Deno.env.get("WORDPRESS_WEBHOOK_KEY") || "default-key";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Bearer token auth
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${API_KEY}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { name, phone, email, source, utm, message, product_interest, ip } =
      body;

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find existing client by phone
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    let clientId = existingClient?.id;

    // Find a system/admin user for created_by / user_id (service account)
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    const systemUserId = adminRole?.user_id;
    if (!systemUserId) {
      return new Response(
        JSON.stringify({ error: "No admin user found for lead assignment" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create client if not found
    if (!clientId) {
      const { data: newClient, error: clientErr } = await supabase
        .from("clients")
        .insert({
          name: name || "Без имени",
          phone,
          email: email || null,
          source: source || "website",
          client_type: "b2c",
          created_by: systemUserId,
        })
        .select("id")
        .single();
      if (clientErr) throw clientErr;
      clientId = newClient?.id;
    }

    // Build notes with UTM & IP metadata
    const metaParts: string[] = [];
    if (message) metaParts.push(message);
    if (utm?.source) metaParts.push(`utm_source: ${utm.source}`);
    if (utm?.medium) metaParts.push(`utm_medium: ${utm.medium}`);
    if (utm?.campaign) metaParts.push(`utm_campaign: ${utm.campaign}`);
    if (utm?.region) metaParts.push(`region: ${utm.region}`);
    if (ip) metaParts.push(`ip: ${ip}`);

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        client_id: clientId,
        client_name: name || "Без имени",
        client_phone: phone,
        client_email: email || null,
        status: "new",
        source: source || "website",
        notes: metaParts.length > 0 ? metaParts.join("\n") : null,
        product_interest: product_interest || null,
        region: utm?.region || null,
        user_id: systemUserId,
      })
      .select("id")
      .single();

    if (leadError) throw leadError;

    console.log("🔔 Новый лид с сайта:", lead?.id);

    return new Response(
      JSON.stringify({
        status: "success",
        lead_id: lead?.id,
        client_id: clientId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Webhook error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
