export const csvHeaders = ['id', 'name', 'team', 'role', 'status'];
export const initialEmployees = Array.from({ length: 12 }, (_, i) => ({
  id: `DEMO-${String(i + 1).padStart(3, '0')}`,
  name: `Sample Agent ${String(i + 1).padStart(2, '0')}`,
  team: ['Orchid', 'Maple', 'Cedar'][i % 3],
  role: i === 0 || i === 4 ? 'Team lead' : 'Support agent',
  status: i === 8 ? 'On leave' : 'Active'
}));

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

export function parseCSV(input) {
  const text = input.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false, afterQuote = false;
  const pushField = () => { row.push(field); field = ''; afterQuote = false; };
  const pushRow = () => { pushField(); if (row.some(value => value.trim())) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (quoted) {
      if (character === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (character === '"') { quoted = false; afterQuote = true; }
      else field += character;
    } else if (character === ',' || character === '\n' || character === '\r') {
      if (character === ',') pushField();
      else { pushRow(); if (character === '\r' && text[i + 1] === '\n') i++; }
    } else if (character === '"') {
      if (field || afterQuote) throw new Error('The CSV contains an unexpected quotation mark. Please use the sample format.');
      quoted = true;
    } else {
      if (afterQuote) throw new Error('The CSV has extra text after a quoted value. Please use the sample format.');
      field += character;
    }
  }
  if (quoted) throw new Error('A quoted value was not closed. Please check the CSV.');
  if (field || row.length || afterQuote) pushRow();
  return rows;
}

export function employeesFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error('Include the column headers and at least one employee row.');
  const headers = rows.shift().map(value => value.trim().toLowerCase());
  if (headers.length !== csvHeaders.length || new Set(headers).size !== headers.length || csvHeaders.some(key => !headers.includes(key))) {
    throw new Error('Use these five columns: id, name, team, role, status. Download the sample CSV for a template.');
  }
  if (rows.length > 500) throw new Error('Please use a sample file with 500 employee rows or fewer.');
  const ids = new Set();
  return rows.map((row, index) => {
    if (row.length !== headers.length) throw new Error(`Row ${index + 2} does not contain all five columns.`);
    const item = Object.fromEntries(headers.map((key, column) => [key, row[column].trim()]));
    if (Object.values(item).some(value => !value || value.length > 120 || /[\u0000-\u001f\u007f]/.test(value))) throw new Error(`Row ${index + 2}: use nonempty, single-line values of 120 characters or fewer.`);
    if (!/^[A-Za-z0-9_-]+$/.test(item.id)) throw new Error(`Row ${index + 2}: employee IDs can contain letters, numbers, hyphens, and underscores.`);
    if (ids.has(item.id.toLowerCase())) throw new Error(`Row ${index + 2}: employee IDs must be unique.`);
    ids.add(item.id.toLowerCase());
    if (!['Active', 'On leave'].includes(item.status)) throw new Error(`Row ${index + 2}: status must be Active or On leave.`);
    return item;
  });
}

export function buildCSV(records, headers) {
  const cell = value => {
    let string = String(value ?? '');
    if (/^\s*[=+@\-]/.test(string) || /^[\t\r\n]/.test(string)) string = `'${string}`;
    return `"${string.replace(/"/g, '""')}"`;
  };
  return '\uFEFF' + [headers, ...records.map(record => headers.map(header => record[header]))].map(row => row.map(cell).join(',')).join('\r\n');
}

