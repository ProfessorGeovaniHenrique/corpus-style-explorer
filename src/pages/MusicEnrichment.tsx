import { ProcessingProvider } from '@/contexts/ProcessingContext';
import { BatchProcessingProvider } from '@/contexts/BatchProcessingContext';
import { ResultsProvider } from '@/contexts/ResultsContext';
import { WorkflowProvider, useWorkflow } from '@/contexts/WorkflowContext';
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
  const { currentStep, completedSteps, goToStep, canProceed } = useWorkflow();

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
              onFileSelect={() => {}}
              isUploading={false}
              progress={0}
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
        onNext={() => {}}
        onBack={() => {}}
        onCancel={() => {}}
        onExport={() => {}}
        onReset={() => {}}
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
