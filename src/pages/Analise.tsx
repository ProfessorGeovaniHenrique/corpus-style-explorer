import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KWICModal } from "@/components/KWICModal";
import { Download } from "lucide-react";

// Mock data para a palavra "verso"
const kwicData = [
  {
    leftContext: "...Daí um",
    keyword: "verso",
    rightContext: "de campo se chegou...",
    source: "'Quando o verso vem pras casa'",
  },
  {
    leftContext: "...galponeira, onde o",
    keyword: "verso",
    rightContext: "é mais caseiro...",
    source: "'Quando o verso vem pras casa'",
  },
  {
    leftContext: "...E o",
    keyword: "verso",
    rightContext: "que tinha sonhos prá rondar...",
    source: "'Quando o verso vem pras casa'",
  },
  {
    leftContext: "...E o",
    keyword: "verso",
    rightContext: "sonhou ser várzea com sombra...",
    source: "'Quando o verso vem pras casa'",
  },
];

const dominiosData = [
  { dominio: "Vida no Galpão", relevancia: "Alta", frequencia: 12 },
  { dominio: "Sentimentos e Poesia", relevancia: "Alta", frequencia: 10 },
  { dominio: "Natureza Campeira", relevancia: "Média", frequencia: 8 },
];

export default function Analise() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState("");

  const handleWordClick = (word: string) => {
    setSelectedWord(word);
    setModalOpen(true);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Resultados da Análise: 'Quando o verso vem pras casa'
          </h1>
          <p className="text-muted-foreground">
            Análise semântica completa do corpus
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Dados
        </Button>
      </div>

      {/* Nuvem de Domínios */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Nuvem de Domínios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-8 py-12 min-h-[300px]">
              <button
                onClick={() => handleWordClick("verso")}
                className="text-5xl font-bold text-primary hover:scale-110 transition-transform cursor-pointer"
              >
                VERSO
              </button>
              <button
                onClick={() => handleWordClick("campo")}
                className="text-4xl font-bold text-success hover:scale-110 transition-transform cursor-pointer"
              >
                CAMPO
              </button>
              <button
                onClick={() => handleWordClick("saudade")}
                className="text-3xl font-bold text-accent hover:scale-110 transition-transform cursor-pointer"
              >
                SAUDADE
              </button>
              <button
                onClick={() => handleWordClick("galpão")}
                className="text-4xl font-bold text-success hover:scale-110 transition-transform cursor-pointer"
              >
                GALPÃO
              </button>
              <button
                onClick={() => handleWordClick("tarumã")}
                className="text-3xl font-bold text-primary hover:scale-110 transition-transform cursor-pointer"
              >
                TARUMÃ
              </button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Planilha de Domínios */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Planilha de Domínios</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Relevância</TableHead>
                  <TableHead className="text-right">Frequência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dominiosData.map((item, index) => (
                  <TableRow 
                    key={index}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleWordClick(item.dominio)}
                  >
                    <TableCell className="font-medium">{item.dominio}</TableCell>
                    <TableCell>
                      <span
                        className={
                          item.relevancia === "Alta"
                            ? "text-primary font-semibold"
                            : "text-accent"
                        }
                      >
                        {item.relevancia}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{item.frequencia}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Modal KWIC */}
      <KWICModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        word={selectedWord}
        data={selectedWord === "verso" ? kwicData : []}
      />
    </div>
  );
}
