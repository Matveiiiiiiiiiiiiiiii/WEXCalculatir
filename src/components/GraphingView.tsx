import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Download,
  Share2,
  Table,
  Sliders,
  Maximize2,
  Layers,
  Activity,
  Calculator
} from 'lucide-react';
import { GraphFunction } from '../types/calculator';
import {
  compileFunction,
  computeDerivative,
  findRoots,
  findExtrema,
  computeDefiniteIntegral,
  generateTableOfValues,
} from '../utils/graphEngine';
import { Language, getTranslation } from '../utils/i18n';

interface GraphingViewProps {
  isDark: boolean;
  lang: Language;
  onShareViaGmail?: (subject: string, body: string, htmlBody?: string) => void;
}

const PRESET_FUNCTIONS = [
  { name: 'Синусоида', expr: 'sin(x)', color: '#3b82f6' },
  { name: 'Парабола', expr: 'x^2 - 4', color: '#10b981' },
  { name: 'Кубическая', expr: 'x^3 - 3x', color: '#8b5cf6' },
  { name: 'Экспонента', expr: 'e^x', color: '#f59e0b' },
  { name: 'Гауссиана', expr: 'e^(-x^2)', color: '#ec4899' },
  { name: 'Логарифм', expr: 'ln(x)', color: '#06b6d4' },
  { name: 'Гипербола', expr: '1/x', color: '#f43f5e' },
  { name: 'Модуль', expr: '|x - 2| - 3', color: '#14b8a6' },
  { name: 'Волна', expr: 'sin(x) + sin(2x)/2', color: '#a855f7' },
];

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];

