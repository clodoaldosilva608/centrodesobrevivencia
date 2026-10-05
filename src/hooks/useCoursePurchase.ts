/**
 * useCoursePurchase — verifica status de compra do usuário para um curso.
 * - Cria cobrança Cakto chamando /api/cakto-payment
 * - Faz polling do status da compra (pending → paid) por até 30 min
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getCourseById } from "@/data/courses";

export interface PurchaseInfo {
  id: string;
  status: "pending" | "paid" | "refunded" | "expired" | "cancelled";
  amount_cents: number;
  cakto_payment_url: string | null;
  cakto_pix_qr_code: string | null;
  cakto_pix_qr_image: string | null;
  expires_at: string | null;
  paid_at: string | null;
}

interface CreatePaymentResponse {
  purchase_id: string;
  charge_id: string;
  amount_cents: number;
  currency: string;
  pix_qr_code: string | null;
  pix_qr_image: string | null;
  payment_url: string | null;
  expires_at: string | null;
  status: string;
}

interface UseCoursePurchaseResult {
  purchase: PurchaseInfo | null;
  isPaid: boolean;
  loading: boolean;
  creatingPayment: boolean;
  error: string | null;
  createPayment: () => Promise<CreatePaymentResponse | null>;
  reload: () => void;
}

export function useCoursePurchase(courseId: string | undefined): UseCoursePurchaseResult {
  const { user, isAuthenticated } = useAuth();
  const [purchase, setPurchase] = useState<PurchaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  // Carrega compra do banco
  useEffect(() => {
    if (!courseId || !isAuthenticated || !user) {
      setPurchase(null);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);

    const load = async () => {
      // Usa RPC is_course_paid para verificar pagamento (mais seguro)
      const [{ data: paidData }, { data: purchaseData }] = await Promise.all([
        supabase.rpc("is_course_paid", { p_course_id: courseId }),
        supabase
          .from("course_purchases")
          .select("*")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!mounted) return;
      if (purchaseData) {
        setPurchase(purchaseData as PurchaseInfo);
      } else {
        setPurchase(null);
      }
      setLoading(false);
    };

    load().catch(() => {
      if (!mounted) return;
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [courseId, user, isAuthenticated, reloadTick]);

  // Polling: se há compra pendente, recarrega a cada 10s para detectar pagamento
  useEffect(() => {
    if (!purchase || purchase.status !== "pending") return;
    const intervalMs = 10000; // 10s
    const interval = setInterval(() => {
      setReloadTick((t) => t + 1);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [purchase]);

  const createPayment = useCallback(async (): Promise<CreatePaymentResponse | null> => {
    if (!courseId || !user) {
      setError("Usuário não logado");
      return null;
    }
    setCreatingPayment(true);
    setError(null);
    try {
      // Pega token de acesso atual
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setError("Sessão expirada — faça login novamente");
        return null;
      }
      const res = await fetch("/api/cakto-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ course_id: courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar pagamento");
        return null;
      }
      // Recarrega purchase do banco
      setReloadTick((t) => t + 1);
      return data as CreatePaymentResponse;
    } catch (e: any) {
      setError(e.message || "Erro de rede");
      return null;
    } finally {
      setCreatingPayment(false);
    }
  }, [courseId, user]);

  return {
    purchase,
    isPaid: purchase?.status === "paid",
    loading,
    creatingPayment,
    error,
    createPayment,
    reload: () => setReloadTick((t) => t + 1),
  };
}
