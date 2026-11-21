// Keep the original held-drag track and image panning synchronized in one animation.
export function mountPosterGallery(root, { signal, motion }) {
  const section = root.querySelector('.poster-section');
  const track = section.querySelector('.poster-track');
  const images = [...track.querySelectorAll('img')];
  // Give the leading posters priority, then prepare every horizontal neighbour.
  let remainingPrepared = false;
  function prepareImage(image, priority = 'low') {
    image.fetchPriority = priority;
    image.loading = 'eager';
    return typeof image.decode === 'function' ? image.decode().catch(() => {}) : Promise.resolve();
  }
  function prepareRemaining() {
    if (signal.aborted || remainingPrepared) return;
    remainingPrepared = true;
    for (const image of images.slice(2)) {
      prepareImage(image, entryVisible ? 'auto' : 'low');
    }
  }
  // Let the hero paint before starting gallery-only background work.
  let imageFrame = requestAnimationFrame(() => {
    imageFrame = requestAnimationFrame(() => {
      imageFrame = 0;
      if (signal.aborted) return;
      Promise.all(images.slice(0, 2).map((image) => prepareImage(image, 'auto')))
        .then(prepareRemaining);
    });
  });
  const thumb = section.querySelector('.poster-thumb');
  const previous = section.querySelector('[data-poster-prev]');
  const next = section.querySelector('[data-poster-next]');
  const listen = (target, type, handler, options = {}) =>
    target.addEventListener(type, handler, { ...options, signal });
  const clamp = (value) => Math.max(-100, Math.min(0, value));
  let shown = clamp(Number(track.dataset.percentage) || 0);
  let target = shown;
  let frame = 0;
  let lastTime = 0;
  let drag = null;
  let suppressClick = false;
  let entryTimer = 0;
  let entryFrame = 0;
  let entryVisible = false;
  let entryPlayed = Math.abs(shown) > 0.01;

  function stopEntryHint() {
    clearTimeout(entryTimer);
    cancelAnimationFrame(entryFrame);
    entryTimer = 0;
    entryFrame = 0;
    section.style.removeProperty('--poster-entry-offset');
  }
  function dismissEntryHint() {
    entryPlayed = true;
    stopEntryHint();
  }
  function canHint() {
    return (
      entryVisible &&
      !entryPlayed &&
      !motion.matches &&
      !document.hidden &&
      !drag &&
      shown === target &&
      !root.querySelector('dialog[open]')
    );
  }
  function queueEntryHint() {
    if (entryTimer || entryFrame || !canHint()) return;
    // Let the vertical snap settle before suggesting the horizontal gesture.
    entryTimer = setTimeout(() => {
      entryTimer = 0;
      if (!canHint()) return;
      entryPlayed = true;
      const distance = Math.min(36, innerWidth * 0.06);
      let started = null;
      function tick(time) {
        entryFrame = 0;
        if (!entryVisible || motion.matches || document.hidden || drag) {
          stopEntryHint();
          return;
        }
        started ??= time;
        const progress = Math.min(1, (time - started) / 1100);
        // Two ballistic hops: the rebound keeps half the velocity and a quarter of the height.
        // Reference: https://gsap.com/docs/v3/Eases/CustomBounce/ (endAtStart).
        const rebound = progress >= 2 / 3;
        const phase = rebound ? (progress - 2 / 3) * 3 : progress * 1.5;
        const height = rebound ? 0.25 : 1;
        const offset = distance * height * 4 * phase * (1 - phase);
        section.style.setProperty('--poster-entry-offset', `${offset}px`);
        if (progress < 1) entryFrame = requestAnimationFrame(tick);
        else stopEntryHint();
      }
      entryFrame = requestAnimationFrame(tick);
    }, 180);
  }
  const entryObserver =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            entryVisible = entry.isIntersecting && entry.intersectionRatio >= 0.85;
            if (entryVisible) {
              prepareRemaining();
              images.forEach((image) => { image.fetchPriority = 'auto'; });
            }
            if (entryVisible) queueEntryHint();
            else stopEntryHint();
          },
          { threshold: [0, 0.85] },
        )
      : null;
  entryObserver?.observe(section);

  section.classList.add('is-enhanced');
  section.querySelector('.poster-controls').hidden = false;
  function render() {
    track.style.transform = `translate3d(calc(${shown}% - var(--poster-entry-offset, 0px)), -50%, 0)`;
    for (const image of images) image.style.objectPosition = `${100 + shown}% 50%`;
    if (thumb) thumb.style.left = `${-shown}%`;
    track.dataset.percentage = String(shown);
    previous.disabled = target >= -0.01;
    next.disabled = target <= -99.99;
    track.dispatchEvent(new Event('portfolio:poster-change', { bubbles: true }));
  }
  function animate(time) {
    frame = 0;
    const delta = lastTime ? Math.min(time - lastTime, 64) : 16.67;
    lastTime = time;
    shown += (target - shown) * (1 - Math.exp(-delta / 160));
    if (Math.abs(target - shown) < 0.005) shown = target;
    render();
    if (shown !== target) frame = requestAnimationFrame(animate);
    else lastTime = 0;
  }
  function move(value, immediate = false) {
    stopEntryHint();
    target = clamp(value);
    if (immediate || motion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      shown = target;
      render();
    } else if (!frame) frame = requestAnimationFrame(animate);
  }
  function step() {
    const item = track.querySelector('.poster-item');
    return (
      ((item.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0)) /
        track.offsetWidth) *
      100
    );
  }
  listen(previous, 'click', () => move(target + step()));
  listen(next, 'click', () => move(target - step()));
  listen(track, 'keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(target - step());
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(target + step());
    }
    if (event.key === 'Home') {
      event.preventDefault();
      move(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      move(-100);
    }
  });
  listen(track, 'focusin', (event) => {
    const item = event.target.closest('.poster-item');
    if (!item || !item.matches(':focus-visible')) return;
    move((-(item.offsetLeft + item.offsetWidth / 2) / track.offsetWidth) * 100, true);
  });
  // Images and links must never start the browser's competing drag-and-drop session.
  listen(section, 'dragstart', (event) => event.preventDefault(), { capture: true });
  listen(section, 'pointerdown', (event) => {
    dismissEntryHint();
    suppressClick = false;
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      event.target.closest('.poster-controls')
    )
      return;
    // Stop selection/native mouse dragging before the movement threshold is reached.
    // Touch keeps its native vertical scroll; pointer capture still starts after a drag.
    if (event.pointerType === 'mouse') event.preventDefault();
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      percentage: target,
      // Touch needs more travel; freeze the range for the duration of this gesture.
      distance: innerWidth * (event.pointerType === 'touch' ? 0.95 : 0.7),
      active: false,
    };
  });
  listen(window, 'pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    if (event.pointerType === 'mouse' && !(event.buttons & 1)) {
      finish(event);
      return;
    }
    const dx = event.clientX - drag.x,
      dy = event.clientY - drag.y;
    if (!drag.active && Math.abs(dx) < 6) return;
    if (!drag.active && event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) {
      drag = null;
      return;
    }
    event.preventDefault();
    if (!drag.active) {
      drag.active = true;
      section.classList.add('is-dragging');
      section.setPointerCapture(event.pointerId);
    }
    suppressClick = true;
    move(drag.percentage + (dx / drag.distance) * 100);
  });
  function finish(event) {
    if (!drag || (event.pointerId !== undefined && event.pointerId !== drag.id)) return;
    const id = drag.id;
    drag = null;
    section.classList.remove('is-dragging');
    if (section.hasPointerCapture(id)) section.releasePointerCapture(id);
  }
  listen(window, 'pointerup', finish);
  listen(window, 'pointercancel', finish);
  listen(window, 'blur', finish);
  listen(section, 'lostpointercapture', (event) => {
    // Touch transfers its implicit capture from the image to the scene.
    if (event.target === section) finish(event);
  });
  listen(
    section,
    'click',
    (event) => {
      if (suppressClick && event.detail > 0) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    { capture: true },
  );
  listen(section, 'focusin', dismissEntryHint);
  listen(
    section,
    'wheel',
    () => {
      if (entryFrame) dismissEntryHint();
      else if (entryTimer) {
        stopEntryHint();
        queueEntryHint();
      }
    },
    { passive: true },
  );
  listen(track, 'portfolio:poster-restore', () => {
    dismissEntryHint();
    move(Number(track.dataset.percentage) || 0, true);
  });
  listen(motion, 'change', () => {
    if (motion.matches) move(target, true);
  });
  listen(document, 'visibilitychange', () => {
    if (document.hidden) move(target, true);
  });
  listen(
    window,
    'resize',
    () => {
      stopEntryHint();
      render();
      queueEntryHint();
    },
    { passive: true },
  );
  render();
  return () => {
    cancelAnimationFrame(imageFrame);
    entryObserver?.disconnect();
    stopEntryHint();
    cancelAnimationFrame(frame);
  };
}
