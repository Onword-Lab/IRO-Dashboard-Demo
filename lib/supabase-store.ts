// Generic JSON-row store for Supabase. Each table is (id text pk, data jsonb,
// created_at timestamptz, updated_at timestamptz). We persist the whole domain
// object in `data`, which keeps the migration robust (no per-field column
// mapping) and easy to evolve. Domain stores delegate here when Supabase is on.
import { supabase } from "./supabase";

export interface JsonRow {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export function jsonStore<T extends JsonRow>(table: string) {
  return {
    async list(newestFirst = true): Promise<T[]> {
      const { data, error } = await supabase()
        .from(table)
        .select("data")
        .order("created_at", { ascending: !newestFirst });
      if (error) throw new Error(`supabase ${table} list: ${error.message}`);
      return (data ?? []).map((r: any) => r.data as T);
    },
    async get(id: string): Promise<T | undefined> {
      const { data, error } = await supabase().from(table).select("data").eq("id", id).maybeSingle();
      if (error) throw new Error(`supabase ${table} get: ${error.message}`);
      return (data?.data as T) ?? undefined;
    },
    async insert(row: T): Promise<T> {
      const { error } = await supabase().from(table).insert({
        id: row.id,
        data: row,
        created_at: row.createdAt ?? new Date().toISOString(),
        updated_at: row.updatedAt ?? new Date().toISOString(),
      });
      if (error) throw new Error(`supabase ${table} insert: ${error.message}`);
      return row;
    },
    async update(id: string, row: T): Promise<T> {
      const { error } = await supabase()
        .from(table)
        .update({ data: row, updated_at: row.updatedAt ?? new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(`supabase ${table} update: ${error.message}`);
      return row;
    },
    async remove(id: string): Promise<boolean> {
      const { error } = await supabase().from(table).delete().eq("id", id);
      if (error) throw new Error(`supabase ${table} remove: ${error.message}`);
      return true;
    },
  };
}
