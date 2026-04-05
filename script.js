const STORAGE_KEY = 'fv_transactions_v1';
const CAT_COLORS = {
  Food:'#f97316', Transport:'#3b82f6', Housing:'#8b5cf6',
  Shopping:'#ec4899', Healthcare:'#14b8a6', Entertainment:'#f59e0b',
  Education:'#22c55e', Utilities:'#64748b', Salary:'#4ade80',
  Investment:'#e8b84b', Freelance:'#60a5fa', Other:'#94a3b8'
};

const SEED_TRANSACTIONS = [
  {id:1,  date:'2026-01-05', description:'January Salary',      category:'Salary',        type:'income',  amount:5200},
  {id:2,  date:'2026-01-08', description:'Grocery Shopping',    category:'Food',          type:'expense', amount:320},
  {id:3,  date:'2026-01-12', description:'Electricity Bill',    category:'Utilities',     type:'expense', amount:85},
  {id:4,  date:'2026-01-18', description:'Netflix',             category:'Entertainment', type:'expense', amount:15},
  {id:5,  date:'2026-01-22', description:'Freelance Project',   category:'Freelance',     type:'income',  amount:800},
  {id:6,  date:'2026-01-28', description:'Metro Card',          category:'Transport',     type:'expense', amount:90},
  {id:7,  date:'2026-02-05', description:'February Salary',     category:'Salary',        type:'income',  amount:5200},
  {id:8,  date:'2026-02-10', description:'Doctor Visit',        category:'Healthcare',    type:'expense', amount:150},
  {id:9,  date:'2026-02-14', description:'Valentine Dinner',    category:'Food',          type:'expense', amount:210},
  {id:10, date:'2026-02-20', description:'Online Course',       category:'Education',     type:'expense', amount:129},
  {id:11, date:'2026-02-25', description:'Clothing Haul',       category:'Shopping',      type:'expense', amount:380},
  {id:12, date:'2026-03-01', description:'March Salary',        category:'Salary',        type:'income',  amount:5200},
  {id:13, date:'2026-03-05', description:'Groceries',           category:'Food',          type:'expense', amount:290},
  {id:14, date:'2026-03-10', description:'Rent',                category:'Housing',       type:'expense', amount:1200},
  {id:15, date:'2026-03-15', description:'Stock Dividend',      category:'Investment',    type:'income',  amount:430},
  {id:16, date:'2026-03-22', description:'Gym Membership',      category:'Healthcare',    type:'expense', amount:49},
  {id:17, date:'2026-03-28', description:'Taxi Rides',          category:'Transport',     type:'expense', amount:120},
  {id:18, date:'2026-04-01', description:'April Salary',        category:'Salary',        type:'income',  amount:5400},
  {id:19, date:'2026-04-02', description:'Electronics Store',   category:'Shopping',      type:'expense', amount:650},
  {id:20, date:'2026-04-03', description:'Food Delivery',       category:'Food',          type:'expense', amount:75},
];

let state = {
  transactions: loadFromStorage(),
  role: 'viewer',
  filters: { search: '', type: '', category: '', month: '' },
  sort: { field: 'date', dir: 'desc' },
  page: 1,
  pageSize: 8,
  editingId: null,
  activeTab: 'overview',
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...SEED_TRANSACTIONS];
  } catch { return [...SEED_TRANSACTIONS]; }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
}

//  ROLE MANAGEMENT

function switchRole(role) {
  state.role = role;
  const badge = document.getElementById('roleBadge');
  badge.className = `role-badge ${role}`;
  badge.textContent = role === 'admin' ? '⚡ Admin Mode' : '● Viewer Mode';
  const addBtn = document.getElementById('addTxBtn');
  addBtn.classList.toggle('hidden', role !== 'admin');
  const actionsCol = document.getElementById('th-actions');
  if (actionsCol) actionsCol.style.display = role === 'admin' ? '' : 'none';
  renderTransactions();
  toast(role === 'admin' ? '⚡ Switched to Admin Mode' : '👁 Switched to Viewer Mode');
}


//  TAB NAVIGATION

