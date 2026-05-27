// ============================================================
// QUESTION TYPES — Renderers for each survey question type
// ============================================================

/**
 * Render a likert scale question.
 * @param {HTMLElement} container
 * @param {object} question - Question config from config.json
 * @param {object|null} currentValue - Current response value
 * @param {function} onChange - Callback with response value
 */
export function renderLikert(container, question, currentValue, onChange) {
  const options = question.options || [];

  let html = '<div class="likert-scale">';
  options.forEach((opt, i) => {
    const val = i + 1;
    const selected = currentValue?.value === val ? ' selected' : '';
    html += `<div class="likert-option${selected}" data-value="${val}" data-label="${escapeAttr(opt.label)}">
      <div class="likert-circle">${val}</div>
      <div class="likert-label">${escapeHtml(opt.label)}</div>
    </div>`;
  });
  html += '</div>';

  if (question.endpointLabels) {
    html += `<div class="likert-endpoints">
      <span>${escapeHtml(question.endpointLabels[0])}</span>
      <span>${escapeHtml(question.endpointLabels[1])}</span>
    </div>`;
  }

  container.innerHTML = html;

  container.querySelectorAll('.likert-option').forEach(el => {
    el.addEventListener('click', () => {
      container.querySelectorAll('.likert-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
      onChange({
        value: parseInt(el.dataset.value),
        label: el.dataset.label,
      });
    });
  });
}

/**
 * Render a slider question.
 */
export function renderSlider(container, question, currentValue, onChange) {
  const min = question.min ?? 0;
  const max = question.max ?? 100;
  const step = question.step ?? 1;
  const initial = currentValue?.value ?? Math.round((min + max) / 2);

  container.innerHTML = `<div class="slider-container">
    <div class="slider-value" id="slider-display">${initial}</div>
    <div class="slider-track">
      <div class="slider-fill" id="slider-fill" style="width: ${((initial - min) / (max - min)) * 100}%"></div>
      <input type="range" class="slider-input" id="slider-input"
        min="${min}" max="${max}" step="${step}" value="${initial}">
    </div>
    <div class="slider-endpoints">
      <span>${escapeHtml(question.endpointLabels?.[0] || String(min))}</span>
      <span>${escapeHtml(question.endpointLabels?.[1] || String(max))}</span>
    </div>
  </div>`;

  const input = container.querySelector('#slider-input');
  const display = container.querySelector('#slider-display');
  const fill = container.querySelector('#slider-fill');

  function update() {
    const val = parseInt(input.value);
    display.textContent = val;
    fill.style.width = ((val - min) / (max - min)) * 100 + '%';
    onChange({ value: val });
  }

  input.addEventListener('input', update);

  // Fire initial value
  onChange({ value: initial });
}

/**
 * Render a multichoice question (single or multi-select).
 */
export function renderMultichoice(container, question, currentValue, onChange) {
  const options = question.options || [];
  const multiSelect = question.multiSelect || false;
  const maxSelections = question.maxSelections || options.length;

  let selected = [];
  if (currentValue) {
    if (Array.isArray(currentValue.selected)) {
      selected = [...currentValue.selected];
    } else if (currentValue.selected) {
      selected = [currentValue.selected];
    }
  }

  function render() {
    let html = '<div class="multichoice-grid">';
    options.forEach(opt => {
      const isSelected = selected.includes(opt.id);
      html += `<div class="multichoice-option${isSelected ? ' selected' : ''}" data-id="${escapeAttr(opt.id)}">
        ${escapeHtml(opt.label)}
      </div>`;
    });
    html += '</div>';

    if (multiSelect) {
      html += `<div class="multichoice-hint">Select up to ${maxSelections}</div>`;
    }

    container.innerHTML = html;

    container.querySelectorAll('.multichoice-option').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        if (multiSelect) {
          if (selected.includes(id)) {
            selected = selected.filter(s => s !== id);
          } else if (selected.length < maxSelections) {
            selected.push(id);
          }
          render();
          if (selected.length > 0) {
            onChange({ selected: [...selected] });
          } else {
            onChange(null);
          }
        } else {
          selected = [id];
          const opt = options.find(o => o.id === id);
          render();
          onChange({ selected: id, label: opt?.label || id });
        }
      });
    });
  }

  render();
}

/**
 * Render a ranking (drag-and-drop) question.
 */
