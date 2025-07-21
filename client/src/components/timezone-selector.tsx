import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCommonTimezones, formatTimezoneForDisplay } from "@/lib/timezone-utils";

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  compact?: boolean;
}

export function TimezoneSelector({ value, onChange, compact = false }: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const timezones = useMemo(() => getCommonTimezones(), []);

  const filteredTimezones = useMemo(() => {
    if (!searchValue) return timezones;
    
    return timezones.filter(tz =>
      tz.value.toLowerCase().includes(searchValue.toLowerCase()) ||
      tz.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      tz.city.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [timezones, searchValue]);

  const selectedTimezone = timezones.find(tz => tz.value === value);

  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={open}
            className="justify-between max-w-[200px]"
          >
            <span className="truncate">
              {selectedTimezone ? selectedTimezone.label : "Select timezone"}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <Command>
            <CommandInput 
              placeholder="Search timezones..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No timezone found.</CommandEmpty>
              <CommandGroup>
                {filteredTimezones.map((timezone) => (
                  <CommandItem
                    key={timezone.value}
                    value={timezone.value}
                    onSelect={() => {
                      onChange(timezone.value);
                      setOpen(false);
                      setSearchValue("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === timezone.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-3 w-full">
                      {timezone.flag && <span className="text-xl">{timezone.flag}</span>}
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{timezone.city}</span>
                          {timezone.country && <span className="text-xs text-muted-foreground">{timezone.country}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{timezone.offset}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center">
            {selectedTimezone?.flag ? (
              <span className="mr-2 text-lg">{selectedTimezone.flag}</span>
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            <span className="truncate">
              {selectedTimezone ? `${selectedTimezone.city} (${selectedTimezone.offset})` : "Select Timezone"}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search timezones..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {filteredTimezones.map((timezone) => (
                <CommandItem
                  key={timezone.value}
                  value={timezone.value}
                  onSelect={() => {
                    onChange(timezone.value);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === timezone.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-3 w-full">
                    {timezone.flag && <span className="text-xl">{timezone.flag}</span>}
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{timezone.city}</span>
                        {timezone.country && <span className="text-xs text-muted-foreground">{timezone.country}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{timezone.offset}</span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
