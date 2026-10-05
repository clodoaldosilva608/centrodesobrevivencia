/**
 * useAppSetting — Lê uma configuração da tabela app_settings (Supabase).
 * Leitura é pública (RLS permite SELECT para anon/authenticated).
 *
 * Para escrita, use `updateAppSetting` (requer admin logado).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface UseAppSettingResult<T = string> {
  value: T;
  loading: boolean;
  enabled: boolean;
  setValue: (newValue: T) => Promise<{ ok: boolean; error?: string }>;
  reload: () => void;
}

export function useAppSetting<T = string>(
  key: string,
  defaultValue: T
): UseAppSettingResult<T> {
  const { user } = useAuth();
  const [value, setValueState] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setEnabled(false);
          setValueState(defaultValue);
        } else if (data) {
          setEnabled(true);
          setValueState(data.value as T);
        } else {
          setEnabled(true);
          setValueState(defaultValue);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setEnabled(false);
        setValueState(defaultValue);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadTick]);

  const setValue = useCallback(
    async (newValue: T) => {
      if (!user) return { ok: false, error: "Não logado" };
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;
      const { error } = await supabase
        .from("app_settings")
        .upsert({
          key,
          value: String(newValue),
          updated_by: userId,
        });
      if (error) return { ok: false, error: error.message };
      setValueState(newValue);
      return { ok: true };
    },
    [key, user]
  );

  return {
    value,
    loading,
    enabled,
    setValue,
    reload: () => setReloadTick((t) => t + 1),
  };
}
