import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileMusic } from 'lucide-react';

interface Song {
  id: string;
  title: string;
}

interface SongSearchInputProps {
  songs: Song[];
  value: string;
  onChange: (songId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function SongSearchInput({
  songs,
  value,
  onChange,
  placeholder = "Selecione uma música...",
  disabled,
  isLoading
}: SongSearchInputProps) {
  return (
    <div className="space-y-2" data-tour="song-search">
      <Select 
        value={value} 
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <FileMusic className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {songs.map(song => (
            <SelectItem key={song.id} value={song.id}>
              <div className="flex items-center gap-2">
                <FileMusic className="h-4 w-4 text-muted-foreground" />
                {song.title}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
