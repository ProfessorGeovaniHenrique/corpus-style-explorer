import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCw, Edit, Undo2, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SemanticTagset {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  nivel_profundidade: number | null;
  categoria_pai: string | null;
  validacoes_humanas: number | null;
  aprovado_em: string | null;
  status: string;
}

interface ValidatedTagsetsListProps {
  tagsets: SemanticTagset[];
  onEdit: (tagset: SemanticTagset) => void;
  onRevert: (tagset: SemanticTagset) => void;
  onRefresh: () => void;
}

const ITEMS_PER_PAGE = 20;

export function ValidatedTagsetsList({ tagsets, onEdit, onRevert, onRefresh }: ValidatedTagsetsListProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [nivelFilter, setNivelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"codigo" | "nome" | "aprovado_em">("codigo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const activeTagsets = useMemo(() => {
    return tagsets.filter(t => t.status === 'ativo');
  }, [tagsets]);

  const filteredTagsets = useMemo(() => {
    let filtered = [...activeTagsets];

    // Busca por código ou nome
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.codigo.toLowerCase().includes(term) || 
        t.nome.toLowerCase().includes(term)
      );
    }

    // Filtro por nível
    if (nivelFilter !== "all") {
      const nivel = parseInt(nivelFilter);
      filtered = filtered.filter(t => t.nivel_profundidade === nivel);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case "codigo":
          aVal = a.codigo;
          bVal = b.codigo;
          break;
        case "nome":
          aVal = a.nome;
          bVal = b.nome;
          break;
        case "aprovado_em":
          aVal = a.aprovado_em ? new Date(a.aprovado_em).getTime() : 0;
          bVal = b.aprovado_em ? new Date(b.aprovado_em).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [activeTagsets, searchTerm, nivelFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredTagsets.length / ITEMS_PER_PAGE);
  const paginatedTagsets = filteredTagsets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Código', 'Nome', 'Descrição', 'Nível', 'Categoria Pai', 'Validações', 'Aprovado em'],
      ...filteredTagsets.map(t => [
        t.codigo,
        t.nome,
        t.descricao || '',
        t.nivel_profundidade?.toString() || '',
        t.categoria_pai || '',
        t.validacoes_humanas?.toString() || '0',
        t.aprovado_em ? format(new Date(t.aprovado_em), 'dd/MM/yyyy', { locale: ptBR }) : ''
      ])
    ];

    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dominios-validados-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast({
      title: "CSV Exportado",
      description: `${filteredTagsets.length} domínios exportados com sucesso.`,
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Domínios Semânticos Validados</CardTitle>
            <CardDescription>
              {filteredTagsets.length} {filteredTagsets.length === 1 ? 'domínio aprovado' : 'domínios aprovados'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Busca e Filtros */}
        <div className="flex gap-4 mb-6">
          <Input 
            placeholder="Buscar código ou nome..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
          <Select value={nivelFilter} onValueChange={(value) => {
            setNivelFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="1">Nível 1</SelectItem>
              <SelectItem value="2">Nível 2</SelectItem>
              <SelectItem value="3">Nível 3</SelectItem>
              <SelectItem value="4">Nível 4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => handleSort('codigo')}
                >
                  <div className="flex items-center gap-2">
                    Código
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => handleSort('nome')}
                >
                  <div className="flex items-center gap-2">
                    Nome
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Categoria Pai</TableHead>
                <TableHead className="text-center">Validações</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => handleSort('aprovado_em')}
                >
                  <div className="flex items-center gap-2">
                    Aprovado em
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTagsets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum domínio validado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTagsets.map(tagset => (
                  <TableRow key={tagset.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {tagset.codigo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[300px]">
                      <div className="truncate" title={tagset.nome}>
                        {tagset.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        Nível {tagset.nivel_profundidade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tagset.categoria_pai || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {tagset.validacoes_humanas || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(tagset.aprovado_em)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onEdit(tagset)}
                          title="Editar domínio"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onRevert(tagset)}
                          title="Desfazer validação"
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredTagsets.length)} de {filteredTagsets.length}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-2 text-sm">
                Página {currentPage} de {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
