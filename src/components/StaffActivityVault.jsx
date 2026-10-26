import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';

export default function StaffActivityVault({ currentUser }) {
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('EXECUTIVE_SUMMARY');
  // 'EXECUTIVE_SUMMARY' | 'EMPLOYEE_RANKING' | 'BOOKS_INVENTORY' | 'SESSIONS' | 'AUDIT_LOGS' | 'A4_PREVIEW'

  // Period Filtering (Monthly / Yearly / Quick Ranges)
  const currentYear = new Date().getFullYear();
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [periodMode, setPeriodMode] = useState('MONTHLY'); // 'MONTHLY' | 'YEARLY' | 'TODAY' | '7DAYS' | 'ALL'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // STRICT OWNER-ONLY CHECK
  const userRole = String(currentUser?.role || 'OWNER').toUpperCase();
  const isOwner = userRole === 'OWNER' || userRole === 'SUPER_ADMIN';

  // Calculate exact start & end ISO timestamps for the chosen period
  const dateBounds = useMemo(() => {
    const now = new Date();
    if (periodMode === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      return { start: start.toISOString(), end: end.toISOString(), label: `Daily Audit (${start.toLocaleDateString()})` };
    }
    if (periodMode === '7DAYS') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start: start.toISOString(), end: now.toISOString(), label: 'Last 7 Days Audit' };
    }
    if (periodMode === 'MONTHLY' && selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number);
      const start = new Date(y, m - 1, 1, 0, 0, 0);
      const end = new Date(y, m, 0, 23, 59, 59);
      const monthName = start.toLocaleString('default', { month: 'long', year: 'numeric' });
      return { start: start.toISOString(), end: end.toISOString(), label: `Monthly Audit — ${monthName}` };
    }
    if (periodMode === 'YEARLY' && selectedYear) {
      const y = Number(selectedYear);
      const start = new Date(y, 0, 1, 0, 0, 0);
      const end = new Date(y, 11, 31, 23, 59, 59);
      return { start: start.toISOString(), end: end.toISOString(), label: `Annual Master Audit — Year ${y}` };
    }
    return { start: null, end: null, label: 'All-Time Master Store Audit' };
  }, [periodMode, selectedMonth, selectedYear]);

  // Fetch All Store Audit Data (Free-Tier Optimized Parallel Fetch)
  const fetchVaultData = async () => {
    setLoading(true);
    try {
      let sessionQuery = supabase
        .from('staff_sessions')
        .select('*')
        .order('login_at', { ascending: false })
        .limit(500);

      let auditQuery = supabase
        .from('staff_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (dateBounds.start) {
        sessionQuery = sessionQuery.gte('login_at', dateBounds.start);
        auditQuery = auditQuery.gte('created_at', dateBounds.start);
      }
      if (dateBounds.end) {
        sessionQuery = sessionQuery.lte('login_at', dateBounds.end);
        auditQuery = auditQuery.lte('created_at', dateBounds.end);
      }

      // Safely fetch orders and books without crashing if table schemas differ
      const ordersPromise = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(400)
        .then((res) => res.data || [])
        .catch(() => []);

      const booksPromise = supabase
        .from('books')
        .select('*')
        .limit(500)
        .then((res) => res.data || [])
        .catch(() => []);

      const [sessRes, auditRes, ordersData, booksData] = await Promise.all([
        sessionQuery,
        auditQuery,
        ordersPromise,
        booksPromise
      ]);

      setSessions(sessRes.data || []);
      setAuditLogs(auditRes.data || []);

      // Filter orders client-side by dateBounds so any date column name works safely
      const filteredOrders = (ordersData || []).filter((o) => {
        const dt = o.created_at || o.order_date || o.date;
        if (!dt) return true;
        if (dateBounds.start && new Date(dt) < new Date(dateBounds.start)) return false;
        if (dateBounds.end && new Date(dt) > new Date(dateBounds.end)) return false;
        return true;
      });

      setOrders(filteredOrders);
      setBooks(booksData || []);
    } catch (err) {
      console.error('Error fetching Master Audit Vault:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) fetchVaultData();
  }, [dateBounds, isOwner]);

  // Unique staff list
  const staffNames = useMemo(() => {
    const names = new Set(sessions.map((s) => s.user_name));
    auditLogs.forEach((a) => names.add(a.user_name));
    return ['ALL', ...Array.from(names).filter(Boolean)];
  }, [sessions, auditLogs]);

  // Filtered Sessions & Audit Logs
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => selectedUser === 'ALL' || s.user_name === selectedUser);
  }, [sessions, selectedUser]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      const matchUser = selectedUser === 'ALL' || l.user_name === selectedUser;
      const matchCat = selectedCategory === 'ALL' || (l.category || 'ADMIN') === selectedCategory;
      return matchUser && matchCat;
    });
  }, [auditLogs, selectedUser, selectedCategory]);

  // ============================================================================
  // 1. EMPLOYEE PERFORMANCE, SCORING & RANKING ENGINE
  // ============================================================================
  const employeeRankings = useMemo(() => {
    const map = {};
    filteredSessions.forEach((s) => {
      const name = s.user_name || 'Unknown Staff';
      if (!map[name]) {
        map[name] = {
          user_name: name,
          user_role: s.user_role || 'STAFF',
          total_sessions: 0,
          total_minutes: 0,
          sales_count: 0,
          total_revenue: 0,
          scans_count: 0,
          voids_count: 0,
          payments_verified_count: 0,
          orders_packed_count: 0,
          orders_shipped_count: 0,
          inventory_edits_count: 0,
          admin_actions_count: 0,
          app_closed_count: 0,
          is_online: false
        };
      }
      map[name].total_sessions += 1;
      map[name].total_minutes += Number(s.duration_minutes || 0);
      map[name].sales_count += Number(s.sales_count || 0);
      map[name].total_revenue += Number(s.total_revenue || 0);
      map[name].scans_count += Number(s.scans_count || 0);
      map[name].voids_count += Number(s.voids_count || 0);
      map[name].payments_verified_count += Number(s.payments_verified_count || 0);
      map[name].orders_packed_count += Number(s.orders_packed_count || 0);
      map[name].orders_shipped_count += Number(s.orders_shipped_count || 0);
      map[name].inventory_edits_count += Number(s.inventory_edits_count || 0);
      map[name].admin_actions_count += Number(s.admin_actions_count || 0);
      if (s.status === 'APP_CLOSED') map[name].app_closed_count += 1;
      if (s.status === 'ACTIVE') map[name].is_online = true;
    });

    const list = Object.values(map).map((emp) => {
      const hours = emp.total_minutes / 60;
      // Weighted Performance Score Formula
      const rawScore =
        emp.sales_count * 12 +
        emp.total_revenue / 1500 +
        emp.payments_verified_count * 10 +
        emp.orders_packed_count * 8 +
        emp.orders_shipped_count * 8 +
        emp.inventory_edits_count * 5 +
        hours * 3 -
        emp.voids_count * 15 -
        emp.app_closed_count * 5;

      const score = Math.max(0, Math.round(rawScore));

      // Grade & Automated HR Verdict
      let grade = 'B';
      let verdict = 'Satisfactory Store Contributor';
      let badgeColor = 'bg-blue-100 text-blue-800';

      if (emp.voids_count >= 5 || (emp.voids_count > emp.sales_count && emp.voids_count > 2)) {
        grade = 'C-';
        verdict = '⚠️ High Cart Void Ratio — Audit Recommended';
        badgeColor = 'bg-red-100 text-red-800';
      } else if (score >= 150) {
        grade = 'A+';
        verdict = '🌟 Star Performer — Exceptional Revenue & Ops';
        badgeColor = 'bg-emerald-100 text-emerald-800';
      } else if (score >= 80) {
        grade = 'A';
        verdict = '✅ High Efficiency — Reliable Staff Member';
        badgeColor = 'bg-green-100 text-green-800';
      } else if (score >= 30) {
        grade = 'B+';
        verdict = '👍 Consistent — Good Operational Support';
        badgeColor = 'bg-indigo-100 text-indigo-800';
      } else if (emp.app_closed_count >= 3) {
        grade = 'C';
        verdict = '🟠 Frequent Unlogged Closures — Remind to Logout';
        badgeColor = 'bg-amber-100 text-amber-800';
      }

      return { ...emp, score, grade, verdict, badgeColor };
    });

    // Sort by Score descending and assign Rank #
    list.sort((a, b) => b.score - a.score);
    return list.map((item, index) => ({ ...item, rank: index + 1 }));
  }, [filteredSessions]);

  // ============================================================================
  // 2. TOP SELLING BOOKS & INVENTORY AUDIT ENGINE
  // ============================================================================
  const booksAudit = useMemo(() => {
    const salesMap = {};

    // Extract book sales from Orders items (supports multiple JSON structures)
    orders.forEach((ord) => {
      const status = String(ord.status || ord.order_status || '').toUpperCase();
      if (status === 'CANCELLED' || status === 'REJECTED') return;

      let itemsList = ord.items || ord.order_items || ord.cart_items || [];
      if (typeof itemsList === 'string') {
        try { itemsList = JSON.parse(itemsList); } catch (e) { itemsList = []; }
      }
      if (Array.isArray(itemsList)) {
        itemsList.forEach((it) => {
          const title = it.title || it.name || it.book_title || `Book #${it.id || 'Unknown'}`;
          const qty = Number(it.quantity || it.qty || 1);
          const price = Number(it.price || it.selling_price || it.unit_price || 0);
          if (!salesMap[title]) {
            salesMap[title] = {
              title,
              author: it.author || it.author_name || 'Catalog Author',
              units_sold: 0,
              revenue: 0
            };
          }
          salesMap[title].units_sold += qty;
          salesMap[title].revenue += qty * price;
        });
      }
    });

    // Also cross-check `books` table if it tracks `sold_count` or `sales_count`
    books.forEach((b) => {
      const title = b.title || b.name;
      if (!title) return;
      const explicitSold = Number(b.sold_count || b.sales_count || 0);
      const price = Number(b.price || b.selling_price || 0);
      if (explicitSold > 0 && !salesMap[title]) {
        salesMap[title] = {
          title,
          author: b.author || b.author_name || 'Catalog Author',
          units_sold: explicitSold,
          revenue: explicitSold * price
        };
      }
    });

    const topSellingBooks = Object.values(salesMap)
      .sort((a, b) => b.units_sold - a.units_sold || b.revenue - a.revenue)
      .slice(0, 10);

    // Inventory Stock Health
    const lowStockBooks = books
      .filter((b) => {
        const stock = Number(b.stock ?? b.quantity_in_stock ?? b.quantity ?? 99);
        return stock <= 5;
      })
      .map((b) => ({
        id: b.id,
        title: b.title || b.name || 'Untitled Book',
        author: b.author || b.author_name || '-',
        stock: Number(b.stock ?? b.quantity_in_stock ?? b.quantity ?? 0),
        price: Number(b.price || b.selling_price || 0)
      }))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 15);

    const outOfStockCount = lowStockBooks.filter((b) => b.stock <= 0).length;

    return { topSellingBooks, lowStockBooks, outOfStockCount, totalCatalogBooks: books.length };
  }, [orders, books]);

  // ============================================================================
  // 3. FINANCIAL & STORE EXECUTIVE VERDICT ENGINE
  // ============================================================================
  const financialSummary = useMemo(() => {
    const posTotals = employeeRankings.reduce(
      (acc, cur) => {
        acc.posRevenue += cur.total_revenue;
        acc.posBills += cur.sales_count;
        acc.verified += cur.payments_verified_count;
        acc.packed += cur.orders_packed_count;
        acc.shipped += cur.orders_shipped_count;
        acc.edits += cur.inventory_edits_count;
        acc.voids += cur.voids_count;
        acc.unloggedClosures += cur.app_closed_count;
        acc.totalMinutes += cur.total_minutes;
        return acc;
      },
      { posRevenue: 0, posBills: 0, verified: 0, packed: 0, shipped: 0, edits: 0, voids: 0, unloggedClosures: 0, totalMinutes: 0 }
    );

    let webOrderRevenue = 0;
    let completedWebOrders = 0;
    let pendingWebOrders = 0;

    orders.forEach((o) => {
      const status = String(o.status || o.order_status || 'PENDING').toUpperCase();
      const amt = Number(o.total_amount || o.total || o.totalPrice || 0);
      if (status !== 'CANCELLED' && status !== 'REJECTED') {
        webOrderRevenue += amt;
        completedWebOrders += 1;
      }
      if (status === 'PENDING' || status === 'PROCESSING') {
        pendingWebOrders += 1;
      }
    });

    const combinedRevenue = posTotals.posRevenue + webOrderRevenue;
    const totalTransactions = posTotals.posBills + completedWebOrders;
    const avgOrderValue = totalTransactions > 0 ? Math.round(combinedRevenue / totalTransactions) : 0;

    // Automated Executive Store Verdict
    let statusBadge = 'EXCELLENT HEALTH';
    let statusColor = 'bg-emerald-600 text-white';
    let executiveNarrative =
      'Store operations, POS sales, and web order fulfillment are performing optimally. Staff discipline and revenue velocity are strong.';
    const recommendations = [];

    if (posTotals.voids > 5) {
      statusBadge = 'ATTENTION: HIGH POS VOIDS';
      statusColor = 'bg-amber-600 text-white';
      recommendations.push(`Review POS cart voids (${posTotals.voids} recorded). Ensure staff are not clearing billed items after customer payment.`);
    }
    if (booksAudit.outOfStockCount > 0) {
      recommendations.push(`Restock ${booksAudit.outOfStockCount} out-of-stock titles immediately to prevent lost POS and online sales.`);
    }
    if (pendingWebOrders > 5) {
      recommendations.push(`There are ${pendingWebOrders} pending web orders awaiting payment verification or packing.`);
    }
    if (posTotals.unloggedClosures > 4) {
      recommendations.push(`${posTotals.unloggedClosures} sessions were closed without clicking Logout. Remind staff to properly lock/logout after shifts.`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Maintain current staffing schedule and reward #1 ranked employee for consistent performance.');
      recommendations.push('Continue weekly stock audits for top-selling titles.');
    }

    return {
      ...posTotals,
      webOrderRevenue,
      completedWebOrders,
      pendingWebOrders,
      combinedRevenue,
      totalTransactions,
      avgOrderValue,
      statusBadge,
      statusColor,
      executiveNarrative,
      recommendations
    };
  }, [employeeRankings, orders, booksAudit]);

  const formatDuration = (mins) => {
    const m = Number(mins || 0);
    if (m < 60) return `${m}m`;
    const hrs = Math.floor(m / 60);
    const rem = m % 60;
    return `${hrs}h ${rem}m`;
  };

  // ============================================================================
  // 4. MANUAL CLEANUP FUNCTIONS (SESSIONS & LOGS)
  // ============================================================================
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('🗑️ Delete this session record permanently?')) return;
    try {
      const { error } = await supabase.from('staff_sessions').delete().eq('id', sessionId);
      if (error) throw error;
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      alert('Failed to delete session.');
    }
  };

  const handleClearAllSessions = async () => {
    if (filteredSessions.length === 0) return;
    if (!window.confirm(`🚨 Permanently delete ALL ${filteredSessions.length} displayed sessions?`)) return;
    try {
      const ids = filteredSessions.map((s) => s.id);
      const { error } = await supabase.from('staff_sessions').delete().in('id', ids);
      if (error) throw error;
      setSessions((prev) => prev.filter((s) => !ids.includes(s.id)));
    } catch (err) {
      alert('Failed to clear sessions.');
    }
  };

  const handleClearAuditLogs = async () => {
    if (filteredLogs.length === 0) return;
    if (!window.confirm(`🚨 Permanently delete ALL ${filteredLogs.length} displayed action logs?`)) return;
    try {
      const ids = filteredLogs.map((l) => l.id);
      const { error } = await supabase.from('staff_audit_logs').delete().in('id', ids);
      if (error) throw error;
      setAuditLogs((prev) => prev.filter((l) => !ids.includes(l.id)));
    } catch (err) {
      alert('Failed to clear audit logs.');
    }
  };

  // ============================================================================
  // 5. A4 PRINT-READY PDF REPORT GENERATOR (ZERO EXTERNAL DEPENDENCIES)
  // ============================================================================
  const handleGenerateA4PDF = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) {
      alert('Please allow popups in your browser to generate the A4 PDF Audit Report.');
      return;
    }

    const generatedAt = new Date().toLocaleString();
    const topEmp = employeeRankings[0];

    const empRowsHtml = employeeRankings
      .map(
        (e) => `
        <tr>
          <td style="font-weight:800; color:#1e3a8a;">#${e.rank}</td>
          <td><strong>${e.user_name}</strong><br/><span style="font-size:10px; color:#64748b;">${e.user_role}</span></td>
          <td>${formatDuration(e.total_minutes)}<br/><span style="font-size:10px; color:#64748b;">${e.total_sessions} shifts</span></td>
          <td><strong>${e.sales_count}</strong><br/><span style="font-size:10px; color:#047857;">Rs. ${e.total_revenue.toLocaleString()}</span></td>
          <td>Ver: ${e.payments_verified_count} | Pack: ${e.orders_packed_count} | Ship: ${e.orders_shipped_count}</td>
          <td>${e.inventory_edits_count}</td>
          <td style="color:${e.voids_count > 0 ? '#dc2626' : '#64748b'}; font-weight:700;">${e.voids_count} Voids / ${e.app_closed_count} Closures</td>
          <td><strong>${e.score} pts (${e.grade})</strong><br/><span style="font-size:10px;">${e.verdict}</span></td>
        </tr>`
      )
      .join('');

    const topBooksHtml =
      booksAudit.topSellingBooks.length > 0
        ? booksAudit.topSellingBooks
            .map(
              (b, i) => `
            <tr>
              <td>#${i + 1}</td>
              <td><strong>${b.title}</strong></td>
              <td>${b.author}</td>
              <td style="font-weight:700;">${b.units_sold} copies</td>
              <td style="font-weight:700; color:#1e40af;">Rs. ${b.revenue.toLocaleString()}</td>
            </tr>`
            )
            .join('')
        : `<tr><td colspan="5" style="text-align:center; color:#64748b;">No itemized book sales recorded in this period.</td></tr>`;

    const lowStockHtml =
      booksAudit.lowStockBooks.length > 0
        ? booksAudit.lowStockBooks
            .slice(0, 8)
            .map(
              (b) => `
            <tr>
              <td><strong>${b.title}</strong></td>
              <td>Rs. ${b.price.toLocaleString()}</td>
              <td style="font-weight:800; color:${b.stock <= 0 ? '#dc2626' : '#d97706'};">
                ${b.stock <= 0 ? 'OUT OF STOCK (0)' : `LOW STOCK (${b.stock} left)`}
              </td>
            </tr>`
            )
            .join('')
        : `<tr><td colspan="3" style="text-align:center; color:#047857;">All catalog books have healthy stock levels (>5).</td></tr>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Alexandria Books — Official A4 Store Audit Report (${dateBounds.label})</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px; }
          .brand-title { font-size: 22px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.5px; margin: 0; }
          .brand-sub { font-size: 11px; color: #475569; font-weight: 600; margin-top: 2px; }
          .meta-box { text-align: right; font-size: 10px; color: #334155; }
          .badge { display: inline-block; background: #1e3a8a; color: #fff; font-weight: 800; padding: 4px 10px; border-radius: 4px; font-size: 10px; margin-bottom: 4px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
          .kpi-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc; }
          .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .kpi-val { font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 3px; }
          .verdict-box { border: 2px solid #1e40af; background: #eff6ff; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
          .verdict-title { font-size: 12px; font-weight: 900; color: #1e3a8a; margin: 0 0 6px 0; text-transform: uppercase; }
          .section-title { font-size: 13px; font-weight: 800; color: #1e3a8a; border-left: 4px solid #2563eb; padding-left: 8px; margin: 16px 0 8px 0; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10px; }
          th { background: #1e293b; color: #ffffff; text-align: left; padding: 7px 8px; font-weight: 700; text-transform: uppercase; font-size: 9px; }
          td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          tr:nth-child(even) td { background: #f8fafc; }
          .two-col { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; }
          .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 35px; padding-top: 15px; page-break-inside: avoid; }
          .sig-line { border-top: 1px dashed #475569; text-align: center; padding-top: 6px; font-size: 10px; font-weight: 700; color: #334155; }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background:#0f172a; color:#fff; padding:10px 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
          <span><strong>📄 Official A4 Print-Ready Audit Report</strong> — Select "Save as PDF" in the print dialog.</span>
          <button onclick="window.print()" style="background:#2563eb; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer;">🖨️ Print / Save A4 PDF Now</button>
        </div>

        <!-- OFFICIAL LETTERHEAD -->
        <div class="header">
          <div>
            <h1 class="brand-title">ALEXANDRIA BOOKS</h1>
            <div class="brand-sub">Executive Store Audit, Staff Performance & Financial Master Report</div>
            <div style="font-size:10px; color:#64748b; margin-top:4px;">Multi-Platform Audit: Windows POS EXE • Desktop Web • Mobile Web & PWA</div>
          </div>
          <div class="meta-box">
            <div class="badge">${dateBounds.label}</div>
            <div><strong>Generated On:</strong> ${generatedAt}</div>
            <div><strong>Authorized By:</strong> ${currentUser?.full_name || 'Store Owner'} (OWNER)</div>
            <div><strong>Staff Filter:</strong> ${selectedUser === 'ALL' ? 'All Employees' : selectedUser}</div>
          </div>
        </div>

        <!-- EXECUTIVE KPI SUMMARY -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Combined Store Revenue</div>
            <div class="kpi-val" style="color:#1d4ed8;">Rs. ${financialSummary.combinedRevenue.toLocaleString()}</div>
            <div style="font-size:9px; color:#64748b;">POS: Rs. ${financialSummary.posRevenue.toLocaleString()} | Web: Rs. ${financialSummary.webOrderRevenue.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Total Orders & POS Bills</div>
            <div class="kpi-val" style="color:#047857;">${financialSummary.totalTransactions}</div>
            <div style="font-size:9px; color:#64748b;">${financialSummary.posBills} POS Bills • ${financialSummary.completedWebOrders} Web Orders</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Web Order Fulfillment</div>
            <div class="kpi-val" style="color:#6d28d9;">${financialSummary.shipped} Shipped</div>
            <div style="font-size:9px; color:#64748b;">${financialSummary.verified} Verified • ${financialSummary.packed} Packed</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Risk & Anomaly Counter</div>
            <div class="kpi-val" style="color:${financialSummary.voids > 0 ? '#dc2626' : '#0f172a'};">${financialSummary.voids} POS Voids</div>
            <div style="font-size:9px; color:#64748b;">${financialSummary.unloggedClosures} Unlogged App Closures</div>
          </div>
        </div>

        <!-- FINAL FINANCIAL & OPERATIONAL VERDICT -->
        <div class="verdict-box">
          <div class="verdict-title">⚖️ Final Executive & Financial Verdict: ${financialSummary.statusBadge}</div>
          <p style="margin: 0 0 6px 0;">${financialSummary.executiveNarrative}</p>
          <div style="font-size:10px;">
            <strong>Top Ranked Employee:</strong> ${topEmp ? `${topEmp.user_name} (${topEmp.score} pts — ${topEmp.grade})` : 'N/A'} &nbsp;|&nbsp;
            <strong>Average Bill Value:</strong> Rs. ${financialSummary.avgOrderValue.toLocaleString()} &nbsp;|&nbsp;
            <strong>Total Staff Active Hours:</strong> ${formatDuration(financialSummary.totalMinutes)}
          </div>
          <ul style="margin:6px 0 0 18px; padding:0; font-size:10px; color:#1e3a8a;">
            ${financialSummary.recommendations.map((r) => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        <!-- SECTION 1: EMPLOYEE RANKING & HR PERFORMANCE TABLE -->
        <div class="section-title">1. Employee Performance Ranking & HR Verdict (${dateBounds.label})</div>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Employee</th>
              <th>Active Time</th>
              <th>POS Sales</th>
              <th>Web Fulfillment</th>
              <th>Catalog Edits</th>
              <th>Risk / Voids</th>
              <th>KPI Score & HR Verdict</th>
            </tr>
          </thead>
          <tbody>
            ${empRowsHtml || '<tr><td colspan="8" style="text-align:center;">No employee activity recorded in this period.</td></tr>'}
          </tbody>
        </table>

        <!-- SECTION 2: TOP SELLING BOOKS & STOCK HEALTH -->
        <div class="two-col">
          <div>
            <div class="section-title">2. Top Selling Books Audit</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Book Title</th>
                  <th>Author</th>
                  <th>Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${topBooksHtml}
              </tbody>
            </table>
          </div>
          <div>
            <div class="section-title">3. Critical Stock Alerts (≤ 5)</div>
            <table>
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Price</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                ${lowStockHtml}
              </tbody>
            </table>
          </div>
        </div>

        <!-- OFFICIAL SIGNATURES -->
        <div class="sig-grid">
          <div class="sig-line">Prepared By (System Audit Engine)</div>
          <div class="sig-line">Store Manager / Admin Signature</div>
          <div class="sig-line">Approved By Store Owner</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };

  if (!isOwner) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl border border-red-200 max-w-md mx-auto mt-10">
        <h2 className="text-lg font-bold">🔒 Owner Exclusive Vault</h2>
        <p className="text-xs mt-1">Only the Store Owner can inspect Staff Rankings, Financial Verdicts & Audit Reports.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen text-gray-900 pb-24">
      {/* TOP COMMAND HEADER */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-blue-900 text-white px-3 py-1 rounded-full">
                Owner Master Audit Vault
              </span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                {dateBounds.label}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 mt-2">
              Store Audit, Employee Ranking & Financial Verdict Center
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Complete monthly & annual employee rankings, POS + Web financial verdicts, top-selling books, and A4 PDF reporting.
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={fetchVaultData}
              className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 px-3.5 py-2.5 rounded-xl transition cursor-pointer"
            >
              🔄 Refresh Data
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('A4_PREVIEW')}
              className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2.5 rounded-xl transition cursor-pointer"
            >
              👁️ Preview A4 Report
            </button>
            <button
              type="button"
              onClick={handleGenerateA4PDF}
              className="text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              🖨️ Download A4 Audit PDF
            </button>
          </div>
        </div>

        {/* PERIOD & STAFF FILTER BAR */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { id: 'MONTHLY', label: '📅 Monthly' },
              { id: 'YEARLY', label: '📆 Yearly' },
              { id: 'TODAY', label: 'Today' },
              { id: '7DAYS', label: 'Last 7 Days' },
              { id: 'ALL', label: 'All Time' }
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setPeriodMode(mode.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  periodMode === mode.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Month Picker if MONTHLY */}
          {periodMode === 'MONTHLY' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-3 py-2 cursor-pointer"
            />
          )}

          {/* Year Picker if YEARLY */}
          {periodMode === 'YEARLY' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-bold bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-3 py-2 cursor-pointer"
            >
              {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((yr) => (
                <option key={yr} value={String(yr)}>
                  Year {yr}
                </option>
              ))}
            </select>
          )}

          {/* Employee Filter */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="text-xs font-semibold bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 ml-auto cursor-pointer"
          >
            {staffNames.map((name, i) => (
              <option key={name || i} value={name}>
                {name === 'ALL' ? '👥 All Employees (Staff, Admin, Owner)' : `👤 ${name}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-1.5 rounded-xl border border-gray-100 w-fit shadow-sm">
        {[
          { id: 'EXECUTIVE_SUMMARY', label: '⚖️ Executive Verdict & Overview' },
          { id: 'EMPLOYEE_RANKING', label: `🏆 Employee Rankings (${employeeRankings.length})` },
          { id: 'BOOKS_INVENTORY', label: '📚 Top Books & Stock Audit' },
          { id: 'SESSIONS', label: `⏱️ Sessions & Manual Clean (${filteredSessions.length})` },
          { id: 'AUDIT_LOGS', label: `🛡️ Action Audit Trail (${filteredLogs.length})` },
          { id: 'A4_PREVIEW', label: '📄 A4 Print Preview' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl text-center text-gray-400 text-sm font-bold animate-pulse">
          Compiling Store Audit, Employee Rankings & Financial Verdicts...
        </div>
      ) : (
        <>
          {/* =====================================================================
              TAB 1: EXECUTIVE VERDICT & FINANCIAL SUMMARY
             ===================================================================== */}
          {activeTab === 'EXECUTIVE_SUMMARY' && (
            <div className="space-y-6">
              {/* 6 KPI CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[11px] text-gray-500 font-bold uppercase">Combined Revenue</p>
                  <p className="text-lg font-extrabold text-blue-600 mt-1">
                    Rs. {financialSummary.combinedRevenue.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">POS + Online Orders</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[11px] text-gray-500 font-bold uppercase">POS Counter Sales</p>
                  <p className="text-lg font-extrabold text-emerald-600 mt-1">
                    Rs. {financialSummary.posRevenue.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{financialSummary.posBills} Bills Printed</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[11px] text-gray-500 font-bold uppercase">Online Web Sales</p>
                  <p className="text-lg font-extrabold text-indigo-600 mt-1">
                    Rs. {financialSummary.webOrderRevenue.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{financialSummary.completedWebOrders} Orders</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[11px] text-gray-500 font-bold uppercase">Order Fulfillment</p>
                  <p className="text-lg font-extrabold text-purple-600 mt-1">
                    {financialSummary.shipped} Shipped
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {financialSummary.verified} Ver. • {financialSummary.packed} Packed
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[11px] text-gray-500 font-bold uppercase">Staff Active Time</p>
                  <p className="text-lg font-extrabold text-gray-900 mt-1">
                    {formatDuration(financialSummary.totalMinutes)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{financialSummary.edits} Catalog Edits</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[11px] text-gray-500 font-bold uppercase">Risk & Voids</p>
                  <p className={`text-lg font-extrabold mt-1 ${financialSummary.voids > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {financialSummary.voids} Voids
                  </p>
                  <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                    {financialSummary.unloggedClosures} Unlogged Closures
                  </p>
                </div>
              </div>

              {/* FINAL EXECUTIVE VERDICT BANNER */}
              <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-800 pb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">
                      Automated Store Intelligence Verdict
                    </span>
                    <h2 className="text-lg md:text-xl font-extrabold mt-1">
                      ⚖️ Final Audit Verdict ({dateBounds.label})
                    </h2>
                  </div>
                  <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold ${financialSummary.statusColor}`}>
                    {financialSummary.statusBadge}
                  </span>
                </div>

                <p className="text-xs md:text-sm text-blue-100 mt-4 leading-relaxed">
                  {financialSummary.executiveNarrative}
                </p>

                <div className="mt-4 bg-blue-950/60 p-4 rounded-xl border border-blue-800/80">
                  <p className="text-xs font-bold text-blue-200 mb-2 uppercase tracking-wider">
                    📌 Key Owner Action Recommendations:
                  </p>
                  <ul className="space-y-1.5 text-xs text-blue-100 list-disc list-inside">
                    {financialSummary.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* TOP 3 EMPLOYEES PODIUM PREVIEW */}
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 mb-3">
                  🏆 Top Performing Employees ({dateBounds.label})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {employeeRankings.slice(0, 3).map((emp) => (
                    <div
                      key={emp.user_name}
                      className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                            {emp.rank === 1 ? '🥇 RANK #1 (GOLD)' : emp.rank === 2 ? '🥈 RANK #2 (SILVER)' : '🥉 RANK #3 (BRONZE)'}
                          </span>
                          <span className="text-sm font-extrabold text-gray-900">{emp.score} pts ({emp.grade})</span>
                        </div>
                        <h4 className="text-base font-extrabold text-gray-900 mt-3">{emp.user_name}</h4>
                        <p className="text-[11px] text-gray-400 font-semibold">{emp.user_role} • {formatDuration(emp.total_minutes)} Active</p>
                        <div className="mt-3 text-xs text-gray-700 space-y-1">
                          <div>💰 <strong>POS Sales:</strong> {emp.sales_count} Bills (Rs. {emp.total_revenue.toLocaleString()})</div>
                          <div>📦 <strong>Web Ops:</strong> {emp.payments_verified_count} Ver. | {emp.orders_packed_count} Packed | {emp.orders_shipped_count} Shipped</div>
                          <div>📚 <strong>Catalog Edits:</strong> {emp.inventory_edits_count}</div>
                        </div>
                      </div>
                      <div className={`mt-4 px-3 py-1.5 rounded-lg text-[11px] font-bold ${emp.badgeColor}`}>
                        {emp.verdict}
                      </div>
                    </div>
                  ))}
                  {employeeRankings.length === 0 && (
                    <div className="col-span-3 bg-white p-8 rounded-2xl text-center text-gray-400 text-xs">
                      No employee activity recorded for this period yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 2: FULL EMPLOYEE PERFORMANCE RANKINGS TABLE
             ===================================================================== */}
          {activeTab === 'EMPLOYEE_RANKING' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">
                    🏆 Employee Performance Leaderboard & HR Verdicts ({dateBounds.label})
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Ranked automatically by POS revenue, bills, payment verifications, order packing/shipping, catalog edits, and void discipline.
                  </p>
                </div>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase">
                    <th className="p-3.5">Rank</th>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Active Hours</th>
                    <th className="p-3.5">POS Sales & Revenue</th>
                    <th className="p-3.5">Payments Verified</th>
                    <th className="p-3.5">Packed / Shipped</th>
                    <th className="p-3.5">Catalog Edits</th>
                    <th className="p-3.5">Voids / Closures</th>
                    <th className="p-3.5">KPI Score</th>
                    <th className="p-3.5">Final HR Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {employeeRankings.map((st) => (
                    <tr key={st.user_name} className="hover:bg-blue-50/30">
                      <td className="p-3.5 font-extrabold text-sm">
                        {st.rank === 1 ? '🥇 #1' : st.rank === 2 ? '🥈 #2' : st.rank === 3 ? '🥉 #3' : `#${st.rank}`}
                      </td>
                      <td className="p-3.5 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${st.is_online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                          <span>{st.user_name}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-semibold">{st.user_role} ({st.total_sessions} shifts)</span>
                      </td>
                      <td className="p-3.5 font-bold text-blue-600">{formatDuration(st.total_minutes)}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-emerald-600">{st.sales_count} Bills</span>
                        <span className="block text-[11px] font-extrabold text-gray-900">Rs. {st.total_revenue.toLocaleString()}</span>
                      </td>
                      <td className="p-3.5 font-bold text-indigo-600">{st.payments_verified_count}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-amber-600">{st.orders_packed_count} Packed</span>
                        <span className="block text-[11px] font-bold text-purple-600">{st.orders_shipped_count} Shipped</span>
                      </td>
                      <td className="p-3.5 font-bold text-gray-800">{st.inventory_edits_count}</td>
                      <td className="p-3.5">
                        <span className={st.voids_count > 0 ? 'text-red-600 font-bold block' : 'text-gray-400 block'}>
                          {st.voids_count} Voids
                        </span>
                        <span className="text-[10px] text-amber-700 font-semibold">
                          {st.app_closed_count} Direct Closures
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-extrabold text-gray-900 text-sm">{st.score} pts</span>
                        <span className="block text-[10px] font-bold text-blue-600">Grade: {st.grade}</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-block ${st.badgeColor}`}>
                          {st.verdict}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {employeeRankings.length === 0 && (
                    <tr>
                      <td colSpan="10" className="p-8 text-center text-gray-400">
                        No employee rankings available for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* =====================================================================
              TAB 3: TOP SELLING BOOKS & INVENTORY STOCK HEALTH
             ===================================================================== */}
          {activeTab === 'BOOKS_INVENTORY' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Books */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-extrabold text-gray-900">🔥 Top Selling Books ({dateBounds.label})</h3>
                  <p className="text-[11px] text-gray-500">Ranked by total copies sold and revenue generated.</p>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Book Title</th>
                      <th className="p-3">Units Sold</th>
                      <th className="p-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {booksAudit.topSellingBooks.map((bk, i) => (
                      <tr key={bk.title || i} className="hover:bg-gray-50">
                        <td className="p-3 font-extrabold text-blue-600">#{i + 1}</td>
                        <td className="p-3">
                          <span className="font-bold text-gray-900 block">{bk.title}</span>
                          <span className="text-[10px] text-gray-400">{bk.author}</span>
                        </td>
                        <td className="p-3 font-bold text-emerald-600">{bk.units_sold} copies</td>
                        <td className="p-3 font-extrabold text-gray-900">Rs. {bk.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {booksAudit.topSellingBooks.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-6 text-center text-gray-400">
                          No itemized book sales found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Low Stock & Out-of-Stock Alert Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">⚠️ Critical Stock Alerts (≤ 5 Copies)</h3>
                    <p className="text-[11px] text-gray-500">
                      Total Catalog: {booksAudit.totalCatalogBooks} Books • Out of Stock: {booksAudit.outOfStockCount}
                    </p>
                  </div>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase">
                      <th className="p-3">Book Title</th>
                      <th className="p-3">Unit Price</th>
                      <th className="p-3">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {booksAudit.lowStockBooks.map((bk, i) => (
                      <tr key={bk.id || i} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-900">{bk.title}</td>
                        <td className="p-3 text-gray-600">Rs. {bk.price.toLocaleString()}</td>
                        <td className="p-3">
                          {bk.stock <= 0 ? (
                            <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                              🚨 OUT OF STOCK (0)
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                              ⚠️ LOW STOCK ({bk.stock} left)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {booksAudit.lowStockBooks.length === 0 && (
                      <tr>
                        <td colSpan="3" className="p-6 text-center text-emerald-600 font-semibold">
                          ✅ All books in your catalog have healthy stock levels!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 4: SESSIONS & MANUAL CLEANUP
             ===================================================================== */}
          {activeTab === 'SESSIONS' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <p className="text-xs text-gray-500 font-semibold">
                  Showing {filteredSessions.length} sessions for {dateBounds.label}.
                </p>
                {filteredSessions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllSessions}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold border border-red-200 transition cursor-pointer"
                  >
                    🗑️ Clear Displayed Sessions
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase">
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Platform</th>
                      <th className="p-3.5">Login Time</th>
                      <th className="p-3.5">Logout / Close Time</th>
                      <th className="p-3.5">Duration</th>
                      <th className="p-3.5">Exit Status</th>
                      <th className="p-3.5">Work Summary</th>
                      <th className="p-3.5 text-right">Clean</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredSessions.map((s, idx) => (
                      <tr key={s.id || idx} className="hover:bg-gray-50">
                        <td className="p-3.5 font-bold text-gray-900">
                          {s.user_name} <span className="text-[10px] text-gray-400 block">{s.user_role}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">
                            {s.platform}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-600">{new Date(s.login_at).toLocaleString()}</td>
                        <td className="p-3.5 text-gray-600">
                          {s.logout_at
                            ? new Date(s.logout_at).toLocaleString()
                            : `Last seen: ${new Date(s.last_heartbeat_at).toLocaleTimeString()}`}
                        </td>
                        <td className="p-3.5 font-bold text-blue-600">{formatDuration(s.duration_minutes)}</td>
                        <td className="p-3.5">
                          {s.status === 'ACTIVE' && (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              🟢 ONLINE
                            </span>
                          )}
                          {s.status === 'LOGGED_OUT' && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              ⚪ Logged Out
                            </span>
                          )}
                          {s.status === 'APP_CLOSED' && (
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              🟠 Closed Directly
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-[11px] text-gray-700">
                          <span className="font-bold text-emerald-600">{s.sales_count || 0} Bills</span> •{' '}
                          <span className="font-bold text-indigo-600">{s.payments_verified_count || 0} Ver.</span> •{' '}
                          <span className="font-bold text-amber-600">{s.orders_packed_count || 0} Pack</span> •{' '}
                          <span className="font-bold text-purple-600">{s.orders_shipped_count || 0} Ship</span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(s.id)}
                            className="p-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-md cursor-pointer"
                            title="Delete Session"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredSessions.length === 0 && (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-gray-400">
                          No sessions recorded for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 5: ACTION AUDIT LOGS
             ===================================================================== */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'ORDERS', 'POS', 'INVENTORY', 'ADMIN', 'AUTH'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
                      }`}
                    >
                      {cat === 'ALL' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>

                {filteredLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAuditLogs}
                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold border border-red-200 cursor-pointer"
                  >
                    🗑️ Clear Displayed Logs
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase">
                      <th className="p-3.5">Time</th>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Platform</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-gray-50">
                        <td className="p-3.5 text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-3.5 font-bold text-gray-900">{log.user_name}</td>
                        <td className="p-3.5">
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                            {log.platform}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {log.category || 'ADMIN'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-blue-700">{log.action_type}</td>
                        <td className="p-3.5 text-gray-700">{log.description}</td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-400">
                          No audit logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 6: ON-SCREEN A4 REPORT PREVIEW
             ===================================================================== */}
          {activeTab === 'A4_PREVIEW' && (
            <div className="flex flex-col items-center">
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateA4PDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md cursor-pointer"
                >
                  🖨️ Open Print / Save as A4 PDF Dialog
                </button>
              </div>

              {/* A4 SHEET SIMULATION ON SCREEN */}
              <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-8 md:p-12 shadow-2xl border border-gray-200 text-gray-900">
                <div className="flex justify-between items-start border-b-4 border-blue-900 pb-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-blue-900 tracking-wide">ALEXANDRIA BOOKS</h2>
                    <p className="text-xs font-bold text-gray-600 mt-0.5">
                      Official Store Audit, Employee Ranking & Financial Master Report
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <span className="bg-blue-900 text-white font-bold px-2.5 py-1 rounded text-[10px] inline-block mb-1">
                      {dateBounds.label}
                    </span>
                    <p className="text-gray-500">Generated: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-blue-50 border-2 border-blue-800 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-blue-950 uppercase">
                      ⚖️ Final Financial & Operational Verdict
                    </span>
                    <span className="text-[11px] font-extrabold text-blue-800">{financialSummary.statusBadge}</span>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">{financialSummary.executiveNarrative}</p>
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-blue-200 text-xs">
                    <div><strong>Total Revenue:</strong> Rs. {financialSummary.combinedRevenue.toLocaleString()}</div>
                    <div><strong>POS Bills:</strong> {financialSummary.posBills}</div>
                    <div><strong>Web Shipped:</strong> {financialSummary.shipped}</div>
                    <div><strong>POS Voids:</strong> {financialSummary.voids}</div>
                  </div>
                </div>

                {/* Employee Rankings in Preview */}
                <h3 className="text-xs font-black text-blue-900 uppercase border-l-4 border-blue-600 pl-2 mb-2">
                  1. Employee Performance Ranking ({dateBounds.label})
                </h3>
                <table className="w-full text-left border-collapse text-[11px] mb-6">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="p-2">Rank</th>
                      <th className="p-2">Employee</th>
                      <th className="p-2">Active Time</th>
                      <th className="p-2">POS Revenue</th>
                      <th className="p-2">Web Ops</th>
                      <th className="p-2">Score & Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employeeRankings.map((e) => (
                      <tr key={e.user_name}>
                        <td className="p-2 font-black text-blue-900">#{e.rank}</td>
                        <td className="p-2 font-bold">{e.user_name} ({e.user_role})</td>
                        <td className="p-2">{formatDuration(e.total_minutes)}</td>
                        <td className="p-2 font-bold">Rs. {e.total_revenue.toLocaleString()} ({e.sales_count})</td>
                        <td className="p-2">V:{e.payments_verified_count} P:{e.orders_packed_count} S:{e.orders_shipped_count}</td>
                        <td className="p-2 font-bold">{e.score} pts ({e.grade}) — {e.verdict}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-8 mt-16 pt-8 text-center text-xs font-bold text-gray-600">
                  <div className="border-t border-dashed border-gray-400 pt-2">Prepared By Audit Engine</div>
                  <div className="border-t border-dashed border-gray-400 pt-2">Store Manager Signature</div>
                  <div className="border-t border-dashed border-gray-400 pt-2">Store Owner Approval</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
