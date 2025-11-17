import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { INSIGNIAS_OPTIONS } from "@/data/types/cultural-insignia.types";

interface MultiSelectInsigniasProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function MultiSelectInsignias({ value, onChange }: MultiSelectInsigniasProps) {
  const toggleInsignia = (insignia: string) => {
    if (value.includes(insignia)) {
      onChange(value.filter(i => i !== insignia));
    } else {
      onChange([...value, insignia]);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Insígnias Culturais (opcional)</Label>
      <p className="text-xs text-muted-foreground mb-2">
        Marque as identidades regionais/étnicas associadas aos exemplos deste tagset
      </p>
      <div className="grid grid-cols-2 gap-2">
        {INSIGNIAS_OPTIONS.map(option => (
          <div key={option.value} className="flex items-start space-x-2 p-2 border rounded-md hover:bg-accent/20">
            <Checkbox
              id={option.value}
              checked={value.includes(option.value)}
              onCheckedChange={() => toggleInsignia(option.value)}
            />
            <div className="flex-1">
              <label
                htmlFor={option.value}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option.label}
              </label>
              <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
            </div>
          </div>
        ))}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {value.map(insignia => {
            const opt = INSIGNIAS_OPTIONS.find(o => o.value === insignia);
            return opt ? <Badge key={insignia} variant="secondary">{opt.label}</Badge> : null;
          })}
        </div>
      )}
    </div>
  );
}
