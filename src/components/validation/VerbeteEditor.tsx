import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Check, X, Save, FileText } from 'lucide-react';
import { notifications } from '@/lib/notifications';
import type { DictionaryEntry } from '@/hooks/useDictionaryValidation';

interface VerbeteEditorProps {
  entry: DictionaryEntry;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, notes?: string) => Promise<void>;
  onSave: (id: string, data: Partial<DictionaryEntry>) => Promise<void>;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigate: { prev: boolean; next: boolean };
}

export function VerbeteEditor({
  entry,
  onApprove,
  onReject,
  onSave,
  onNavigate,
  canNavigate,
}: VerbeteEditorProps) {
  const [editedVerbete, setEditedVerbete] = useState(entry.verbete);
  const [editedClasse, setEditedClasse] = useState(entry.classe_gramatical || '');
  const [editedDefinicoes, setEditedDefinicoes] = useState(
    JSON.stringify(entry.definicoes, null, 2)
  );
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when entry changes
  useEffect(() => {
    setEditedVerbete(entry.verbete);
    setEditedClasse(entry.classe_gramatical || '');
    setEditedDefinicoes(JSON.stringify(entry.definicoes, null, 2));
    setRejectionNotes('');
  }, [entry.id]);

  const hasChanges = 
    editedVerbete !== entry.verbete ||
    editedClasse !== (entry.classe_gramatical || '') ||
    editedDefinicoes !== JSON.stringify(entry.definicoes, null, 2);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      if (hasChanges) {
        await handleSave();
      }
      await onApprove(entry.id);
      notifications.success('Verbete aprovado com sucesso!');
    } catch (error) {
      notifications.error('Erro ao aprovar verbete');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject(entry.id, rejectionNotes);
      notifications.success('Verbete rejeitado');
    } catch (error) {
      notifications.error('Erro ao rejeitar verbete');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      let parsedDefinicoes;
      try {
        parsedDefinicoes = JSON.parse(editedDefinicoes);
      } catch {
        throw new Error('JSON de definições inválido');
      }

      await onSave(entry.id, {
        verbete: editedVerbete,
        classe_gramatical: editedClasse,
        definicoes: parsedDefinicoes,
      });
      notifications.success('Alterações salvas!');
    } catch (error) {
      notifications.error(error instanceof Error ? error.message : 'Erro ao salvar');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header with original data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Entrada Original (Referência)
              </CardTitle>
              <CardDescription>
                Dados brutos extraídos do dicionário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="rounded-md bg-muted p-4 text-xs overflow-x-auto">
                {JSON.stringify(entry.raw_data || entry, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Edit form */}
          <Card>
            <CardHeader>
              <CardTitle>Editar Verbete</CardTitle>
              <CardDescription>
                Faça as correções necessárias ou aprove se estiver correto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verbete">Verbete</Label>
                <Input
                  id="verbete"
                  value={editedVerbete}
                  onChange={(e) => setEditedVerbete(e.target.value)}
                  placeholder="Digite o verbete"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classe">Classe Gramatical</Label>
                <Input
                  id="classe"
                  value={editedClasse}
                  onChange={(e) => setEditedClasse(e.target.value)}
                  placeholder="Ex: s.m., adj., v.t."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="definicoes">Definições (JSON)</Label>
                <Textarea
                  id="definicoes"
                  value={editedDefinicoes}
                  onChange={(e) => setEditedDefinicoes(e.target.value)}
                  placeholder='[{"numero": 1, "texto": "..."}]'
                  className="font-mono text-xs min-h-[200px]"
                />
              </div>

              {hasChanges && (
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                  Alterações pendentes
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Rejection notes */}
          {entry.validation_status === 'rejected' && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Notas de Rejeição</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Motivo da rejeição (opcional)"
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 border-t bg-background p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Navigation */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('prev')}
              disabled={!canNavigate.prev || isSubmitting}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('next')}
              disabled={!canNavigate.next || isSubmitting}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" />
              Rejeitar
            </Button>

            {hasChanges && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="h-4 w-4 mr-1" />
              Aprovar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
