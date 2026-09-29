import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart, Truck } from "lucide-react";
import { toast } from "sonner";
import Page, { btnPrimary } from "@/components/Page";
import useProduct from "@/hooks/useProduct";
import useMoney from "@/hooks/useMoney";
import useProducts from "@/hooks/useProducts";
import PriceTag from "@/components/Shop/PriceTag";
import Countdown from "@/components/Shop/Countdown";
import Stars from "@/components/Shop/Stars";
import Reviews from "@/components/Shop/Reviews";
import ProductCard from "@/components/ProductCard/ProductCard";
import useShopStore from "@/store/shopStore";
import useRecentStore from "@/store/recentStore";
import { isOnSale, deliveryRange } from "../../shared/settings";
import useCartStore from "@/store/cartStore";
import useWishlistStore from "@/store/wishlistStore";

export default function ProductDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const money = useMoney();
  const { product, loading } = useProduct(id);
  const [photo, setPhoto] = useState(0);
  const { products: all } = useProducts();
  const settings = useShopStore((s) => s.settings);
  const rating = useShopStore((s) => s.ratings[id]);
  const addRecent = useRecentStore((s) => s.add);

  useEffect(() => {
    setPhoto(0);
    if (id) addRecent(Number(id));
    window.scrollTo(0, 0);
  }, [id, addRecent]);
  const addToCart = useCartStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const liked = useWishlistStore((s) => s.items.some((p) => String(p.id) === String(id)));

  if (loading) return <Page><p className="text-center py-20">{t("common.loading")}</p></Page>;
  if (!product) return <Page><p className="text-center py-20">{t("product.notFound")}</p></Page>;

  const inStock = Number(product.stock) > 0;
  const similar = all
    .filter((p) => p.id !== product.id && (p.categories?.name || "") === (product.categories?.name || "") )
    .slice(0, 4);
  const photos = product.images?.length ? product.images : product.image ? [product.image] : [];

  async function handleAdd() {
    try {
      await addToCart(product.id);
      toast.success(t("product.addedToCart", { name: product.name }), {
        action: { label: t("product.viewCart"), onClick: () => navigate("/cart") },
      });
    } catch (err) {
      if (err.code === "LOGIN_REQUIRED") {
        toast.error(t("product.loginFirst"));
        navigate("/login", { state: { from: `/product/${product.id}` } });
      } else toast.error(t("common.error"));
    }
  }

  return (
    <Page width="max-w-7xl" back="/products" backLabel={t("nav.products")}>
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="bg-white rounded-xl flex items-center justify-center p-6 min-h-[320px]">
            <img src={photos[photo] || product.image} alt={product.name} className="max-h-[480px] max-w-full object-contain" />
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {photos.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setPhoto(i)}
                  className={`bg-white w-20 h-20 rounded-lg flex items-center justify-center shrink-0 border-2 ${i === photo ? "border-cyan-500" : "border-transparent"}`}
                >
                  <img src={url} alt="" className="max-h-full max-w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl sm:text-5xl font-bold">{product.name}</h1>
          {rating && <div className="mt-3"><Stars value={rating.avg} count={rating.count} size={18} /></div>}
          <div className="mt-4"><PriceTag product={product} size="lg" /></div>
          {isOnSale(product) && product.sale_ends_at && <div className="mt-2"><Countdown until={product.sale_ends_at} /></div>}
          <p className={inStock ? "text-green-400" : "text-red-400"}>
            {inStock ? t("product.inStock", { count: product.stock }) : t("product.outOfStock")}
          </p>

          <dl className="mt-6 space-y-2">
            {product.brands?.name && <div><dt className="inline font-bold">{t("product.brand")}: </dt><dd className="inline">{product.brands.name}</dd></div>}
            {product.categories?.name && <div><dt className="inline font-bold">{t("product.category")}: </dt><dd className="inline">{product.categories.name}</dd></div>}
            {product.sku && <div><dt className="inline font-bold">{t("product.sku")}: </dt><dd className="inline">{product.sku}</dd></div>}
          </dl>

          {inStock && (
            <div className="mt-6 flex items-start gap-3 text-gray-300">
              <Truck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">{t("product.delivery", deliveryRange(settings, i18n.language))}</div>
                {Number(settings.shipping?.free_over) > 0 && (
                  <div className="text-gray-400 text-sm">{t("product.freeShippingOver", { amount: money(settings.shipping.free_over) })}</div>
                )}
              </div>
            </div>
          )}

          <div className="mt-10 flex gap-3">
            <button onClick={handleAdd} disabled={!inStock} className={`${btnPrimary} flex-1 text-lg py-4`}>
              {inStock ? t("product.addToCart") : t("product.outOfStock")}
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              aria-label={liked ? t("product.removeFromWishlist") : t("product.addToWishlist")}
              className="border border-zinc-700 hover:bg-zinc-800 rounded-lg px-4"
            >
              <Heart className={`w-6 h-6 ${liked ? "fill-pink-500 text-pink-500" : "text-white"}`} />
            </button>
          </div>
        </div>
      </div>

      {product.description && (
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-6">{t("product.description")}</h2>
          <p className="text-gray-300 leading-8 whitespace-pre-line">{product.description}</p>
        </div>
      )}
      <Reviews productId={product.id} />

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="text-3xl font-bold mb-6">{t("product.similar")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </Page>
  );
}
