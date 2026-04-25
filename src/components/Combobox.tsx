import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { buttonVariants } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Label } from "./ui/label";
import { cn } from "./ui/utils";

export interface ComboboxItem {
  value: string;
  label: string;
  sub?: string;
  disabled?: boolean;
}

interface ComboboxProps {
  items: ComboboxItem[];
  value: string | null;
  onChange: (item: ComboboxItem | null) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}

export default function Combobox({
  items,
  value,
  onChange,
  label,
  placeholder = "Search or select...",
  searchPlaceholder = "Search...",
  emptyText = "No items found.",
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.value === value) ?? null,
    [items, value],
  );

  const isDisabled = disabled;

  return (
    <div className="grid gap-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full justify-between font-normal",
            )}
            disabled={isDisabled}
          >
            <span className="truncate text-left">
              {selectedItem ? selectedItem.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          portalled={false}
          side="bottom"
          align="start"
          className="z-[70] w-[var(--radix-popover-trigger-width)] p-0"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    keywords={[item.label, item.sub ?? "", item.value]}
                    disabled={item.disabled}
                    onSelect={() => {
                      onChange(item.value === value ? null : item);
                      setOpen(false);
                    }}
                    className="flex items-start gap-2 py-2"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{item.label}</span>
                      {item.sub && (
                        <span className="text-xs text-gray-500 truncate">
                          {item.sub}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 shrink-0",
                        value === item.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
