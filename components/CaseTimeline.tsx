import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Reminder } from '../types';
import { Calendar, Filter, ZoomIn, RotateCcw, Clock, AlertTriangle, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CaseTimelineProps {
  reminders: Reminder[];
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ reminders }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 280 });
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [hoveredReminder, setHoveredReminder] = useState<Reminder | null>(null);
  const [filters, setFilters] = useState({
    filing: true,
    court_date: true,
    other: true,
  });

  // Safe Date Converter for Firestore Timestamps & ordinary dates
  const getEventDate = (reminder: Reminder): Date => {
    if (!reminder.date) return new Date();
    if (typeof reminder.date.toDate === 'function') {
      return reminder.date.toDate();
    }
    if (reminder.date.seconds) {
      return new Date(reminder.date.seconds * 1000);
    }
    return new Date(reminder.date);
  };

  // Resize Listener conforming to guidelines
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Keep a proportional, elegant height
      setDimensions({
        width: Math.max(width, 300),
        height: 260,
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Filter reminders
  const filteredReminders = reminders.filter((r) => {
    if (r.type === 'filing' && !filters.filing) return false;
    if (r.type === 'court_date' && !filters.court_date) return false;
    if (r.type === 'other' && !filters.other) return false;
    return true;
  });

  // Handle D3 Chart Rendering
  useEffect(() => {
    if (!svgRef.current || filteredReminders.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    const { width, height } = dimensions;
    const margin = { top: 40, right: 40, bottom: 50, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Define main viewport Group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Date bounds
    const dates = filteredReminders.map(getEventDate);
    const minDate = (d3.min(dates) || new Date()) as Date;
    const maxDate = (d3.max(dates) || new Date()) as Date;

    // Add +/- 7 days padding to boundaries so events don't lean on edge of axes
    const paddedMinDate = d3.timeDay.offset(minDate, -7);
    const paddedMaxDate = d3.timeDay.offset(maxDate, 7);

    // X Scale (Time Scale)
    const xScale = d3.scaleTime()
      .domain([paddedMinDate, paddedMaxDate])
      .range([0, chartWidth]);

    // Color definitions
    const getColor = (type: string) => {
      if (type === 'court_date') return '#3b82f6'; // Bright Blue
      if (type === 'filing') return '#f97316'; // Warning Orange
      return '#a855f7'; // Purple for Other
    };

    // Draw gridlines (ticks) for x-axis
    const xAxisGrid = d3.axisBottom(xScale)
      .tickSize(-chartHeight)
      .tickFormat(() => '');

    const gGrid = g.append('g')
      .attr('class', 'grid-lines text-neutral-800')
      .attr('transform', `translate(0, ${chartHeight})`)
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.25)
      .call(xAxisGrid);

    // Format Gridlines lines
    gGrid.selectAll('.tick line').attr('stroke', '#475569');

    // Horizontal Baseline of timeline
    g.append('line')
      .attr('x1', 0)
      .attr('y1', chartHeight / 2)
      .attr('x2', chartWidth)
      .attr('y2', chartHeight / 2)
      .attr('stroke', '#334155')
      .attr('stroke-width', 2);

    // TODAY line indicator
    const today = new Date();
    if (today >= paddedMinDate && today <= paddedMaxDate) {
      const todayX = xScale(today);
      
      // Draw vertical today line
      g.append('line')
        .attr('x1', todayX)
        .attr('y1', 0)
        .attr('x2', todayX)
        .attr('y2', chartHeight)
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4')
        .style('opacity', 0.8);

      // Label "Today"
      g.append('text')
        .attr('x', todayX + 5)
        .attr('y', 15)
        .attr('fill', '#ef4444')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('letter-spacing', '0.05em')
        .text('CURRENT DATE');
    }

    // Vertical dodger to avoid clustering/overlapping
    // Sort reminders chronologically first to align stacking correctly
    const sortedData = [...filteredReminders].sort((a, b) => getEventDate(a).getTime() - getEventDate(b).getTime());
    
    // We stack nodes in staggered levels: 3 levels above the line, and 3 below.
    // Or we stagger them mathematically based on proximity
    const nodesData = sortedData.map((reminder, idx) => {
      const date = getEventDate(reminder);
      const x = xScale(date);
      // Give each a vertical offset level centered around chartHeight / 2
      // Using a simple alternating algorithm or index-based offset
      const offsets = [
        -55,  // level -2
        -30,  // level -1
        30,   // level 1
        55,   // level 2
      ];
      const yOffset = offsets[idx % offsets.length] + (chartHeight / 2);
      
      return {
        reminder,
        x,
        y: yOffset,
      };
    });

    // Draw connection stems from the timeline axis to node orbits
    g.selectAll('.stem-line')
      .data(nodesData)
      .enter()
      .append('line')
      .attr('class', 'stem-line')
      .attr('x1', d => d.x)
      .attr('y1', chartHeight / 2)
      .attr('x2', d => d.x)
      .attr('y2', d => d.y)
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1)
      .style('stroke-dasharray', '2,2');

    // Create container for nodes (orbits)
    const nodeGroups = g.selectAll('.node-group')
      .data(nodesData)
      .enter()
      .append('g')
      .attr('class', 'node-group cursor-pointer');

    // Pulsing outer orbit for court_dates (critical)
    nodeGroups.filter(d => d.reminder.type === 'court_date')
      .append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 12)
      .attr('fill', 'none')
      .attr('stroke', d => getColor(d.reminder.type))
      .attr('stroke-width', 1.5)
      .style('opacity', 0.4)
      .style('animation', 'pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite')
      .attr('class', 'animate-pulse-ring');

    // Core circular node
    const circles = nodeGroups.append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => (selectedReminder?.id === d.reminder.id ? 8 : 6))
      .attr('fill', d => getColor(d.reminder.type))
      .attr('stroke', '#0a0a0a')
      .attr('stroke-width', 2)
      .style('transition', 'r 0.2s ease, fill-opacity 0.2s ease');

    // Tick labels/text along timeline bottom
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.max(width / 120, 3))
      .tickFormat(d3.timeFormat('%B %d') as any);

    const gx = g.append('g')
      .attr('class', 'x-axis text-neutral-400')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis);

    gx.select('.domain').attr('stroke', '#334155');
    gx.selectAll('.tick line').attr('stroke', '#334155');
    gx.selectAll('text')
      .style('font-family', '"Space Grotesk", sans-serif')
      .style('font-size', '10px')
      .style('font-weight', '500')
      .attr('dy', '1em');

    // Add interactivity/hover events
    nodeGroups
      .on('mouseover', function (event, d) {
        setHoveredReminder(d.reminder);
        d3.select(this).select('circle:not(.animate-pulse-ring)')
          .transition()
          .duration(150)
          .attr('r', 10);
      })
      .on('mouseout', function (event, d) {
        setHoveredReminder(null);
        d3.select(this).select('circle:not(.animate-pulse-ring)')
          .transition()
          .duration(150)
          .attr('r', selectedReminder?.id === d.reminder.id ? 8 : 6);
      })
      .on('click', function (event, d) {
        setSelectedReminder(d.reminder);
      });

    // Add zoom capability
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        const transform = event.transform;
        const newXScale = transform.rescaleX(xScale);

        // Update gridlines axis
        gGrid.call(xAxisGrid.scale(newXScale));
        gGrid.selectAll('.tick line').attr('stroke', '#475569');

        // Update timeline x-axis
        gx.call(xAxis.scale(newXScale));

        // Update node stems
        g.selectAll('.stem-line')
          .attr('x1', d => newXScale(getEventDate((d as any).reminder)))
          .attr('x2', d => newXScale(getEventDate((d as any).reminder)));

        // Update nodes positioning
        g.selectAll('.node-group circle')
          .attr('cx', d => newXScale(getEventDate((d as any).reminder)));

        // Update Today vertical line if visible
        if (today >= paddedMinDate && today <= paddedMaxDate) {
          g.select('line[stroke="#ef4444"]')
            .attr('x1', newXScale(today))
            .attr('x2', newXScale(today));

          g.select('text[fill="#ef4444"]')
            .attr('x', newXScale(today) + 5);
        }
      });

    // Register zoom
    svg.call(zoom);

    // Export resetting zoom to standard UI
    (svgRef as any).current._resetZoom = () => {
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
    };

  }, [filteredReminders, dimensions, selectedReminder]);

  // Handle dynamic countdown computation
  const getDaysCountdown = (reminder: Reminder) => {
    const targetDate = getEventDate(reminder);
    const diffTime = targetDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: 'Due Today', isSevere: true };
    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)} Day${Math.abs(diffDays) > 1 ? 's' : ''}`, isSevere: true };
    return { text: `In ${diffDays} Day${diffDays > 1 ? 's' : ''}`, isSevere: diffDays <= 3 };
  };

  const handleResetZoom = () => {
    if (svgRef.current && (svgRef as any).current._resetZoom) {
      (svgRef as any).current._resetZoom();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 px-4">
      <div className="bg-neutral-900 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
          <div>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em] mb-1.5 block">TEMPORAL ANALYTICS</span>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Calendar className="text-blue-500" size={24} />
              Chronological Case Map
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Legend filters */}
            <button
              onClick={() => setFilters({ ...filters, filing: !filters.filing })}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                filters.filing
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold'
                  : 'bg-neutral-950 border-white/5 text-gray-500 hover:text-gray-400'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              Filings
            </button>
            <button
              onClick={() => setFilters({ ...filters, court_date: !filters.court_date })}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                filters.court_date
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold'
                  : 'bg-neutral-950 border-white/5 text-gray-500 hover:text-gray-400'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Court Hearings
            </button>
            <button
              onClick={() => setFilters({ ...filters, other: !filters.other })}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                filters.other
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 font-bold'
                  : 'bg-neutral-950 border-white/5 text-gray-500 hover:text-gray-400'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Other
            </button>

            {reminders.length > 0 && (
              <button
                onClick={handleResetZoom}
                className="p-2 bg-neutral-950 border border-white/5 hover:border-white/15 rounded-xl text-xs text-gray-400 hover:text-white transition-all ml-1"
                title="Reset Zoom & Pan"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Timeline Chart Viewport */}
        {reminders.length === 0 ? (
          <div className="text-gray-500 text-center py-20 border border-dashed border-white/5 rounded-3xl relative z-10">
            <Info className="mx-auto mb-3 text-neutral-600" size={32} />
            <p className="text-sm">Log deadlines below to map your case's procedural vector path.</p>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="text-gray-500 text-center py-20 border border-dashed border-white/5 rounded-3xl relative z-10">
            <Filter className="mx-auto mb-3 text-neutral-600" size={32} />
            <p className="text-sm">Filter active. Please toggle types above to see events.</p>
          </div>
        ) : (
          <div className="relative w-full z-10" ref={containerRef}>
            {/* Axis Instructions Hint */}
            <div className="absolute top-0 right-2 text-[9px] text-gray-600 font-bold uppercase tracking-wider flex items-center gap-1 bg-black/30 px-2 py-1 rounded">
              <ZoomIn size={10} /> Scroll SVG area to zoom & drag to pan axis
            </div>

            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="w-full bg-neutral-950/20 rounded-2xl border border-white/5"
            />

            {/* Float Tooltip / Highlight on hovered dot */}
            <AnimatePresence>
              {hoveredReminder && (
                <div className="absolute top-2 left-6 bg-black/90 pointer-events-none border border-white/10 px-4 py-2.5 rounded-xl shadow-xl z-20">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      hoveredReminder.type === 'filing' ? 'bg-orange-500' :
                      hoveredReminder.type === 'court_date' ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{hoveredReminder.type}</span>
                  </div>
                  <h4 className="text-white text-xs font-bold leading-tight max-w-[180px] truncate">{hoveredReminder.title}</h4>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Selected Event Details Panel */}
        <AnimatePresence>
          {selectedReminder && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 p-6 bg-neutral-950/40 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                    selectedReminder.type === 'filing' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    selectedReminder.type === 'court_date' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {selectedReminder.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                    <Clock size={12} />
                    {getEventDate(selectedReminder).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{selectedReminder.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">{selectedReminder.description || 'No extended description recorded.'}</p>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0 gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block">UPLINK SCHEDULE</span>
                  <span className={`text-sm font-bold flex items-center gap-1.5 mt-0.5 ${
                    getDaysCountdown(selectedReminder).isSevere ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {getDaysCountdown(selectedReminder).isSevere && <AlertTriangle size={14} className="animate-pulse" />}
                    {getDaysCountdown(selectedReminder).text}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReminder(null)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-all flex items-center gap-1"
                >
                  Clear Selection
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
