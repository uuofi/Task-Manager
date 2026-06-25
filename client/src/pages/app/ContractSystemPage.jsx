import { useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link2, Network, Workflow, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { tasksApi } from '@/api/tasks.api';
import { useProjects } from '@/hooks/useProjects';
import { qk } from '@/lib/queryKeys';
import { STATUS, statusLabel } from '@/lib/taskMeta';

/** SVG canvas dimensions — the diagram scales responsively via viewBox. */
const W = 1100;
const H = 720;
const CENTER = { x: W / 2, y: H / 2 };
const NODE_R = 6; // sub-contract (task) dot radius
const HUB_R = 13; // contract (project) dot radius
const HIT_R = 18; // invisible grab/hit area around a dot
const MARGIN = 28; // keep dots away from the canvas edge

const LS_KEY = 'taskcontrol-contract-links';

/** Status → hex (SVG strokes/fills can't use Tailwind utility classes). */
const STATUS_HEX = {
  backlog: '#a1a1aa',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  review: '#a855f7',
  done: '#10b981',
  cancelled: '#d4d4d8',
};

/** Normalises an unordered project-pair into a stable key. */
const pairKey = (a, b) => [a, b].sort().join('::');

/**
 * Builds the unified node list (project hubs + their task dots). Project hubs sit
 * on a large ellipse; each project's tasks orbit their own hub.
 */
function buildNodes(projects, boardsByProject) {
  const P = projects.length;
  const nodes = [];

  const hubRX = P > 1 ? Math.min(400, 170 + P * 16) : 0;
  const hubRY = P > 1 ? Math.min(260, 120 + P * 12) : 0;

  projects.forEach((proj, pi) => {
    const angle = P > 1 ? (pi / P) * Math.PI * 2 - Math.PI / 2 : 0;
    const hub = { x: CENTER.x + Math.cos(angle) * hubRX, y: CENTER.y + Math.sin(angle) * hubRY };
    nodes.push({
      key: `project-${proj.id}`,
      type: 'project',
      id: proj.id,
      label: proj.key,
      color: proj.color || '#0d9488',
      anchor: hub,
    });

    const tasks = boardsByProject[proj.id] ?? [];
    const tCount = tasks.length;
    const ringR = P > 1 ? Math.min(120, 50 + tCount * 6) : Math.min(240, 120 + tCount * 7);
    tasks.forEach((tk, ti) => {
      const a = (ti / Math.max(1, tCount)) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        key: `task-${tk.id}`,
        type: 'task',
        id: tk.id,
        projectId: proj.id,
        label: tk.key,
        status: tk.status,
        deps: (tk.dependencies ?? []).map(String),
        taskRef: tk,
        anchor: { x: hub.x + Math.cos(a) * ringR, y: hub.y + Math.sin(a) * ringR },
      });
    });
  });

  return nodes;
}

