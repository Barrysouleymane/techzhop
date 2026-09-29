import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchBar() {
  return (
    <div className="flex flex-1 max-w-2xl mx-6">
      <Input
        placeholder="Search products..."
        className="rounded-r-none"
      />

      <Button className="rounded-l-none">
        <Search className="w-5 h-5" />
      </Button>
    </div>
  );
}