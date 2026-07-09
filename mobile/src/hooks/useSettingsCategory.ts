import { useCallback, useEffect, useState } from "react";

import { ApiError, SettingsCategory, getSettings, putSettings } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function useSettingsCategory<T extends object>(category: SettingsCategory, defaults: T) {
  const { token } = useAuth();
  const [values, setValues] = useState<T>(defaults);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await getSettings<T>(category, token);
        if (!cancelled) setValues({ ...defaults, ...data });
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Unable to reach the server");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // defaults is a fresh object every render by design (screens pass a literal) —
    // only re-fetch when the category or auth token actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, token]);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    if (!token) return;
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const data = await putSettings<T>(category, values, token);
      setValues({ ...defaults, ...data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, values, token]);

  return { values, setField, isLoading, isSaving, error, saved, save };
}
