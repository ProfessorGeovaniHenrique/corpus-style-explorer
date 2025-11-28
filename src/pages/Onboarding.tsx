import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, Wrench, FlaskConical, ArrowRight, 
  ArrowLeft, Check, Database, BarChart3 
} from "lucide-react";
import logoVersoAustral from "@/assets/logo-versoaustral-completo.png";

const onboardingSteps = [
  {
    id: 1,
    title: "Bem-vindo ao VersoAustral!",
    description: "Uma plataforma de Estilística de Corpus para análise linguística profunda",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <img src={logoVersoAustral} alt="VersoAustral" className="h-24 mx-auto" />
        <p className="text-center text-lg">
          Explore a riqueza lexical da cultura gaúcha através de análises computacionais avançadas.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <Database className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-semibold">Corpus Rico</p>
          </div>
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <Wrench className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-semibold">Ferramentas Avançadas</p>
          </div>
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-semibold">Visualizações</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Orientação Rápida",
    description: "Conheça as 3 áreas principais da plataforma",
    icon: BarChart3,
    content: (
      <div className="space-y-4">
        <p className="text-center mb-6">A plataforma está organizada em 3 abas principais:</p>
        <div className="space-y-3">
          <div className="p-4 border-l-4 border-primary bg-primary/5 rounded-r-lg">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="font-semibold">Apresentação</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Demonstração com corpus pré-carregado. Explore domínios semânticos, estatísticas e visualizações interativas.
            </p>
          </div>
          <div className="p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-r-lg">
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <p className="font-semibold">Ferramentas</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Suite profissional: KWIC, Keywords, Wordlist, N-grams e Dispersão. Requer login para salvar análises.
            </p>
          </div>
          <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-r-lg">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <p className="font-semibold">Subcorpus</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Crie e compare subcorpus específicos por artista, região ou conjunto.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Pronto para começar!",
    description: "Escolha como deseja explorar a plataforma",
    icon: Check,
    content: (
      <div className="space-y-6 text-center">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">Tudo pronto!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Você pode começar com um tour rápido de 30 segundos ou explorar a plataforma por conta própria.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button size="lg" className="gap-2" onClick={() => {
            localStorage.setItem('onboarding_completed', 'true');
            localStorage.setItem('show_quick_tour', 'true');
            window.location.href = '/dashboard-mvp-definitivo';
          }}>
            <Sparkles className="w-5 h-5" />
            Ver demo rápida (30s)
          </Button>
          <Button variant="outline" size="lg" className="gap-2" onClick={() => {
            localStorage.setItem('onboarding_completed', 'true');
            window.location.href = '/dashboard-mvp-definitivo';
          }}>
            <ArrowRight className="w-5 h-5" />
            Explorar sozinho
          </Button>
        </div>
      </div>
    ),
  },
];

import { useAnalytics } from '@/hooks/useAnalytics';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { trackOnboardingStep } = useAnalytics();
  
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const step = onboardingSteps[currentStep];
  const Icon = step.icon;
  
  useEffect(() => {
    trackOnboardingStep(currentStep + 1, step.title, 'view');
  }, [currentStep, trackOnboardingStep]);
  
  const handleNext = () => {
    trackOnboardingStep(currentStep + 1, step.title, 'complete');
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/dashboard-mvp-definitivo');
  };
  
  const handleSkip = () => {
    trackOnboardingStep(currentStep + 1, step.title, 'skip');
    handleComplete();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardContent className="p-8">
          {/* Header com Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Passo {currentStep + 1} de {onboardingSteps.length}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Pular Tutorial
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Conteúdo Animado */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[400px]"
            >
              <h2 className="text-3xl font-bold mb-2">{step.title}</h2>
              <p className="text-muted-foreground mb-6">{step.description}</p>
              
              <div className="py-4">
                {step.content}
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Navegação */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            
            <div className="flex gap-2">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-primary' 
                      : index < currentStep 
                        ? 'bg-primary/50' 
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <Button onClick={handleNext}>
              {currentStep === onboardingSteps.length - 1 ? (
                <>
                  Começar
                  <Check className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