export function scoreRecords(month = 10) {
  return initialEmployees.map((person, index) => {
    const quality = 87 + ((index * 7 + month) % 13);
    const listening = 85 + ((index * 5 + month) % 15);
    const attendance = 94 + ((index * 3 + month) % 7);
    return { ...person, quality, listening, attendance, saves: 32 + ((index * 9 + month) % 34), overall: Number(((quality + listening + attendance) / 3).toFixed(1)) };
  }).sort((a, b) => b.overall - a.overall || a.id.localeCompare(b.id)).map((person, index) => ({ ...person, rank: index + 1 }));
}

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let employees = initialEmployees.map(person => ({ ...person }));
  let shownEmployees = [], shownScores = [];
  let displayedMonth = new Date(2026, 9, 1);
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const views = ['dashboard', 'scorecard', 'employees', 'leave'];

  function selectView(name, focus = false) {
    if (!views.includes(name)) name = 'dashboard';
    tabs.forEach(tab => {
      const selected = tab.getAttribute('aria-controls') === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      $(tab.getAttribute('aria-controls')).hidden = !selected;
      if (selected && focus) tab.focus();
    });
    history.replaceState(null, '', `#${name}`);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectView(tab.getAttribute('aria-controls')));
    tab.addEventListener('keydown', event => {
      const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (next !== undefined) { event.preventDefault(); selectView(views[next], true); }
    });
  });
  document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => {
    selectView(button.dataset.go);
    $(button.dataset.go).focus({ preventScroll: true });
    $('main').scrollIntoView({ behavior: 'auto', block: 'start' });
  }));
  window.addEventListener('hashchange', () => selectView(location.hash.slice(1)));
  selectView(location.hash.slice(1));

  function download(name, records, headers) {
    const url = URL.createObjectURL(new Blob([buildCSV(records, headers)], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function renderOverview() {
    const data = scoreRecords();
    const average = key => (data.reduce((sum, row) => sum + row[key], 0) / data.length).toFixed(1);
    $('employee-count').textContent = employees.length;
    $('active-count').textContent = `${employees.filter(person => person.status === 'Active').length} active members`;
    $('quality-metric').textContent = `${average('quality')}%`;
    $('listening-metric').textContent = `${average('listening')}%`;
    $('attendance-metric').textContent = `${average('attendance')}%`;
    $('performance-bars').innerHTML = [['quality', 'Quality'], ['listening', 'Active listening'], ['attendance', 'Attendance']].map(([key, label]) => `<div class="bar-row"><div class="bar-label"><span>${label}</span><strong>${average(key)}%</strong></div><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${average(key)}%"></div></div></div>`).join('');
  }
  function renderScores() {
    const query = $('score-search').value.trim().toLowerCase();
    const team = $('score-team').value;
    shownScores = scoreRecords(Number($('score-month').value)).filter(person => (team === 'all' || person.team === team) && `${person.name} ${person.id}`.toLowerCase().includes(query));
    if ($('top-five').checked) shownScores = shownScores.slice(0, 5);
    $('score-rows').innerHTML = shownScores.length ? shownScores.map(person => `<tr><td class="rank">${String(person.rank).padStart(2, '0')}</td><td class="name-cell"><strong>${escapeHTML(person.name)}</strong><small>${person.id}</small></td><td>${person.team}</td><td><span class="score-pill">${person.overall.toFixed(1)}%</span></td><td>${person.quality}%</td><td>${person.listening}%</td><td>${person.attendance}%</td><td>${person.saves}%</td></tr>`).join('') : '<tr><td colspan="8" class="empty-state">No scorecards match these filters. Try another team or search.</td></tr>';
    $('score-count').textContent = `${shownScores.length} of 12 sample scorecards`;
    $('export-scores').disabled = !shownScores.length;
  }
  function refreshTeams() {
    const selected = $('employee-team').value;
    const teams = Array.from(new Set(employees.map(person => person.team))).sort();
    $('employee-team').replaceChildren(new Option('All teams', 'all'), ...teams.map(team => new Option(team, team)));
    $('employee-team').value = teams.includes(selected) ? selected : 'all';
  }
  function renderEmployees() {
    const query = $('employee-search').value.trim().toLowerCase();
    const team = $('employee-team').value, status = $('employee-status').value;
    shownEmployees = employees.filter(person => (team === 'all' || person.team === team) && (status === 'all' || person.status === status) && `${person.id} ${person.name}`.toLowerCase().includes(query));
    $('employee-rows').innerHTML = shownEmployees.length ? shownEmployees.map(person => `<tr><td class="name-cell"><strong>${escapeHTML(person.name)}</strong><small>${escapeHTML(person.id)}</small></td><td>${escapeHTML(person.team)}</td><td>${escapeHTML(person.role)}</td><td><span class="status-pill ${person.status === 'On leave' ? 'leave' : ''}">${escapeHTML(person.status)}</span></td></tr>`).join('') : '<tr><td colspan="4" class="empty-state">No employees match these filters. Try a different search or reset the filters.</td></tr>';
    $('directory-count').textContent = `${shownEmployees.length} of ${employees.length} employees`;
    $('export-employees').disabled = !shownEmployees.length;
  }
  ['score-month', 'score-team', 'top-five'].forEach(id => $(id).addEventListener('change', renderScores));
  $('score-search').addEventListener('input', renderScores);
  ['employee-team', 'employee-status'].forEach(id => $(id).addEventListener('change', renderEmployees));
  $('employee-search').addEventListener('input', renderEmployees);
  $('export-scores').addEventListener('click', () => download(`sample-scorecards-2026-${$('score-month').value}.csv`, shownScores, ['rank', 'id', 'name', 'team', 'overall', 'quality', 'listening', 'attendance', 'saves']));
  $('export-employees').addEventListener('click', () => download('sample-employee-view.csv', shownEmployees, csvHeaders));
  $('download-sample').addEventListener('click', () => download('sample-employees.csv', initialEmployees.slice(0, 6), csvHeaders));
  $('import-trigger').addEventListener('click', () => $('import-file').click());
  const importMessage = (text, error = false) => { $('import-status').textContent = text; $('import-status').classList.toggle('error', error); };
  let importGeneration = 0;
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    const generation = ++importGeneration;
    if (!file) return;
    try {
      if (file.size > 100000) throw new Error('This demo accepts files up to 100 KB. Please use a smaller sample file.');
      if (!file.name.toLowerCase().endsWith('.csv')) throw new Error('Choose a .csv file. You can download the sample CSV above.');
      const records = employeesFromCSV(await file.text());
      if (generation !== importGeneration) return;
      employees = records;
      $('employee-search').value = ''; $('employee-status').value = 'all'; $('employee-team').value = 'all';
      refreshTeams(); renderEmployees(); renderOverview();
      importMessage(`Imported ${employees.length} employee records into this demo session. Scorecards and leave events remain the original sample data.`);
    } catch (error) { if (generation === importGeneration) importMessage(error.message, true); }
    finally { if (generation === importGeneration) event.target.value = ''; }
  });
  $('reset-data').addEventListener('click', () => {
    importGeneration++;
    employees = initialEmployees.map(person => ({ ...person }));
    $('employee-search').value = ''; $('employee-status').value = 'all'; $('employee-team').value = 'all'; $('import-file').value = '';
    refreshTeams(); renderEmployees(); renderOverview(); importMessage('The original 12 sample employees have been restored.');
  });

  const leaveEvents = [
    { year: 2026, month: 8, start: 22, end: 23, agent: 'Sample Agent 04', type: 'Vacation leave' },
    { year: 2026, month: 9, start: 5, end: 6, agent: 'Sample Agent 02', type: 'Vacation leave' },
    { year: 2026, month: 9, start: 12, end: 14, agent: 'Sample Agent 09', type: 'Vacation leave' },
    { year: 2026, month: 9, start: 19, end: 19, agent: 'Sample Agent 05', type: 'Personal leave' },
    { year: 2026, month: 9, start: 26, end: 27, agent: 'Sample Agent 11', type: 'Vacation leave' },
    { year: 2026, month: 10, start: 3, end: 4, agent: 'Sample Agent 01', type: 'Vacation leave' },
    { year: 2026, month: 10, start: 12, end: 12, agent: 'Sample Agent 07', type: 'Personal leave' }
  ];
  function renderCalendar() {
    const month = displayedMonth.getMonth(), year = displayedMonth.getFullYear();
    const title = displayedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const shortMonth = displayedMonth.toLocaleDateString('en-US', { month: 'short' });
    const events = leaveEvents.filter(event => event.month === month && event.year === year);
    const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const cells = Math.ceil((startOffset + days) / 7) * 7;
    $('calendar-month').textContent = title;
    $('calendar-days').setAttribute('aria-label', `${title}, approved sample leave`);
    $('calendar-days').innerHTML = Array.from({ length: cells }, (_, index) => {
      const day = index - startOffset + 1;
      if (day < 1 || day > days) return '<div class="calendar-day blank" aria-hidden="true"></div>';
      const dayEvents = events.filter(event => day >= event.start && day <= event.end);
      return `<div class="calendar-day ${index % 7 > 4 ? 'weekend' : ''}" aria-label="${shortMonth} ${day}${dayEvents.length ? `: ${dayEvents.map(event => `${event.agent}, ${event.type}`).join('; ')}` : ', no scheduled leave'}"><span>${day}</span>${dayEvents.map(event => `<div class="calendar-event">${event.agent.replace('Sample ', '')}</div>`).join('')}</div>`;
    }).join('');
    $('leave-list').innerHTML = events.length ? events.map(event => `<li><strong>${event.agent}</strong><span>${shortMonth} ${event.start}${event.end !== event.start ? `–${event.end}` : ''} · ${event.end - event.start + 1} ${event.end === event.start ? 'day' : 'days'}</span><span class="leave-type">${event.type} · Approved</span></li>`).join('') : '<li class="empty-state">No sample leave in this month. Try September, October, or November 2026.</li>';
  }
  $('previous-month').addEventListener('click', () => { displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1); renderCalendar(); });
  $('next-month').addEventListener('click', () => { displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1); renderCalendar(); });
  $('sample-month').addEventListener('click', () => { displayedMonth = new Date(2026, 9, 1); renderCalendar(); });
  refreshTeams(); renderOverview(); renderScores(); renderEmployees(); renderCalendar();
}
