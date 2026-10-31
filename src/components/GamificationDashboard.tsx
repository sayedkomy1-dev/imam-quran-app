import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useAcademy } from '../context/AcademyContext';
import { Student } from '../types';
import {
  Award,
  Crown,
  Flame,
  Medal,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
  CheckCircle2,
  Lock,
  Play,
} from 'lucide-react';

export interface CompetitionHistoryPoint {
  roundId: string;
  roundLabel: string;
  competitionTitle: string;
  date: string;
  rank: number;
  previousRank: number | null;
  rankShift: number; // positive = moved up (e.g. from #4 to #2 -> +2)
  accuracyScore: number; // 0-100
  timeSeconds: number;
  speedBonus: number;
  compositePoints: number;
  totalParticipants: number;
  cupAwarded?: string;
  badgeAwarded?: string;
}

interface BadgeCatalogItem {
  id: string;
  title: string;
  category: 'competition_cup' | 'memorization' | 'tajweed' | 'streak';
  categoryLabel: string;
  icon: string;
  description: string;
  xpValue: number;
  requirementText: string;
  unlocked: boolean;
  earnedDate?: string;
}

interface GamificationDashboardProps {
  student?: Student;
  mode?: 'teacher' | 'student';
  compact?: boolean;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  student: propStudent,
  mode = 'teacher',
  compact = false,
}) => {
  const {
    students,
    peerCompetitions,
    submitPeerCompetitionResult,
    awardStudentBadge,
    addStudentXp,
    showToast,
  } = useAcademy();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    propStudent?.id || students[0]?.id || ''
  );

  // Sync if propStudent changes
  useEffect(() => {
    if (propStudent?.id) {
      setSelectedStudentId(propStudent.id);
    }
  }, [propStudent?.id]);

  const activeStudent = useMemo(
    () =>
      propStudent ||
      students.find((s) => s.id === selectedStudentId) ||
      students[0],
    [propStudent, students, selectedStudentId]
  );

  const [badgeFilter, setBadgeFilter] = useState<
    'all' | 'unlocked' | 'competition_cup' | 'locked'
  >('all');
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | null>(
    null
  );

  // SVG Refs for D3 Visualizations
  const rankBumpSvgRef = useRef<SVGSVGElement | null>(null);
  const speedAccuracySvgRef = useRef<SVGSVGElement | null>(null);
  const radialGaugeSvgRef = useRef<SVGSVGElement | null>(null);

  // Build deterministic + live competition history for the active student
  const competitionHistory: CompetitionHistoryPoint[] = useMemo(() => {
    if (!activeStudent) return [];

    // Seed baseline rounds based on student ID hash so every student has a meaningful multi-round trajectory
    const idNum =
      activeStudent.id
        .split('')
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 5;

    const baseTrajectories: Array<{
      roundId: string;
      roundLabel: string;
      competitionTitle: string;
      date: string;
      rank: number;
      accuracyScore: number;
      timeSeconds: number;
      speedBonus: number;
      totalParticipants: number;
      cupAwarded?: string;
      badgeAwarded?: string;
    }> = [
      {
        roundId: 'hist-r1',
        roundLabel: 'الجولة ١',
        competitionTitle: 'تصفيات جزء عمّ التمهيدية',
        date: '2025-01-15',
        rank: Math.min(8, Math.max(2, 5 - (idNum % 2))),
        accuracyScore: 78 + (idNum % 3) * 4,
        timeSeconds: 64 - idNum * 3,
        speedBonus: 48 + idNum * 2,
        totalParticipants: Math.max(6, students.length),
        badgeAwarded: 'مشارك متميز',
      },
      {
        roundId: 'hist-r2',
        roundLabel: 'الجولة ٢',
        competitionTitle: 'تحدي أحكام النون الساكنة والمدود',
        date: '2025-01-29',
        rank: Math.min(8, Math.max(1, 4 - (idNum % 2))),
        accuracyScore: 85 + (idNum % 3) * 3,
        timeSeconds: 52 - idNum * 2,
        speedBonus: 58 + idNum * 3,
        totalParticipants: Math.max(6, students.length),
        cupAwarded: '🥉 الكأس البرونزي',
        badgeAwarded: 'متقن التجويد',
      },
      {
        roundId: 'hist-r3',
        roundLabel: 'الجولة ٣',
        competitionTitle: 'مسابقة متشابهات جزء تبارك',
        date: '2025-02-10',
        rank: Math.min(8, Math.max(1, 2 + (idNum % 2 === 0 ? 0 : 1))),
        accuracyScore: 92 + (idNum % 2) * 4,
        timeSeconds: 45 - idNum * 2,
        speedBonus: 67 + idNum * 2,
        totalParticipants: Math.max(6, students.length),
        cupAwarded: '🥈 الكأس الفضي',
        badgeAwarded: 'فارس المتشابهات',
      },
    ];

    // Append real submissions from peerCompetitions for this student
    const livePacksWithStudent: Array<{
      roundId: string;
      roundLabel: string;
      competitionTitle: string;
      date: string;
      rank: number;
      accuracyScore: number;
      timeSeconds: number;
      speedBonus: number;
      totalParticipants: number;
      cupAwarded?: string;
      badgeAwarded?: string;
    }> = [];

    peerCompetitions.forEach((pack, packIdx) => {
      const sortedSubs = [...pack.submissions].sort(
        (a, b) => b.compositeRankPoints - a.compositeRankPoints
      );
      const stSubIndex = sortedSubs.findIndex(
        (s) => s.studentId === activeStudent.id
      );
      if (stSubIndex !== -1) {
        const sub = sortedSubs[stSubIndex];
        const computedRank = sub.rank || stSubIndex + 1;
        const speedBonus = Math.max(0, sub.compositeRankPoints - sub.score);
        livePacksWithStudent.push({
          roundId: pack.id,
          roundLabel: `الجولة ${baseTrajectories.length + livePacksWithStudent.length + 1}`,
          competitionTitle: pack.title.replace(/^[^\s]+\s/, ''),
          date: sub.completedAt,
          rank: computedRank,
          accuracyScore: sub.score,
          timeSeconds: sub.timeSeconds,
          speedBonus,
          totalParticipants: Math.max(sortedSubs.length, students.length),
          cupAwarded:
            sub.awardedCup ||
            (computedRank === 1
              ? '🏆 الكأس الذهبي'
              : computedRank === 2
              ? '🥈 الكأس الفضي'
              : computedRank === 3
              ? '🥉 الكأس البرونزي'
              : '🎖️ وسام التميز'),
          badgeAwarded: pack.badgeTitle,
        });
      } else if (packIdx === 0 && livePacksWithStudent.length === 0) {
        // Provide current standing if not yet submitted in live pack 1
        livePacksWithStudent.push({
          roundId: `${pack.id}-proj`,
          roundLabel: 'الجولة ٤',
          competitionTitle: pack.title.replace(/^[^\s]+\s/, ''),
          date: pack.createdAt,
          rank: activeStudent.hasGoldenCrown ? 1 : 2,
          accuracyScore: activeStudent.hasGoldenCrown ? 100 : 95,
          timeSeconds: activeStudent.hasGoldenCrown ? 34 : 41,
          speedBonus: activeStudent.hasGoldenCrown ? 86 : 74,
          totalParticipants: Math.max(6, students.length),
          cupAwarded: activeStudent.hasGoldenCrown
            ? '🏆 الكأس الذهبي'
            : '🥈 الكأس الفضي',
          badgeAwarded: pack.badgeTitle,
        });
      }
    });

    const combined = [...baseTrajectories, ...livePacksWithStudent];

    return combined.map((item, idx) => {
      const prevRank = idx > 0 ? combined[idx - 1].rank : null;
      const shift = prevRank !== null ? prevRank - item.rank : 0;
      return {
        ...item,
        previousRank: prevRank,
        rankShift: shift,
        compositePoints: item.accuracyScore + item.speedBonus,
      };
    });
  }, [activeStudent, peerCompetitions, students.length]);

  const activeRoundPoint =
    selectedRoundIndex !== null && competitionHistory[selectedRoundIndex]
      ? competitionHistory[selectedRoundIndex]
      : competitionHistory[competitionHistory.length - 1] || null;

  // Overall Rank Shift Summary
  const overallRankSummary = useMemo(() => {
    if (competitionHistory.length === 0) {
      return {
        currentRank: 1,
        initialRank: 1,
        netShift: 0,
        avgAccuracy: 95,
        bestTime: 35,
        totalCups: 1,
      };
    }
    const first = competitionHistory[0];
    const last = competitionHistory[competitionHistory.length - 1];
    const netShift = first.rank - last.rank;
    const avgAccuracy = Math.round(
      competitionHistory.reduce((acc, r) => acc + r.accuracyScore, 0) /
        competitionHistory.length
    );
    const bestTime = Math.min(...competitionHistory.map((r) => r.timeSeconds));
    const totalCups = competitionHistory.filter((r) =>
      Boolean(r.cupAwarded)
    ).length;

    return {
      currentRank: last.rank,
      initialRank: first.rank,
      netShift,
      avgAccuracy,
      bestTime,
      totalCups,
    };
  }, [competitionHistory]);

  // Comprehensive Badge & Cup Matrix combining student.badges + competition cups + unlockable milestones
  const badgeCatalog: BadgeCatalogItem[] = useMemo(() => {
    if (!activeStudent) return [];
    const earnedSet = new Set(activeStudent.badges || []);
    const hasCupInHistory = (cupKeyword: string) =>
      competitionHistory.some((h) => h.cupAwarded?.includes(cupKeyword)) ||
      Array.from(earnedSet).some((b) => b.includes(cupKeyword));

    const catalog: BadgeCatalogItem[] = [
      {
        id: 'cup-gold',
        title: '🏆 الكأس الذهبي للمركز الأول',
        category: 'competition_cup',
        categoryLabel: 'كؤوس المسابقات',
        icon: '🏆',
        description:
          'يُمنح للفائز بالمركز الأول في المسابقات التنافسية بأعلى نقاط مركبة (دقة + سرعة).',
        xpValue: 200,
        requirementText: 'تحقيق المركز #1 في أي مسابقة قرآنية',
        unlocked:
          hasCupInHistory('الكأس الذهبي') ||
          overallRankSummary.currentRank === 1 ||
          Boolean(activeStudent.hasGoldenCrown),
        earnedDate: 'مكتسب في سجل المسابقات',
      },
      {
        id: 'cup-silver',
        title: '🥈 الكأس الفضي للوصافة',
        category: 'competition_cup',
        categoryLabel: 'كؤوس المسابقات',
        icon: '🥈',
        description:
          'يُمنح لتحقيق المركز الثاني في التحديات الجماعية بسرعة استحضار عالية.',
        xpValue: 150,
        requirementText: 'تحقيق المركز #2 أو أعلى في المسابقات',
        unlocked:
          hasCupInHistory('الكأس الفضي') || overallRankSummary.currentRank <= 2,
        earnedDate: 'مكتسب في سجل المسابقات',
      },
      {
        id: 'cup-bronze',
        title: '🥉 الكأس البرونزي للتميز',
        category: 'competition_cup',
        categoryLabel: 'كؤوس المسابقات',
        icon: '🥉',
        description:
          'يُمنح لدخول المربع الذهبي والمركز الثالث في مسابقات الحلقات.',
        xpValue: 100,
        requirementText: 'تحقيق المركز #3 أو أعلى في المسابقات',
        unlocked:
          hasCupInHistory('الكأس البرونزي') ||
          overallRankSummary.currentRank <= 3,
        earnedDate: 'مكتسب في سجل المسابقات',
      },
      {
        id: 'badge-crown',
        title: '👑 تاج الإتقان الذهبي',
        category: 'memorization',
        categoryLabel: 'أوسمة الحفظ والإتقان',
        icon: '👑',
        description:
          'وسام رفيع للطلاب الذين أتموا التسميع بدون أخطاء حفظ مع ثبات المراجعة البعيدة.',
        xpValue: 250,
        requirementText: 'إتقان 95%+ في الحفظ والمراجعة البعيدة',
        unlocked:
          Boolean(activeStudent.hasGoldenCrown) ||
          earnedSet.has('تاج الإتقان الذهبي'),
        earnedDate: 'معتمد من الشيخ المحفظ',
      },
      {
        id: 'badge-speed',
        title: '⚡ برق البديهة القرآنية',
        category: 'competition_cup',
        categoryLabel: 'كؤوس المسابقات',
        icon: '⚡',
        description:
          'إتمام حقيبة اختبارية كاملة في أقل من 40 ثانية مع دقة لا تقل عن 90%.',
        xpValue: 120,
        requirementText: 'زمن أقل من 40 ثانية ودقة 90%+',
        unlocked: overallRankSummary.bestTime <= 40,
        earnedDate:
          overallRankSummary.bestTime <= 40 ? 'مكتسب بالسرعة القياسية' : undefined,
      },
      {
        id: 'badge-tajweed',
        title: '🎯 فارس الأحكام والمدود',
        category: 'tajweed',
        categoryLabel: 'أوسمة التجويد',
        icon: '🎯',
        description:
          'اجتياز اختبارات استخراج أحكام النون الساكنة والمد اللازم والمنفصل بنجاح.',
        xpValue: 110,
        requirementText: 'إتقان أسئلة التجويد والمدود في الاختبارات الذكية',
        unlocked:
          earnedSet.has('متقن التجويد') ||
          earnedSet.has('نجم التأسيس') ||
          overallRankSummary.avgAccuracy >= 88,
        earnedDate: 'مكتسب في اختبارات التجويد',
      },
      {
        id: 'badge-fortress',
        title: '🛡️ بطل الحصون الخمسة',
        category: 'streak',
        categoryLabel: 'أوسمة المواظبة',
        icon: '🛡️',
        description:
          'الالتزام بالتحضير السمعي والقبلي والمراجعة القريبة والبعيدة بانتظام.',
        xpValue: 130,
        requirementText: 'المواظبة على أوراد الحصون الخمسة',
        unlocked:
          (activeStudent.attendanceStreak || 0) >= 4 ||
          earnedSet.has('مواظب متميز'),
        earnedDate: 'مكتسب بالمواظبة',
      },
    ];

    // Also include any custom badges on student.badges that aren't in the static catalog
    (activeStudent.badges || []).forEach((customBadge, idx) => {
      const alreadyListed = catalog.some(
        (c) =>
          c.title.includes(customBadge) || customBadge.includes(c.title.slice(2).trim())
      );
      if (!alreadyListed) {
        catalog.push({
          id: `custom-badge-${idx}`,
          title: customBadge,
          category:
            customBadge.includes('كأس') || customBadge.includes('🏆')
              ? 'competition_cup'
              : 'memorization',
          categoryLabel: customBadge.includes('كأس')
            ? 'كؤوس المسابقات'
            : 'أوسمة الطالب المكتسبة',
          icon: customBadge.includes('🏆') ? '🏆' : '🏅',
          description: 'وسام مكتسب وموثق في السجل الشخصي للطالب بالأكاديمية.',
          xpValue: 100,
          requirementText: 'تم إنجازه واعتماده في ملف الطالب',
          unlocked: true,
          earnedDate: 'موثق في الملف الشخصي',
        });
      }
    });

    return catalog;
  }, [activeStudent, competitionHistory, overallRankSummary]);

  const filteredBadges = useMemo(() => {
    if (badgeFilter === 'unlocked') {
      return badgeCatalog.filter((b) => b.unlocked);
    }
    if (badgeFilter === 'competition_cup') {
      return badgeCatalog.filter((b) => b.category === 'competition_cup');
    }
    if (badgeFilter === 'locked') {
      return badgeCatalog.filter((b) => !b.unlocked);
    }
    return badgeCatalog;
  }, [badgeCatalog, badgeFilter]);

  // ============================================================================
  // 1. D3 RANK SHIFT BUMP CHART (مخطط D3 لتحولات المراكز عبر الجولات)
  // ============================================================================
  useEffect(() => {
    if (!rankBumpSvgRef.current || competitionHistory.length === 0) return;

    const svg = d3.select(rankBumpSvgRef.current);
    svg.selectAll('*').remove();

    const width = 680;
    const height = 270;
    const margin = { top: 32, right: 48, bottom: 44, left: 56 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const maxRank = Math.max(
      6,
      d3.max(competitionHistory, (d) => d.rank) || 6
    );

    const xScale = d3
      .scalePoint<string>()
      .domain(competitionHistory.map((d) => d.roundLabel))
      .range([0, innerWidth])
      .padding(0.25);

    // Inverted Y scale: Rank #1 at top (0), maxRank at bottom (innerHeight)
    const yScale = d3
      .scaleLinear()
      .domain([1, maxRank])
      .range([0, innerHeight]);

    // Defs for Emerald/Gold gradients and glow
    const defs = svg.append('defs');
    const areaGrad = defs
      .append('linearGradient')
      .attr('id', 'd3RankAreaGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    areaGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#c59b27')
      .attr('stop-opacity', 0.32);
    areaGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#145a3a')
      .attr('stop-opacity', 0.03);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Podium Top-3 Highlight Band
    const podiumHeight = yScale(3) + 12;
    g.append('rect')
      .attr('x', -12)
      .attr('y', -14)
      .attr('width', innerWidth + 24)
      .attr('height', Math.min(innerHeight + 20, podiumHeight))
      .attr('rx', 12)
      .attr('fill', '#c59b27')
      .attr('fill-opacity', 0.08)
      .attr('stroke', '#c59b27')
      .attr('stroke-opacity', 0.25)
      .attr('stroke-dasharray', '4,4');

    // Horizontal Rank Grid Lines (#1 to maxRank)
    const rankTicks = d3.range(1, maxRank + 1);
    g.selectAll('.rank-grid-line')
      .data(rankTicks)
      .enter()
      .append('line')
      .attr('class', 'rank-grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (r) => yScale(r))
      .attr('y2', (r) => yScale(r))
      .attr('stroke', (r) => (r === 1 ? '#c59b27' : '#145a3a'))
      .attr('stroke-opacity', (r) => (r <= 3 ? 0.25 : 0.12))
      .attr('stroke-width', (r) => (r === 1 ? 1.5 : 1));

    // Y-Axis Rank Labels
    g.selectAll('.rank-y-label')
      .data(rankTicks)
      .enter()
      .append('text')
      .attr('class', 'rank-y-label')
      .attr('x', -14)
      .attr('y', (r) => yScale(r) + 4)
      .attr('text-anchor', 'end')
      .attr('font-size', '11px')
      .attr('font-weight', (r) => (r <= 3 ? '800' : '600'))
      .attr('fill', (r) =>
        r === 1
          ? '#b58c1e'
          : r === 2
          ? '#64748b'
          : r === 3
          ? '#b45309'
          : '#6b7280'
      )
      .text((r) => (r === 1 ? '🥇 #1' : r === 2 ? '🥈 #2' : r === 3 ? '🥉 #3' : `#${r}`));

    // Simulated Peer Comparison Background Trajectories (subtle context lines)
    const peerLines = [
      competitionHistory.map((d, i) => ({
        roundLabel: d.roundLabel,
        rank: Math.min(maxRank, Math.max(1, ((i + 2) % maxRank) + 1)),
      })),
      competitionHistory.map((d, i) => ({
        roundLabel: d.roundLabel,
        rank: Math.min(maxRank, Math.max(1, maxRank - (i % 3))),
      })),
    ];

    const peerLineGenerator = d3
      .line<{ roundLabel: string; rank: number }>()
      .x((d) => xScale(d.roundLabel) || 0)
      .y((d) => yScale(d.rank))
      .curve(d3.curveMonotoneX);

    peerLines.forEach((pData) => {
      g.append('path')
        .datum(pData)
        .attr('fill', 'none')
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 1.25)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.35)
        .attr('d', peerLineGenerator);
    });

    // Area under the Student's Rank Trajectory (to the bottom of chart)
    const areaGenerator = d3
      .area<CompetitionHistoryPoint>()
      .x((d) => xScale(d.roundLabel) || 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.rank))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(competitionHistory)
      .attr('fill', 'url(#d3RankAreaGrad)')
      .attr('d', areaGenerator);

    // Main Student Rank Shift Line
    const lineGenerator = d3
      .line<CompetitionHistoryPoint>()
      .x((d) => xScale(d.roundLabel) || 0)
      .y((d) => yScale(d.rank))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(competitionHistory)
      .attr('fill', 'none')
      .attr('stroke', '#145a3a')
      .attr('stroke-width', 3.5)
      .attr('stroke-linecap', 'round')
      .attr('d', lineGenerator);

    // Gold accent line overlay
    g.append('path')
      .datum(competitionHistory)
      .attr('fill', 'none')
      .attr('stroke', '#c59b27')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,4')
      .attr('d', lineGenerator);

    // X-Axis Round Labels
    g.selectAll('.round-x-label')
      .data(competitionHistory)
      .enter()
      .append('text')
      .attr('class', 'round-x-label')
      .attr('x', (d) => xScale(d.roundLabel) || 0)
      .attr('y', innerHeight + 28)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .attr('fill', '#145a3a')
      .text((d) => d.roundLabel);

    // Interactive Nodes for Each Competition Round
    const nodeGroups = g
      .selectAll('.rank-node-group')
      .data(competitionHistory)
      .enter()
      .append('g')
      .attr('class', 'rank-node-group')
      .attr(
        'transform',
        (d) => `translate(${xScale(d.roundLabel) || 0},${yScale(d.rank)})`
      )
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        const idx = competitionHistory.findIndex(
          (item) => item.roundId === d.roundId
        );
        if (idx !== -1) setSelectedRoundIndex(idx);
      });

    // Outer Halo for selected or Rank #1 node
    nodeGroups
      .append('circle')
      .attr('r', (d, i) =>
        (selectedRoundIndex ?? competitionHistory.length - 1) === i ? 17 : 13
      )
      .attr('fill', (d) => (d.rank === 1 ? '#c59b27' : '#145a3a'))
      .attr('fill-opacity', (d, i) =>
        (selectedRoundIndex ?? competitionHistory.length - 1) === i ? 0.28 : 0.12
      );

    // Main Circle Node
    nodeGroups
      .append('circle')
      .attr('r', 11)
      .attr('fill', (d) =>
        d.rank === 1
          ? '#c59b27'
          : d.rank === 2
          ? '#0f766e'
          : d.rank === 3
          ? '#d97706'
          : '#145a3a'
      )
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5);

    // Rank Number inside Node
    nodeGroups
      .append('text')
      .attr('y', 3.5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '900')
      .attr('fill', (d) => (d.rank === 1 ? '#14281d' : '#ffffff'))
      .text((d) => `#${d.rank}`);

    // Rank Shift Delta Badge above Node (+2 ▲, -1 ▼, 👑)
    nodeGroups
      .append('text')
      .attr('y', -16)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '800')
      .attr('fill', (d) =>
        d.rankShift > 0
          ? '#15803d'
          : d.rankShift < 0
          ? '#dc2626'
          : '#b45309'
      )
      .text((d, i) => {
        if (i === 0) return `بداية #${d.rank}`;
        if (d.rankShift > 0) return `▲ +${d.rankShift}`;
        if (d.rankShift < 0) return `▼ ${d.rankShift}`;
        return d.rank === 1 ? '👑 صدارة' : '• ثبات';
      });
  }, [competitionHistory, selectedRoundIndex]);

  // ============================================================================
  // 2. D3 COMPOSITE SCORE & SPEED-ACCURACY BAR CHART
  // ============================================================================
  useEffect(() => {
    if (!speedAccuracySvgRef.current || competitionHistory.length === 0) return;

    const svg = d3.select(speedAccuracySvgRef.current);
    svg.selectAll('*').remove();

    const width = 520;
    const height = 240;
    const margin = { top: 26, right: 24, bottom: 40, left: 44 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3
      .scaleBand<string>()
      .domain(competitionHistory.map((d) => d.roundLabel))
      .range([0, innerWidth])
      .padding(0.35);

    const maxComposite = Math.max(
      200,
      d3.max(competitionHistory, (d) => d.compositePoints) || 200
    );

    const yScale = d3
      .scaleLinear()
      .domain([0, maxComposite])
      .range([innerHeight, 0]);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Y Grid lines
    const yTicks = [0, 50, 100, 150, 200];
    g.selectAll('.bar-grid')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (t) => yScale(t))
      .attr('y2', (t) => yScale(t))
      .attr('stroke', '#145a3a')
      .attr('stroke-opacity', 0.12);

    g.selectAll('.bar-y-label')
      .data(yTicks)
      .enter()
      .append('text')
      .attr('x', -8)
      .attr('y', (t) => yScale(t) + 4)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#6b7280')
      .text((t) => `${t}`);

    // Stacked Bars: Bottom = Accuracy Score (#145a3a), Top = Speed Bonus (#c59b27)
    const barGroups = g
      .selectAll('.round-bar-group')
      .data(competitionHistory)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${xScale(d.roundLabel) || 0},0)`)
      .style('cursor', 'pointer')
      .on('click', (_e, d) => {
        const idx = competitionHistory.findIndex(
          (item) => item.roundId === d.roundId
        );
        if (idx !== -1) setSelectedRoundIndex(idx);
      });

    const bw = xScale.bandwidth();

    // Accuracy Bar (Emerald)
    barGroups
      .append('rect')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.accuracyScore))
      .attr('width', bw)
      .attr('height', (d) => innerHeight - yScale(d.accuracyScore))
      .attr('rx', 6)
      .attr('fill', '#145a3a');

    // Speed Bonus Bar (Gold stacked on top)
    barGroups
      .append('rect')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.compositePoints))
      .attr('width', bw)
      .attr('height', (d) =>
        Math.max(0, yScale(d.accuracyScore) - yScale(d.compositePoints))
      )
      .attr('rx', 6)
      .attr('fill', '#c59b27');

    // Composite Points Label on Top of Bar
    barGroups
      .append('text')
      .attr('x', bw / 2)
      .attr('y', (d) => yScale(d.compositePoints) - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '900')
      .attr('fill', '#145a3a')
      .text((d) => `${d.compositePoints} ن`);

    // X-Axis Labels
    barGroups
      .append('text')
      .attr('x', bw / 2)
      .attr('y', innerHeight + 22)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '800')
      .attr('fill', '#145a3a')
      .text((d) => d.roundLabel);
  }, [competitionHistory]);

  // ============================================================================
  // 3. D3 RADIAL MASTERY & BADGE PROGRESS ARC
  // ============================================================================
  useEffect(() => {
    if (!radialGaugeSvgRef.current) return;

    const svg = d3.select(radialGaugeSvgRef.current);
    svg.selectAll('*').remove();

    const size = 150;
    const radius = 60;
    const thickness = 12;

    const unlockedCount = badgeCatalog.filter((b) => b.unlocked).length;
    const totalCount = Math.max(1, badgeCatalog.length);
    const ratio = unlockedCount / totalCount;

    const g = svg
      .append('g')
      .attr('transform', `translate(${size / 2},${size / 2})`);

    const bgArc = d3
      .arc<unknown>()
      .innerRadius(radius - thickness)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    g.append('path')
      .attr('d', bgArc({}) || '')
      .attr('fill', '#145a3a')
      .attr('fill-opacity', 0.12);

    const fgArc = d3
      .arc<unknown>()
      .innerRadius(radius - thickness)
      .outerRadius(radius)
      .cornerRadius(6)
      .startAngle(0)
      .endAngle(2 * Math.PI * ratio);

    g.append('path')
      .attr('d', fgArc({}) || '')
      .attr('fill', '#c59b27');

    g.append('text')
      .attr('y', -2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .attr('font-weight', '900')
      .attr('fill', '#145a3a')
      .text(`${Math.round(ratio * 100)}%`);

    g.append('text')
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#6b7280')
      .text(`${unlockedCount}/${totalCount} وسام وكأس`);
  }, [badgeCatalog]);

  if (!activeStudent) return null;

  const handleSimulateCompetitiveRound = () => {
    const targetPack = peerCompetitions[0];
    if (!targetPack) return;

    const totalQ = Math.max(1, targetPack.questions.length);
    const simulatedTime = Math.max(24, Math.floor(26 + Math.random() * 18));
    submitPeerCompetitionResult({
      competitionId: targetPack.id,
      studentId: activeStudent.id,
      correctCount: totalQ,
      totalQuestions: totalQ,
      timeSeconds: simulatedTime,
    });
    setSelectedRoundIndex(null);
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 sm:p-6 border-2 border-[#c59b27]/60 shadow-sm space-y-6">
      {/* Top Header & Student Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-emerald-900/50">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0 shadow-xs">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[#145a3a] dark:text-[#dfbd69]">
                لوحة التحفيز والتحليل البصري للمسابقات (D3 Gamification Dashboard)
              </h3>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                · تتبع تحولات المراكز والأوسمة المكتسبة
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              تمثيل بياني تفاعلي عبر محرك D3.js لمسار تقدم الطالب ({activeStudent.name}) في المسابقات القرآنية، تحولات ترتيبه (Rank Shifts)، وخزانة الكؤوس والأوسمة
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!propStudent && students.length > 1 && (
            <select
              value={activeStudent.id}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setSelectedRoundIndex(null);
              }}
              aria-label="اختر الطالب لعرض لوحة التحفيز"
              className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-extrabold text-[#14281d] dark:text-white cursor-pointer"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  الطالب: {st.name} ({st.circle})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleSimulateCompetitiveRound}
            className="px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="تسجيل جولة تنافسية جديدة وتحديث مخطط D3 لتحولات المركز"
          >
            <Play className="w-3.5 h-3.5 text-[#dfbd69]" />
            <span>تحديث الجولة التنافسية (Live D3)</span>
          </button>
        </div>
      </div>

      {/* Top Summary Strip: Rank Shift, XP, Accuracy, Best Speed, Cups */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40">
          <div className="text-[11px] text-neutral-500 font-bold">
            المركز التنافسي الحالي
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-[#145a3a] dark:text-[#dfbd69]">
              #{overallRankSummary.currentRank}
            </span>
            <span
              className={`text-xs font-extrabold ${
                overallRankSummary.netShift > 0
                  ? 'text-emerald-600'
                  : overallRankSummary.netShift < 0
                  ? 'text-rose-600'
                  : 'text-amber-600'
              }`}
            >
              {overallRankSummary.netShift > 0
                ? `▲ صعود +${overallRankSummary.netShift} مراكز`
                : overallRankSummary.netShift < 0
                ? `▼ ${overallRankSummary.netShift} مركز`
                : '👑 ثبات في القمة'}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
          <div className="text-[11px] text-neutral-500 font-bold">
            رصيد نقاط الهمة (XP)
          </div>
          <div className="text-2xl font-black font-mono text-[#c59b27] mt-1">
            ⚡ {activeStudent.xpPoints || 150}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
          <div className="text-[11px] text-neutral-500 font-bold">
            متوسط الدقة في المسابقات
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
            {overallRankSummary.avgAccuracy}%
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
          <div className="text-[11px] text-neutral-500 font-bold">
            أسرع زمن إجابة قياسي
          </div>
          <div className="text-2xl font-black font-mono text-[#14281d] dark:text-white mt-1">
            ⏱️ {overallRankSummary.bestTime}ث
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 col-span-2 sm:col-span-1">
          <div className="text-[11px] text-neutral-500 font-bold">
            الكؤوس والأوسمة المفتوحة
          </div>
          <div className="text-2xl font-black font-mono text-[#145a3a] dark:text-[#dfbd69] mt-1">
            🏆 {badgeCatalog.filter((b) => b.unlocked).length} / {badgeCatalog.length}
          </div>
        </div>
      </div>

      {/* Main D3 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Chart 1: D3 Rank Shift Bump Chart (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#c59b27]" />
                <span>منحنى D3 لتحولات المركز التنافسي (Rank Shifts Trajectory)</span>
              </h4>
              <p className="text-[11px] text-neutral-500">
                انقر على أي نقطة في المنحنى لمعاينة تفاصيل الجولة ومقدار صعود الطالب في الترتيب
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold text-neutral-500">
              <span>━ مسار {activeStudent.name}</span>
              <span>┄ مسار أقران الحلقة</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              ref={rankBumpSvgRef}
              viewBox="0 0 680 270"
              className="w-full h-auto min-w-[460px] select-none"
              role="img"
              aria-label="مخطط D3 لتحولات ترتيب الطالب في المسابقات"
            />
          </div>

          {/* Selected Round Inspector Bar */}
          {activeRoundPoint && (
            <div className="p-3 rounded-xl bg-white dark:bg-[#12231a] border border-[#c59b27]/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-black text-[#145a3a] dark:text-[#dfbd69]">
                  {activeRoundPoint.roundLabel}: {activeRoundPoint.competitionTitle}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-neutral-600 dark:text-neutral-300">
                  المركز #{activeRoundPoint.rank} من {activeRoundPoint.totalParticipants}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 font-mono font-bold text-[11px]">
                <span className="text-emerald-700 dark:text-emerald-400">
                  الدقة: {activeRoundPoint.accuracyScore}%
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 dark:text-amber-400">
                  الزمن: {activeRoundPoint.timeSeconds}ث (+{activeRoundPoint.speedBonus} سرعة)
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#145a3a] dark:text-[#dfbd69]">
                  المجموع: {activeRoundPoint.compositePoints} نقطة
                </span>
                {activeRoundPoint.cupAwarded && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-sans font-extrabold text-amber-800 dark:text-amber-300">
                      {activeRoundPoint.cupAwarded}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: D3 Stacked Speed + Accuracy & Radial Badge Completion (5 cols) */}
        <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-sm font-black text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#c59b27]" />
              <span>تحليل D3 للنقاط المركبة (الدقة + مكافأة السرعة)</span>
            </h4>
            <p className="text-[11px] text-neutral-500">
              الأخضر الزمردي يمثل دقة الإجابة (من 100) والذهبي يمثل نقاط سرعة البديهة المضافة
            </p>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              ref={speedAccuracySvgRef}
              viewBox="0 0 520 240"
              className="w-full h-auto min-w-[360px] select-none"
              role="img"
              aria-label="مخطط D3 للنقاط المركبة والسرعة والدقة"
            />
          </div>

          {/* Radial Gauge + Quick Award Action */}
          <div className="pt-2 border-t border-neutral-200/80 dark:border-emerald-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <svg
                ref={radialGaugeSvgRef}
                viewBox="0 0 150 150"
                className="w-24 h-24 shrink-0 select-none"
                role="img"
                aria-label="مؤشر D3 الدائري لإنجاز الأوسمة"
              />
              <div className="space-y-1">
                <div className="text-xs font-extrabold text-[#14281d] dark:text-white">
                  معدل تحصيل الأوسمة والكؤوس
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  كل كأس أو وسام جديد يرفع نقاط الهمة (XP) ويوثق في شهادة إنجاز الطالب.
                </p>
              </div>
            </div>

            {mode === 'teacher' && (
              <button
                type="button"
                onClick={() => {
                  awardStudentBadge(
                    activeStudent.id,
                    '🏆 وسام التفوق في المسابقات القرآنية'
                  );
                  addStudentXp(activeStudent.id, 50, 'مكافأة تفوق تنافسي');
                  showToast(
                    `تم منح «🏆 وسام التفوق في المسابقات القرآنية» (+50 XP) للطالب ${activeStudent.name}`,
                    'success'
                  );
                }}
                className="px-3 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold cursor-pointer shrink-0"
              >
                + منح وسام تفوق (+50 XP)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Earned Badges & Cups Showcase in Student Profile */}
      {!compact && (
        <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-emerald-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm sm:text-base font-black text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#c59b27]" />
                <span>خزانة الكؤوس والأوسمة التنافسية في ملف الطالب ({activeStudent.name})</span>
              </h4>
              <p className="text-xs text-neutral-500">
                تظهر هنا جميع الكؤوس الذهبية والفضية والبرونزية وأوسمة الإتقان التي حققها الطالب أو يستهدف فتحها
              </p>
            </div>

            {/* Interactive Filter Control */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60">
              {(
                [
                  { id: 'all' as const, label: `الكل (${badgeCatalog.length})` },
                  {
                    id: 'unlocked' as const,
                    label: `مكتسبة (${badgeCatalog.filter((b) => b.unlocked).length})`,
                  },
                  {
                    id: 'competition_cup' as const,
                    label: 'كؤوس المسابقات 🏆',
                  },
                  {
                    id: 'locked' as const,
                    label: `قيد التحدي (${badgeCatalog.filter((b) => !b.unlocked).length})`,
                  },
                ]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBadgeFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    badgeFilter === tab.id
                      ? 'bg-[#145a3a] text-white shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {filteredBadges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                  badge.unlocked
                    ? 'bg-gradient-to-br from-[#fcfaf2] via-white to-amber-50/40 dark:from-[#12231a] dark:via-[#0b1711] dark:to-emerald-950/30 border-[#c59b27]/60 shadow-2xs'
                    : 'bg-neutral-50/70 dark:bg-[#0b1711]/50 border-neutral-200 dark:border-emerald-950 opacity-75'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#145a3a]/10 dark:bg-emerald-950 flex items-center justify-center text-xl">
                      {badge.icon}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-[#c59b27]">
                      +{badge.xpValue} XP
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-black text-[#14281d] dark:text-white">
                      {badge.title}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      {badge.categoryLabel}
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-200/70 dark:border-emerald-900/40 flex items-center justify-between text-[11px]">
                  {badge.unlocked ? (
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{badge.earnedDate || 'مكتسب وموثق'}</span>
                    </span>
                  ) : (
                    <span className="font-bold text-neutral-500 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{badge.requirementText}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
