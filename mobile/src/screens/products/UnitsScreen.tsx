import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { ApiError, UnitItem, createUnit, listUnits } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { CatalogList } from "../../components/CatalogList";
import { TextField } from "../../components/TextField";
import { spacing } from "../../theme";

export default function UnitsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<UnitItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      setItems(await listUnits(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const canAdd = name.trim().length > 0 && abbreviation.trim().length > 0 && !isAdding;

  const handleAdd = async () => {
    if (!token || !canAdd) return;
    setIsAdding(true);
    setError(null);
    try {
      const item = await createUnit(name.trim(), abbreviation.trim(), token);
      setItems((prev) => [...prev, item]);
      setName("");
      setAbbreviation("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <CatalogList
      title="Units of Measure"
      description="Buy in one unit, sell in another — e.g. a carton of 24 pieces."
      emptyLabel="No units yet — add your first one above."
      isLoading={isLoading}
      error={error}
      items={items.map((u) => ({ id: u.id, name: u.name, subtitle: u.abbreviation }))}
      formContent={
        <View style={{ gap: 0 }}>
          <TextField label="Name" placeholder="Piece" value={name} onChangeText={setName} />
          <View style={{ height: spacing.xs }} />
          <TextField label="Abbreviation" placeholder="pc" value={abbreviation} onChangeText={setAbbreviation} />
        </View>
      }
      onAdd={handleAdd}
      canAdd={canAdd}
      isAdding={isAdding}
      addLabel="Add Unit"
    />
  );
}
