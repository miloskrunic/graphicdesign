import { mountPosterGallery } from './poster-gallery.js';
import { mountAboutStory } from './about-story.js';

export function mountPage(root) {
  const controller = new AbortController();
  const { signal } = controller;
  const disposers = [];
  const listen = (target, type, handler, options = {}) =>
    target.addEventListener(type, handler, { ...options, signal });
  const motion = matchMedia('(prefers-reduced-motion: reduce)');

  // Every visit derives reveal state from its actual restored viewport.
  root
    .querySelectorAll('[data-reveal-pending]')
    .forEach((element) => element.removeAttribute('data-reveal-pending'));
  if ('IntersectionObserver' in window && !motion.matches) {
    const reveal = (element) => element.removeAttribute('data-reveal-pending');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
      },
      { rootMargin: '0px 0px 48px 0px' },
    );
    for (const element of root.querySelectorAll('[data-reveal]')) {
      if (element.getBoundingClientRect().top >= innerHeight + 48) {
        element.setAttribute('data-reveal-pending', '');
        observer.observe(element);
      }
    }
    listen(root, 'focusin', (event) => {
      const element = event.target.closest('[data-reveal]');
      if (element) {
        reveal(element);
        observer.unobserve(element);
      }
    });
    listen(motion, 'change', () => {
      if (motion.matches) {
        observer.disconnect();
        root.querySelectorAll('[data-reveal-pending]').forEach(reveal);
      }
    });
    disposers.push(() => observer.disconnect());
  }

  if (root.dataset.page === 'about') {
    disposers.push(mountAboutStory(root, { signal, motion }));
  }

  if (root.dataset.page === 'work') {
    const dialog = root.querySelector('#lightbox');
    const preview = dialog.querySelector('[data-lightbox-image]');
    const caption = dialog.querySelector('figcaption');
    let opener = null;
    listen(root, 'click', (event) => {
      const trigger = event.target.closest('[data-lightbox]');
      if (
        !trigger ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      // Links still open the full image if modal dialogs are unavailable.
      if (typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      opener = trigger;
      preview.src = trigger.dataset.lightboxSrc;
      preview.alt = trigger.querySelector('img').alt;
      caption.textContent = trigger.dataset.lightboxCaption;
      document.documentElement.classList.add('has-lightbox');
      dialog.showModal();
      dialog.querySelector('.lightbox-close').focus();
    });
    listen(dialog, 'keydown', (event) => {
      // The preview has one interactive control; keep Tab/Shift+Tab on that control.
      if (event.key === 'Tab') {
        event.preventDefault();
        dialog.querySelector('.lightbox-close').focus();
      }
    });
    // Preserve the original overlay behavior: clicking anywhere closes the preview.
    listen(dialog, 'click', () => dialog.close());
    listen(dialog, 'close', () => {
      document.documentElement.classList.remove('has-lightbox');
      preview.removeAttribute('src');
      opener?.focus({ preventScroll: true });
    });
    disposers.push(() => {
      if (dialog.open) dialog.close();
      document.documentElement.classList.remove('has-lightbox');
    });

    disposers.push(mountPosterGallery(root, { signal, motion }));

    const canvas = root.querySelector('canvas');
    const context = canvas.getContext('2d');
    if (context && 'IntersectionObserver' in window) {
      let particles = [],
        frame = 0,
        previousTime = 0,
        visible = false;
      const allowed = () => visible && !document.hidden && !motion.matches;
      function stop() {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
        particles = [];
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
      function resize() {
        const ratio = Math.min(devicePixelRatio || 1, 2);
        canvas.width = canvas.clientWidth * ratio;
        canvas.height = canvas.clientHeight * ratio;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      function animate(time) {
        frame = 0;
        if (!allowed()) {
          stop();
          return;
        }
        const delta = previousTime ? Math.min((time - previousTime) / 16.67, 3) : 1;
        previousTime = time;
        context.clearRect(0, 0, canvas.width, canvas.height);
        particles = particles.filter((particle) => particle.opacity > 0 && particle.size > 1);
        for (const particle of particles) {
          context.beginPath();
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fillStyle = `rgba(49,10,56,${particle.opacity})`;
          context.fill();
          particle.x += particle.vx * delta;
          particle.y += particle.vy * delta;
          particle.size *= Math.pow(0.98, delta);
          particle.opacity -= 0.015 * delta;
        }
        if (particles.length) frame = requestAnimationFrame(animate);
        else previousTime = 0;
      }
      listen(root.querySelector('.hero'), 'pointermove', (event) => {
        if (!allowed() || event.pointerType === 'touch') return;
        const bounds = canvas.getBoundingClientRect();
        if (particles.length >= 120) particles.shift();
        particles.push({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
          size: Math.random() * 20 + 15,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          opacity: 0.7,
        });
        if (!frame) frame = requestAnimationFrame(animate);
      });
      const observer = new IntersectionObserver(
        (entries) => {
          visible = entries[0].isIntersecting;
          if (!visible) stop();
        },
        { threshold: 0.1 },
      );
      observer.observe(canvas);
      resize();
      listen(window, 'resize', resize, { passive: true });
      listen(document, 'visibilitychange', () => {
        if (document.hidden) stop();
      });
      listen(motion, 'change', () => {
        if (motion.matches) stop();
      });
      disposers.push(() => {
        observer.disconnect();
        stop();
      });
    }
  }

  const form = root.querySelector('.contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const submit = form.querySelector('[type="submit"]');
    let submitting = false;
    listen(form, 'input', (event) => {
      event.target.setCustomValidity?.('');
    });
    listen(form, 'submit', async (event) => {
      event.preventDefault();
      if (submitting) return;
      for (const field of form.querySelectorAll('[required]')) {
        field.setCustomValidity(field.value.trim() ? '' : 'Please enter a value, not only spaces.');
      }
      if (!form.reportValidity()) return;
      submitting = true;
      submit.disabled = true;
      status.removeAttribute('data-status');
      status.textContent = 'Sending your message…';
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
          signal,
        });
        if (!response.ok) throw new Error('Submission failed');
        form.reset();
        status.dataset.status = 'success';
        status.textContent = 'Thank you - your message has been sent.';
        document.dispatchEvent(new Event('portfolio:form-reset'));
      } catch (error) {
        if (!signal.aborted) {
          status.dataset.status = 'error';
          status.textContent =
            'Your message could not be sent. Please try again. Your text is still here.';
        }
      } finally {
        submitting = false;
        submit.disabled = false;
      }
    });
  }

  return () => {
    disposers.forEach((dispose) => dispose());
    controller.abort();
  };
}
