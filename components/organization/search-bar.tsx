import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchBarProps = {
  tab: string;
  defaultValue: string;
  placeholder: string;
};

export function SearchBar({ tab, defaultValue, placeholder }: SearchBarProps) {
  return (
    <form className="flex w-full gap-2 sm:max-w-md">
      <input type="hidden" name="tab" value={tab} />
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="pl-8"
        />
      </div>
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}
