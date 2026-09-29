import { supabase } from "@/lib/supabase";

export async function getProduct(id) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      brands(name),
      categories(name)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}