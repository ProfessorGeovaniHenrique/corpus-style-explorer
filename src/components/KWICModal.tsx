import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface KWICData {
  leftContext: string;
  keyword: string;
  rightContext: string;
  source: string;
}

interface KWICModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  word: string;
  data: KWICData[];
}

export function KWICModal({ open, onOpenChange, word, data }: KWICModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Concordância para a palavra: <span className="text-primary">{word}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">Contexto Esquerdo</TableHead>
                <TableHead className="w-[10%] text-center">Palavra-Chave</TableHead>
                <TableHead className="w-[35%]">Contexto Direito</TableHead>
                <TableHead className="w-[20%]">Fonte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="text-right text-muted-foreground">
                    {row.leftContext}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-primary">
                    {row.keyword}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.rightContext}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground italic">
                    {row.source}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
