import { supabase } from "@/lib/supabase";

async function currentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function getCart() {
  const user = await currentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("cart_items")
    .select("*, products (*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addToCart(productId) {
  const user = await currentUser();
  if (!user) {
    const err = new Error("LOGIN_REQUIRED");
    err.code = "LOGIN_REQUIRED";
    throw err;
  }

  const { data: existing, error: existingError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    return setCartQuantity(existing.id, existing.quantity + 1);
  }

  const { error } = await supabase
    .from("cart_items")
    .insert({ user_id: user.id, product_id: productId, quantity: 1 });

  if (error) throw error;
}

export async function setCartQuantity(itemId, quantity) {
  if (quantity < 1) return removeFromCart(itemId);

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) throw error;
}

export async function removeFromCart(itemId) {
  const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
  if (error) throw error;
}
