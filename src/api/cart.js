import { supabase } from "@/lib/supabase";

export async function addToCart(productId) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("USER:", user);
  console.log("USER ERROR:", userError);
  console.log("PRODUCT ID:", productId);

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("Please login first.");
  }

  // Check if this product is already in the user's cart
  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  console.log("EXISTING:", existing);
  console.log("EXISTING ERROR:", existingError);

  if (existingError) {
    throw existingError;
  }

  // Product already in cart → increase quantity
  if (existing) {
    const {
      data,
      error,
    } = await supabase
      .from("cart_items")
      .update({
        quantity: existing.quantity + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select();

    console.log("UPDATE DATA:", data);
    console.log("UPDATE ERROR:", error);

    if (error) {
      throw error;
    }

    return data;
  }

  // Product not in cart → create cart item
  const {
    data,
    error,
  } = await supabase
    .from("cart_items")
    .insert({
      user_id: user.id,
      product_id: productId,
      quantity: 1,
    })
    .select();

  console.log("INSERT DATA:", data);
  console.log("INSERT ERROR:", error);

  if (error) {
    throw error;
  }

  return data;
}

export async function getCart() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("CART USER:", user);
  console.log("CART USER ERROR:", userError);

  if (userError) {
    throw userError;
  }

  if (!user) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from("cart_items")
    .select(`
      *,
      products (
        id,
        name,
        price,
        image
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  console.log("CART DATA:", data);
  console.log("CART ERROR:", error);

  if (error) {
    throw error;
  }

  return data;
}