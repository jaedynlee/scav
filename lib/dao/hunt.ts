import type {
  Hunt,
} from "@/lib/models/types";
import { supabase } from "@/app/supabaseClient";
import { toSnakeCase, keysToCamel } from "@/lib/utils/casing";

export class HuntDAO {
  async createHunt({ name, description }: { name: string, description?: string }): Promise<Hunt> {
    const { data, error } = await supabase
      .from("hunts")
      .insert(toSnakeCase({ name, description, status: "draft" }))
      .select("*")
      .single();
    if (error) throw error;
    return keysToCamel<Hunt>(data);
  }

  async getHunt(id: string): Promise<Hunt | null> {
    const { data, error } = await supabase
      .from("hunts")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }
    return keysToCamel<Hunt>(data);
  }

  async getAllHunts(): Promise<Hunt[]> {
    const { data, error } = await supabase.from("hunts").select("*");
    if (error) throw error;
    return keysToCamel<Hunt[]>(data ?? []);
  }

  async updateHunt(id: string, updates: Partial<Hunt>): Promise<Hunt> {
    const { data, error } = await supabase
      .from("hunts")
      .update(toSnakeCase(updates))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return keysToCamel<Hunt>(data);
  }

  async deleteHunt(id: string): Promise<void> {
    const { error } = await supabase.from("hunts").delete().eq("id", id);
    if (error) throw error;
  }
}

export const huntDAO = new HuntDAO();
