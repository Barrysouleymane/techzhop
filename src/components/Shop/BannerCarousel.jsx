import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Hero from "@/components/Hero/Hero";
import { API_URL } from "@/config/constants";

/** Banners managed in Admin → Banners. Falls back to the default hero. */
export default function BannerCarousel() {
  const [banners, setBanners] = useState(null);
  const [i, setI] = useState(0);

  useEffect(() => {
    axios.get(`${API_URL}/banners`).then((r) => setBanners(r.data.banners || [])).catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    if (!banners || banners.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % banners.length), 6000);
    return () => clearInterval(id);
  }, [banners]);

  if (banners === null) return <div className="h-[360px] bg-zinc-900" />;
  if (banners.length === 0) return <Hero />;

  const b = banners[i % banners.length];
  const go = (d) => setI((x) => (x + d + banners.length) % banners.length);
  const internal = b.link && b.link.startsWith("/");

  const cta = b.link && (
    internal ? (
      <Link to={b.link} className="inline-block mt-6 bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3 rounded-lg no-underline">{b.button_label || "Shop now"}</Link>
    ) : (
      <a href={b.link} className="inline-block mt-6 bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3 rounded-lg no-underline">{b.button_label || "Shop now"}</a>
    )
  );

  // Image-only banner (text already drawn in the picture): show it whole, all clickable
  const imageOnly = !b.title && !b.subtitle;
  const wrap = (children) =>
    !b.link ? children : internal ? <Link to={b.link} className="block">{children}</Link> : <a href={b.link} className="block">{children}</a>;

  return (
    <section className={`relative overflow-hidden bg-black ${imageOnly ? "" : "h-[300px] sm:h-[420px]"}`}>
      {imageOnly ? (
        wrap(<img key={b.id} src={b.image} alt={b.button_label || "TechZhop"} className="w-full h-auto block" />)
      ) : (
        <>
          <img key={b.id} src={b.image} alt={b.title || ""} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
          <div className="relative max-w-7xl mx-auto px-6 sm:px-10 h-full flex flex-col justify-center" style={{ color: "#fff" }}>
            {b.title && <h1 className="text-3xl sm:text-5xl font-extrabold max-w-2xl" style={{ color: "#fff" }}>{b.title}</h1>}
            {b.subtitle && <p className="mt-3 text-lg max-w-xl" style={{ color: "#e4e4e7" }}>{b.subtitle}</p>}
            {cta}
          </div>
        </>
      )}

      {banners.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2" style={{ background: "rgba(0,0,0,.5)" }}><ChevronLeft className="w-6 h-6" style={{ color: "#fff" }} /></button>
          <button onClick={() => go(1)} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2" style={{ background: "rgba(0,0,0,.5)" }}><ChevronRight className="w-6 h-6" style={{ color: "#fff" }} /></button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {banners.map((x, n) => (
              <button key={x.id} onClick={() => setI(n)} aria-label={`${n + 1}`} className="w-2.5 h-2.5 rounded-full" style={{ background: n === i % banners.length ? "#06b6d4" : "rgba(255,255,255,.5)" }} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
