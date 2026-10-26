/**
 * console.js — the ⌘K command console, and the page's discrete actions.
 *
 * An enhancement in the strict sense: if this file never runs, navigation
 * still works through the masthead links, the in-page index and normal anchor
 * links. Nothing here is the only route to any content.
 *
 * It renders as an instrument rather than a dialog: hard corners, mono rows,
 * a bordered result list, and a status line for the key bindings.
 */

const EMAIL = 'dan.aditya.0@gmail.com';

/* ---------------------------------------------------------------- commands */

/** Build the command list from what is actually on the page. */
function buildCommands() {
  const commands = [];

  // One per section, in document order.
  for (const section of document.querySelectorAll('[data-panel]')) {
    const id = section.id;
    commands.push({
      id: `cmd-${id}`,
      group: 'Go to',
      label: section.dataset.label || id,
      hint: `#${id}`,
      run: () => scrollTo_(id),
    });
  }

  // Every outbound link, grouped by its compartment.
  for (const link of document.querySelectorAll('a[href^="http"]')) {
    let group = 'Open';
    let host = '';
    try {
      host = new URL(link.href).host.replace(/^www\./, '');
    } catch {
      continue;
    }
    if (link.closest('[data-panel]')) {
      group = link.closest('[data-panel]').dataset.label || 'Open';
    }
    commands.push({
      id: `cmd-url-${commands.length}`,
      group,
      label: (link.dataset.cmd || link.textContent || host).trim(),
      hint: host,
      run: () => window.open(link.href, '_blank', 'noopener'),
    });
  }

  commands.push({
    id: 'cmd-copy-email',
    group: 'Action',
    label: 'Copy email address',
    hint: EMAIL,
    run: () => copyEmail(),
  });

  return commands;
}

function scrollTo_(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Move focus so keyboard users continue from the destination, not the top.
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

/* ------------------------------------------------------------------ clipboard */

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(EMAIL);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reflect a copy result in the visible button, then put it back.
 *
 * One function, because there are two routes to the same action — the button
 * and the ⌘K command — and they must leave the page in the same state. Setting
 * only the label from the console route left the button reading "Copied"
 * forever, with no inverted confirmation and no reset, which is worse than not
 * reflecting it at all. The reset is cleared on each call so a second copy
 * cannot be reverted early by the first one's timer.
 */
let copyReset = null;
function reflectCopy(ok) {
  const btn = document.getElementById('copy-email');
  if (!btn) return;
  const label = btn.querySelector('.copy__label');

  btn.dataset.copied = ok ? 'true' : 'false';
  if (label) label.textContent = ok ? 'Copied' : 'Copy failed';

  clearTimeout(copyReset);
  copyReset = setTimeout(() => {
    delete btn.dataset.copied;
    const l = document.querySelector('#copy-email .copy__label');
    if (l) l.textContent = 'Copy address';
  }, 2000);
}

/** Wire the visible copy button and mirror the result into the live region. */
export function initCopy() {
  const btn = document.getElementById('copy-email');
  const live = document.getElementById('console-live');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const ok = await copyEmail();
    reflectCopy(ok);

    if (live) live.textContent = ok ? 'Email address copied to clipboard.' : 'Copy failed. Select the address manually.';
  });
}

/* -------------------------------------------------------------------- console */

export function initConsole() {
  initCopy();

  const root = document.getElementById('console');
  const input = document.getElementById('console-input');
  const list = document.getElementById('console-list');
  const live = document.getElementById('console-live');
  const openers = document.querySelectorAll('[data-open-console]');

  if (!root || !input || !list) return;

  const commands = buildCommands();
  let filtered = commands;
  let active = 0;
  let invoker = null;

  const announce = (msg) => {
    if (live) live.textContent = msg;
  };

  function render() {
    list.textContent = '';

    if (!filtered.length) {
      const li = document.createElement('li');
      // A listbox may only contain options. Without this the "no matches" row
      // is an invalid child and can be announced as an empty option.
      li.setAttribute('role', 'presentation');
      li.textContent = 'No matching command';
      li.style.padding = 'var(--s2) var(--s3)';
      li.style.color = 'var(--muted)';
      list.appendChild(li);
      input.removeAttribute('aria-activedescendant');
      return;
    }

    filtered.forEach((cmd, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.id = cmd.id;
      li.setAttribute('aria-selected', i === active ? 'true' : 'false');

      const row = document.createElement('div');
      row.className = 'console__opt';

      const g = document.createElement('span');
      g.textContent = cmd.group;

      const l = document.createElement('span');
      l.textContent = cmd.label;

      const h = document.createElement('span');
      h.textContent = cmd.hint;

      row.append(g, l, h);
      li.appendChild(row);
      list.appendChild(li);
    });

    input.setAttribute('aria-activedescendant', filtered[active].id);
    list.children[active]?.scrollIntoView({ block: 'nearest' });
  }

  function filter() {
    const q = input.value.trim().toLowerCase();
    filtered = !q
      ? commands
      : commands.filter((c) => `${c.group} ${c.label} ${c.hint}`.toLowerCase().includes(q));
    active = 0;
    render();
    announce(`${filtered.length} command${filtered.length === 1 ? '' : 's'} available`);
  }

  function move(delta) {
    if (!filtered.length) return;
    active = (active + delta + filtered.length) % filtered.length;
    render();
  }

  /**
   * Run the selected command and report what ACTUALLY happened.
   *
   * `cmd.run()` is asynchronous and may resolve `false` — the copy command
   * does exactly that when the clipboard write is refused. This used to discard
   * the promise and announce "done" unconditionally, so a screen-reader user
   * was told their email address had been copied when nothing had been written.
   * A status message that cannot be wrong is worth more than a fast one.
   *
   * `!== false` keeps the commands that return nothing (scroll, window.open)
   * reporting success, since they have no failure mode to report.
   */
  async function runActive() {
    const cmd = filtered[active];
    if (!cmd) return;
    close();

    let ok = true;
    try {
      ok = (await cmd.run()) !== false;
    } catch {
      ok = false;
    }

    // Both routes to the copy command must leave the button in the same
    // state — inverted on success, reset on a timer — or the visible button
    // and the live region start disagreeing with each other.
    if (cmd.id === 'cmd-copy-email') reflectCopy(ok);

    announce(
      ok ? `${cmd.label} — done` : `${cmd.label} — failed. Select the address manually.`
    );
  }

  function open() {
    invoker = document.activeElement;
    root.dataset.open = 'true';
    input.setAttribute('aria-expanded', 'true');
    input.value = '';
    filter();
    input.focus();
  }

  function close() {
    root.dataset.open = 'false';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    // Focus returns to the control that opened the console.
    invoker?.focus?.();
    invoker = null;
  }

  for (const btn of openers) btn.addEventListener('click', open);

  document.addEventListener('keydown', (e) => {
    // Cmd+K / Ctrl+K from anywhere, including while the console is open.
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      root.dataset.open === 'true' ? close() : open();
      return;
    }

    if (root.dataset.open !== 'true') return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runActive();
    } else if (e.key === 'Tab') {
      // The dialog holds one focusable control, so Tab stays inside it.
      e.preventDefault();
      input.focus();
    }
  });

  input.addEventListener('input', filter);
}