export function renderRanking(container, question, currentValue, onChange) {
  const options = question.options || [];

  // Use existing ranking order if available, otherwise shuffle
  let order;
  if (currentValue?.ranked) {
    order = currentValue.ranked.map(id => options.find(o => o.id === id)).filter(Boolean);
  } else {
    order = [...options];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }

  function render() {
    let html = '<ul class="ranking-list" id="ranking-list">';
    order.forEach((opt, i) => {
      html += `<li class="ranking-item" draggable="true" data-id="${escapeAttr(opt.id)}">
        <div class="ranking-number">${i + 1}</div>
        <div class="ranking-label">${escapeHtml(opt.label)}</div>
        <div class="ranking-handle">&#x2630;</div>
      </li>`;
    });
    html += '</ul>';

    container.innerHTML = html;
    setupDragAndDrop();
    emitValue();
  }

  function emitValue() {
    onChange({ ranked: order.map(o => o.id) });
  }

  function setupDragAndDrop() {
    const list = container.querySelector('#ranking-list');
    let draggedItem = null;

    list.querySelectorAll('.ranking-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.id);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        list.querySelectorAll('.ranking-item').forEach(el => el.classList.remove('drag-over'));
        draggedItem = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (item !== draggedItem) {
          item.classList.add('drag-over');
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (!draggedItem || draggedItem === item) return;

        const fromId = draggedItem.dataset.id;
        const toId = item.dataset.id;
        const fromIdx = order.findIndex(o => o.id === fromId);
        const toIdx = order.findIndex(o => o.id === toId);

        if (fromIdx !== -1 && toIdx !== -1) {
          const [moved] = order.splice(fromIdx, 1);
          order.splice(toIdx, 0, moved);
          render();
        }
      });
    });

    // Touch support for mobile
    let touchItem = null;
    let touchClone = null;

    list.querySelectorAll('.ranking-item').forEach(item => {
      item.addEventListener('touchstart', (e) => {
        touchItem = item;
        const rect = item.getBoundingClientRect();
        touchClone = item.cloneNode(true);
        touchClone.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;z-index:1000;opacity:0.8;pointer-events:none;`;
        document.body.appendChild(touchClone);
        item.classList.add('dragging');
      }, { passive: true });

      item.addEventListener('touchmove', (e) => {
        if (!touchClone) return;
        e.preventDefault();
        const touch = e.touches[0];
        touchClone.style.top = (touch.clientY - 20) + 'px';

        // Find drop target
        list.querySelectorAll('.ranking-item').forEach(el => {
          el.classList.remove('drag-over');
          const rect = el.getBoundingClientRect();
          if (touch.clientY > rect.top && touch.clientY < rect.bottom && el !== touchItem) {
            el.classList.add('drag-over');
          }
        });
      });

      item.addEventListener('touchend', () => {
        if (touchClone) {
          document.body.removeChild(touchClone);
          touchClone = null;
        }
        if (touchItem) {
          touchItem.classList.remove('dragging');
          const overEl = list.querySelector('.ranking-item.drag-over');
          if (overEl) {
            const fromId = touchItem.dataset.id;
            const toId = overEl.dataset.id;
            const fromIdx = order.findIndex(o => o.id === fromId);
            const toIdx = order.findIndex(o => o.id === toId);
            if (fromIdx !== -1 && toIdx !== -1) {
              const [moved] = order.splice(fromIdx, 1);
              order.splice(toIdx, 0, moved);
              render();
            }
          }
          list.querySelectorAll('.ranking-item').forEach(el => el.classList.remove('drag-over'));
          touchItem = null;
        }
      });
    });
  }

  render();
}

/**
 * Render a text input question.
 */
export function renderText(container, question, currentValue, onChange) {
  const maxLength = question.maxLength || 500;
  const placeholder = question.placeholder || 'Type your thoughts here...';
  const currentText = currentValue?.text || '';

  container.innerHTML = `<div class="text-area-container">
    <textarea class="text-area-journal" id="text-input"
      placeholder="${escapeAttr(placeholder)}"
      maxlength="${maxLength}">${escapeHtml(currentText)}</textarea>
    <div class="text-char-count"><span id="text-count">${currentText.length}</span> / ${maxLength}</div>
  </div>`;

  const textarea = container.querySelector('#text-input');
  const counter = container.querySelector('#text-count');

  textarea.addEventListener('input', () => {
    counter.textContent = textarea.value.length;
    const text = textarea.value.trim();
    if (text) {
      onChange({ text });
    } else {
      onChange(null);
    }
  });

  // Fire initial value if present
  if (currentText) {
    onChange({ text: currentText });
  }
}

/**
 * Render an emoji mood question.
 */
export function renderEmoji(container, question, currentValue, onChange) {
  const options = question.options || [];

  let html = '<div class="emoji-grid">';
  options.forEach(opt => {
    const selected = currentValue?.emoji === opt.id ? ' selected' : '';
    html += `<div class="emoji-option${selected}" data-id="${escapeAttr(opt.id)}" data-value="${opt.value}">
      <div class="emoji-face">${opt.emoji}</div>
      <div class="emoji-label">${escapeHtml(opt.label)}</div>
    </div>`;
  });
  html += '</div>';

  container.innerHTML = html;

  container.querySelectorAll('.emoji-option').forEach(el => {
    el.addEventListener('click', () => {
      container.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
      onChange({
        emoji: el.dataset.id,
        value: parseInt(el.dataset.value),
      });
    });
  });
}

/* --- Helpers --- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