const tabTitles = {
  overview:     ['Financial Overview', 'Your money at a glance · April 2026'],
  transactions: ['Transactions', 'Browse, filter & manage your activity'],
  insights:     ['Financial Insights', 'Patterns & observations from your data'],
};

function switchTab(tab, sideNavEl, tabBtnEl) {
  state.activeTab = tab;
  // Sections
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${tab}`).classList.add('active');
  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (sideNavEl) sideNavEl.classList.add('active');
  else {
    document.querySelectorAll('.nav-item').forEach(n => {
      if (n.textContent.toLowerCase().includes(tab.split('-')[0])) n.classList.add('active');
    });
  }
  // Tab bar
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tb = tabBtnEl || document.getElementById(`tab-${tab}`);
  if (tb) tb.classList.add('active');
  // Titles
  const [title, sub] = tabTitles[tab] || ['Dashboard', ''];
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageSubtitle').textContent = sub;

  if (tab === 'insights') renderInsights();
  closeSidebar();
}

//  COMPUTED STATS

function computeStats(txs) {
  const income   = txs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expenses = txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  return { income, expenses, balance: income - expenses };
}

function fmt(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

//  SUMMARY CARDS

function renderCards() {
  const { income, expenses, balance } = computeStats(state.transactions);
  animateCounter('totalBalance', balance, true);
  animateCounter('totalIncome', income, true);
  animateCounter('totalExpenses', expenses, true);

  // Delta vs last month
  const now = new Date();
  const thisMonth = state.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = state.transactions.filter(t => {
    const d = new Date(t.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });
  const tm = computeStats(thisMonth), lm = computeStats(lastMonth);

  setDelta('balanceDelta', tm.balance, lm.balance);
  setDelta('incomeDelta', tm.income, lm.income);
  setDelta('expensesDelta', tm.expenses, lm.expenses, true);
}

function setDelta(id, curr, prev, invertColor = false) {
  const el = document.getElementById(id);
  if (!el) return;
  if (prev === 0) { el.textContent = '— No prior data'; return; }
  const pct = ((curr - prev) / prev * 100).toFixed(1);
  const up = curr >= prev;
  el.textContent = (up ? '↑ ' : '↓ ') + Math.abs(pct) + '% vs last month';
  el.className = 'card-delta ' + (invertColor ? (up ? 'delta-down' : 'delta-up') : (up ? 'delta-up' : 'delta-down'));
}

function animateCounter(id, target, isCurrency) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = 0, dur = 900;
  const t0 = performance.now();
  function step(t) {
    const p = Math.min((t - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = isCurrency ? fmt(Math.round(ease * target)) : Math.round(ease * target);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

//  LINE CHART (SVG)

function renderLineChart() {
  const W = 500, H = 180, PAD = { t: 10, b: 30, l: 50, r: 20 };
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b;

  // Build monthly balance
  const months = getLast6Months();
  const data = months.map(({ label, key }) => {
    const txs = state.transactions.filter(t => t.date.startsWith(key));
    const { income, expenses } = computeStats(txs);
    return { label, value: income - expenses };
  });

  const vals = data.map(d => d.value);
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  const xScale = (i) => PAD.l + (i / (data.length - 1)) * iW;
  const yScale = (v) => PAD.t + iH - ((v - minV) / range) * iH;

  const pts = data.map((d, i) => `${xScale(i)},${yScale(d.value)}`).join(' ');
  const firstX = xScale(0), lastX = xScale(data.length - 1);
  const bottomY = PAD.t + iH;

  // Grid
  let gridHtml = '';
  for (let i = 0; i <= 4; i++) {
    const y = PAD.t + (iH / 4) * i;
    gridHtml += `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" />`;
    const v = maxV - (range / 4) * i;
    gridHtml += `<text x="${PAD.l - 6}" y="${y + 4}" class="chart-label" text-anchor="end">${fmt(v)}</text>`;
  }
  document.getElementById('chartGrid').innerHTML = gridHtml;

  // Area
  document.getElementById('chartArea').setAttribute('d',
    `M ${xScale(0)} ${yScale(data[0].value)} ` +
    data.slice(1).map((d, i) => `L ${xScale(i + 1)} ${yScale(d.value)}`).join(' ') +
    ` L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
  );

  // Line
  document.getElementById('chartLine').setAttribute('d',
    `M ${xScale(0)} ${yScale(data[0].value)} ` +
    data.slice(1).map((d, i) => `L ${xScale(i + 1)} ${yScale(d.value)}`).join(' ')
  );

  // Dots + labels
  document.getElementById('chartDots').innerHTML = data.map((d, i) =>
    `<circle class="chart-dot" cx="${xScale(i)}" cy="${yScale(d.value)}" r="5">
      <title>${d.label}: ${fmt(d.value)}</title>
    </circle>`
  ).join('');

  document.getElementById('chartLabels').innerHTML = data.map((d, i) =>
    `<text x="${xScale(i)}" y="${bottomY + 18}" class="chart-label" text-anchor="middle">${d.label}</text>`
  ).join('');
}

function getLast6Months() {
  const result = [];
  const now = new Date(2026, 3, 1); // April 2026
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    result.push({ label, key });
  }
  return result;
}

//  DONUT CHART (SVG)

function renderDonutChart() {
  const expenses = state.transactions.filter(t => t.type === 'expense');
  const catMap = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const total = Object.values(catMap).reduce((a, b) => a + b, 0);
  if (total === 0) return;

  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const cx = 80, cy = 80, R = 65, r = 40;
  let startAngle = -Math.PI / 2;
  let svgPaths = '';
  let legendHtml = '';

  sorted.forEach(([cat, val]) => {
    const pct = val / total;
    const angle = pct * 2 * Math.PI;
    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(startAngle + angle);
    const y2 = cy + R * Math.sin(startAngle + angle);
    const xi1 = cx + r * Math.cos(startAngle);
    const yi1 = cy + r * Math.sin(startAngle);
    const xi2 = cx + r * Math.cos(startAngle + angle);
    const yi2 = cy + r * Math.sin(startAngle + angle);
    const large = angle > Math.PI ? 1 : 0;
    const color = CAT_COLORS[cat] || '#94a3b8';

    svgPaths += `<path d="M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z"
      fill="${color}" opacity="0.9" style="cursor:pointer" stroke="var(--surface)" stroke-width="2">
      <title>${cat}: ${fmt(val)} (${(pct*100).toFixed(1)}%)</title>
    </path>`;

    legendHtml += `<div class="legend-item">
      <div class="legend-dot" style="background:${color}"></div>
      <span class="legend-name">${cat}</span>
      <span class="legend-pct">${(pct * 100).toFixed(0)}%</span>
    </div>`;

    startAngle += angle;
  });

  // Center label
  svgPaths += `<circle cx="${cx}" cy="${cy}" r="${r - 4}" fill="var(--surface)" />
    <text x="${cx}" y="${cy - 5}" text-anchor="middle" fill="var(--text-dim)" font-size="9" font-family="DM Sans">EXPENSES</text>
    <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="var(--gold)" font-size="13" font-weight="700" font-family="Playfair Display">${fmt(total)}</text>`;

  document.getElementById('donutSvg').innerHTML = svgPaths;
  document.getElementById('donutLegend').innerHTML = legendHtml;
}

//  TRANSACTIONS TABLE

function getFilteredTransactions() {
  const { search, type, category, month } = state.filters;
  return state.transactions.filter(t => {
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()) &&
                  !t.category.toLowerCase().includes(search.toLowerCase())) return false;
    if (type && t.type !== type) return false;
    if (category && t.category !== category) return false;
    if (month && !t.date.startsWith(month)) return false;
    return true;
  }).sort((a, b) => {
    const { field, dir } = state.sort;
    let av = a[field], bv = b[field];
    if (field === 'amount') { av = Number(av); bv = Number(bv); }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function renderTransactions() {
  const all = getFilteredTransactions();
  const total = all.length;
  const start = (state.page - 1) * state.pageSize;
  const paged = all.slice(start, start + state.pageSize);

  document.getElementById('paginationInfo').textContent = `Showing ${Math.min(start + 1, total)}–${Math.min(start + state.pageSize, total)} of ${total}`;

  const tbody = document.getElementById('txTableBody');
  if (total === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📭</div>No transactions match your filters.</div></td></tr>`;
  } else {
    tbody.innerHTML = paged.map(t => renderRow(t)).join('');
  }

  // Actions column visibility
  const actCol = document.getElementById('th-actions');
  if (actCol) actCol.style.display = state.role === 'admin' ? '' : 'none';

  renderPagination(total);
}

