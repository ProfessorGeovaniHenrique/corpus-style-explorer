import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";
import { INSIGNIAS_OPTIONS } from "@/data/types/cultural-insignia.types";

interface FilterInsigniaDropdownProps {
  selectedInsignias: string[];
  onInsigniasChange: (insignias: string[]) => void;
}

export function FilterInsigniaDropdown({
  selectedInsignias,
  onInsigniasChange,
}: FilterInsigniaDropdownProps) {
  const toggleInsignia = (insignia: string) => {
    if (selectedInsignias.includes(insignia)) {
      onInsigniasChange(selectedInsignias.filter(i => i !== insignia));
    } else {
      onInsigniasChange([...selectedInsignias, insignia]);
    }
  };

  const clearFilters = () => {
    onInsigniasChange([]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Insígnias Culturais
          {selectedInsignias.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedInsignias.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Filtrar por Insígnia</span>
          {selectedInsignias.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              Limpar
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {INSIGNIAS_OPTIONS.map(option => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selectedInsignias.includes(option.value)}
            onCheckedChange={() => toggleInsignia(option.value)}
          >
            <div className="flex flex-col">
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </div>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
