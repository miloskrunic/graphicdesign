// About has one scroll model for its rail, chapter selection and education timeline.
export function mountAboutStory(root, { signal, motion }) {
  const story = root.querySelector('[data-about-story]');
  if (!story) return () => {};
  const chapters = [...story.querySelectorAll('[data-about-chapter]')];
  const links = [...story.querySelectorAll('[data-about-link]')];
  const education = story.querySelector('#education');
  const timeline = education.querySelector('.about-timeline');
  const steps = [...timeline.querySelectorAll('[data-about-step]')];
  const stageIndex = education.querySelector('[data-about-stage-index]');
  const stageLabel = education.querySelector('[data-about-stage-label]');
  const listen = (target, type, handler, options = {}) =>
    target.addEventListener(type, handler, { ...options, signal });
  const clamp = (value) => Math.max(0, Math.min(1, value));
  let chapterStops = [],
    stepStops = [];
  let dirty = true,
    frame = 0;
  let currentChapter = -1,
    currentStep = -1;

  function measure() {
    chapterStops = chapters.map((chapter) => chapter.getBoundingClientRect().top + scrollY);
    const timelineTop = timeline.getBoundingClientRect().top + scrollY;
    // offsetTop excludes the entry-reveal transform of a future timeline item.
    stepStops = steps.map((step) => timelineTop + step.offsetTop);
    education.style.setProperty('--education-line-height', `${stepStops.at(-1) - stepStops[0]}px`);
    dirty = false;
  }
  function indexAt(position, stops) {
    let index = 0;
    while (index < stops.length - 1 && position >= stops[index + 1]) index++;
    return index;
  }
  function update() {
    frame = 0;
    if (dirty) measure();
    const readingLine = scrollY + Math.min(innerHeight * 0.32, 300);
    const chapter = indexAt(readingLine, chapterStops);
    const fraction =
      chapter === chapters.length - 1
        ? 0
        : clamp(
            (readingLine - chapterStops[chapter]) /
              Math.max(1, chapterStops[chapter + 1] - chapterStops[chapter]),
          );
    const progress = clamp((chapter + fraction) / (chapters.length - 1));
    story.style.setProperty('--about-progress', progress.toFixed(5));
    if (chapter !== currentChapter) {
      currentChapter = chapter;
      story.dataset.activeChapter = chapters[chapter].id;
      links.forEach((link, index) => {
        link.dataset.active = String(index === chapter);
        link.dataset.past = String(index < chapter);
        if (index === chapter) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }

    const step = indexAt(readingLine, stepStops);
    const educationProgress = clamp(
      (readingLine - stepStops[0]) / Math.max(1, stepStops.at(-1) - stepStops[0]),
    );
    education.style.setProperty('--education-progress', educationProgress.toFixed(5));
    if (step !== currentStep) {
      currentStep = step;
      steps.forEach((item, index) => {
        item.dataset.state = index < step ? 'past' : index === step ? 'current' : 'future';
        if (index === step) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      });
      stageIndex.textContent = String(step + 1).padStart(2, '0');
      stageLabel.textContent = steps[step].dataset.stageLabel;
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function remeasure() {
    dirty = true;
    schedule();
  }
  listen(window, 'scroll', schedule, { passive: true });
  listen(window, 'resize', remeasure, { passive: true });
  listen(document, 'visibilitychange', () => {
    if (!document.hidden) remeasure();
  });
  if (document.fonts) listen(document.fonts, 'loadingdone', remeasure);
  const resize = 'ResizeObserver' in window ? new ResizeObserver(remeasure) : null;
  if (resize) {
    resize.observe(root.querySelector('.about-intro'));
    resize.observe(root.querySelector('.about-chapters'));
  }
  update();

  const reveals = [...root.querySelectorAll('[data-about-reveal]')];
  const reveal = (element) => element.removeAttribute('data-about-pending');
  reveals.forEach(reveal);
  let observer = null;
  if ('IntersectionObserver' in window && !motion.matches) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
      },
      { rootMargin: '0px 0px 48px 0px' },
    );
    for (const element of reveals)
      if (element.getBoundingClientRect().top >= innerHeight + 48) {
        element.setAttribute('data-about-pending', '');
        observer.observe(element);
      }
  }
  listen(root, 'focusin', (event) => {
    const element = event.target.closest('[data-about-reveal]');
    if (element) {
      reveal(element);
      observer?.unobserve(element);
    }
  });
  listen(motion, 'change', () => {
    if (motion.matches) {
      observer?.disconnect();
      reveals.forEach(reveal);
    }
    remeasure();
  });
  root.dataset.aboutReady = 'true';
  return () => {
    cancelAnimationFrame(frame);
    resize?.disconnect();
    observer?.disconnect();
  };
}