function renderRow(t) {
  const color = CAT_COLORS[t.category] || '#94a3b8';
  const isAdmin = state.role === 'admin';
  return `<tr>
    <td class="tx-date">${formatDate(t.date)}</td>
    <td style="font-weight:500">${t.description}</td>
    <td><span class="tx-cat" style="background:${color}22;color:${color}">${t.category}</span></td>
    <td><span class="tx-type-badge type-${t.type}">${t.type}</span></td>
    <td class="tx-amount ${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
      ${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}
    </td>
    <td style="${isAdmin ? '' : 'display:none'}">
      <button class="action-btn edit" onclick="editTransaction(${t.id})">✎ Edit</button>
      <button class="action-btn del" onclick="deleteTransaction(${t.id})">✕</button>
    </td>
  </tr>`;
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function renderPagination(total) {
  const pages = Math.ceil(total / state.pageSize);
  let html = `<button class="page-btn" onclick="goPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''}>← Prev</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn ${i === state.page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="goPage(${state.page + 1})" ${state.page >= pages ? 'disabled' : ''}>Next →</button>`;
  document.getElementById('pageBtns').innerHTML = html;
}

function goPage(p) {
  const all = getFilteredTransactions();
  const maxPage = Math.ceil(all.length / state.pageSize);
  state.page = Math.max(1, Math.min(p, maxPage));
  renderTransactions();
}

//  FILTERS & SORT

function populateFilters() {
  const cats = [...new Set(state.transactions.map(t => t.category))].sort();
  const months = [...new Set(state.transactions.map(t => t.date.slice(0, 7)))].sort().reverse();

  const catSel = document.getElementById('filterCategory');
  catSel.innerHTML = `<option value="">All Categories</option>` +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');

  const monSel = document.getElementById('filterMonth');
  monSel.innerHTML = `<option value="">All Months</option>` +
    months.map(m => `<option value="${m}">${new Date(m + '-01').toLocaleDateString('en-US', {month:'long', year:'numeric'})}</option>`).join('');
}

function applyFilters() {
  state.filters.search   = document.getElementById('searchInput').value;
  state.filters.type     = document.getElementById('filterType').value;
  state.filters.category = document.getElementById('filterCategory').value;
  state.filters.month    = document.getElementById('filterMonth').value;
  state.page = 1;
  renderTransactions();
}

function clearFilters() {
  state.filters = { search: '', type: '', category: '', month: '' };
  document.getElementById('searchInput').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterMonth').value = '';
  state.page = 1;
  renderTransactions();
}

function sortBy(field) {
  if (state.sort.field === field) {
    state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    state.sort.field = field;
    state.sort.dir = 'asc';
  }
  document.querySelectorAll('th').forEach(th => th.classList.remove('sorted'));
  const th = document.getElementById(`th-${field}`);
  if (th) {
    th.classList.add('sorted');
    th.querySelector('.sort-icon').textContent = state.sort.dir === 'asc' ? '↑' : '↓';
  }
  renderTransactions();
}


//  RECENT TABLE (Overview)


function renderRecentTable() {
  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const html = recent.length === 0
    ? `<div class="empty-state"><div class="empty-icon">📭</div>No transactions yet.</div>`
    : `<table>
        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th></tr></thead>
        <tbody>${recent.map(t => renderRow(t)).join('')}</tbody>
      </table>`;
  document.getElementById('recentTableWrap').innerHTML = html;
}


//  INSIGHTS

function renderInsights() {
  const txs = state.transactions;
  const expenses = txs.filter(t => t.type === 'expense');
  const income = txs.filter(t => t.type === 'income');

  // Highest spending category
  const catTotals = {};
  expenses.forEach(t => catTotals[t.category] = (catTotals[t.category] || 0) + t.amount);
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  // Savings rate
  const totalInc = income.reduce((a, t) => a + t.amount, 0);
  const totalExp = expenses.reduce((a, t) => a + t.amount, 0);
  const savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc * 100).toFixed(1) : 0;

  // Avg monthly expense
  const months = getLast6Months();
  const monthlyExps = months.map(({ key }) => {
    return expenses.filter(t => t.date.startsWith(key)).reduce((a, t) => a + t.amount, 0);
  });
  const avgMonthlyExp = monthlyExps.reduce((a, b) => a + b, 0) / monthlyExps.filter(v => v > 0).length || 0;

  // Transaction count
  const txCount = txs.length;

  const insights = [
    {
      icon: '🏆',
      title: 'Top Spending Category',
      value: topCat ? topCat[0] : 'N/A',
      desc: topCat ? `You spent ${fmt(topCat[1])} on ${topCat[0]}` : 'No expense data yet.'
    },
    {
      icon: '💰',
      title: 'Savings Rate',
      value: savingsRate + '%',
      desc: `You are saving ${savingsRate}% of your income. ${Number(savingsRate) >= 20 ? '🎉 Great job!' : 'Try to save at least 20%.'}`
    },
    {
      icon: '📊',
      title: 'Avg Monthly Expense',
      value: fmt(Math.round(avgMonthlyExp)),
      desc: `Based on your last ${monthlyExps.filter(v => v > 0).length} active months of data.`
    },
    {
      icon: '📋',
      title: 'Total Transactions',
      value: txCount,
      desc: `${income.length} income · ${expenses.length} expense entries recorded.`
    },
    {
      icon: '📅',
      title: 'Largest Single Expense',
      value: expenses.length ? fmt(Math.max(...expenses.map(t => t.amount))) : 'N/A',
      desc: (() => {
        if (!expenses.length) return 'No expense data.';
        const m = expenses.reduce((a, b) => a.amount > b.amount ? a : b);
        return `${m.description} on ${formatDate(m.date)}`;
      })()
    },
    {
      icon: '🌱',
      title: 'Best Income Month',
      value: (() => {
        const monthly = {};
        income.forEach(t => {
          const k = t.date.slice(0, 7);
          monthly[k] = (monthly[k] || 0) + t.amount;
        });
        const best = Object.entries(monthly).sort((a, b) => b[1] - a[1])[0];
        return best ? new Date(best[0] + '-01').toLocaleDateString('en-US', {month:'short', year:'numeric'}) : 'N/A';
      })(),
      desc: 'Month with the highest total income received.'
    },
  ];

  document.getElementById('insightsGrid').innerHTML = insights.map(ins => `
    <div class="insight-card">
      <div class="insight-icon">${ins.icon}</div>
      <div class="insight-text">
        <h4>${ins.title}</h4>
        <div class="insight-value">${ins.value}</div>
        <p>${ins.desc}</p>
      </div>
    </div>
  `).join('');

  renderBarChart();
}

