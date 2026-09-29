export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 py-10 text-center text-gray-400">
      <h2 className="text-xl font-bold text-cyan-400">
        TECHZHOP
      </h2>

      <p className="mt-2">
        Modern Electronics Marketplace
      </p>

      <p className="mt-4 text-sm">
        © {new Date().getFullYear()} TechZhop. All rights reserved.
      </p>
    </footer>
  );
}