import { supabase } from "@/lib/supabase";

export async function getBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name");

  if (error) throw error;

  return data;
}