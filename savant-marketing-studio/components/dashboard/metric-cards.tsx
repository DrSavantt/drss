'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Users, Zap, FileText, HardDrive, Target } from 'lucide-react';
import { springTransitions } from '@/lib/animations';

interface MetricData {
  clientHealth: {
    health: number;
    total: number;
    active: number;
    activePercent: number;
    questionnairesCompleted: number;
    questionnairePercent: number;
    inactive: number;
    overdueProjects: number;
  } | null;
  projectVelocity: {
    avgVelocity: number;
    total: number;
    backlog: number;
    inProgress: number;
    inReview: number;
    done: number;
    completedThisWeek: number;
    stuck: number;
    completionRate: number;
  } | null;
  contentOutput: {
    thisMonth: number;
    thisWeek: number;
    total: number;
    byType: Record<string, number>;
  } | null;
  storage: {
    totalMB: number;
    filesCount: number;
    filesThisWeek: number;
  } | null;
  capacity: {
    currentClients: number;
    maxCapacity: number;
    capacityPercent: number;
    clientsCanAdd: number;
    hoursPerWeek: number;
    avgHoursPerClient: number;
  } | null;
}

interface MetricCardsProps {
  autoExpand?: string;
}

export function MetricCards({ autoExpand }: MetricCardsProps) {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      setMetrics(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoExpand) {
      setExpanded(prev => ({ ...prev, [autoExpand]: true }));
      setActiveCard(autoExpand);
    }
  }, [autoExpand]);

  const toggleExpand = (metricKey: string) => {
    setExpanded(prev => ({ ...prev, [metricKey]: !prev[metricKey] }));
    setActiveCard(expanded[metricKey] ? null : metricKey);
  };

  if (loading || !metrics) {
    return (
      <div className="flex flex-col gap-3 max-w-4xl">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-muted/20 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-muted/20 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const getHealthColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-green-500';
    if (value >= threshold * 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col gap-3 max-w-4xl">
      
      {/* METRIC 1: CLIENT HEALTH */}
      {metrics.clientHealth && (
        <motion.div
          layout
          className={`
            relative overflow-hidden
            bg-glass-bg backdrop-blur-xl 
            border border-glass-border rounded-xl p-5
            transition-all duration-300
            ${activeCard === 'clientHealth' ? 'ring-2 ring-active-ring shadow-xl shadow-active-shadow' : ''}
          `}
        >
          {/* Spotlight on active */}
          <AnimatePresence>
            {activeCard === 'clientHealth' && (
              <motion.div
                className="absolute inset-0 bg-gradient-radial from-active-ring via-active-shadow to-transparent pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springTransitions.springMicro}
              />
            )}
          </AnimatePresence>

          <button 
            onClick={() => toggleExpand('clientHealth')}
            className="relative z-10 w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-red-primary" />
              <span className="text-sm font-medium text-muted-foreground">Client Health</span>
            </div>
            <motion.div
              animate={{ rotate: expanded.clientHealth ? 180 : 0 }}
              transition={springTransitions.springMicro}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>
          
          <div className={`relative z-10 text-3xl font-bold ${getHealthColor(metrics.clientHealth.health, 80)}`}>
            {metrics.clientHealth.health}%
          </div>
          
          <AnimatePresence>
            {expanded.clientHealth && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springTransitions.springMedium}
                className="overflow-hidden relative z-10"
              >
                <div className="mt-4 space-y-1 border-t border-border pt-4">
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Clients</span>
                    <span className="text-sm text-foreground">{metrics.clientHealth.total}</span>
                  </div>
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Active (30d)</span>
                    <span className="text-sm text-green-500">{metrics.clientHealth.active}</span>
                  </div>
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Questionnaires Done</span>
                    <span className="text-sm text-foreground">{metrics.clientHealth.questionnairesCompleted}</span>
                  </div>
                  {metrics.clientHealth.inactive > 0 && (
                    <div className="w-full flex justify-between p-2 rounded-lg">
                      <span className="text-sm text-muted-foreground">Inactive</span>
                      <span className="text-sm text-yellow-500">{metrics.clientHealth.inactive}</span>
                    </div>
                  )}
                  {metrics.clientHealth.overdueProjects > 0 && (
                    <div className="w-full flex justify-between p-2 rounded-lg">
                      <span className="text-sm text-muted-foreground">With Overdue Projects</span>
                      <span className="text-sm text-red-500">{metrics.clientHealth.overdueProjects}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* METRIC 2: PROJECT VELOCITY */}
      {metrics.projectVelocity && (
        <motion.div
          layout
          className={`
            relative overflow-hidden
            bg-glass-bg backdrop-blur-xl 
            border border-glass-border rounded-xl p-5
            transition-all duration-300
            ${activeCard === 'projectVelocity' ? 'ring-2 ring-active-ring shadow-xl shadow-active-shadow' : ''}
          `}
        >
          <AnimatePresence>
            {activeCard === 'projectVelocity' && (
              <motion.div
                className="absolute inset-0 bg-gradient-radial from-active-ring via-active-shadow to-transparent pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springTransitions.springMicro}
              />
            )}
          </AnimatePresence>

          <button 
            onClick={() => toggleExpand('projectVelocity')}
            className="relative z-10 w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-red-primary" />
              <span className="text-sm font-medium text-muted-foreground">Project Velocity</span>
            </div>
            <motion.div
              animate={{ rotate: expanded.projectVelocity ? 180 : 0 }}
              transition={springTransitions.springMicro}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>
          
          <div className="relative z-10 text-3xl font-bold text-foreground">
            {metrics.projectVelocity.avgVelocity} <span className="text-sm text-muted-foreground">days</span>
          </div>
          
          <AnimatePresence>
            {expanded.projectVelocity && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springTransitions.springMedium}
                className="overflow-hidden relative z-10"
              >
                <div className="mt-4 space-y-1 border-t border-border pt-4">
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Backlog</span>
                    <span className="text-sm text-foreground">{metrics.projectVelocity.backlog}</span>
                  </div>
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">In Progress</span>
                    <span className="text-sm text-blue-500">{metrics.projectVelocity.inProgress}</span>
                  </div>
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">In Review</span>
                    <span className="text-sm text-yellow-500">{metrics.projectVelocity.inReview}</span>
                  </div>
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Done</span>
                    <span className="text-sm text-green-500">{metrics.projectVelocity.done}</span>
                  </div>
                  {metrics.projectVelocity.stuck > 0 && (
                    <div className="w-full flex justify-between p-2 rounded-lg">
                      <span className="text-sm text-muted-foreground">Stuck (7+ days)</span>
                      <span className="text-sm text-red-500">{metrics.projectVelocity.stuck}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* METRIC 3: CONTENT OUTPUT */}
      {metrics.contentOutput && (
        <motion.div
          layout
          className={`
            relative overflow-hidden
            bg-glass-bg backdrop-blur-xl 
            border border-glass-border rounded-xl p-5
            transition-all duration-300
            ${activeCard === 'contentOutput' ? 'ring-2 ring-active-ring shadow-xl shadow-active-shadow' : ''}
          `}
        >
          <AnimatePresence>
            {activeCard === 'contentOutput' && (
              <motion.div
                className="absolute inset-0 bg-gradient-radial from-active-ring via-active-shadow to-transparent pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springTransitions.springMicro}
              />
            )}
          </AnimatePresence>

          <button 
            onClick={() => toggleExpand('contentOutput')}
            className="relative z-10 w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-red-primary" />
              <span className="text-sm font-medium text-muted-foreground">Content Output</span>
            </div>
            <motion.div
              animate={{ rotate: expanded.contentOutput ? 180 : 0 }}
              transition={springTransitions.springMicro}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>
          
          <div className="relative z-10 text-3xl font-bold text-foreground">
            {metrics.contentOutput.thisMonth} <span className="text-sm text-muted-foreground">this month</span>
          </div>
          
          <AnimatePresence>
            {expanded.contentOutput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springTransitions.springMedium}
                className="overflow-hidden relative z-10"
              >
                <div className="mt-4 space-y-1 border-t border-border pt-4">
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">This Week</span>
                    <span className="text-sm text-foreground">{metrics.contentOutput.thisWeek}</span>
                  </div>
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-sm text-foreground">{metrics.contentOutput.total}</span>
                  </div>
                  {Object.entries(metrics.contentOutput.byType).map(([type, count]) => (
                    <div 
                      key={type}
                      className="w-full flex justify-between p-2 rounded-lg"
                    >
                      <span className="text-sm text-muted-foreground capitalize">{type.replace('_', ' ')}</span>
                      <span className="text-sm text-foreground">{count as number}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* METRIC 4: STORAGE */}
      {metrics.storage && (
        <motion.div
          layout
          className={`
            relative overflow-hidden
            bg-glass-bg backdrop-blur-xl 
            border border-glass-border rounded-xl p-5
            transition-all duration-300
            ${activeCard === 'storage' ? 'ring-2 ring-active-ring shadow-xl shadow-active-shadow' : ''}
          `}
        >
          <AnimatePresence>
            {activeCard === 'storage' && (
              <motion.div
                className="absolute inset-0 bg-gradient-radial from-active-ring via-active-shadow to-transparent pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springTransitions.springMicro}
              />
            )}
          </AnimatePresence>

          <button 
            onClick={() => toggleExpand('storage')}
            className="relative z-10 w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-red-primary" />
              <span className="text-sm font-medium text-muted-foreground">Storage Used</span>
            </div>
            <motion.div
              animate={{ rotate: expanded.storage ? 180 : 0 }}
              transition={springTransitions.springMicro}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>
          
          <div className="relative z-10 text-3xl font-bold text-foreground">
            {metrics.storage.totalMB} <span className="text-sm text-muted-foreground">MB</span>
          </div>
          
          <AnimatePresence>
            {expanded.storage && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springTransitions.springMedium}
                className="overflow-hidden relative z-10"
              >
                <div className="mt-4 space-y-1 border-t border-border pt-4">
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Files</span>
                    <span className="text-sm text-foreground">{metrics.storage.filesCount}</span>
                  </div>
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Files This Week</span>
                    <span className="text-sm text-foreground">{metrics.storage.filesThisWeek}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* METRIC 5: CAPACITY */}
      {metrics.capacity && (
        <motion.div
          layout
          className={`
            relative overflow-hidden
            bg-glass-bg backdrop-blur-xl 
            border border-glass-border rounded-xl p-5
            transition-all duration-300
            ${activeCard === 'capacity' ? 'ring-2 ring-active-ring shadow-xl shadow-active-shadow' : ''}
          `}
        >
          <AnimatePresence>
            {activeCard === 'capacity' && (
              <motion.div
                className="absolute inset-0 bg-gradient-radial from-active-ring via-active-shadow to-transparent pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springTransitions.springMicro}
              />
            )}
          </AnimatePresence>

          <button 
            onClick={() => toggleExpand('capacity')}
            className="relative z-10 w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-red-primary" />
              <span className="text-sm font-medium text-muted-foreground">Capacity</span>
            </div>
            <motion.div
              animate={{ rotate: expanded.capacity ? 180 : 0 }}
              transition={springTransitions.springMicro}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>
          
          <div className={`relative z-10 text-3xl font-bold ${getHealthColor(100 - metrics.capacity.capacityPercent, 50)}`}>
            {metrics.capacity.capacityPercent}% <span className="text-sm text-muted-foreground">used</span>
          </div>
          
          <AnimatePresence>
            {expanded.capacity && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springTransitions.springMedium}
                className="overflow-hidden relative z-10"
              >
                <div className="mt-4 space-y-1 border-t border-border pt-4">
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Current Clients</span>
                    <span className="text-sm text-foreground">{metrics.capacity.currentClients}</span>
                  </div>
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Can Add</span>
                    <span className="text-sm text-green-500">{metrics.capacity.clientsCanAdd}</span>
                  </div>
                  <div className="w-full flex justify-between p-2 rounded-lg">
                    <span className="text-sm text-muted-foreground">Hours Per Client</span>
                    <span className="text-sm text-foreground">{metrics.capacity.avgHoursPerClient}h</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

    </div>
  );
}
