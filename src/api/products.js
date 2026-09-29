import { supabase } from "@/lib/supabase";

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      brands(name, logo),
      categories(name)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  console.log("Products:", data);
  console.log("Error:", error);

  if (error) {
    throw error;
  }

  return data;
}

export async function getProduct(id) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      brands(name, logo),
      categories(name)
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}