function ContractDiagram({
  nodes,
  projectLinks,
  linkMode,
  pendingSource,
  onProjectClick,
  onOpenTask,
  onOpenProject,
  onRemoveLink,
}) {
  const svgRef = useRef(null);

  // Live render data, refs keep handlers/loop free of re-subscription churn.
  const anchorsRef = useRef([]);
  const floatRef = useRef([]);
  const nodesRef = useRef(nodes);
  const [positions, setPositions] = useState([]);

  // Drag bookkeeping.
  const dragIndexRef = useRef(null);
  const movedRef = useRef(false);
  const downPtRef = useRef({ x: 0, y: 0 });
  const [dragIndex, setDragIndex] = useState(null);

  useEffect(() => {
    nodesRef.current = nodes;
  });

  // Structural signature → reseed only when the graph's shape changes (not on
  // every animation frame or board refetch with identical data).
  const sig = useMemo(() => nodes.map((n) => `${n.key}:${n.status ?? ''}`).join('|'), [nodes]);

  // Lookups for drawing edges by node index.
  const projectIndexById = useMemo(() => {
    const m = new Map();
    nodes.forEach((n, i) => n.type === 'project' && m.set(String(n.id), i));
    return m;
  }, [nodes]);
  const taskIndexById = useMemo(() => {
    const m = new Map();
    nodes.forEach((n, i) => n.type === 'task' && m.set(String(n.id), i));
    return m;
  }, [nodes]);

  // Seed anchors + per-node float parameters when the structure changes.
  useEffect(() => {
    const base = nodesRef.current;
    anchorsRef.current = base.map((n) => ({ ...n.anchor }));
    floatRef.current = base.map((n) => {
      const big = n.type === 'project';
      return {
        ax: (big ? 3 : 5) + Math.random() * (big ? 3 : 6),
        ay: (big ? 3 : 5) + Math.random() * (big ? 3 : 6),
        sx: 0.5 + Math.random() * 0.7,
        sy: 0.5 + Math.random() * 0.7,
        px: Math.random() * Math.PI * 2,
        py: Math.random() * Math.PI * 2,
      };
    });
    setPositions(base.map((n) => ({ ...n.anchor })));
  }, [sig]);

  // Animation loop: drift every non-dragged node around its anchor.
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = (now - start) / 1000;
      setPositions(
        anchorsRef.current.map((a, i) => {
          if (dragIndexRef.current === i) return { x: a.x, y: a.y };
          const f = floatRef.current[i];
          if (!f) return { x: a.x, y: a.y };
          return {
            x: a.x + Math.sin(t * f.sx + f.px) * f.ax,
            y: a.y + Math.cos(t * f.sy + f.py) * f.ay,
          };
        }),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sig]);

  const posAt = (i) => positions[i] ?? nodes[i]?.anchor ?? { x: 0, y: 0 };

  /** Screen-space pointer → SVG viewBox coordinates. */
  const toSvgPoint = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  const handleNodePointerDown = (e, i) => {
    e.stopPropagation();
    dragIndexRef.current = i;
    movedRef.current = false;
    downPtRef.current = { x: e.clientX, y: e.clientY };
    setDragIndex(i);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const i = dragIndexRef.current;
    if (i === null) return;
    const dx = e.clientX - downPtRef.current.x;
    const dy = e.clientY - downPtRef.current.y;
    if (dx * dx + dy * dy > 16) movedRef.current = true; // 4px threshold
    const p = toSvgPoint(e.clientX, e.clientY);
    anchorsRef.current[i] = {
      x: Math.max(MARGIN, Math.min(W - MARGIN, p.x)),
      y: Math.max(MARGIN, Math.min(H - MARGIN, p.y)),
    };
  };

  const endDrag = () => {
    const i = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragIndex(null);
    if (i === null || movedRef.current) return; // a real drag → no click action
    const node = nodesRef.current[i];
    if (!node) return;
    if (node.type === 'project') {
      if (linkMode) onProjectClick(node.id);
      else onOpenProject(node.id);
    } else if (!linkMode) {
      onOpenTask(node.taskRef);
    }
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full select-none"
      style={{ touchAction: 'none' }}
      role="img"
      aria-label="Contract system diagram"
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" />
        </marker>
      </defs>

      {/* Spokes: each sub-contract links back to its contract hub. */}
      {nodes.map((n, i) => {
        if (n.type !== 'task') return null;
        const hubIdx = projectIndexById.get(String(n.projectId));
        if (hubIdx === undefined) return null;
        const a = posAt(hubIdx);
        const b = posAt(i);
        return (
          <line
            key={`spoke-${n.key}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            className="stroke-border"
            strokeWidth={1.25}
            strokeDasharray="4 4"
          />
        );
      })}

      {/* Task → task dependency links. */}
      {nodes.map((n, i) => {
        if (n.type !== 'task') return null;
        return (n.deps ?? []).map((dep) => {
          const from = taskIndexById.get(dep);
          if (from === undefined || from === i) return null;
          const a = posAt(from);
          const b = posAt(i);
          return (
            <line
              key={`dep-${n.key}-${dep}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className="stroke-primary/60"
              strokeWidth={1.75}
              markerEnd="url(#arrow)"
            />
          );
        });
      })}

      {/* Project ↔ project links (user-created). Click to remove. */}
      {projectLinks.map((lnk) => {
        const ai = projectIndexById.get(String(lnk.a));
        const bi = projectIndexById.get(String(lnk.b));
        if (ai === undefined || bi === undefined) return null;
        const a = posAt(ai);
        const b = posAt(bi);
        return (
          <line
            key={`plink-${lnk.a}-${lnk.b}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            className="stroke-orange-500 cursor-pointer"
            strokeWidth={3}
            strokeDasharray="8 5"
            onClick={() => onRemoveLink(lnk.a, lnk.b)}
          >
            <title>Click to remove link</title>
          </line>
        );
      })}

      {/* Nodes — project hubs + task dots, floating & draggable. */}
      {nodes.map((n, i) => {
        const p = posAt(i);
        const isProject = n.type === 'project';
        const color = isProject ? n.color : STATUS_HEX[n.status] ?? '#a1a1aa';
        const r = isProject ? HUB_R : NODE_R;
        const isDragged = dragIndex === i;
        const isPending = isProject && pendingSource === n.id;
        return (
          <g
            key={n.key}
            transform={`translate(${p.x} ${p.y})`}
            className={dragIndex !== null ? 'cursor-grabbing' : 'cursor-grab'}
            onPointerDown={(e) => handleNodePointerDown(e, i)}
          >
            {/* Invisible larger circle → easy to grab small dots. */}
            <circle r={HIT_R} fill="transparent" />
            {isProject && <circle r={r + 7} fill={color} opacity={0.18} />}
            {(isDragged || isPending) && (
              <circle r={r + 5} fill={color} opacity={isPending ? 0.4 : 0.25} />
            )}
            <motion.circle
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              r={r}
              fill={color}
              stroke="white"
              strokeWidth={isProject ? 2 : 1.5}
              className="drop-shadow-sm"
            />
            <text
              x={0}
              y={r + (isProject ? 16 : 13)}
              textAnchor="middle"
              className={
                isProject
                  ? 'fill-foreground pointer-events-none text-[13px] font-bold'
                  : 'fill-muted-foreground pointer-events-none text-[10px] font-medium'
              }
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ContractSystemPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading: projectsLoading } = useProjects();
  const projects = useMemo(() => data?.data ?? [], [data]);

  // Fetch every project's board so all contracts appear at once.
  const boardQueries = useQueries({
    queries: projects.map((p) => ({
      queryKey: qk.board(p.id),
      queryFn: () => tasksApi.board(p.id),
      enabled: !!p.id,
    })),
  });
  const boardsLoading = boardQueries.some((q) => q.isLoading);
  // A cheap signature that changes only when fetched board data actually changes.
  const boardsSig = boardQueries.map((q) => q.dataUpdatedAt).join(',');

  const boardsByProject = useMemo(() => {
    const map = {};
    projects.forEach((p, i) => {
      map[p.id] = boardQueries[i]?.data ?? [];
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, boardsSig]);

  const nodes = useMemo(() => buildNodes(projects, boardsByProject), [projects, boardsByProject]);

  // Project ↔ project links — client-side, persisted to localStorage.
  const [projectLinks, setProjectLinks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) ?? [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(projectLinks));
  }, [projectLinks]);

  const [linkMode, setLinkMode] = useState(false);
  const [pendingSource, setPendingSource] = useState(null);

  const toggleLinkMode = () => {
    setLinkMode((v) => !v);
    setPendingSource(null);
  };

  const handleProjectClick = (id) => {
    // Note: keep the two state updates separate. Nesting setProjectLinks inside
    // a setPendingSource updater double-fires it under StrictMode (toggling the
    // link twice → nothing happens).
    if (!pendingSource) {
      setPendingSource(id);
      return;
    }
    if (pendingSource === id) {
      setPendingSource(null);
      return;
    }
    const key = pairKey(pendingSource, id);
    setProjectLinks((links) =>
      links.some((l) => pairKey(l.a, l.b) === key)
        ? links.filter((l) => pairKey(l.a, l.b) !== key)
        : [...links, { a: pendingSource, b: id }],
    );
    setPendingSource(null);
  };

  const removeLink = (a, b) => {
    const key = pairKey(a, b);
    setProjectLinks((links) => links.filter((l) => pairKey(l.a, l.b) !== key));
  };

  const totalTasks = nodes.filter((n) => n.type === 'task').length;
  const depCount = useMemo(
    () => nodes.reduce((sum, n) => sum + (n.type === 'task' ? n.deps.length : 0), 0),
    [nodes],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title={t('contracts.title')}
        description={t('contracts.subtitle')}
        actions={
          projects.length > 0 && (
            <div className="flex items-center gap-2">
              {projectLinks.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setProjectLinks([])}>
                  <X className="size-4" /> {t('contracts.clearLinks')}
                </Button>
              )}
              <Button variant={linkMode ? 'cta' : 'outline'} size="sm" onClick={toggleLinkMode}>
                <Link2 className="size-4" />
                {linkMode ? t('contracts.linking') : t('contracts.linkProjects')}
              </Button>
            </div>
          )
        }
      />

      {projectsLoading ? (
        <Skeleton className="h-[640px] w-full rounded-xl" />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Network}
          title={t('contracts.noContracts')}
          description={t('contracts.noContractsDesc')}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="py-4">
              <CardContent>
                <p className="text-muted-foreground text-xs">{t('contracts.contracts')}</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardContent>
                <p className="text-muted-foreground text-xs">{t('contracts.subContracts')}</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardContent>
                <p className="text-muted-foreground text-xs">{t('contracts.links')}</p>
                <p className="text-2xl font-bold">{depCount + projectLinks.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden py-0">
            <CardContent className="p-0">
              {/* Legend / link-mode banner */}
              <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
                <Workflow className="text-primary size-4" />
                <span className="text-sm font-medium">{t('contracts.systemMap')}</span>
                {linkMode && (
                  <Badge variant="secondary" className="gap-1">
                    <Link2 className="size-3" />
                    {pendingSource ? t('contracts.pickSecond') : t('contracts.pickFirst')}
                  </Badge>
                )}
                <div className="ms-auto flex flex-wrap items-center gap-3">
                  {Object.entries(STATUS)
                    .filter(([, v]) => v.column)
                    .map(([key, v]) => (
                      <span key={key} className="flex items-center gap-1.5 text-xs">
                        <span className={`size-2.5 rounded-full ${v.dot}`} />
                        {statusLabel(key)}
                      </span>
                    ))}
                </div>
              </div>

              <div className="h-[600px] w-full bg-muted/20">
                {boardsLoading ? (
                  <div className="grid h-full place-items-center">
                    <Skeleton className="size-40 rounded-full" />
                  </div>
                ) : (
                  <ContractDiagram
                    nodes={nodes}
                    projectLinks={projectLinks}
                    linkMode={linkMode}
                    pendingSource={pendingSource}
                    onProjectClick={handleProjectClick}
                    onOpenTask={(task) => navigate(`/app/tasks/${task.id}`)}
                    onOpenProject={(id) => navigate(`/app/projects/${id}`)}
                    onRemoveLink={removeLink}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Badge variant="secondary">{t('contracts.tip')}</Badge>
            {t('contracts.tipText')}
          </p>
        </>
      )}
    </div>
  );
}

export default ContractSystemPage;
