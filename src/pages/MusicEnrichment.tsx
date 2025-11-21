import { useCallback, useEffect } from 'react';
import { ProcessingProvider, useProcessing } from '@/contexts/ProcessingContext';
import { BatchProcessingProvider } from '@/contexts/BatchProcessingContext';
import { ResultsProvider } from '@/contexts/ResultsContext';
import { WorkflowProvider, useWorkflow, WorkflowStep } from '@/contexts/WorkflowContext';
import { toast } from 'sonner';
import { 
  FileUpload, 
  ColumnMapper, 
  ProcessingPipeline, 
  DraggableQueueTable,
  EnrichmentProgress,
  EnrichedDataTable,
  WorkflowTabs,
  ActionButtons,
  ProcessingControl,
  ProcessingProgress,
  ProcessingLog,
  TitleExtractionResults,
  ValidationTable,
  ErrorLog
} from '@/components/music';

function MusicEnrichmentContent() {
  const { uploadFile, uploadState, progress, error, parsedData, fileName } = useProcessing();
  const { currentStep, completedSteps, goToStep, completeStep, canProceed, saveProgress } = useWorkflow();

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      await uploadFile(file);
    } catch (err) {
      toast.error('Erro ao processar arquivo');
    }
  }, [uploadFile]);

  useEffect(() => {
    if (uploadState === 'complete' && parsedData.length > 0 && !completedSteps.includes('upload')) {
      completeStep('upload');
      if (fileName) {
        saveProgress({ uploadedFileName: fileName });
      }
      toast.success(`${parsedData.length} músicas encontradas!`);
    }
  }, [uploadState, parsedData, completedSteps, completeStep, saveProgress, fileName]);

  const handleNext = useCallback(() => {
    if (!canProceed) {
      toast.error('Complete o passo atual antes de continuar');
      return;
    }
    
    const stepOrder: WorkflowStep[] = ['upload', 'mapping', 'processing', 'enrichment', 'results'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const nextStep = stepOrder[currentIndex + 1];
    
    if (nextStep) {
      goToStep(nextStep);
    }
  }, [canProceed, currentStep, goToStep]);

  const handleBack = useCallback(() => {
    const stepOrder: WorkflowStep[] = ['upload', 'mapping', 'processing', 'enrichment', 'results'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      goToStep(stepOrder[currentIndex - 1]);
    }
  }, [currentStep, goToStep]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Enriquecimento de Metadados Musicais</h1>
        <p className="text-muted-foreground">
          Sistema completo de processamento e enriquecimento de dados musicais
        </p>
      </div>

      <ProcessingPipeline 
        currentStep={currentStep} 
        completedSteps={completedSteps}
        onStepClick={goToStep}
      />

      <WorkflowTabs 
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepChange={goToStep}
      />

      <div className="min-h-[500px]">
        {currentStep === 'upload' && (
          <div className="space-y-4">
            <FileUpload 
              onFileSelect={handleFileSelect}
              isUploading={uploadState === 'uploading'}
              progress={progress}
              error={error}
            />
          </div>
        )}

        {currentStep === 'mapping' && (
          <div className="space-y-4">
            <ColumnMapper 
              detectedColumns={[]}
              onMappingComplete={() => {}}
              previewData={[]}
            />
          </div>
        )}

        {currentStep === 'processing' && (
          <div className="space-y-4">
            <TitleExtractionResults results={{
              totalSongs: 0,
              uniqueArtists: 0,
              duplicatesRemoved: 0,
              artists: []
            }} />
            <ValidationTable 
              entries={[]}
              onEdit={() => {}}
              onRemove={() => {}}
              onAutoFix={() => {}}
            />
            <ProcessingControl 
              isProcessing={false}
              isPaused={false}
              onStart={() => {}}
              onPause={() => {}}
              onResume={() => {}}
              onCancel={() => {}}
            />
            <ProcessingProgress 
              current={0}
              total={100}
              startTime={new Date()}
              status="idle"
            />
            <ProcessingLog entries={[]} />
          </div>
        )}

        {currentStep === 'enrichment' && (
          <div className="space-y-4">
            <DraggableQueueTable 
              queue={[]}
              onReorder={() => {}}
              onRemove={() => {}}
              onRetry={() => {}}
            />
            <EnrichmentProgress 
              completed={0}
              total={0}
              averageConfidence={0}
              successRate={0}
              apis={{
                youtube: false,
                gemini: false,
                perplexity: false
              }}
            />
            <ErrorLog 
              errors={[]}
              onRetry={() => {}}
              onRetryAll={() => {}}
            />
          </div>
        )}

        {currentStep === 'results' && (
          <div className="space-y-4">
            <EnrichedDataTable 
              songs={[]}
              onExport={() => {}}
            />
          </div>
        )}
      </div>

      <ActionButtons 
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        onCancel={() => {}}
        onExport={() => {}}
        onReset={() => {}}
        isProcessing={uploadState === 'uploading' || uploadState === 'processing'}
      />
    </div>
  );
}

export default function MusicEnrichment() {
  return (
    <WorkflowProvider>
      <ProcessingProvider>
        <BatchProcessingProvider>
          <ResultsProvider>
            <MusicEnrichmentContent />
          </ResultsProvider>
        </BatchProcessingProvider>
      </ProcessingProvider>
    </WorkflowProvider>
  );
}
