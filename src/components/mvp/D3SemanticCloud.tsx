import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import cloud from 'd3-cloud';
import * as d3 from 'd3';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface CloudNode {
  label: string;
  frequency: number;
  color: string;
  type: 'domain' | 'keyword';
  domain: string;
  tooltip: Record<string, any>;
}

interface D3CloudWord {
  text: string;
  size: number;
  color: string;
  type: 'domain' | 'keyword';
  data: {
    frequency: number;
    domain: string;
    tooltip: Record<string, any>;
  };
  x?: number;
  y?: number;
  rotate?: number;
}

interface D3SemanticCloudProps {
  nodes: CloudNode[];
  width?: number;
  height?: number;
  padding?: number;
  spiral?: 'archimedean' | 'rectangular';
  rotation?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'semibold' | 'bold';
  animationSpeed?: number;
  showTooltips?: boolean;
  onWordClick?: (word: string) => void;
  onDomainClick?: (domain: string) => void;
}

export function D3SemanticCloud({ 
  nodes, 
  width = 1200, 
  height = 700,
  padding = 6,
  spiral = 'archimedean',
  rotation = 0,
  fontFamily = 'Inter',
  fontWeight = 'semibold',
  animationSpeed = 600,
  showTooltips = true,
  onWordClick,
  onDomainClick
}: D3SemanticCloudProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tippyInstances = useRef<TippyInstance[]>([]);
  const [layoutWords, setLayoutWords] = useState<D3CloudWord[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();

  const d3Words: D3CloudWord[] = useMemo(() => {
    return nodes.map(node => ({
      text: node.label,
      size: node.type === 'domain' ? 48 + Math.min(24, (node.tooltip.percentual || 0) * 2) : 14 + Math.min(22, (node.tooltip.ll || 0) / 3),
      color: node.color,
      type: node.type,
      data: { frequency: node.frequency, domain: node.domain, tooltip: node.tooltip }
    }));
  }, [nodes]);

  useEffect(() => {
    if (d3Words.length === 0) return;
    const layout = cloud().size([width, height]).words(d3Words as any).padding(padding).rotate(() => rotation).fontSize(d => d.size).spiral(spiral).on('end', (words) => setLayoutWords(words as D3CloudWord[]));
    layout.start();
  }, [d3Words, width, height, padding, spiral, rotation]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select('g.cloud-group');
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 4]).on('zoom', (event) => {
      g.attr('transform', `translate(${width / 2},${height / 2}) ${event.transform}`);
      setZoomLevel(event.transform.k);
    });
    svg.call(zoom);
    zoomBehavior.current = zoom;
    return () => { svg.on('.zoom', null); };
  }, [width, height]);

  useEffect(() => {
    if (!svgRef.current || layoutWords.length === 0) return;
    tippyInstances.current.forEach(instance => instance.destroy());
    tippyInstances.current = [];
    const svg = d3.select(svgRef.current);
    const g = svg.select('g.cloud-group');
    const texts = g.selectAll('text').data(layoutWords, (d: any) => d.text);
    const fontWeightNum = fontWeight === 'normal' ? '400' : fontWeight === 'semibold' ? '600' : '700';
    const enter = texts.enter().append('text').style('font-family', `${fontFamily}, system-ui, sans-serif`).style('font-weight', fontWeightNum).style('cursor', 'pointer').attr('text-anchor', 'middle').attr('fill', d => d.color).text(d => d.text);
    enter.attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`).style('font-size', 0).style('opacity', 0).transition().duration(animationSpeed).ease(d3.easeCubicOut).style('font-size', d => `${d.size}px`).style('opacity', 1);
    
    if (showTooltips) {
      enter.each(function(d) {
        const tooltipContent = d.type === 'domain' ? createDomainTooltip(d.data.tooltip) : createKeywordTooltip(d.data.tooltip);
        const instance = tippy(this, { content: tooltipContent, allowHTML: true, theme: 'light', placement: 'top', arrow: true, maxWidth: 350, interactive: true });
        tippyInstances.current.push(instance);
      });
    }
    
    texts.transition().duration(400).attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`).style('font-size', d => `${d.size}px`);
    texts.exit().transition().duration(300).style('font-size', 0).style('opacity', 0).remove();
    g.selectAll('text').on('click', function(event, d: D3CloudWord) {
      if (d.type === 'domain' && onDomainClick) onDomainClick(d.text);
      else if (d.type === 'keyword' && onWordClick) onWordClick(d.text);
    });
    return () => { tippyInstances.current.forEach(instance => instance.destroy()); tippyInstances.current = []; };
  }, [layoutWords, onWordClick, onDomainClick, showTooltips, fontFamily, fontWeight, animationSpeed]);

  const handleZoomIn = () => { if (svgRef.current && zoomBehavior.current) d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.current.scaleBy, 1.3); };
  const handleZoomOut = () => { if (svgRef.current && zoomBehavior.current) d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.current.scaleBy, 0.7); };
  const handleResetZoom = () => { if (svgRef.current && zoomBehavior.current) d3.select(svgRef.current).transition().duration(500).call(zoomBehavior.current.transform, d3.zoomIdentity); };

  function createDomainTooltip(tooltip: any): string {
    return `<div style="padding: 14px; font-family: Inter, sans-serif; min-width: 280px;"><div style="font-weight: 700; font-size: 17px; margin-bottom: 10px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">${tooltip.nome || tooltip.dominio || 'Domínio'}</div><div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: #64748b; margin-bottom: 12px;"><div><strong>Ocorrências:</strong> ${tooltip.ocorrencias?.toLocaleString() || 0}</div><div><strong>Riqueza Lexical:</strong> ${tooltip.riquezaLexical || 0} palavras únicas</div><div><strong>Representatividade:</strong> ${tooltip.percentual?.toFixed(2) || 0}% do corpus</div>${tooltip.avgLL ? `<div><strong>Significância (LL):</strong> ${tooltip.avgLL.toFixed(2)}</div>` : ''}</div><div style="background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #3b82f6;"><div style="font-size: 12px; color: #475569; font-weight: 600; margin-bottom: 4px;">💡 Dica de Interação</div><div style="font-size: 11px; color: #64748b; line-height: 1.4;"><strong>Clique</strong> para ver todas as palavras-chave deste domínio e suas estatísticas detalhadas</div></div></div>`;
  }

  function createKeywordTooltip(tooltip: any): string {
    const prosodyInfo = getProsodyInfo(tooltip.prosody);
    return `<div style="padding: 14px; font-family: Inter, sans-serif; min-width: 300px;"><div style="font-weight: 700; font-size: 17px; margin-bottom: 10px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">${tooltip.palavra || 'Palavra'}</div><div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: #64748b; margin-bottom: 12px;"><div><strong>Domínio:</strong> ${tooltip.dominio || 'N/A'}</div><div><strong>Frequência:</strong> ${tooltip.frequencia || 0} ocorrências</div><div><strong>LL Score:</strong> ${tooltip.ll?.toFixed(2) || 0}</div><div><strong>MI Score:</strong> ${tooltip.mi?.toFixed(2) || 0}</div></div><div style="margin-bottom: 12px; padding: 10px; background: ${prosodyInfo.bg}; border-radius: 6px; border: 1px solid ${prosodyInfo.borderColor};"><span style="font-size: 13px; color: #555; font-weight: 600;">${prosodyInfo.emoji} Prosódia: <strong>${prosodyInfo.label}</strong></span></div><div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #22c55e;"><div style="font-size: 12px; color: #166534; font-weight: 600; margin-bottom: 4px;">💡 Dica</div><div style="font-size: 11px; color: #15803d;"><strong>Clique</strong> para ver concordâncias (KWIC)</div></div></div>`;
  }

  function getProsodyInfo(prosody: any) {
    if (typeof prosody === 'string') {
      const emoji = prosody === 'Positiva' ? '😊' : prosody === 'Negativa' ? '😔' : '😐';
      const bg = prosody === 'Positiva' ? '#dcfce7' : prosody === 'Negativa' ? '#fee2e2' : '#fef9c3';
      const borderColor = prosody === 'Positiva' ? '#86efac' : prosody === 'Negativa' ? '#fca5a5' : '#fde047';
      return { emoji, label: prosody, bg, borderColor };
    }
    const value = prosody ?? 0;
    const emoji = value > 0 ? '😊' : value < 0 ? '😔' : '😐';
    const label = value > 0 ? 'Positiva' : value < 0 ? 'Negativa' : 'Neutra';
    const bg = value > 0 ? '#dcfce7' : value < 0 ? '#fee2e2' : '#fef9c3';
    const borderColor = value > 0 ? '#86efac' : value < 0 ? '#fca5a5' : '#fde047';
    return { emoji, label, bg, borderColor };
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="relative w-full h-full">
      <svg ref={svgRef} width={width} height={height} className="w-full h-full">
        <g className="cloud-group" transform={`translate(${width / 2},${height / 2})`} />
      </svg>
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-card/90 backdrop-blur-sm rounded-lg p-2 shadow-lg z-10">
        <Button size="icon" variant="outline" onClick={handleZoomIn}><ZoomIn className="w-4 h-4" /></Button>
        <Button size="icon" variant="outline" onClick={handleZoomOut}><ZoomOut className="w-4 h-4" /></Button>
        <Button size="icon" variant="outline" onClick={handleResetZoom}><Maximize2 className="w-4 h-4" /></Button>
        <div className="text-xs text-center text-muted-foreground px-1">{(zoomLevel * 100).toFixed(0)}%</div>
      </div>
    </motion.div>
  );
}
