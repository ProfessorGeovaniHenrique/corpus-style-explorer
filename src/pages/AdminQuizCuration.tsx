import { useState } from "react";
import { useQuizQuestions } from "@/hooks/useQuizQuestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, RefreshCw, Filter, X } from "lucide-react";
import { QuizQuestionRow } from "@/components/admin/QuizQuestionRow";
import { QuizQuestionInput } from "@/hooks/useQuizQuestions";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: 'introducao', label: 'Introdução' },
  { value: 'aprendizado', label: 'Aprendizado' },
  { value: 'origens', label: 'Origens' },
  { value: 'instrumentos', label: 'Instrumentos' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Fácil', color: 'bg-green-500' },
  { value: 'medium', label: 'Médio', color: 'bg-yellow-500' },
  { value: 'hard', label: 'Difícil', color: 'bg-red-500' },
];

const TYPES = [
  { value: 'objective', label: 'Múltipla Escolha' },
  { value: 'checkbox', label: 'Múltiplas Respostas' },
  { value: 'matching', label: 'Relacionar' },
];

export default function AdminQuizCuration() {
  const { questions, loading, fetchQuestions, createQuestion, updateQuestion, deleteQuestion, toggleActive, refineWithAI } = useQuizQuestions();
  
  const [filters, setFilters] = useState({
    category: [] as string[],
    difficulty: [] as string[],
    active: undefined as boolean | undefined,
    searchText: '',
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<QuizQuestionInput>>({
    question_id: '',
    type: 'objective',
    difficulty: 'easy',
    category: 'introducao',
    question: '',
    options: ['', '', '', ''],
    correct_answers: [],
    matching_pairs: [
      { left: '', right: '' },
      { left: '', right: '' },
      { left: '', right: '' },
      { left: '', right: '' },
    ],
    explanation: '',
  });

  const filteredQuestions = questions.filter(q => {
    if (filters.category.length > 0 && !filters.category.includes(q.category)) return false;
    if (filters.difficulty.length > 0 && !filters.difficulty.includes(q.difficulty)) return false;
    if (filters.active !== undefined && q.isActive !== filters.active) return false;
    if (filters.searchText && !q.question.toLowerCase().includes(filters.searchText.toLowerCase())) return false;
    return true;
  });

  const handleCreateNew = () => {
    setFormData({
      question_id: `custom-${Date.now()}`,
      type: 'objective',
      difficulty: 'easy',
      category: 'introducao',
      question: '',
      options: ['', '', '', ''],
      correct_answers: [],
      matching_pairs: [
        { left: '', right: '' },
        { left: '', right: '' },
        { left: '', right: '' },
        { left: '', right: '' },
      ],
      explanation: '',
    });
    setIsCreateOpen(true);
  };

  const handleSaveNew = async () => {
    if (!formData.question || !formData.question_id) return;

    const input: QuizQuestionInput = {
      question_id: formData.question_id!,
      type: formData.type!,
      difficulty: formData.difficulty!,
      category: formData.category!,
      question: formData.question,
      options: formData.type === 'matching' ? undefined : formData.options,
      correct_answers: formData.correct_answers!,
      matching_pairs: formData.type === 'matching' ? formData.matching_pairs : undefined,
      explanation: formData.explanation,
    };

    await createQuestion(input);
    setIsCreateOpen(false);
  };

  const toggleCategoryFilter = (cat: string) => {
    if (filters.category.includes(cat)) {
      setFilters({ ...filters, category: filters.category.filter(c => c !== cat) });
    } else {
      setFilters({ ...filters, category: [...filters.category, cat] });
    }
  };

  const toggleDifficultyFilter = (diff: string) => {
    if (filters.difficulty.includes(diff)) {
      setFilters({ ...filters, difficulty: filters.difficulty.filter(d => d !== diff) });
    } else {
      setFilters({ ...filters, difficulty: [...filters.difficulty, diff] });
    }
  };

  const clearFilters = () => {
    setFilters({ category: [], difficulty: [], active: undefined, searchText: '' });
  };

  const hasActiveFilters = filters.category.length > 0 || filters.difficulty.length > 0 || filters.active !== undefined || filters.searchText;

  // Stats
  const stats = {
    total: questions.length,
    active: questions.filter(q => q.isActive).length,
    byCategory: CATEGORIES.map(c => ({
      ...c,
      count: questions.filter(q => q.category === c.value).length,
    })),
    byDifficulty: DIFFICULTIES.map(d => ({
      ...d,
      count: questions.filter(q => q.difficulty === d.value).length,
    })),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Curadoria do Quiz</h1>
          <p className="text-muted-foreground">
            {stats.total} perguntas ({stats.active} ativas)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchQuestions()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Pergunta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Pergunta</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Dificuldade</Label>
                    <Select value={formData.difficulty} onValueChange={(v: any) => setFormData({ ...formData, difficulty: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select value={formData.category} onValueChange={(v: any) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Pergunta</Label>
                  <Textarea 
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    rows={3}
                  />
                </div>

                {formData.type !== 'matching' && (
                  <div>
                    <Label>Opções (marque as corretas)</Label>
                    {formData.options?.map((opt, i) => (
                      <div key={i} className="flex gap-2 mt-2 items-center">
                        <Checkbox 
                          checked={formData.correct_answers?.includes(opt)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, correct_answers: [...(formData.correct_answers || []), opt] });
                            } else {
                              setFormData({ ...formData, correct_answers: formData.correct_answers?.filter(a => a !== opt) });
                            }
                          }}
                        />
                        <Input 
                          value={opt}
                          onChange={(e) => {
                            const oldValue = formData.options?.[i] || '';
                            const newOpts = [...(formData.options || [])];
                            newOpts[i] = e.target.value;
                            let newCorrect = formData.correct_answers || [];
                            if (newCorrect.includes(oldValue)) {
                              newCorrect = newCorrect.map(a => a === oldValue ? e.target.value : a);
                            }
                            setFormData({ ...formData, options: newOpts, correct_answers: newCorrect });
                          }}
                          placeholder={`Opção ${i + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {formData.type === 'matching' && (
                  <div>
                    <Label>Pares de Relacionamento</Label>
                    {formData.matching_pairs?.map((pair, i) => (
                      <div key={i} className="grid grid-cols-2 gap-2 mt-2">
                        <Input 
                          value={pair.left}
                          onChange={(e) => {
                            const newPairs = [...(formData.matching_pairs || [])];
                            newPairs[i] = { ...newPairs[i], left: e.target.value };
                            setFormData({ ...formData, matching_pairs: newPairs });
                          }}
                          placeholder="Esquerda"
                        />
                        <Input 
                          value={pair.right}
                          onChange={(e) => {
                            const newPairs = [...(formData.matching_pairs || [])];
                            newPairs[i] = { ...newPairs[i], right: e.target.value };
                            setFormData({ ...formData, matching_pairs: newPairs });
                          }}
                          placeholder="Direita"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <Label>Explicação</Label>
                  <Textarea 
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSaveNew}>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.byCategory.map(cat => (
          <Card 
            key={cat.value} 
            className={cn(
              "cursor-pointer transition-all",
              filters.category.includes(cat.value) && "ring-2 ring-primary"
            )}
            onClick={() => toggleCategoryFilter(cat.value)}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{cat.count}</div>
              <div className="text-sm text-muted-foreground">{cat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input 
                placeholder="Buscar por texto..."
                value={filters.searchText}
                onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              />
            </div>
            
            <div className="flex gap-1">
              {DIFFICULTIES.map(diff => (
                <Badge 
                  key={diff.value}
                  variant={filters.difficulty.includes(diff.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer",
                    filters.difficulty.includes(diff.value) && diff.color
                  )}
                  onClick={() => toggleDifficultyFilter(diff.value)}
                >
                  {diff.label} ({stats.byDifficulty.find(d => d.value === diff.value)?.count})
                </Badge>
              ))}
            </div>

            <div className="flex gap-1">
              <Badge 
                variant={filters.active === true ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilters({ ...filters, active: filters.active === true ? undefined : true })}
              >
                Ativas ({stats.active})
              </Badge>
              <Badge 
                variant={filters.active === false ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilters({ ...filters, active: filters.active === false ? undefined : false })}
              >
                Inativas ({stats.total - stats.active})
              </Badge>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhuma pergunta encontrada com os filtros selecionados.
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map(q => (
            <QuizQuestionRow
              key={q.id}
              question={q}
              onUpdate={updateQuestion}
              onDelete={deleteQuestion}
              onToggleActive={toggleActive}
              onRefine={refineWithAI}
            />
          ))
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando {filteredQuestions.length} de {questions.length} perguntas
        </p>
      )}
    </div>
  );
}
