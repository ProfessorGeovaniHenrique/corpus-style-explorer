import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

interface UploadCorpusButtonProps {
  corpusType: 'gaucho' | 'nordestino';
}

export function UploadCorpusButton({ corpusType }: UploadCorpusButtonProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    setIsUploading(true);
    
    try {
      const projectBaseUrl = window.location.origin;
      
      toast.info(`Iniciando upload do corpus ${corpusType}...`);
      
      const { data, error } = await supabase.functions.invoke('upload-corpus-to-storage', {
        body: { corpusType, projectBaseUrl }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido no upload');
      }

      if (data.uploads && Array.isArray(data.uploads)) {
        // Multi-parte (gaúcho ou nordestino)
        const partsCount = data.uploads.length;
        const totalMB = data.totalSizeMB || (data.totalSize / 1024 / 1024).toFixed(2);
        toast.success(`Upload concluído! ${partsCount} arquivos, total: ${totalMB} MB`);
      } else {
        // Arquivo único (legado)
        const sizeMB = (data.fileSize / 1024 / 1024).toFixed(2);
        toast.success(`Upload concluído! Arquivo: ${sizeMB} MB`);
      }
      
    } catch (error) {
      console.error('Erro no upload:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao fazer upload';
      toast.error(`Erro: ${errorMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUpload}
      disabled={isUploading}
    >
      {isUploading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Fazendo upload...
        </>
      ) : (
        <>
          <Upload className="mr-2 h-4 w-4" />
          Upload {corpusType} para Storage
        </>
      )}
    </Button>
  );
}
