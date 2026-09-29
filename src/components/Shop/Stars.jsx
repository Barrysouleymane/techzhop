import { Star } from "lucide-react";

/** ★★★★☆ (4.2) — pass value 0..5 */
export default function Stars({ value = 0, count, size = 16, onChange }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = value >= i - 0.25;
          const Tag = onChange ? "button" : "span";
          return (
            <Tag
              key={i}
              type={onChange ? "button" : undefined}
              onClick={onChange ? () => onChange(i) : undefined}
              aria-label={onChange ? `${i}` : undefined}
              className={onChange ? "p-0.5" : ""}
            >
              <Star style={{ width: size, height: size }} className={fill ? "fill-yellow-400 text-yellow-400" : "text-gray-500"} />
            </Tag>
          );
        })}
      </span>
      {count != null && <span className="text-gray-400 text-sm">({count})</span>}
    </span>
  );
}