export const GraphingView: React.FC<GraphingViewProps> = ({
  isDark,
  lang,
  onShareViaGmail,
}) => {
  const [functions, setFunctions] = useState<GraphFunction[]>([
    {
      id: 'f1',
      expression: 'sin(x)',
      color: '#3b82f6',
      visible: true,
      showDerivative: false,
    },
    {
      id: 'f2',
      expression: 'x^2 / 4 - 2',
      color: '#10b981',
      visible: true,
      showDerivative: false,
    },
  ]);

  const [newExpr, setNewExpr] = useState('');
  const [showRoots, setShowRoots] = useState(true);
  const [showExtrema, setShowExtrema] = useState(true);
  const [showTangent, setShowTangent] = useState(false);
  const [showIntegral, setShowIntegral] = useState(false);
  const [integralRange, setIntegralRange] = useState<[number, number]>([-2, 2]);
  const [showTableModal, setShowTableModal] = useState(false);
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>('f1');
  const [tableStep, setTableStep] = useState(0.5);

  // Domain & Range state
  const [domain, setDomain] = useState<[number, number]>([-10, 10]);
  const [range, setRange] = useState<[number, number]>([-7, 7]);

  // Cursor state
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 500,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          setContainerSize({ width: w, height: Math.max(h, 420) });
        }
      }
    };
    updateSize();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height: Math.max(height, 420) });
        }
      }
    });

    observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Compile all active functions
  const compiledMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof compileFunction>>();
    functions.forEach((fn) => {
      map.set(fn.id, compileFunction(fn.expression));
    });
    return map;
  }, [functions]);

  // Handle adding new function
  const handleAddFunction = (exprToAdd?: string, colorToAdd?: string) => {
    const text = exprToAdd || newExpr;
    if (!text.trim()) return;

    const newId = 'fn_' + Date.now();
    const color = colorToAdd || PALETTE[functions.length % PALETTE.length];
    setFunctions((prev) => [
      ...prev,
      {
        id: newId,
        expression: text.trim(),
        color,
        visible: true,
        showDerivative: false,
      },
    ]);
    if (!exprToAdd) setNewExpr('');
  };

  const handleDeleteFunction = (id: string) => {
    setFunctions((prev) => prev.filter((f) => f.id !== id));
  };

  const handleToggleVisible = (id: string) => {
    setFunctions((prev) =>
      prev.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f))
    );
  };

  const handleToggleDerivative = (id: string) => {
    setFunctions((prev) =>
      prev.map((f) => (f.id === id ? { ...f, showDerivative: !f.showDerivative } : f))
    );
  };

  const handleColorChange = (id: string, color: string) => {
    setFunctions((prev) =>
      prev.map((f) => (f.id === id ? { ...f, color } : f))
    );
  };

  // Reset View
  const handleResetView = () => {
    setDomain([-10, 10]);
    setRange([-7, 7]);
  };

  // Zoom controls
  const handleZoom = (factor: number) => {
    const [xMin, xMax] = domain;
    const [yMin, yMax] = range;
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;
    const xHalf = ((xMax - xMin) / 2) * factor;
    const yHalf = ((yMax - yMin) / 2) * factor;
    setDomain([xCenter - xHalf, xCenter + xHalf]);
    setRange([yCenter - yHalf, yCenter + yHalf]);
  };

  // D3 Render Loop
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerSize.width || containerRef.current.clientWidth || 800;
    const height = Math.max(containerSize.height || containerRef.current.clientHeight || 500, 420);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Scales
    const xScale = d3.scaleLinear().domain(domain).range([0, width]);
    const yScale = d3.scaleLinear().domain(range).range([height, 0]);

    // Defs & Clip path
    const defs = svg.append('defs');
    defs
      .append('clipPath')
      .attr('id', 'graph-clip')
      .append('rect')
      .attr('width', width)
      .attr('height', height);

    const mainG = svg.append('g').attr('clip-path', 'url(#graph-clip)');

    // 1. Grid lines
    const gridG = mainG.append('g').attr('class', 'grid');
    const xTicks = xScale.ticks(Math.max(width / 70, 5));
    const yTicks = yScale.ticks(Math.max(height / 60, 5));

    // Vertical grid
    gridG
      .selectAll('.grid-x')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-x')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', isDark ? '#334155' : '#e2e8f0')
      .attr('stroke-width', (d) => (d === 0 ? 0 : 1))
      .attr('stroke-dasharray', isDark ? '2,2' : 'none')
      .attr('opacity', 0.65);

    // Horizontal grid
    gridG
      .selectAll('.grid-y')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-y')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', isDark ? '#334155' : '#e2e8f0')
      .attr('stroke-width', (d) => (d === 0 ? 0 : 1))
      .attr('stroke-dasharray', isDark ? '2,2' : 'none')
      .attr('opacity', 0.65);

    // 2. Axes (X=0 and Y=0)
    const axesG = mainG.append('g').attr('class', 'axes');

    // X Axis line
    axesG
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', isDark ? '#94a3b8' : '#475569')
      .attr('stroke-width', 1.75);

    // Y Axis line
    axesG
      .append('line')
      .attr('x1', xScale(0))
      .attr('x2', xScale(0))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', isDark ? '#94a3b8' : '#475569')
      .attr('stroke-width', 1.75);

    // Ticks & Labels
    const labelsG = mainG.append('g').attr('class', 'labels');

    // X Axis numbers
    xTicks.forEach((t) => {
      if (t === 0) return;
      labelsG
        .append('text')
        .attr('x', xScale(t))
        .attr('y', Math.min(Math.max(yScale(0) + 14, 14), height - 6))
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('fill', isDark ? '#94a3b8' : '#64748b')
        .text(t);
    });

    // Y Axis numbers
    yTicks.forEach((t) => {
      if (t === 0) return;
      labelsG
        .append('text')
        .attr('x', Math.min(Math.max(xScale(0) - 6, 6), width - 24))
        .attr('y', yScale(t) + 3)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('fill', isDark ? '#94a3b8' : '#64748b')
        .text(t);
    });

    // Origin (0,0) label
    labelsG
      .append('text')
      .attr('x', xScale(0) - 6)
      .attr('y', yScale(0) + 14)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('fill', isDark ? '#64748b' : '#94a3b8')
      .text('0');

    // 3. Shaded Area for Integral (if active)
    if (showIntegral) {
      const activeFn = compiledMap.get(selectedFunctionId);
      if (activeFn && activeFn.isValid) {
        const [a, b] = integralRange;
        const startX = Math.min(a, b);
        const endX = Math.max(a, b);
        const intPts: [number, number][] = [];

        const intSteps = 100;
        const dX = (endX - startX) / intSteps;
        for (let i = 0; i <= intSteps; i++) {
          const x = startX + i * dX;
          const y = activeFn.evaluate(x);
          if (Number.isFinite(y)) {
            intPts.push([xScale(x), yScale(y)]);
          }
        }

        if (intPts.length > 2) {
          const areaGenerator = d3
            .area<[number, number]>()
            .x((d) => d[0])
            .y0(yScale(0))
            .y1((d) => d[1]);

          mainG
            .append('path')
            .datum(intPts)
            .attr('d', areaGenerator)
            .attr('fill', '#3b82f6')
            .attr('fill-opacity', 0.25)
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3');
        }
      }
    }

    // 4. Plot each active function
    const curvesG = mainG.append('g').attr('class', 'curves');
    const samples = Math.max(Math.round(width * 1.5), 600);
    const step = (domain[1] - domain[0]) / samples;

    functions.forEach((fn) => {
      if (!fn.visible) return;
      const compiled = compiledMap.get(fn.id);
      if (!compiled || !compiled.isValid) return;

      // Group points into continuous segments to avoid connecting asymptotes (like 1/x or tan(x))
      const segments: [number, number][][] = [];
      let currentSegment: [number, number][] = [];

      for (let i = 0; i <= samples; i++) {
        const x = domain[0] + i * step;
        const y = compiled.evaluate(x);

        if (Number.isFinite(y) && Math.abs(y) < 1000) {
          const px = xScale(x);
          const py = yScale(y);

          // Check for steep jumps (asymptotes)
          if (currentSegment.length > 0) {
            const lastPy = currentSegment[currentSegment.length - 1][1];
            if (Math.abs(py - lastPy) > height * 0.95 && ((py < 0 && lastPy > height) || (py > height && lastPy < 0))) {
              segments.push(currentSegment);
              currentSegment = [];
            }
          }
          currentSegment.push([px, py]);
        } else {
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
            currentSegment = [];
          }
        }
      }
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }

      const lineGen = d3
        .line<[number, number]>()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(d3.curveLinear);

      segments.forEach((seg) => {
        curvesG
          .append('path')
          .datum(seg)
          .attr('d', lineGen)
          .attr('fill', 'none')
          .attr('stroke', fn.color)
          .attr('stroke-width', 2.5)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round');
      });

      // 5. Derivative curve if toggled
      if (fn.showDerivative) {
        const dSegments: [number, number][][] = [];
        let curDSeg: [number, number][] = [];
        for (let i = 0; i <= samples; i += 2) {
          const x = domain[0] + i * step;
          const dy = computeDerivative(compiled.evaluate, x);
          if (Number.isFinite(dy) && Math.abs(dy) < 500) {
            curDSeg.push([xScale(x), yScale(dy)]);
          } else if (curDSeg.length > 0) {
            dSegments.push(curDSeg);
            curDSeg = [];
          }
        }
        if (curDSeg.length > 0) dSegments.push(curDSeg);

        dSegments.forEach((seg) => {
          curvesG
            .append('path')
            .datum(seg)
            .attr('d', lineGen)
            .attr('fill', 'none')
            .attr('stroke', fn.color)
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '4,4')
            .attr('opacity', 0.7);
        });
      }

      // 6. Roots markers (f(x) = 0)
      if (showRoots) {
        const roots = findRoots(compiled.evaluate, domain[0], domain[1]);
        roots.forEach((root) => {
          if (root >= domain[0] && root <= domain[1]) {
            const rx = xScale(root);
            const ry = yScale(0);
            curvesG
              .append('circle')
              .attr('cx', rx)
              .attr('cy', ry)
              .attr('r', 4.5)
              .attr('fill', fn.color)
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 1.5);
          }
        });
      }

      // 7. Extrema markers
      if (showExtrema) {
        const extrema = findExtrema(compiled.evaluate, domain[0], domain[1]);
        extrema.forEach((ext) => {
          if (ext.x >= domain[0] && ext.x <= domain[1] && ext.y >= range[0] && ext.y <= range[1]) {
            const ex = xScale(ext.x);
            const ey = yScale(ext.y);
            curvesG
              .append('circle')
              .attr('cx', ex)
              .attr('cy', ey)
              .attr('r', 4)
              .attr('fill', ext.type === 'max' ? '#ec4899' : '#06b6d4')
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 1.2);
          }
        });
      }
    });

    // 8. Tangent Line at Cursor X (if toggled)
    if (showTangent && cursorPos) {
      const activeFn = compiledMap.get(selectedFunctionId);
      if (activeFn && activeFn.isValid) {
        const x0 = cursorPos.x;
        const y0 = activeFn.evaluate(x0);
        const slope = computeDerivative(activeFn.evaluate, x0);

        if (Number.isFinite(y0) && Number.isFinite(slope)) {
          const tanX1 = domain[0];
          const tanY1 = y0 + slope * (tanX1 - x0);
          const tanX2 = domain[1];
          const tanY2 = y0 + slope * (tanX2 - x0);

          curvesG
            .append('line')
            .attr('x1', xScale(tanX1))
            .attr('y1', yScale(tanY1))
            .attr('x2', xScale(tanX2))
            .attr('y2', yScale(tanY2))
            .attr('stroke', '#f59e0b')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '5,3');

          // Point of tangency
          curvesG
            .append('circle')
            .attr('cx', xScale(x0))
            .attr('cy', yScale(y0))
            .attr('r', 4.5)
            .attr('fill', '#f59e0b')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1.5);
        }
      }
    }

    // 9. Interactive Crosshair & Hover Tooltip
    if (cursorPos) {
      const cx = xScale(cursorPos.x);
      const cy = yScale(cursorPos.y);

      // Vertical tracker
      mainG
        .append('line')
        .attr('x1', cx)
        .attr('x2', cx)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', isDark ? '#64748b' : '#94a3b8')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');

      // Horizontal tracker
      mainG
        .append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', cy)
        .attr('y2', cy)
        .attr('stroke', isDark ? '#64748b' : '#94a3b8')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');

      // Cursor point
      mainG
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 3.5)
        .attr('fill', '#ef4444');
    }

    // 10. Pan / Drag & Zoom handling via D3
    let isDragging = false;
    let startCoords: [number, number] | null = null;
    let startDomain: [number, number] = [...domain];
    let startRange: [number, number] = [...range];

    const overlay = svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    overlay
      .on('mousedown', (event: MouseEvent) => {
        isDragging = true;
        startCoords = [event.clientX, event.clientY];
        startDomain = [...domain];
        startRange = [...range];
      })
      .on('mousemove', (event: MouseEvent) => {
        const rect = overlay.node()?.getBoundingClientRect();
        if (rect) {
          const mouseX = event.clientX - rect.left;
          const mouseY = event.clientY - rect.top;
          const mathX = xScale.invert(mouseX);
          const mathY = yScale.invert(mouseY);
          setCursorPos({ x: Math.round(mathX * 100) / 100, y: Math.round(mathY * 100) / 100 });
        }

        if (isDragging && startCoords) {
          const dx = event.clientX - startCoords[0];
          const dy = event.clientY - startCoords[1];
          const dXMath = (dx / width) * (startDomain[1] - startDomain[0]);
          const dYMath = (dy / height) * (startRange[1] - startRange[0]);

          setDomain([startDomain[0] - dXMath, startDomain[1] - dXMath]);
          setRange([startRange[0] + dYMath, startRange[1] + dYMath]);
        }
      })
      .on('mouseup', () => {
        isDragging = false;
        startCoords = null;
      })
      .on('mouseleave', () => {
        isDragging = false;
        startCoords = null;
        setCursorPos(null);
      })
      .on('wheel', (event: WheelEvent) => {
        event.preventDefault();
        const factor = event.deltaY > 0 ? 1.15 : 0.85;
        const rect = overlay.node()?.getBoundingClientRect();
        if (rect) {
          const mouseX = event.clientX - rect.left;
          const mouseY = event.clientY - rect.top;
          const focusX = xScale.invert(mouseX);
          const focusY = yScale.invert(mouseY);

          setDomain([
            focusX - (focusX - domain[0]) * factor,
            focusX + (domain[1] - focusX) * factor,
          ]);
          setRange([
            focusY - (focusY - range[0]) * factor,
            focusY + (range[1] - focusY) * factor,
          ]);
        }
      });
  }, [
    domain,
    range,
    functions,
    compiledMap,
    isDark,
    showRoots,
    showExtrema,
    showTangent,
    showIntegral,
    integralRange,
    selectedFunctionId,
    cursorPos,
    containerSize,
  ]);

  // Export graph to SVG file
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VexCalc_Graph_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Share via Gmail handler
  const handleShareGraph = () => {
    if (!onShareViaGmail) return;
    const activeFunctions = functions.filter((f) => f.visible);
    const targetFunctions = activeFunctions.length > 0 ? activeFunctions : functions;
    const funcsList =
      targetFunctions.length > 0
        ? targetFunctions.map((f, i) => `${i + 1}. f(x) = ${f.expression}`).join('\n')
        : '(нет заданных функций)';

    const countLabel =
      activeFunctions.length > 0
        ? `${activeFunctions.length} функций`
        : functions.length > 0
        ? `${functions.length} скрытых функций`
        : 'обзор';

    const subject = `ВексКалькулятор: Математический график (${countLabel})`;
    const body = `Здравствуйте!\n\nДелюсь математическим графиком из приложения ВексКалькулятор:\n\nФункции:\n${funcsList}\n\nДиапазон отображения:\nX: [${domain[0].toFixed(2)}, ${domain[1].toFixed(2)}]\nY: [${range[0].toFixed(2)}, ${range[1].toFixed(2)}]\n\nСоздано в ВексКалькуляторе.`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #2563eb; margin-top: 0;">ВексКалькулятор — Математический отчёт</h2>
        <p>Построенный график содержит следующие функции:</p>
        <ul style="line-height: 1.8;">
          ${targetFunctions
            .map(
              (f) =>
                `<li><strong style="color: ${f.color};">f(x) = ${f.expression}</strong></li>`
            )
            .join('')}
        </ul>
        <p><strong>Область графика:</strong> X: [${domain[0].toFixed(2)}, ${domain[1].toFixed(2)}], Y: [${range[0].toFixed(2)}, ${range[1].toFixed(2)}]</p>
      </div>
    `;

    onShareViaGmail(subject, body, htmlBody);
  };

  const selectedFn = functions.find((f) => f.id === selectedFunctionId) || functions[0];
  const selectedCompiled = selectedFn ? compiledMap.get(selectedFn.id) : null;

  // Compute live integral value
  const liveIntegral = useMemo(() => {
    if (!selectedCompiled || !selectedCompiled.isValid) return null;
    return computeDefiniteIntegral(selectedCompiled.evaluate, integralRange[0], integralRange[1]);
  }, [selectedCompiled, integralRange]);

  // Compute table values
  const tableValues = useMemo(() => {
    if (!selectedCompiled || !selectedCompiled.isValid) return [];
    return generateTableOfValues(selectedCompiled.evaluate, domain[0], domain[1], tableStep);
  }, [selectedCompiled, domain, tableStep]);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative select-none">
      {/* Top Toolbar: Presets & Controls */}
      <div
        className={`px-3 py-2 border-b flex items-center justify-between gap-2 overflow-x-auto text-xs ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'
        }`}
      >
        {/* Presets buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-semibold text-[11px] opacity-70 flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>{getTranslation('presets', lang)}:</span>
          </span>
          {PRESET_FUNCTIONS.slice(0, 5).map((p) => (
            <button
              key={p.name}
              onClick={() => handleAddFunction(p.expr, p.color)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-white hover:bg-slate-200 text-slate-700 shadow-2xs'
              }`}
            >
              {p.expr}
            </button>
          ))}
        </div>

        {/* View Tools: Zoom, Roots, Extrema, Export, Gmail Share */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => handleZoom(0.8)}
            className={`p-1.5 rounded-md transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Приблизить (+)"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(1.25)}
            className={`p-1.5 rounded-md transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Отдалить (-)"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            className={`p-1.5 rounded-md transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Сброс вида ([-10, 10])"
            aria-label="Reset view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-500/20 mx-1" />

          {/* Toggle Roots */}
          <button
            onClick={() => setShowRoots(!showRoots)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              showRoots
                ? 'bg-blue-600/20 text-blue-500 font-semibold'
                : 'opacity-60 hover:opacity-100'
            }`}
            title="Показать / скрыть корни f(x)=0"
          >
            {getTranslation('roots', lang)}
          </button>

          {/* Toggle Extrema */}
          <button
            onClick={() => setShowExtrema(!showExtrema)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              showExtrema
                ? 'bg-pink-600/20 text-pink-500 font-semibold'
                : 'opacity-60 hover:opacity-100'
            }`}
            title="Показать локальные минимумы и максимумы"
          >
            {getTranslation('extrema', lang)}
          </button>

          {/* Toggle Tangent */}
          <button
            onClick={() => setShowTangent(!showTangent)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              showTangent
                ? 'bg-amber-600/20 text-amber-500 font-semibold'
                : 'opacity-60 hover:opacity-100'
            }`}
            title="Касательная в точке курсора"
          >
            {getTranslation('tangent', lang)}
          </button>

          {/* Toggle Integral */}
          <button
            onClick={() => setShowIntegral(!showIntegral)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              showIntegral
                ? 'bg-emerald-600/20 text-emerald-500 font-semibold'
                : 'opacity-60 hover:opacity-100'
            }`}
            title="Интеграл (Площадь под кривой)"
          >
            {getTranslation('integral', lang)}
          </button>

          {/* Table of values */}
          <button
            onClick={() => setShowTableModal(!showTableModal)}
            className={`p-1.5 rounded-md transition-colors ${
              showTableModal
                ? 'bg-purple-600/20 text-purple-500'
                : isDark
                ? 'hover:bg-slate-800 text-slate-300'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Таблица значений (x, y)"
            aria-label="Table of values"
          >
            <Table className="w-3.5 h-3.5" />
          </button>

          {/* Export SVG */}
          <button
            onClick={handleExportSvg}
            className={`p-1.5 rounded-md transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Скачать SVG"
            aria-label="Export SVG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Share via Gmail */}
          {onShareViaGmail && (
            <button
              onClick={handleShareGraph}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-600/10 hover:bg-red-600/20 text-red-600 transition-colors"
              title="Поделиться графиком по Gmail"
            >
              <Share2 className="w-3 h-3" />
              <span>Gmail</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Function List Sidebar & D3 Canvas */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[460px]">
        {/* Left/Sidebar: Function inputs and management */}
        <div
          className={`w-full md:w-72 border-r p-3 flex flex-col gap-3 shrink-0 ${
            isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {/* Add Function Input */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold opacity-75">
              {getTranslation('addFunction', lang)}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-blue-500">y =</span>
              <input
                type="text"
                value={newExpr}
                onChange={(e) => setNewExpr(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFunction();
                }}
                placeholder="sin(x), x^2, e^x..."
                className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono outline-hidden transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 focus:border-blue-500 text-slate-100'
                    : 'bg-white border-slate-300 focus:border-blue-500 text-slate-800'
                }`}
              />
              <button
                onClick={() => handleAddFunction()}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-xs transition-transform active:scale-95"
                title="Добавить"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Functions list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[340px] md:max-h-none">
            {functions.map((fn) => {
              const compiled = compiledMap.get(fn.id);
              const isSelected = fn.id === selectedFunctionId;

              return (
                <div
                  key={fn.id}
                  onClick={() => setSelectedFunctionId(fn.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-slate-800/90 border-blue-500/70 shadow-xs'
                        : 'bg-white border-blue-500 shadow-xs'
                      : isDark
                      ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                      : 'bg-white/70 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Color badge */}
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-black/20"
                        style={{ backgroundColor: fn.color }}
                      />
                      <span className="font-mono text-xs font-semibold truncate">
                        f(x) = {fn.expression}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisible(fn.id);
                        }}
                        className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
                        title={fn.visible ? 'Скрыть' : 'Показать'}
                      >
                        {fn.visible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFunction(fn.id);
                        }}
                        className="p-1 rounded-md opacity-60 hover:opacity-100 hover:text-red-500 transition-all"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Derivative toggle & Color picker */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-inherit/40 text-[10px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDerivative(fn.id);
                      }}
                      className={`flex items-center gap-1 font-mono px-1.5 py-0.5 rounded transition-colors ${
                        fn.showDerivative
                          ? 'bg-blue-500/20 text-blue-400 font-bold'
                          : 'opacity-50 hover:opacity-100'
                      }`}
                      title="Показать f'(x) пунктиром"
                    >
                      <Activity className="w-2.5 h-2.5" />
                      <span>f'(x)</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {PALETTE.map((c) => (
                        <span
                          key={c}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleColorChange(fn.id, c);
                          }}
                          className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-transform hover:scale-125 ${
                            fn.color === c ? 'ring-2 ring-white scale-110' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {compiled?.error && (
                    <div className="text-[10px] text-red-500 mt-1 truncate">
                      {compiled.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Integral Area Configuration (if toggled) */}
          {showIntegral && (
            <div className={`p-2.5 rounded-xl border text-xs space-y-2 ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-blue-50/80 border-blue-200'
            }`}>
              <div className="flex items-center justify-between font-semibold text-[11px]">
                <span>{getTranslation('integral', lang)}</span>
                <span className="font-mono text-blue-500">
                  {liveIntegral && Number.isFinite(liveIntegral.value)
                    ? `≈ ${liveIntegral.value.toFixed(4)}`
                    : '—'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <label className="opacity-70">a =</label>
                <input
                  type="number"
                  value={integralRange[0]}
                  onChange={(e) =>
                    setIntegralRange([parseFloat(e.target.value) || 0, integralRange[1]])
                  }
                  className="w-14 px-1.5 py-0.5 rounded border text-center font-mono bg-inherit"
                />
                <label className="opacity-70">b =</label>
                <input
                  type="number"
                  value={integralRange[1]}
                  onChange={(e) =>
                    setIntegralRange([integralRange[0], parseFloat(e.target.value) || 0])
                  }
                  className="w-14 px-1.5 py-0.5 rounded border text-center font-mono bg-inherit"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: D3 SVG Graphing Surface */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden flex flex-col justify-center items-center bg-transparent"
        >
          <svg
            ref={svgRef}
            className="w-full h-full select-none"
            style={{ touchAction: 'none' }}
          />

          {/* Floating Live HUD / Inspector Badge */}
          {cursorPos && (
            <div
              className={`absolute top-3 right-3 px-3 py-1.5 rounded-xl shadow-lg border text-xs font-mono pointer-events-none backdrop-blur-md ${
                isDark
                  ? 'bg-slate-900/85 border-slate-700 text-slate-200'
                  : 'bg-white/90 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">X: {cursorPos.x}</span>
                <span className="text-emerald-500 font-bold">Y: {cursorPos.y}</span>
              </div>
              {selectedCompiled && selectedCompiled.isValid && (
                <div className="text-[11px] opacity-75 mt-0.5">
                  f({cursorPos.x}) = {selectedCompiled.evaluate(cursorPos.x).toFixed(4)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table of Values Modal / Drawer */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl border flex flex-col max-h-[80vh] overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-inherit">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-semibold">
                  {getTranslation('tableOfValues', lang)}: f(x) = {selectedFn?.expression}
                </h3>
              </div>
              <button
                onClick={() => setShowTableModal(false)}
                className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-500/10"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-inherit flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="opacity-70">Шаг (step):</span>
                <select
                  value={tableStep}
                  onChange={(e) => setTableStep(parseFloat(e.target.value))}
                  className="px-2 py-1 rounded border bg-inherit font-mono"
                >
                  <option value={0.1}>0.1</option>
                  <option value={0.5}>0.5</option>
                  <option value={1}>1.0</option>
                  <option value={2}>2.0</option>
                </select>
              </div>
              <span className="opacity-60 text-[11px]">
                {tableValues.length} значений в [ {domain[0].toFixed(1)}, {domain[1].toFixed(1)} ]
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-inherit opacity-60">
                    <th className="py-1.5 px-3">x</th>
                    <th className="py-1.5 px-3">f(x)</th>
                  </tr>
                </thead>
                <tbody>
                  {tableValues.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-inherit/20 ${
                        idx % 2 === 0 ? 'opacity-90' : 'opacity-70'
                      }`}
                    >
                      <td className="py-1 px-3 font-semibold">{row.x}</td>
                      <td className="py-1 px-3">
                        {row.y !== null ? row.y : <span className="text-red-500">не опр.</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
