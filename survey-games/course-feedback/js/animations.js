// ============================================================
// ANIMATIONS — Ambient visuals, transitions for The Study Lounge
// ============================================================

/**
 * Initialize ambient background with scatter plot dots.
 * Call once on page load.
 */
export function initAmbientBackground() {
  const bg = document.querySelector('.ambient-bg');
  if (!bg) return;

  // Create scatter plot dots
  const dotCount = 25;
  for (let i = 0; i < dotCount; i++) {
    const dot = document.createElement('div');
    dot.className = 'scatter-dot';
    dot.style.left = Math.random() * 100 + '%';
    dot.style.top = Math.random() * 100 + '%';
    dot.style.animationDelay = (Math.random() * -20) + 's';
    dot.style.animationDuration = (15 + Math.random() * 15) + 's';
    dot.style.width = dot.style.height = (2 + Math.random() * 4) + 'px';
    bg.appendChild(dot);
  }
}

/**
 * Transition content out (slide left), swap content, transition in (slide from right).
 * @param {HTMLElement} container - The element whose content changes
 * @param {function} swapFn - Function to call to update the content
 * @param {'forward'|'back'} direction - Slide direction
 */
export function slideTransition(container, swapFn, direction = 'forward') {
  container.classList.remove('slide-enter');
  container.classList.add('slide-exit');

  // Override animation direction for back navigation
  if (direction === 'back') {
    container.style.animation = 'slideOut 0.25s ease forwards';
    container.style.animationDirection = 'reverse';
  }

  setTimeout(() => {
    swapFn();
    container.classList.remove('slide-exit');
    container.style.animation = '';

    if (direction === 'back') {
      container.style.animation = 'slideInReverse 0.35s ease forwards';
    } else {
      container.classList.add('slide-enter');
    }

    setTimeout(() => {
      container.classList.remove('slide-enter');
      container.style.animation = '';
    }, 350);
  }, 250);
}