//  BAR CHART (Monthly Income vs Expenses)

function renderBarChart() {
  const svg = document.getElementById('barChartSvg');
  const W = 500, H = 200, PAD = { t: 10, b: 30, l: 55, r: 20 };
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b;
  const months = getLast6Months();

  const data = months.map(({ label, key }) => {
    const inc = state.transactions.filter(t => t.type === 'income' && t.date.startsWith(key)).reduce((a, t) => a + t.amount, 0);
    const exp = state.transactions.filter(t => t.type === 'expense' && t.date.startsWith(key)).reduce((a, t) => a + t.amount, 0);
    return { label, inc, exp };
  });

  const maxV = Math.max(...data.flatMap(d => [d.inc, d.exp]), 1);
  const barW = iW / (data.length * 2 + data.length + 1);
  const grpW = barW * 2 + barW * 0.3;
  let html = '';

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = PAD.t + (iH / 4) * i;
    const v = maxV * (1 - i / 4);
    html += `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" stroke="var(--border)" stroke-width="1"/>`;
    html += `<text x="${PAD.l - 6}" y="${y + 4}" fill="var(--text-dimmer)" font-size="10" font-family="DM Sans" text-anchor="end">${fmt(v)}</text>`;
  }

  data.forEach((d, i) => {
    const gx = PAD.l + i * (grpW + barW * 0.5);
    const incH = (d.inc / maxV) * iH;
    const expH = (d.exp / maxV) * iH;
    const bY = PAD.t + iH;

    // Income bar
    html += `<rect x="${gx}" y="${bY - incH}" width="${barW}" height="${incH}" rx="3" fill="var(--green)" opacity="0.8">
      <title>${d.label} Income: ${fmt(d.inc)}</title></rect>`;
    // Expense bar
    html += `<rect x="${gx + barW + 3}" y="${bY - expH}" width="${barW}" height="${expH}" rx="3" fill="var(--red)" opacity="0.8">
      <title>${d.label} Expense: ${fmt(d.exp)}</title></rect>`;
    // Label
    html += `<text x="${gx + barW + 1.5}" y="${bY + 16}" fill="var(--text-dimmer)" font-size="10" font-family="DM Sans" text-anchor="middle">${d.label}</text>`;
  });

  // Legend
  html += `<circle cx="${W - 90}" cy="10" r="5" fill="var(--green)"/>
    <text x="${W - 82}" y="14" fill="var(--text-dim)" font-size="10" font-family="DM Sans">Income</text>
    <circle cx="${W - 40}" cy="10" r="5" fill="var(--red)"/>
    <text x="${W - 32}" y="14" fill="var(--text-dim)" font-size="10" font-family="DM Sans">Expense</text>`;

  svg.innerHTML = html;
}

