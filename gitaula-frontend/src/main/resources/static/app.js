/* GitAula front end: plain JavaScript, no build step, no dependencies.
   It talks to the Courses and Deliveries packages of the backend. */
(() => {
  'use strict';

  /* ======================================================================
     Constants and labels
     ====================================================================== */
  const STORAGE = {
    settings: 'gitaula.settings',
    users: 'gitaula.users',
    activeUser: 'gitaula.activeUser',
    commissions: 'gitaula.commissions',
    selectedCommission: 'gitaula.selectedCommission',
  };

  const TERMS = [
    { value: 'FIRST_TERM', label: 'First term' },
    { value: 'SECOND_TERM', label: 'Second term' },
    { value: 'ANNUAL', label: 'Annual' },
  ];
  const ROLES = [
    { value: 'STUDENT', label: 'Student' },
    { value: 'TEACHER', label: 'Teacher' },
  ];
  const MODES = [
    { value: 'MANUAL_TEACHER', label: 'Manual: the teacher builds the teams' },
    { value: 'SELF_ORGANIZED_STUDENTS', label: 'Self-organized: students build the teams' },
  ];
  const ROLE_STYLE = {
    TEACHER: { tone: 'magenta', icon: '◆' },
    STUDENT: { tone: 'violet', icon: '●' },
  };
  const MODE_STYLE = {
    MANUAL_TEACHER: { tone: 'magenta', icon: '◆', label: 'Manual teams' },
    SELF_ORGANIZED_STUDENTS: { tone: 'violet', icon: '●', label: 'Self-organized teams' },
  };
  const TEAM_STATUS = {
    FORMING: { tone: 'amber', icon: '◔', label: 'Forming' },
    CONFIRMED: { tone: 'lime', icon: '✓', label: 'Confirmed' },
  };
  const DELIVERY_STEPS = [
    { value: 'CREATED', label: 'Created' },
    { value: 'IN_PROGRESS', label: 'In progress' },
    { value: 'FINISHED', label: 'Finished' },
  ];
  const OTHER = '__other__';

  const labelOf = (list, value) => (list.find((item) => item.value === value) || { label: value }).label;

  /* ======================================================================
     DOM helpers (everything is built with text nodes: no innerHTML)
     ====================================================================== */
  const $ = (selector, root = document) => root.querySelector(selector);

  function append(parent, children) {
    for (const child of children.flat(Infinity)) {
      if (child === null || child === undefined || child === false) continue;
      parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
  }

  // Like replaceChildren, but it also accepts arrays and ignores null / false.
  function setChildren(parent, ...children) {
    parent.replaceChildren();
    append(parent, children);
  }

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === false || value === null || value === undefined) continue;
      if (key === 'class') el.className = value;
      else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
      else if (value === true) el.setAttribute(key, '');
      else el.setAttribute(key, String(value));
    }
    append(el, children);
    return el;
  }

  let uid = 0;
  const nextId = (prefix) => `${prefix}-${++uid}`;

  /* ======================================================================
     Storage and state
     ====================================================================== */
  const storage = {
    get(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (error) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        /* storage not available: the page keeps working in memory */
      }
    },
    clearAll() {
      Object.values(STORAGE).forEach((key) => {
        try { window.localStorage.removeItem(key); } catch (error) { /* ignore */ }
      });
    },
  };

  const state = {
    settings: { apiBase: '', testMode: false, ...storage.get(STORAGE.settings, {}) },
    users: storage.get(STORAGE.users, []),
    activeUserId: storage.get(STORAGE.activeUser, null),
    commissions: storage.get(STORAGE.commissions, {}),
    selectedCommissionId: storage.get(STORAGE.selectedCommission, null),
    log: [],
  };

  const activeUser = () => state.users.find((user) => user.id === state.activeUserId) || null;
  const userLabel = (id) => {
    const user = state.users.find((item) => item.id === id);
    return user ? user.name : `User #${id}`;
  };
  const commissionLabel = (id) => {
    const commission = state.commissions[id];
    return commission ? commission.name : `Commission #${id}`;
  };

  function rememberUser(user) {
    const index = state.users.findIndex((item) => item.id === user.id);
    if (index >= 0) state.users[index] = { ...state.users[index], ...user };
    else state.users.push(user);
    storage.set(STORAGE.users, state.users);
    renderActiveUserSelect();
  }

  function setActiveUser(id) {
    state.activeUserId = id;
    storage.set(STORAGE.activeUser, id);
    renderActiveUserSelect();
  }

  function forgetUser(id) {
    state.users = state.users.filter((user) => user.id !== id);
    storage.set(STORAGE.users, state.users);
    if (state.activeUserId === id) setActiveUser(state.users.length ? state.users[0].id : null);
    else renderActiveUserSelect();
  }

  function rememberCommission(commission) {
    state.commissions[commission.id] = { ...state.commissions[commission.id], ...commission };
    storage.set(STORAGE.commissions, state.commissions);
  }

  function selectCommission(id) {
    state.selectedCommissionId = id;
    storage.set(STORAGE.selectedCommission, id);
  }

  const commissionOptions = () => Object.values(state.commissions)
    .sort((a, b) => a.id - b.id)
    .map((commission) => ({ value: String(commission.id), label: `${commission.name} (#${commission.id})` }));

  const userOptions = () => state.users.map((user) => ({ value: String(user.id), label: `${user.name} (#${user.id})` }));

  /* ======================================================================
     API client and activity log
     ====================================================================== */
  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  }

  function describeError(status, data) {
    if (data && data.message) return data.message;
    if (status === 400) return 'The server rejected the data that was sent. Check every field and try again.';
    if (status === 404) return 'The server could not find that. Check the ids and try again.';
    if (status === 409) return 'That action conflicts with the current state of the data.';
    return `The server answered with an error (${status}).`;
  }

  async function api(method, path, body) {
    const url = state.settings.apiBase.replace(/\/+$/, '') + path;
    const options = { method, headers: { Accept: 'application/json' } };
    if (body !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(url, options);
    } catch (error) {
      addLog(method, path, 0, 'No connection');
      throw new ApiError(0, 'Cannot reach the server. Check that the backend is running and that the API address in Settings is right.');
    }

    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch (error) { data = null; }
    }
    addLog(method, path, response.status, response.statusText || '');
    if (!response.ok) throw new ApiError(response.status, describeError(response.status, data));
    return data;
  }

  const endpoints = {
    // Courses
    createUser: (body) => api('POST', '/users', body),
    createCommission: (body) => api('POST', '/commissions', body),
    enroll: (commissionId, body) => api('POST', `/commissions/${commissionId}/enrollments`, body),
    getCommissionsByUser: (userId) => api('GET', `/commissions?userId=${encodeURIComponent(userId)}`),
    // Deliveries
    createProject: (commissionId, body) => api('POST', `/commissions/${commissionId}/projects`, body),
    getProjects: (commissionId) => api('GET', `/commissions/${commissionId}/projects`),
    createTeam: (projectId, body) => api('POST', `/projects/${projectId}/teams`, body),
    joinTeam: (teamId, userId) => api('PUT', `/teams/${teamId}/members/${userId}`),
    leaveTeam: (teamId, userId) => api('DELETE', `/teams/${teamId}/members/${userId}`),
    moveMember: (teamId, userId, destinationTeamId) =>
      api('PATCH', `/teams/${teamId}/members/${userId}`, { teamId: destinationTeamId }),
    confirmTeam: (teamId) => api('POST', `/teams/${teamId}/confirmation`),
    updateDeliveryStatus: (deliveryId, status) => api('PATCH', `/deliveries/${deliveryId}`, { status }),
  };

  function addLog(method, path, status, text) {
    state.log.unshift({ time: new Date(), method, path, status, text });
    state.log.length = Math.min(state.log.length, 40);
    renderLog();
  }

  function renderLog() {
    const list = $('#log-list');
    if (!list) return;
    list.replaceChildren(...state.log.map((entry) => {
      let tone = 'lime';
      let icon = '✓';
      if (entry.status === 0 || entry.status >= 500) { tone = 'coral'; icon = '✕'; }
      else if (entry.status >= 400) { tone = 'amber'; icon = '!'; }
      return h('li', { class: `log-item tone-${tone}` },
        h('span', { class: 'method' }, entry.method),
        h('span', { class: 'path' }, entry.path),
        h('span', { class: 'result' }, `${icon} ${entry.status || 'failed'} ${entry.text}`.trim()),
        h('time', { datetime: entry.time.toISOString() }, entry.time.toLocaleTimeString()));
    }));
    const count = state.log.length;
    $('#log-count').textContent = `${count} ${count === 1 ? 'call' : 'calls'}`;
  }

  /* ======================================================================
     Feedback (live regions)
     ====================================================================== */
  function setLive(element, message) {
    element.textContent = '';
    window.setTimeout(() => { element.textContent = message; }, 40);
  }

  const feedback = {
    status(message) {
      $('#alert-msg').textContent = '';
      setLive($('#status-msg'), message);
    },
    error(message) {
      $('#status-msg').textContent = '';
      setLive($('#alert-msg'), message);
    },
    clear() {
      $('#status-msg').textContent = '';
      $('#alert-msg').textContent = '';
    },
  };

  function reportError(error) {
    if (error instanceof ApiError) {
      feedback.error(error.message);
    } else {
      console.error(error);
      feedback.error('Something unexpected happened. Open the browser console for details.');
    }
  }

  function requireActiveUser() {
    const user = activeUser();
    if (!user) {
      throw new ApiError(0, 'Choose or create a user first: use the "Acting as" menu or the Users page.');
    }
    return user;
  }

  /* ======================================================================
     UI components
     ====================================================================== */
  function viewHead(title, intro) {
    return h('div', { class: 'view-head' },
      h('h2', { class: 'view-title', tabindex: '-1' }, title),
      intro ? h('p', { class: 'lead' }, intro) : null);
  }

  function card(title, tone, ...children) {
    const id = nextId('card');
    return h('section', { class: `card tone-${tone}`, 'aria-labelledby': id },
      h('h3', { class: 'card-title', id }, title),
      children);
  }

  function chip(text, tone, icon) {
    return h('span', { class: `chip tone-${tone}` },
      icon ? h('span', { class: 'chip-icon', 'aria-hidden': 'true' }, icon) : null,
      text);
  }

  const roleChip = (role) => chip(labelOf(ROLES, role), ROLE_STYLE[role].tone, ROLE_STYLE[role].icon);

  function emptyState(message, link) {
    return h('div', { class: 'empty' },
      h('p', {}, message),
      link ? h('a', { class: 'btn btn-quiet', href: link.href }, link.text) : null);
  }

  function button(label, options = {}) {
    const { variant = 'quiet', small = false, context, onClick, type = 'button', pressed, ...rest } = options;
    return h('button', {
      type,
      class: `btn btn-${variant}${small ? ' btn-small' : ''}`,
      'aria-pressed': pressed === undefined ? null : String(pressed),
      onclick: onClick,
      ...rest,
    }, label, context ? h('span', { class: 'visually-hidden' }, ` ${context}`) : null);
  }

  // Wraps a click handler: disables the button while the request runs and reports failures.
  function action(work) {
    return async (event) => {
      const target = event.currentTarget;
      target.disabled = true;
      try {
        await work();
      } catch (error) {
        reportError(error);
      } finally {
        target.disabled = false;
      }
    };
  }

  function makeControl(el, input, errorEl, label, required) {
    return {
      el, input, label, required,
      active: () => true,
      value: () => input.value.trim(),
      setError(message) {
        errorEl.textContent = message;
        input.setAttribute('aria-invalid', 'true');
      },
      clearError() {
        errorEl.textContent = '';
        input.removeAttribute('aria-invalid');
      },
    };
  }

  function field({ label, type = 'text', required = false, hint, value = '', name, ...attrs }) {
    const id = nextId('field');
    const describedBy = [hint ? `${id}-hint` : '', `${id}-error`].filter(Boolean).join(' ');
    const isArea = type === 'textarea';
    const input = h(isArea ? 'textarea' : 'input', {
      id, name, ...(isArea ? {} : { type }), required, 'aria-describedby': describedBy, ...attrs,
    });
    input.value = value;
    const errorEl = h('p', { class: 'field-error', id: `${id}-error` });
    const el = h('div', { class: 'field' },
      h('label', { for: id }, label, required ? h('span', { class: 'req' }, ' (required)') : null),
      hint ? h('p', { class: 'hint', id: `${id}-hint` }, hint) : null,
      input,
      errorEl);
    return makeControl(el, input, errorEl, label, required);
  }

  function selectField({ label, options, value, hint, required = false }) {
    const id = nextId('field');
    const describedBy = [hint ? `${id}-hint` : '', `${id}-error`].filter(Boolean).join(' ');
    const input = h('select', { id, required, 'aria-describedby': describedBy },
      options.map((option) => h('option', { value: option.value }, option.label)));
    if (value !== undefined && value !== null) input.value = String(value);
    const errorEl = h('p', { class: 'field-error', id: `${id}-error` });
    const el = h('div', { class: 'field' },
      h('label', { for: id }, label),
      hint ? h('p', { class: 'hint', id: `${id}-hint` }, hint) : null,
      input,
      errorEl);
    return makeControl(el, input, errorEl, label, required);
  }

  // A select of known ids plus an "Another id" option that reveals a number field.
  function idPicker({ label, options, hint, initial }) {
    const known = options.some((option) => option.value === String(initial));
    const select = selectField({
      label, hint, required: true,
      options: [...options, { value: OTHER, label: 'Another id…' }],
      value: known ? String(initial) : (options.length && initial == null ? options[0].value : OTHER),
    });
    const other = field({
      label: `${label}: id number`, type: 'number', required: true, min: 1, step: 1,
      value: !known && initial != null ? String(initial) : '',
    });
    other.active = () => !other.el.hidden;
    const sync = () => { other.el.hidden = select.input.value !== OTHER; };
    select.input.addEventListener('change', sync);
    sync();
    return {
      el: h('div', { class: 'picker' }, select.el, other.el),
      controls: [select, other],
      value: () => (select.input.value === OTHER ? other.value() : select.input.value),
    };
  }

  function validateControls(controls) {
    const invalid = [];
    for (const control of controls) {
      control.clearError();
      if (!control.active()) continue;
      if (control.required && control.input.value.trim() === '') {
        control.setError(`${control.label} is required.`);
        invalid.push(control);
      } else if (control.input.value && !control.input.checkValidity()) {
        control.setError(control.input.validationMessage || `${control.label} is not valid.`);
        invalid.push(control);
      }
    }
    return invalid;
  }

  // parts: fields / pickers. check(): optional extra rules returning [{ control, message }].
  function formElement({ parts, extra = [], submitLabel, submitVariant = 'primary', check, onSubmit, className }) {
    // Parts without an input (for example a group of checkboxes) are shown but not validated here.
    const controls = parts.flatMap((part) => part.controls || [part]).filter((control) => control.input);
    const submit = button(submitLabel, { variant: submitVariant, type: 'submit' });
    const form = h('form', { novalidate: true, class: className || null },
      parts.map((part) => part.el), extra, h('div', { class: 'actions' }, submit));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const problems = validateControls(controls).map((control) => ({ control, message: null }));
      if (!problems.length && check) {
        for (const problem of check()) {
          problem.control.setError(problem.message);
          problems.push(problem);
        }
      }
      if (problems.length) {
        const names = problems.map((problem) => problem.control.label).join(', ');
        feedback.error(`Please fix ${problems.length} ${problems.length === 1 ? 'field' : 'fields'}: ${names}.`);
        problems[0].control.input.focus();
        return;
      }
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      try {
        await onSubmit();
      } catch (error) {
        reportError(error);
      } finally {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
      }
    });
    return form;
  }

  function parseIdList(text) {
    const pieces = text.split(/[\s,]+/).filter(Boolean);
    const ids = pieces.map(Number);
    const valid = ids.every((id) => Number.isInteger(id) && id > 0);
    return { ids, valid };
  }

  /* ======================================================================
     Header: acting-as menu, settings, activity
     ====================================================================== */
  function renderActiveUserSelect() {
    const select = $('#active-user');
    if (!select) return;
    select.replaceChildren();
    if (!state.users.length) {
      select.append(h('option', { value: '' }, 'No users yet'));
      select.disabled = true;
      return;
    }
    select.disabled = false;
    state.users.forEach((user) => select.append(h('option', { value: String(user.id) }, `${user.name} (#${user.id})`)));
    if (!activeUser()) {
      state.activeUserId = state.users[0].id;
      storage.set(STORAGE.activeUser, state.activeUserId);
    }
    select.value = String(state.activeUserId);
  }

  function setupSettings() {
    const dialog = $('#settings');
    $('#open-settings').addEventListener('click', () => {
      $('#api-base').value = state.settings.apiBase;
      $('#test-mode').checked = state.settings.testMode;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
    dialog.addEventListener('close', () => {
      if (dialog.returnValue !== 'save') return;
      state.settings.apiBase = $('#api-base').value.trim();
      state.settings.testMode = $('#test-mode').checked;
      storage.set(STORAGE.settings, state.settings);
      feedback.status('Settings saved.');
      showView({ focus: false });
    });
    $('#clear-data').addEventListener('click', () => {
      if (!window.confirm('Forget all users, commissions and settings saved in this browser? The backend data is not touched.')) return;
      storage.clearAll();
      state.users = [];
      state.commissions = {};
      state.activeUserId = null;
      state.selectedCommissionId = null;
      state.settings = { apiBase: '', testMode: false };
      if (typeof dialog.close === 'function') dialog.close('cancel');
      renderActiveUserSelect();
      feedback.status('Saved data was cleared.');
      showView({ focus: false });
    });
  }

  /* ======================================================================
     View: Users
     ====================================================================== */
  function createUserForm() {
    const name = field({ label: 'Name', name: 'name', required: true, autocomplete: 'name' });
    const email = field({ label: 'Email', type: 'email', name: 'email', required: true, autocomplete: 'email' });
    const github = field({
      label: 'GitHub username', name: 'githubUsername', required: true, autocomplete: 'off',
      autocapitalize: 'off', spellcheck: 'false',
      hint: 'It identifies the user: sending the same username again returns the same user.',
    });
    return formElement({
      parts: [name, email, github],
      submitLabel: 'Save user',
      onSubmit: async () => {
        const user = await endpoints.createUser({
          name: name.value(), email: email.value(), githubUsername: github.value(),
        });
        rememberUser({ id: user.id, name: user.name, email: user.email, githubUsername: user.githubUsername });
        setActiveUser(user.id);
        feedback.status(`User ${user.name} saved with id ${user.id}. You are now acting as ${user.name}.`);
        await showView({ keepFeedback: true });
      },
    });
  }

  function addKnownUserForm() {
    const id = field({
      label: 'User id', type: 'number', required: true, min: 1, step: 1,
      hint: 'Use this for a user that already exists in the backend but is not listed here.',
    });
    const name = field({ label: 'Name to show', hint: 'Optional. Only this browser stores it.' });
    return formElement({
      parts: [id, name],
      submitLabel: 'Add user',
      submitVariant: 'quiet',
      onSubmit: async () => {
        const number = Number(id.value());
        rememberUser({ id: number, name: name.value() || `User #${number}` });
        feedback.status(`User ${number} added to this browser.`);
        await showView({ keepFeedback: true });
      },
    });
  }

  function usersTable() {
    if (!state.users.length) {
      return emptyState('No users yet. Create the first one with the form.');
    }
    const rows = state.users.map((user) => {
      const isActive = user.id === state.activeUserId;
      return h('tr', {},
        h('td', {}, `#${user.id}`),
        h('th', { scope: 'row' }, user.name),
        h('td', {}, user.githubUsername || 'not known'),
        h('td', {}, h('div', { class: 'cell-actions' },
          button('Act as', {
            small: true, variant: 'quiet', pressed: isActive, context: user.name,
            onClick: () => {
              setActiveUser(user.id);
              feedback.status(`You are now acting as ${user.name}.`);
              showView({ keepFeedback: true, focus: false });
            },
          }),
          button('Forget', {
            small: true, variant: 'danger', context: user.name,
            onClick: () => {
              forgetUser(user.id);
              feedback.status(`${user.name} was removed from this browser. The backend still has the user.`);
              showView({ keepFeedback: true });
            },
          }))));
    });
    return h('div', { class: 'table-wrap', role: 'region', 'aria-label': 'Users table', tabindex: '0' },
      h('table', {},
        h('caption', {}, 'The button marked as pressed is the user you are acting as.'),
        h('thead', {}, h('tr', {},
          h('th', { scope: 'col' }, 'Id'), h('th', { scope: 'col' }, 'Name'),
          h('th', { scope: 'col' }, 'GitHub'), h('th', { scope: 'col' }, 'Actions'))),
        h('tbody', {}, rows)));
  }

  function renderUsers(view) {
    view.append(
      viewHead('Users', 'The backend has no login or user list yet, so this browser remembers the users you create. Choose who you are acting as in the header to try the teacher and student flows.'),
      h('div', { class: 'grid' },
        card('Create or find a user', 'cyan', createUserForm()),
        card('Add an existing user by id', 'violet', addKnownUserForm())),
      card('Users in this browser', 'magenta', usersTable()));
  }

  /* ======================================================================
     View: Commissions
     ====================================================================== */
  async function fetchMyCommissions() {
    if (state.activeUserId == null) return [];
    const list = await endpoints.getCommissionsByUser(state.activeUserId);
    list.forEach((item) => rememberCommission({
      id: item.commissionId, name: item.commissionName, subjectName: item.subjectName, term: item.term, year: item.year,
    }));
    return list;
  }

  function commissionsTable(list) {
    const rows = list.map((item) => h('tr', {},
      h('td', {}, `#${item.commissionId}`),
      h('th', { scope: 'row' }, item.commissionName),
      h('td', {}, item.subjectName),
      h('td', {}, `${labelOf(TERMS, item.term)}, ${item.year}`),
      h('td', {}, roleChip(item.role)),
      h('td', {}, button('Open projects', {
        small: true, context: `of ${item.commissionName}`,
        onClick: () => { selectCommission(item.commissionId); window.location.hash = '#/projects'; },
      }))));
    return h('div', { class: 'table-wrap', role: 'region', 'aria-label': 'Commissions table', tabindex: '0' },
      h('table', {},
        h('caption', {}, 'Each commission shows the role this user has in it.'),
        h('thead', {}, h('tr', {},
          h('th', { scope: 'col' }, 'Id'), h('th', { scope: 'col' }, 'Commission'), h('th', { scope: 'col' }, 'Subject'),
          h('th', { scope: 'col' }, 'Term'), h('th', { scope: 'col' }, 'Role'), h('th', { scope: 'col' }, 'Actions'))),
        h('tbody', {}, rows)));
  }

  async function fillMyCommissions(container) {
    if (state.activeUserId == null) {
      container.replaceChildren(emptyState('Choose or create a user to see their commissions.', { href: '#/users', text: 'Go to Users' }));
      return;
    }
    container.replaceChildren(h('p', { class: 'note' }, 'Loading commissions…'));
    try {
      const list = await fetchMyCommissions();
      container.replaceChildren(list.length
        ? commissionsTable(list)
        : emptyState(`${activeUser().name} is not enrolled in any commission yet. Create one or enroll them with the forms.`));
    } catch (error) {
      container.replaceChildren(emptyState('The commissions could not be loaded.'));
      reportError(error);
    }
  }

  function createCommissionForm() {
    const name = field({ label: 'Commission name', name: 'commissionName', required: true });
    const term = selectField({ label: 'Term', options: TERMS, required: true });
    const year = field({
      label: 'Year', type: 'number', required: true, min: 2000, max: 2100, step: 1,
      value: String(new Date().getFullYear()),
    });
    const code = field({
      label: 'Subject code', required: true, autocapitalize: 'characters', spellcheck: 'false',
      hint: 'For example DB101. If a subject with this code already exists it is reused.',
    });
    const subjectName = field({
      label: 'Subject name',
      hint: 'Only needed when the subject does not exist yet. Otherwise it is ignored.',
    });
    const user = activeUser();
    const creator = h('p', { class: 'note' },
      user ? ['The commission will have ', h('strong', {}, user.name), ' as its teacher.']
        : 'Choose or create a user first: the creator becomes the teacher.');
    return formElement({
      parts: [name, term, year, code, subjectName],
      extra: [creator],
      submitLabel: 'Create commission',
      onSubmit: async () => {
        const creatorUser = requireActiveUser();
        const body = {
          commissionName: name.value(), term: term.input.value, year: Number(year.value()),
          subjectCode: code.value(), creatorUserId: creatorUser.id,
        };
        if (subjectName.value()) body.subjectName = subjectName.value();
        const created = await endpoints.createCommission(body);
        rememberCommission({
          id: created.id, name: created.commissionName, term: created.term, year: created.year,
          subjectName: subjectName.value() || '',
        });
        feedback.status(`Commission ${created.commissionName} created with id ${created.id}. ${creatorUser.name} is its teacher.`);
        await showView({ keepFeedback: true });
      },
    });
  }

  function enrollForm() {
    const commission = idPicker({
      label: 'Commission', options: commissionOptions(),
      initial: state.selectedCommissionId,
      hint: 'Commissions you have seen in this browser are listed. Pick "Another id" for any other.',
    });
    const user = idPicker({ label: 'User to enroll', options: userOptions(), initial: state.activeUserId });
    const role = selectField({ label: 'Role in the commission', options: ROLES, required: true });
    return formElement({
      parts: [commission, user, role],
      submitLabel: 'Enroll user',
      onSubmit: async () => {
        const commissionId = Number(commission.value());
        const userId = Number(user.value());
        await endpoints.enroll(commissionId, { userId, role: role.input.value });
        feedback.status(`${userLabel(userId)} is now enrolled as ${labelOf(ROLES, role.input.value).toLowerCase()} in ${commissionLabel(commissionId)}.`);
        await showView({ keepFeedback: true });
      },
    });
  }

  async function renderCommissions(view) {
    const listBox = h('div', { class: 'list-box' });
    const user = activeUser();
    view.append(
      viewHead('Commissions', 'A commission is a course group. Whoever creates one becomes its teacher, and anyone can then be enrolled as a student or a teacher.'),
      card(user ? `Commissions of ${user.name}` : 'My commissions', 'cyan', listBox),
      h('div', { class: 'grid' },
        card('Create a commission', 'lime', createCommissionForm()),
        card('Enroll a user', 'magenta', enrollForm())));
    await fillMyCommissions(listBox);
  }

  /* ======================================================================
     View: Projects (teams and deliveries)
     ====================================================================== */
  function roleBanner(ctx) {
    const user = activeUser();
    let tone = 'cyan';
    const lines = [];
    if (!user) {
      lines.push(h('p', {}, 'No user selected, so you can look but not act. ', h('a', { href: '#/users' }, 'Create or choose a user.')));
    } else if (ctx.role) {
      tone = ROLE_STYLE[ctx.role].tone;
      lines.push(h('p', {}, 'Acting as ', h('strong', {}, user.name), ', who is a ', roleChip(ctx.role), ' in this commission.'));
    } else {
      tone = 'amber';
      lines.push(h('p', {}, h('strong', {}, user.name), ' is not enrolled in this commission, so actions are hidden. ',
        h('a', { href: '#/commissions' }, 'Enroll the user from Commissions.')));
    }
    if (ctx.testMode) {
      lines.push(h('p', {}, 'Test mode is on: every action is shown, even the ones this role would not normally use.'));
    }
    return h('div', { class: `role-banner tone-${tone}` }, lines);
  }

  async function reloadProjects(focusSelector) {
    const container = $('#projects-container');
    if (container) await loadProjectsInto(container, focusSelector);
  }

  async function loadProjectsInto(container, focusSelector) {
    const commissionId = Number(state.selectedCommissionId);
    container.setAttribute('aria-busy', 'true');
    container.replaceChildren(h('p', { class: 'note' }, 'Loading projects…'));
    try {
      const [projects, mine] = await Promise.all([
        endpoints.getProjects(commissionId),
        state.activeUserId != null ? fetchMyCommissions() : Promise.resolve([]),
      ]);
      const entry = mine.find((item) => item.commissionId === commissionId);
      const ctx = {
        commissionId, role: entry ? entry.role : null, userId: state.activeUserId, testMode: state.settings.testMode,
      };
      const isTeacher = ctx.testMode || ctx.role === 'TEACHER';
      setChildren(
        container,
        roleBanner(ctx),
        isTeacher ? card('Create a project', 'lime', createProjectForm(ctx)) : null,
        projects.length
          ? projects.map((project) => projectCard(project, ctx))
          : emptyState(`${commissionLabel(commissionId)} has no projects yet.${isTeacher ? ' Create the first one above.' : ''}`));
    } catch (error) {
      container.replaceChildren(emptyState('The projects could not be loaded.'));
      reportError(error);
    } finally {
      container.removeAttribute('aria-busy');
    }
    if (focusSelector) {
      const target = $(focusSelector);
      if (target) target.focus();
    }
  }

  function createProjectForm(ctx) {
    const name = field({ label: 'Project name', name: 'projectName', required: true });
    const description = field({ label: 'Description', type: 'textarea' });
    const mode = selectField({ label: 'How are the teams formed?', options: MODES, required: true });
    const deadline = field({
      label: 'Team formation deadline', type: 'date',
      hint: 'Required when students build the teams themselves.',
    });
    return formElement({
      parts: [name, description, mode, deadline],
      submitLabel: 'Create project',
      check: () => (mode.input.value === 'SELF_ORGANIZED_STUDENTS' && !deadline.value()
        ? [{ control: deadline, message: 'Team formation deadline is required for self-organized projects.' }] : []),
      onSubmit: async () => {
        const body = { projectName: name.value(), teamFormationMode: mode.input.value };
        if (description.value()) body.description = description.value();
        if (deadline.value()) body.teamFormationDeadline = deadline.value();
        const created = await endpoints.createProject(ctx.commissionId, body);
        feedback.status(`Project ${created.projectName} created with id ${created.id}.`);
        await reloadProjects(`#project-${created.id}-title`);
      },
    });
  }

  function projectCard(project, ctx) {
    const titleId = `project-${project.projectId}-title`;
    const mode = MODE_STYLE[project.teamFormationMode];
    const canAddTeam = ctx.userId != null && (ctx.testMode
      || (project.teamFormationMode === 'MANUAL_TEACHER' ? ctx.role === 'TEACHER' : ctx.role === 'STUDENT'));
    return h('article', { class: `card project tone-${mode.tone}`, 'aria-labelledby': titleId },
      h('div', { class: 'project-head' },
        h('h3', { id: titleId, tabindex: '-1' }, project.projectName),
        chip(mode.label, mode.tone, mode.icon),
        h('span', { class: 'id-tag' }, `Project #${project.projectId}`)),
      project.teams.length
        ? h('div', { class: 'teams' }, project.teams.map((team) => teamCard(project, team, ctx)))
        : h('p', { class: 'note' }, 'No teams yet.'),
      canAddTeam ? addTeamDetails(project, ctx) : null);
  }

  function addTeamDetails(project, ctx) {
    const manual = project.teamFormationMode === 'MANUAL_TEACHER';
    const teamName = field({ label: 'Team name', required: true });
    const boxes = state.users.map((user) => ({
      user,
      input: h('input', {
        type: 'checkbox', id: nextId('member'), value: String(user.id),
        checked: !manual && user.id === ctx.userId,
      }),
    }));
    const group = h('fieldset', {},
      h('legend', {}, 'Members'),
      h('p', { class: 'hint' }, manual
        ? 'Choose everyone in the team. A manual team is confirmed right away and its delivery is created.'
        : 'Choose yourself and anyone who already agreed. The team stays open until the teacher confirms it.'),
      h('div', { class: 'checklist' }, boxes.map(({ user, input }) =>
        h('label', { for: input.id }, input, user.name, h('span', { class: 'id-tag' }, `#${user.id}`)))));
    const others = field({
      label: 'Other user ids', hint: 'Optional. Separate several ids with commas, for example 12, 15.',
    });
    const collect = () => {
      const typed = parseIdList(others.value());
      const chosen = boxes.filter(({ input }) => input.checked).map(({ user }) => user.id);
      return { ids: [...new Set([...chosen, ...typed.ids])], valid: typed.valid };
    };
    const form = formElement({
      parts: [teamName, { el: group }, others],
      submitLabel: 'Create team',
      check: () => {
        const { ids, valid } = collect();
        if (!valid) return [{ control: others, message: 'Use only positive whole numbers separated by commas.' }];
        if (!ids.length) return [{ control: others, message: 'Choose at least one member or type a user id.' }];
        return [];
      },
      onSubmit: async () => {
        const team = await endpoints.createTeam(project.projectId, {
          teamName: teamName.value(), memberUserIds: collect().ids,
        });
        feedback.status(team.teamStatus === 'CONFIRMED'
          ? `Team ${team.teamName} created and confirmed. Its delivery was created.`
          : `Team ${team.teamName} created. It stays open until the teacher confirms it.`);
        await reloadProjects(`#team-${team.teamId}-title`);
      },
    });
    return h('details', { class: 'add-team' }, h('summary', {}, 'Add a team to this project'), form);
  }

  function teamCard(project, team, ctx) {
    const status = TEAM_STATUS[team.teamStatus];
    const forming = team.teamStatus === 'FORMING';
    const titleId = `team-${team.teamId}-title`;
    const isTeacher = ctx.testMode || ctx.role === 'TEACHER';
    const isStudent = ctx.testMode || ctx.role === 'STUDENT';
    const userIsMember = ctx.userId != null && team.memberUserIds.includes(ctx.userId);
    const userInProject = ctx.userId != null && project.teams.some((item) => item.memberUserIds.includes(ctx.userId));
    const otherTeams = project.teams.filter((item) => item.teamId !== team.teamId);
    const focusTeam = `#${titleId}`;
    const actingName = activeUser() ? activeUser().name : '';

    const teamActions = [];
    if (forming && ctx.userId != null && !userIsMember && isStudent && (ctx.testMode || !userInProject)) {
      teamActions.push(button('Join this team', {
        variant: 'primary', context: `as ${actingName}`,
        onClick: action(async () => {
          await endpoints.joinTeam(team.teamId, ctx.userId);
          feedback.status(`${actingName} joined ${team.teamName}.`);
          await reloadProjects(focusTeam);
        }),
      }));
    }
    if (forming && isTeacher) {
      teamActions.push(button('Confirm team', {
        variant: 'accent-lime', context: team.teamName,
        onClick: action(async () => {
          await endpoints.confirmTeam(team.teamId);
          feedback.status(`${team.teamName} confirmed. Its delivery was created.`);
          await reloadProjects(focusTeam);
        }),
      }));
    }

    return h('article', { class: `team team-${team.teamStatus.toLowerCase()}`, 'aria-labelledby': titleId },
      h('div', { class: 'team-head' },
        h('h4', { id: titleId, tabindex: '-1' }, team.teamName),
        chip(status.label, status.tone, status.icon),
        h('span', { class: 'id-tag' }, `Team #${team.teamId}`)),
      team.memberUserIds.length
        ? h('ul', { class: 'members', 'aria-label': `Members of ${team.teamName}` },
          team.memberUserIds.map((userId) => memberRow(team, userId, { forming, isTeacher, otherTeams, ctx, focusTeam })))
        : h('p', { class: 'note' }, 'This team has no members left.'),
      teamActions.length ? h('div', { class: 'actions' }, teamActions) : null,
      deliveryPanel(team, { isTeacher, userIsMember, focusTeam }));
  }

  function memberRow(team, userId, { forming, isTeacher, otherTeams, ctx, focusTeam }) {
    const isSelf = ctx.userId === userId;
    const name = userLabel(userId);
    const tools = [];

    if (forming && (isSelf || isTeacher)) {
      tools.push(button(isSelf ? 'Leave' : 'Remove', {
        small: true, variant: 'danger', context: isSelf ? `${team.teamName}` : `${name} from ${team.teamName}`,
        onClick: action(async () => {
          await endpoints.leaveTeam(team.teamId, userId);
          feedback.status(isSelf ? `${name} left ${team.teamName}.` : `${name} was removed from ${team.teamName}.`);
          await reloadProjects(focusTeam);
        }),
      }));
    }
    if (isTeacher && otherTeams.length) tools.push(moveForm(team, userId, otherTeams, focusTeam));

    return h('li', { class: 'member' },
      h('span', { class: 'member-name' }, name, ' ', h('span', { class: 'id-tag' }, `#${userId}`)),
      tools.length ? h('div', { class: 'member-tools' }, tools) : null);
  }

  function moveForm(team, userId, otherTeams, focusTeam) {
    const id = nextId('move');
    const name = userLabel(userId);
    const select = h('select', { id },
      otherTeams.map((item) => h('option', { value: String(item.teamId) }, `${item.teamName} (#${item.teamId})`)));
    const form = h('form', { class: 'inline-form', novalidate: true },
      h('label', { class: 'visually-hidden', for: id }, `Move ${name} to another team`),
      select,
      button('Move', { type: 'submit', small: true, context: name }));
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const destination = Number(select.value);
      try {
        await endpoints.moveMember(team.teamId, userId, destination);
        const destinationName = otherTeams.find((item) => item.teamId === destination).teamName;
        feedback.status(`${name} moved from ${team.teamName} to ${destinationName}.`);
        await reloadProjects(focusTeam);
      } catch (error) {
        reportError(error);
      }
    });
    return form;
  }

  // The delivery progress is drawn like a commit graph: nodes joined by a line.
  function deliveryPanel(team, { isTeacher, userIsMember, focusTeam }) {
    if (team.deliveryId == null) {
      return h('div', { class: 'delivery' },
        h('p', { class: 'note' }, 'No delivery yet. It is created when the team is confirmed.'));
    }
    const currentIndex = DELIVERY_STEPS.findIndex((step) => step.value === team.deliveryStatus);
    const steps = DELIVERY_STEPS.map((step, index) => {
      const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo';
      const text = { done: 'Done', current: 'Current', todo: 'Pending' }[state];
      return h('li', { class: `step ${state}`, 'data-step': step.value, 'aria-current': state === 'current' ? 'step' : null },
        h('span', { class: 'node', 'aria-hidden': 'true' }),
        h('span', { class: 'step-label' }, step.label),
        h('span', { class: 'step-state' }, text));
    });

    const next = { CREATED: ['IN_PROGRESS', 'Start work'], IN_PROGRESS: ['FINISHED', 'Mark as finished'] }[team.deliveryStatus];
    const canChange = next && (isTeacher || userIsMember);

    return h('div', { class: 'delivery' },
      h('p', {}, h('strong', {}, `Delivery #${team.deliveryId}`)),
      h('ol', { class: 'tracker', 'aria-label': `Progress of delivery ${team.deliveryId}` }, steps),
      canChange ? h('div', { class: 'actions' },
        button(next[1], {
          variant: 'accent-amber', context: `for ${team.teamName}`,
          onClick: action(async () => {
            await endpoints.updateDeliveryStatus(team.deliveryId, next[0]);
            feedback.status(`Delivery ${team.deliveryId} of ${team.teamName} is now ${labelOf(DELIVERY_STEPS, next[0]).toLowerCase()}.`);
            await reloadProjects(focusTeam);
          }),
        }),
        h('p', { class: 'note' }, 'For now the status changes by hand. Later it will follow the GitHub repository.')) : null);
  }

  function commissionPickerForm() {
    const picker = idPicker({
      label: 'Commission', options: commissionOptions(), initial: state.selectedCommissionId,
      hint: 'Open a commission from the Commissions page, or pick one you have seen before.',
    });
    return formElement({
      parts: [picker],
      submitLabel: 'Show projects',
      onSubmit: async () => {
        selectCommission(Number(picker.value()));
        await showView({ keepFeedback: true, focus: false });
      },
    });
  }

  async function renderProjects(view) {
    const container = h('div', { id: 'projects-container', class: 'view' });
    view.append(
      viewHead('Projects', 'A project is a practical assignment of a commission. Each team hands in one delivery for it.'),
      card('Commission', 'cyan', commissionPickerForm()),
      container);
    if (state.selectedCommissionId != null) {
      await loadProjectsInto(container);
    } else {
      container.append(emptyState('Choose a commission to see its projects.'));
    }
  }

  /* ======================================================================
     Router
     ====================================================================== */
  const ROUTES = {
    users: { title: 'Users', render: renderUsers },
    commissions: { title: 'Commissions', render: renderCommissions },
    projects: { title: 'Projects', render: renderProjects },
  };

  function currentRoute() {
    const name = window.location.hash.replace(/^#\/?/, '');
    return ROUTES[name] ? name : 'users';
  }

  let renderToken = 0;

  async function showView({ keepFeedback = false, focus = true } = {}) {
    const name = currentRoute();
    const route = ROUTES[name];
    const token = ++renderToken;
    document.title = `${route.title} - GitAula`;
    document.querySelectorAll('.main-nav a').forEach((link) => {
      if (link.dataset.route === name) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (!keepFeedback) feedback.clear();

    const root = $('#view-root');
    const view = h('div', { class: 'view', 'data-view': name });
    root.replaceChildren(view);
    root.setAttribute('aria-busy', 'true');
    try {
      await route.render(view);
    } catch (error) {
      reportError(error);
    }
    if (token !== renderToken) return;
    root.removeAttribute('aria-busy');
    if (focus) {
      const title = $('.view-title', view);
      if (title) title.focus();
    }
  }

  /* ======================================================================
     Start
     ====================================================================== */
  function init() {
    renderActiveUserSelect();
    renderLog();
    setupSettings();

    $('#active-user').addEventListener('change', (event) => {
      const id = Number(event.target.value);
      setActiveUser(id);
      feedback.status(`You are now acting as ${userLabel(id)}.`);
      showView({ keepFeedback: true, focus: false });
    });
    $('#clear-log').addEventListener('click', () => { state.log = []; renderLog(); });
    window.addEventListener('hashchange', () => showView());

    if (!window.location.hash) window.history.replaceState(null, '', '#/users');
    showView({ focus: false });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
