// 📋 Developer Logs - Exportações centralizadas

export {
  constructionLog,
  projectStats,
  getPhaseByName,
  getCompletedPhases,
  getInProgressPhases,
  getAllScientificReferences,
  getMetricEvolution,
  type ConstructionPhase,
  type TechnicalDecision,
  type Artifact,
  type Metrics,
  type ScientificReference
} from './construction-log';

export {
  scientificChangelog,
  scientificStats,
  methodologies,
  fullReferences,
  getVersionByNumber,
  getLatestVersion,
  getAccuracyEvolution,
  getAllConcepts,
  getReferenceByKey,
  type ScientificChangelog,
  type ScientificAdvance
} from './changelog-scientific';

export {
  backendBugs,
  frontendBugs,
  architectureBugs,
  refactoringStrategy,
  executiveSummary,
  actionPlan,
  validationChecklist,
  type BugReport,
  type RefactoringStrategy
} from './audit-report-2024-11';

export {
  corrections,
  summaryMetrics,
  nextSteps,
  type Correction
} from './changelog-corrections-nov2024';

export {
  productVision,
  personas,
  mvpEpics,
  postMvpEpics,
  v2Epics,
  futureProspects,
  mvpMetrics,
  immediatePriorities,
  type Epic,
  type Story,
  type Persona,
  type FutureProspect
} from './product-roadmap';

export {
  tools,
  ecosystemMetrics,
  getToolById,
  getToolsByCategory,
  getProductionTools,
  getToolEvolutionData,
  getAllReferences,
  type Tool
} from './tools-methodologies';
