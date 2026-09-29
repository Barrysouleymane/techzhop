import { User } from "lucide-react";
import { Link } from "react-router-dom";

export default function UserMenu() {
  return (
    <Link
      to="/account"
      className="flex items-center gap-2 hover:text-cyan-400 transition"
    >
      <User className="w-6 h-6" />
      <span>Account</span>
    </Link>
  );
}