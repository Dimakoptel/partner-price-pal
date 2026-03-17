import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useGenerateDocument() {
  return useMutation({
    mutationFn: async ({ orderId, documentType, orderNumber }: { orderId: string; documentType: "invoice" | "warranty"; orderNumber?: string }) => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-document`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order_id: orderId, document_type: documentType }),
        }
      );

      if (!res.ok) throw new Error("Ошибка генерации документа");

      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentType}_${orderNumber || orderId}.html`;
      a.click();
      URL.revokeObjectURL(url);

      return html;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.documentType === "invoice" ? "Счёт сгенерирован" : "Гарантийный талон сгенерирован");
    },
    onError: (e: any) => toast.error("Ошибка: " + e.message),
  });
}
