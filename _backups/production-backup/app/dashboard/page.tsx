'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, FolderKanban, FileText, BookOpen } from 'lucide-react';
import { MetricCards } from '@/components/dashboard/metric-cards';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { metroItemVariants, metroContainerVariants } from '@/lib/animations';

export default function DashboardPage() {
  const [counts, setCounts] = useState({
    clients: 0,
    projects: 0,
    content: 0,
  });

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch('/api/metrics');
        const data = await res.json();
        setCounts({
          clients: data.clientHealth?.total || 0,
          projects: data.projectVelocity?.total || 0,
          content: data.contentOutput?.total || 0,
        });
      } catch (error) {
        console.error('Failed to fetch counts:', error);
      }
    }
    fetchCounts();
  }, []);

  return (
    <div className="space-y-6 md:space-y-8 pb-8 pt-2 md:pt-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wider mb-2 md:mb-4 text-foreground">
          DASHBOARD
        </h1>
        <p className="text-muted-foreground text-sm md:text-lg">Welcome back! Here&apos;s your agency overview</p>
      </div>
      
      {/* Quick Create Metro Tiles */}
      <section>
        <motion.div 
          className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4"
          variants={metroContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* CLIENT TILE */}
          <Link href="/dashboard/clients/new">
            <motion.div
              variants={metroItemVariants}
              className="relative overflow-hidden group cursor-pointer"
            >
              <div className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-xl p-4 md:p-6 h-28 md:h-32 flex flex-col justify-between transition-all hover:border-red-primary/50 active:bg-surface-highlight">
                <div className="flex items-center justify-between">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-red-primary" />
                  {counts.clients > 0 && (
                    <span className="text-lg md:text-2xl font-bold text-red-primary">{counts.clients}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-foreground">CLIENT</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Create new</p>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* PROJECT TILE */}
          <Link href="/dashboard/projects/board">
            <motion.div
              variants={metroItemVariants}
              className="relative overflow-hidden group cursor-pointer"
            >
              <div className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-xl p-4 md:p-6 h-28 md:h-32 flex flex-col justify-between transition-all hover:border-red-primary/50 active:bg-surface-highlight">
                <div className="flex items-center justify-between">
                  <FolderKanban className="w-6 h-6 md:w-8 md:h-8 text-red-primary" />
                  {counts.projects > 0 && (
                    <span className="text-lg md:text-2xl font-bold text-red-primary">{counts.projects}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-foreground">PROJECT</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Create new</p>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* CONTENT TILE */}
          <Link href="/dashboard/content">
            <motion.div
              variants={metroItemVariants}
              className="relative overflow-hidden group cursor-pointer"
            >
              <div className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-xl p-4 md:p-6 h-28 md:h-32 flex flex-col justify-between transition-all hover:border-red-primary/50 active:bg-surface-highlight">
                <div className="flex items-center justify-between">
                  <FileText className="w-6 h-6 md:w-8 md:h-8 text-red-primary" />
                  {counts.content > 0 && (
                    <span className="text-lg md:text-2xl font-bold text-red-primary">{counts.content}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-foreground">CONTENT</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Create new</p>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* NOTE TILE */}
          <Link href="/dashboard/journal">
            <motion.div
              variants={metroItemVariants}
              className="relative overflow-hidden group cursor-pointer"
            >
              <div className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-xl p-4 md:p-6 h-28 md:h-32 flex flex-col justify-between transition-all hover:border-red-primary/50 active:bg-surface-highlight">
                <div className="flex items-center justify-between">
                  <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-red-primary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-foreground">NOTE</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Quick capture</p>
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </section>
      
      {/* Key Metrics - The new collapsible cards */}
      <section>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-wide mb-4 md:mb-6 text-foreground border-b-2 border-border pb-2">
          KEY METRICS
        </h2>
        <MetricCards />
      </section>
      
      {/* Activity Feed - Single unified section */}
      <section>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-wide mb-4 md:mb-6 text-foreground border-b-2 border-border pb-2">
          RECENT ACTIVITY
        </h2>
        <div className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-xl p-4 md:p-6">
          <RecentActivity />
        </div>
      </section>
    </div>
  );
}