//  MODAL (Add / Edit)


function openModal(tx = null) {
  state.editingId = tx ? tx.id : null;
  document.getElementById('modalTitle').textContent = tx ? 'Edit Transaction' : 'Add Transaction';
  document.getElementById('fDesc').value     = tx ? tx.description : '';
  document.getElementById('fAmount').value   = tx ? tx.amount : '';
  document.getElementById('fDate').value     = tx ? tx.date : new Date().toISOString().slice(0, 10);
  document.getElementById('fCategory').value = tx ? tx.category : 'Food';
  document.getElementById('fType').value     = tx ? tx.type : 'expense';
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

function saveTransaction() {
  const desc   = document.getElementById('fDesc').value.trim();
  const amount = parseFloat(document.getElementById('fAmount').value);
  const date   = document.getElementById('fDate').value;
  const cat    = document.getElementById('fCategory').value;
  const type   = document.getElementById('fType').value;

  if (!desc) { toast('⚠ Please enter a description.'); return; }
  if (isNaN(amount) || amount <= 0) { toast('⚠ Please enter a valid amount.'); return; }
  if (!date) { toast('⚠ Please select a date.'); return; }

  if (state.editingId !== null) {
    const idx = state.transactions.findIndex(t => t.id === state.editingId);
    state.transactions[idx] = { id: state.editingId, description: desc, amount, date, category: cat, type };
    toast('✅ Transaction updated successfully.');
  } else {
    const newId = Math.max(0, ...state.transactions.map(t => t.id)) + 1;
    state.transactions.push({ id: newId, description: desc, amount, date, category: cat, type });
    toast('✅ Transaction added successfully.');
  }

  saveToStorage();
  closeModal();
  populateFilters();
  renderAll();
}

function editTransaction(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (tx) openModal(tx);
}

function deleteTransaction(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;
  if (!confirm(`Delete "${tx.description}"?`)) return;
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveToStorage();
  populateFilters();
  renderAll();
  toast('🗑 Transaction deleted.');
}


//  EXPORT CSV


function exportCSV() {
  const header = ['Date', 'Description', 'Category', 'Type', 'Amount'];
  const rows = state.transactions.map(t => [t.date, t.description, t.category, t.type, t.amount]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'financevault_transactions.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('📥 CSV exported successfully!');
}


//  TOAST


function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3100);
}


//  SIDEBAR (Mobile)


function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

document.getElementById('sidebarOverlay').onclick = closeSidebar;


//  CLOSE MODAL ON OVERLAY CLICK


document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});


//  RENDER ALL


function renderAll() {
  renderCards();
  renderLineChart();
  renderDonutChart();
  renderRecentTable();
  renderTransactions();
  if (state.activeTab === 'insights') renderInsights();
}


//  INIT


(function init() {
  populateFilters();
  renderAll();
  // Set default date in modal
  document.getElementById('fDate').value = new Date().toISOString().slice(0, 10);
})();
