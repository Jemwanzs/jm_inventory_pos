import React, { useCallback, useEffect, useState } from "react";

import { ApiError, CatalogItem, createCategory, listCategories } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { CatalogList } from "../../components/CatalogList";
import { TextField } from "../../components/TextField";

export default function CategoriesScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      setItems(await listCategories(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!token || name.trim().length === 0) return;
    setIsAdding(true);
    setError(null);
    try {
      const item = await createCategory(name.trim(), token);
      setItems((prev) => [...prev, item]);
      setName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <CatalogList
      title="Categories"
      description="Group products for browsing, filtering, and reporting."
      emptyLabel="No categories yet — add your first one above."
      isLoading={isLoading}
      error={error}
      items={items}
      formContent={<TextField label="Name" placeholder="Electronics" value={name} onChangeText={setName} />}
      onAdd={handleAdd}
      canAdd={name.trim().length > 0 && !isAdding}
      isAdding={isAdding}
      addLabel="Add Category"
    />
  );
}
