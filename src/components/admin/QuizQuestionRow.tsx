import { useState } from "react";
import { ChevronDown, ChevronRight, Edit, Trash2, Eye, EyeOff, Sparkles, Save, X, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { QuizOptionsTree } from "./QuizOptionsTree";
import { QuizQuestion } from "@/types/quiz.types";
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

interface QuizQuestionRowProps {
  question: QuizQuestion;
  onUpdate: (id: string, data: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onToggleActive: (id: string, active: boolean) => Promise<any>;
  onRefine: (id: string) => Promise<{ success: boolean; data?: any; original?: any }>;
}

export function QuizQuestionRow({ 
  question, 
  onUpdate, 
  onDelete, 
  onToggleActive,
  onRefine 
}: QuizQuestionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinementSuggestion, setRefinementSuggestion] = useState<any>(null);
  
  const [editData, setEditData] = useState({
    question: question.question,
    type: question.type,
    difficulty: question.difficulty,
    category: question.category,
    options: question.options || ['', '', '', ''],
    correct_answers: question.correctAnswers,
    matching_pairs: question.matchingPairs || [
      { left: '', right: '' },
      { left: '', right: '' },
      { left: '', right: '' },
      { left: '', right: '' },
    ],
    explanation: question.explanation || '',
  });

  const handleStartEdit = () => {
    setEditData({
      question: question.question,
      type: question.type,
      difficulty: question.difficulty,
      category: question.category,
      options: question.options || ['', '', '', ''],
      correct_answers: question.correctAnswers,
      matching_pairs: question.matchingPairs || [
        { left: '', right: '' },
        { left: '', right: '' },
        { left: '', right: '' },
        { left: '', right: '' },
      ],
      explanation: question.explanation || '',
    });
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setRefinementSuggestion(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(question.id, {
        question: editData.question,
        type: editData.type,
        difficulty: editData.difficulty,
        category: editData.category,
        options: editData.type === 'matching' ? undefined : editData.options,
        correct_answers: editData.correct_answers,
        matching_pairs: editData.type === 'matching' ? editData.matching_pairs : undefined,
        explanation: editData.explanation,
      });
      setIsEditing(false);
      setRefinementSuggestion(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      const result = await onRefine(question.id);
      if (result.success && result.data) {
        setRefinementSuggestion(result.data);
      }
    } finally {
      setIsRefining(false);
    }
  };

  const handleAcceptRefinement = () => {
    if (refinementSuggestion) {
      setEditData({
        ...editData,
        question: refinementSuggestion.question || editData.question,
        options: refinementSuggestion.options || editData.options,
        correct_answers: refinementSuggestion.correctAnswers || editData.correct_answers,
        explanation: refinementSuggestion.explanation || editData.explanation,
      });
      setRefinementSuggestion(null);
    }
  };

  const difficultyConfig = DIFFICULTIES.find(d => d.value === question.difficulty);
  const categoryConfig = CATEGORIES.find(c => c.value === question.category);
  const typeConfig = TYPES.find(t => t.value === question.type);

  return (
    <div className={cn(
      "border rounded-lg transition-all",
      isExpanded ? "shadow-md" : "hover:shadow-sm",
      !question.isActive && "opacity-60"
    )}>
      {/* Header Row */}
      <div className="p-4 flex items-start gap-3">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="mt-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
        </Collapsible>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <Badge variant="outline" className="text-xs">{question.id.slice(0, 8)}</Badge>
            <Badge className={cn("text-xs", difficultyConfig?.color)}>
              {difficultyConfig?.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {categoryConfig?.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {typeConfig?.label}
            </Badge>
            <Badge 
              variant={question.isActive ? "default" : "secondary"} 
              className="text-xs cursor-pointer"
              onClick={() => onToggleActive(question.id, !question.isActive)}
            >
              {question.isActive ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
          
          <p className="text-sm font-medium line-clamp-2">{question.question}</p>
          
          {!isExpanded && (
            <div className="mt-2">
              <QuizOptionsTree
                type={question.type}
                options={question.options}
                correctAnswers={question.correctAnswers}
                matchingPairs={question.matchingPairs}
              />
            </div>
          )}
        </div>

        <div className="flex gap-1.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleStartEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onToggleActive(question.id, !question.isActive)}
          >
            {question.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(question.id)}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Expanded Content */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <div className="border-t px-4 py-4 space-y-4 bg-muted/30">
            {isEditing ? (
              <>
                {/* Inline Edit Form */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={editData.type} onValueChange={(v: any) => setEditData({ ...editData, type: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Dificuldade</Label>
                    <Select value={editData.difficulty} onValueChange={(v: any) => setEditData({ ...editData, difficulty: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <Select value={editData.category} onValueChange={(v: any) => setEditData({ ...editData, category: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Pergunta</Label>
                  <Textarea 
                    value={editData.question}
                    onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                    rows={2}
                    className="mt-1"
                  />
                </div>

                {editData.type !== 'matching' && (
                  <div>
                    <Label className="text-xs">Opções (marque as corretas)</Label>
                    <div className="space-y-2 mt-1">
                      {editData.options.map((opt, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <Checkbox 
                            checked={editData.correct_answers.includes(opt)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEditData({ ...editData, correct_answers: [...editData.correct_answers, opt] });
                              } else {
                                setEditData({ ...editData, correct_answers: editData.correct_answers.filter(a => a !== opt) });
                              }
                            }}
                          />
                          <Input 
                            value={opt}
                            onChange={(e) => {
                              const oldValue = editData.options[i];
                              const newOpts = [...editData.options];
                              newOpts[i] = e.target.value;
                              // Update correct_answers if this was a correct answer
                              let newCorrect = editData.correct_answers;
                              if (editData.correct_answers.includes(oldValue)) {
                                newCorrect = editData.correct_answers.map(a => a === oldValue ? e.target.value : a);
                              }
                              setEditData({ ...editData, options: newOpts, correct_answers: newCorrect });
                            }}
                            placeholder={`Opção ${i + 1}`}
                            className="h-8"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editData.type === 'matching' && (
                  <div>
                    <Label className="text-xs">Pares de Relacionamento</Label>
                    <div className="space-y-2 mt-1">
                      {editData.matching_pairs.map((pair, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2">
                          <Input 
                            value={pair.left}
                            onChange={(e) => {
                              const newPairs = [...editData.matching_pairs];
                              newPairs[i] = { ...newPairs[i], left: e.target.value };
                              setEditData({ ...editData, matching_pairs: newPairs });
                            }}
                            placeholder="Esquerda"
                            className="h-8"
                          />
                          <Input 
                            value={pair.right}
                            onChange={(e) => {
                              const newPairs = [...editData.matching_pairs];
                              newPairs[i] = { ...newPairs[i], right: e.target.value };
                              setEditData({ ...editData, matching_pairs: newPairs });
                            }}
                            placeholder="Direita"
                            className="h-8"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs">Explicação</Label>
                  <Textarea 
                    value={editData.explanation}
                    onChange={(e) => setEditData({ ...editData, explanation: e.target.value })}
                    rows={2}
                    className="mt-1"
                  />
                </div>

                {/* Refinement Suggestion */}
                {refinementSuggestion && (
                  <div className="p-3 border border-primary/30 rounded-lg bg-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary">💡 Sugestão da IA</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setRefinementSuggestion(null)}>
                          Ignorar
                        </Button>
                        <Button size="sm" onClick={handleAcceptRefinement}>
                          <Check className="h-3 w-3 mr-1" />
                          Aplicar
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{refinementSuggestion.question}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={handleRefine} disabled={isRefining}>
                    {isRefining ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    Refinar IA
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                    Salvar
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Read-only expanded view */}
                <div>
                  <Label className="text-xs text-muted-foreground">Opções de Resposta</Label>
                  <QuizOptionsTree
                    type={question.type}
                    options={question.options}
                    correctAnswers={question.correctAnswers}
                    matchingPairs={question.matchingPairs}
                    defaultOpen={true}
                  />
                </div>
                
                {question.explanation && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Explicação</Label>
                    <p className="text-sm mt-1 p-2 bg-muted/50 rounded">{question.explanation}</p>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={handleStartEdit}>
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
