import { useState, useMemo, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { RotateCcw, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { generateWallSectionSVG } from '@/lib/wallSection';
import { generateSocketJointSVG, generateFasciaPenetrationSVG } from '@/lib/socketJointDrawing';
import { generateCornerPostSVG, generateRafterLedgerSVG, generateCrossBracingSVG, generateLedgerConnectionSVG } from '@/lib/connectionDrawings';
import { generateFullElevationSVG } from '@/lib/fullElevation';
import { generateBuildingPlanSVG, generateRoofGeometrySVG } from '@/lib/planDrawings';
import { generateThreeViewSVG } from '@/lib/drawings';
import { calcUtilisation, filterByForm, calcGableInfill } from '@/lib/engine';
import { getDefaultDrawingParams, type DrawingParams, DRAWING_PARAM_META, getParamsForDrawing, groupParamsByCategory } from '@/lib/drawingParams';
import type { Section, MemberForm, BuildingType, ConstructionType, AttachmentType, RoofType, CladdingType, MemberOverrides } from '@/types';

// ── DrawingEditor Component ──
interface DrawingEditorProps {
  drawingId: string;
  title: string;
  description?: string;
  generator: (params: DrawingParams) => string;
  defaultParams?: DrawingParams;
  onParamsChange?: (params: DrawingParams) => void;
  className?: string;
}

function DrawingEditor({
  drawingId,
  title,
  description,
  generator,
  defaultParams,
  onParamsChange,
  className = '',
}: DrawingEditorProps) {
  const [params, setParams] = useState<DrawingParams>(() => defaultParams || getDefaultDrawingParams());
  const [controlsOpen, setControlsOpen] = useState(true);
  const [svgZoom, setSvgZoom] = useState(1);

  const relevantParams = useMemo(() => getParamsForDrawing(drawingId), [drawingId]);
  const groupedParams = useMemo(() => groupParamsByCategory(relevantParams), [relevantParams]);

  const svgString = useMemo(() => {
    try {
      return generator(params);
    } catch (e) {
      console.error('Drawing generation error:', e);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><text x="200" y="100" text-anchor="middle" fill="#f44336" font-size="14">Error generating drawing</text></svg>`;
    }
  }, [generator, params]);

  const updateParam = useCallback((key: keyof DrawingParams, value: any) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      onParamsChange?.(next);
      return next;
    });
  }, [onParamsChange]);

  const resetParams = useCallback(() => {
    setParams(getDefaultDrawingParams());
  }, []);

  const downloadSVG = useCallback(() => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${drawingId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [svgString, drawingId]);

  const renderControl = (meta: typeof DRAWING_PARAM_META[0]) => {
    const key = meta.key;
    const value = params[key];

    if (meta.type === 'boolean') {
      return (
        <div className="flex items-center justify-between py-1.5">
          <Label htmlFor={`${drawingId}-${key}`} className="text-xs text-slate-300 cursor-pointer">
            {meta.label}
          </Label>
          <Switch
            id={`${drawingId}-${key}`}
            checked={!!value}
            onCheckedChange={(v) => updateParam(key, v)}
          />
        </div>
      );
    }

    if (meta.type === 'select' && meta.options) {
      return (
        <div className="py-1.5">
          <Label htmlFor={`${drawingId}-${key}`} className="text-xs text-slate-300 mb-1 block">
            {meta.label}
          </Label>
          <Select value={String(value)} onValueChange={(v) => updateParam(key, v)}>
            <SelectTrigger id={`${drawingId}-${key}`} className="h-7 text-xs bg-slate-800 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {meta.options.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (meta.type === 'number' && meta.min !== undefined && meta.max !== undefined) {
      return (
        <div className="py-1.5">
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor={`${drawingId}-${key}`} className="text-xs text-slate-300">
              {meta.label}
            </Label>
            <span className="text-xs font-mono text-amber-400">
              {value}{meta.unit ? ` ${meta.unit}` : ''}
            </span>
          </div>
          <Slider
            id={`${drawingId}-${key}`}
            value={[typeof value === 'number' ? value : 0]}
            min={meta.min}
            max={meta.max}
            step={meta.step || 1}
            onValueChange={([v]) => updateParam(key, v)}
            className="w-full"
          />
        </div>
      );
    }

    return (
      <div className="py-1.5">
        <Label htmlFor={`${drawingId}-${key}`} className="text-xs text-slate-300 mb-1 block">
          {meta.label}
        </Label>
        <Input
          id={`${drawingId}-${key}`}
          value={String(value)}
          onChange={(e) => updateParam(key, e.target.value)}
          className="h-7 text-xs bg-slate-800 border-slate-600"
        />
      </div>
    );
  };

  return (
    <div className={`border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50 ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber-400 font-bold">{drawingId}</span>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setControlsOpen(!controlsOpen)}
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200"
          >
            {controlsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetParams}
            className="h-7 w-7 p-0 text-slate-400 hover:text-amber-400"
            title="Reset to defaults"
          >
            <RotateCcw size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadSVG}
            className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-400"
            title="Download SVG"
          >
            <Download size={14} />
          </Button>
        </div>
      </div>

      {description && (
        <div className="px-4 py-1.5 bg-slate-800/40 border-b border-slate-700/50">
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row">
        {controlsOpen && (
          <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-700 bg-slate-900/30 p-3 max-h-[500px] overflow-y-auto">
            <Accordion type="multiple" defaultValue={Object.keys(groupedParams)} className="w-full">
              {Object.entries(groupedParams).map(([category, params]) => (
                <AccordionItem key={category} value={category} className="border-slate-700/50">
                  <AccordionTrigger className="text-xs font-semibold text-slate-300 hover:text-slate-100 py-2">
                    {category}
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    {params.map((meta) => (
                      <div key={meta.key} className="border-b border-slate-800/50 last:border-0">
                        {renderControl(meta)}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        <div className="flex-1 p-4 bg-slate-950/50 min-h-[300px] flex items-center justify-center overflow-auto">
          <div style={{ transform: `scale(${svgZoom})`, transformOrigin: 'center center' }}>
            <div dangerouslySetInnerHTML={{ __html: svgString }} className="svg-drawing" style={{ maxWidth: '100%', height: 'auto' }} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 px-4 py-1.5 bg-slate-800/40 border-t border-slate-700/50">
        <span className="text-xs text-slate-500">Zoom</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSvgZoom((z) => Math.max(0.5, z - 0.25))}
          className="h-6 px-2 text-xs text-slate-400"
        >
          −
        </Button>
        <span className="text-xs font-mono text-slate-300 w-12 text-center">{(svgZoom * 100).toFixed(0)}%</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSvgZoom((z) => Math.min(3, z + 0.25))}
          className="h-6 px-2 text-xs text-slate-400"
        >
          +
        </Button>
      </div>
    </div>
  );
}

// ── Main App Component ──
export default function App() {
  // ... ALL YOUR EXISTING STATE DECLARATIONS STAY HERE ...
  // (config, forms, overrides, showAllPassing, activeTab, etc.)

  // ── NEW: Drawing Parameters State ──
  const [drawingParams, setDrawingParams] = useState<DrawingParams>(getDefaultDrawingParams());

  // ... ALL YOUR EXISTING useMemo, useCallback, helper functions STAY HERE ...

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ... ALL YOUR EXISTING TABS HEADER STAYS HERE ... */}

      {/* ── TAB: DRAWINGS ── */}
      {activeTab === 'drawings' && (
        <div className="space-y-6 p-4">
          {/* Plan View */}
          <DrawingEditor
            drawingId="plan"
            title="Plan View — Structure Layout"
            description="Shows the structure in plan view relative to the existing dwelling."
            generator={(params) =>
              generateBuildingPlanSVG(
                config.width,
                config.depth,
                config.height,
                config.pitch,
                config.attachment,
                config.portalFrameCount,
                config.roofType === 'gable',
                config.standoffMm ? config.standoffMm / 1000 : 0.15,
                params
              )
            }
            defaultParams={drawingParams}
            onParamsChange={setDrawingParams}
            className="w-full"
          />

          {/* Roof Geometry */}
          <DrawingEditor
            drawingId="roof"
            title="Roof Geometry Diagram"
            description="Triangular geometry showing span, rise, and rafter length."
            generator={(params) =>
              generateRoofGeometrySVG(
                config.width,
                config.pitch,
                config.height,
                config.roofType === 'gable',
                params
              )
            }
            defaultParams={drawingParams}
            onParamsChange={setDrawingParams}
            className="w-full"
          />

          {/* Wall Section Detail */}
          <DrawingEditor
            drawingId="DRF-001"
            title="Wall Section — Existing Dwelling (measured from site)"
            description="Section A-A through existing dwelling wall at eave."
            generator={(params) => generateWallSectionSVG(params)}
            defaultParams={drawingParams}
            onParamsChange={setDrawingParams}
            className="w-full"
          />

          {/* Full Detail Elevation Assembly */}
          <DrawingEditor
            drawingId="DRF-002"
            title="Full Detail Elevation — Wall (A-A) · Socket Joint (B-B) · Post (C-C)"
            description="Three-panel detail elevation per AS1100."
            generator={(params) => generateFullElevationSVG(params)}
            defaultParams={drawingParams}
            onParamsChange={setDrawingParams}
            className="w-full"
          />

          {/* Connection Detail Drawings */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <DrawingEditor
              drawingId="DRF-003"
              title="Corner Post + Ledger Connection"
              description="Base plate, concrete pad, anchor bolts."
              generator={(params) => generateCornerPostSVG(params)}
              defaultParams={drawingParams}
              onParamsChange={setDrawingParams}
            />
            <DrawingEditor
              drawingId="DRF-004"
              title="Rafter to Ledger Connection"
              description="Birdsmouth, through-bolt, pitch angle."
              generator={(params) => generateRafterLedgerSVG(params)}
              defaultParams={drawingParams}
              onParamsChange={setDrawingParams}
            />
            <DrawingEditor
              drawingId="DRF-005"
              title="Cross-Bracing (X-Brace)"
              description="Tension-only lateral stability in end bay."
              generator={(params) => generateCrossBracingSVG(params)}
              defaultParams={drawingParams}
              onParamsChange={setDrawingParams}
            />
            <DrawingEditor
              drawingId="DRF-006"
              title="Ledger to Wall Connection"
              description="Standoff bracket to existing brick wall."
              generator={(params) => generateLedgerConnectionSVG(params)}
              defaultParams={drawingParams}
              onParamsChange={setDrawingParams}
            />
          </div>

          {/* Socket Joint & Fascia */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <DrawingEditor
              drawingId="DRF-007"
              title="Socket Joint — Rafter to Standoff"
              description="50×50 SHS stub with packers, C250 rafter slips over."
              generator={(params) => generateSocketJointSVG(params)}
              defaultParams={drawingParams}
              onParamsChange={setDrawingParams}
            />
            <DrawingEditor
              drawingId="DRF-008"
              title="Fascia Penetration — SHS Through Existing Fascia"
              description="65×65 SHS through 30mm fascia, sealed with Sikaflex."
              generator={(params) => generateFasciaPenetrationSVG(params)}
              defaultParams={drawingParams}
              onParamsChange={setDrawingParams}
            />
          </div>

          {/* Connection Inventory (static) */}
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/50">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">Connection Inventory</h3>
            <p className="text-xs text-slate-400 mb-3">
              Connections required for each member type in this structure
            </p>
            {/* ... your existing connection inventory table ... */}
          </div>
        </div>
      )}

      {/* ... ALL YOUR OTHER TABS STAY HERE ... */}
    </div>
  );
}
