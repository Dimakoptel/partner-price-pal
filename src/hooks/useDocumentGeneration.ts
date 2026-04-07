import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useGenerateDocument() {
  return useMutation({
    mutationFn: async ({ orderId, documentType, orderNumber }: { orderId: string; documentType: "invoice" | "warranty"; orderNumber?: string }) => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Не авторизован");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL не настроен");

      const res = await fetch(
        `${supabaseUrl}/functions/v1/generate-document`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order_id: orderId, document_type: documentType }),
        }
      );

      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          console.error("generate-document error response:", errBody);
          errorMsg = errBody.error || errorMsg;
        } catch {
          const textBody = await res.text();
          console.error("generate-document raw response:", textBody);
        }
        throw new Error(errorMsg);
      }

      const html = await res.text();
      if (!html || html.length < 50) {
        throw new Error("Пустой документ — возможно, в заказе нет позиций");
      }

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentType}_${orderNumber || orderId}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      return html;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.documentType === "invoice" ? "Счёт сгенерирован" : "Гарантийный талон сгенерирован");
    },
    onError: (e: any) => {
      console.error("Document generation failed:", e);
      toast.error("Ошибка генерации: " + e.message);
    },
  });
}
