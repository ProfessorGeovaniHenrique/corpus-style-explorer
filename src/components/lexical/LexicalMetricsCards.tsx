/**
 * LexicalMetricsCards
 * Sprint AUD-C1: Grid of 4 metrics cards for lexical profile
 */

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LexicalProfile } from "@/data/types/stylistic-analysis.types";
import { SignificanceIndicator } from "@/components/visualization/SignificanceIndicator";

// Inline types to avoid import issues
interface DiversityMetrics {
  vocabularyRichness: string;
  lexicalDensityLevel: string;
  styleType: string;
}

interface ProfileComparison {
  differences: {
    ttrDiff: number;
    lexicalDensityDiff: number;
    hapaxDiff: number;
    nounVerbRatioDiff: number;
  };
  significantFields: Array<{ field: string; studyPercentage: number; referencePercentage: number; difference: number }>;
}

interface LexicalMetricsCardsProps {
  profile: LexicalProfile;
  diversityMetrics: DiversityMetrics | null;
  comparison?: ProfileComparison | null;
}

export function LexicalMetricsCards({ profile, diversityMetrics, comparison }: LexicalMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* TTR Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Type-Token Ratio (TTR)</CardDescription>
          <div className="text-3xl font-bold">{profile.ttr.toFixed(3)}</div>
        </CardHeader>
        <CardContent>
          <Badge variant={profile.ttr > 0.6 ? 'default' : profile.ttr > 0.4 ? 'secondary' : 'outline'}>
            {diversityMetrics?.vocabularyRichness}
          </Badge>
          {comparison && (
            <div className="mt-2">
              <SignificanceIndicator
                difference={comparison.differences.ttrDiff}
                significance="*"
                pValue={0.05}
                metric="TTR"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lexical Density Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Densidade Lexical</CardDescription>
          <div className="text-3xl font-bold">{(profile.lexicalDensity * 100).toFixed(1)}%</div>
        </CardHeader>
        <CardContent>
          <Badge variant={profile.lexicalDensity > 0.6 ? 'default' : 'secondary'}>
            {diversityMetrics?.lexicalDensityLevel}
          </Badge>
          {comparison && (
            <div className="mt-2">
              <SignificanceIndicator
                difference={comparison.differences.lexicalDensityDiff}
                significance="**"
                pValue={0.01}
                metric="Densidade"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hapax Legomena Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Hapax Legomena</CardDescription>
          <div className="text-3xl font-bold">{profile.hapaxCount}</div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{profile.hapaxPercentage.toFixed(1)}% do vocabulário</p>
          {comparison && (
            <div className="mt-2">
              <SignificanceIndicator
                difference={comparison.differences.hapaxDiff}
                significance="ns"
                pValue={0.1}
                metric="Hapax"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Noun/Verb Ratio Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Razão Substantivo/Verbo</CardDescription>
          <div className="text-3xl font-bold">{profile.nounVerbRatio.toFixed(2)}</div>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">{diversityMetrics?.styleType}</Badge>
          {comparison && (
            <div className="mt-2">
              <SignificanceIndicator
                difference={comparison.differences.nounVerbRatioDiff}
                significance="***"
                pValue={0.001}
                metric="N/V Ratio"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
