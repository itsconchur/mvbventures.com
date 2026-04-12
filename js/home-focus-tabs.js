(function () {
  'use strict';

  var root = document.querySelector('[data-focus-tabs]');
  if (!root) return;

  var list = root.querySelector('.focus-tabs__list');
  var viewport = root.querySelector('.focus-tabs__viewport');
  var dotsHost = root.querySelector('.focus-tabs__carousel-dots');
  var btnPrev = root.querySelector('.focus-tabs__carousel-arrow--prev');
  var btnNext = root.querySelector('.focus-tabs__carousel-arrow--next');

  var mqDesktop = window.matchMedia('(min-width: 992px)');
  var mqReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isFirstActivate = true;
  var activeIndex = 0;
  var suppressCarouselScrollSync = false;
  var dotButtons = [];
  var scrollRaf = null;

  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var panels = Array.prototype.slice.call(root.querySelectorAll('[role="tabpanel"]'));
  if (!tabs.length || tabs.length !== panels.length) return;

  function isCarouselLayout() {
    return !mqDesktop.matches;
  }

  function playViewportReveal() {
    if (!viewport || mqReduceMotion.matches || isCarouselLayout()) return;
    viewport.classList.remove('focus-tabs__viewport--reveal');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        viewport.classList.add('focus-tabs__viewport--reveal');
      });
    });
  }

  function syncViewportMaxHeight() {
    if (!list) return;
    root.style.removeProperty('--focus-tabs-viewport-offset');
    if (!mqDesktop.matches) {
      root.style.removeProperty('--focus-tabs-viewport-max');
      return;
    }
    var h = Math.round(list.getBoundingClientRect().height);
    if (h > 0) {
      root.style.setProperty('--focus-tabs-viewport-max', h + 'px');
    }
  }

  function scheduleSyncViewport() {
    syncViewportMaxHeight();
    requestAnimationFrame(function () {
      syncViewportMaxHeight();
      requestAnimationFrame(syncViewportMaxHeight);
    });
    setTimeout(syncViewportMaxHeight, 50);
    setTimeout(syncViewportMaxHeight, 400);
  }

  function setListCarouselAccess() {
    if (!list) return;
    if (isCarouselLayout()) {
      list.setAttribute('aria-hidden', 'true');
      if ('inert' in HTMLElement.prototype) {
        list.inert = true;
      }
    } else {
      list.removeAttribute('aria-hidden');
      if ('inert' in HTMLElement.prototype) {
        list.inert = false;
      }
    }
  }

  function setPanelDomState() {
    var i;
    if (isCarouselLayout()) {
      for (i = 0; i < panels.length; i++) {
        panels[i].removeAttribute('hidden');
        panels[i].setAttribute('aria-hidden', i === activeIndex ? 'false' : 'true');
      }
    } else {
      for (i = 0; i < panels.length; i++) {
        panels[i].removeAttribute('aria-hidden');
        if (i === activeIndex) {
          panels[i].removeAttribute('hidden');
        } else {
          panels[i].setAttribute('hidden', '');
        }
      }
    }
  }

  function getIndexFromScroll() {
    if (!viewport || !panels.length) return 0;
    var sl = viewport.scrollLeft;
    var closest = 0;
    var best = Infinity;
    var i;
    for (i = 0; i < panels.length; i++) {
      var d = Math.abs(panels[i].offsetLeft - sl);
      if (d < best) {
        best = d;
        closest = i;
      }
    }
    return closest;
  }

  function updateTabSelectionUi() {
    var i;
    var len = tabs.length;
    for (i = 0; i < len; i++) {
      var tab = tabs[i];
      var isSel = i === activeIndex;
      tab.setAttribute('aria-selected', isSel ? 'true' : 'false');
      tab.tabIndex = isSel ? 0 : -1;
      tab.classList.toggle('is-active', isSel);
    }
  }

  function updateCarouselChrome() {
    if (!dotButtons.length) return;
    dotButtons.forEach(function (b, i) {
      var on = i === activeIndex;
      b.classList.toggle('is-active', on);
      if (on) {
        b.setAttribute('aria-current', 'true');
      } else {
        b.removeAttribute('aria-current');
      }
    });
  }

  function scrollCarouselTo(index, smooth) {
    if (!viewport || !isCarouselLayout()) return;
    var panel = panels[index];
    if (!panel) return;
    suppressCarouselScrollSync = true;
    viewport.scrollTo({
      left: panel.offsetLeft,
      behavior: smooth && !mqReduceMotion.matches ? 'smooth' : 'auto'
    });
    window.setTimeout(function () {
      suppressCarouselScrollSync = false;
    }, smooth && !mqReduceMotion.matches ? 480 : 80);
  }

  function onCarouselScroll() {
    if (!isCarouselLayout() || suppressCarouselScrollSync || !viewport) return;
    if (scrollRaf) {
      cancelAnimationFrame(scrollRaf);
    }
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = null;
      var next = getIndexFromScroll();
      if (next !== activeIndex) {
        activeIndex = next;
        updateTabSelectionUi();
        setPanelDomState();
        updateCarouselChrome();
      }
    });
  }

  function onLayoutModeChange() {
    setListCarouselAccess();
    setPanelDomState();
    if (isCarouselLayout()) {
      scrollCarouselTo(activeIndex, false);
    } else if (viewport) {
      viewport.scrollLeft = 0;
      if (!isFirstActivate) {
        viewport.scrollTop = 0;
        playViewportReveal();
      }
    }
    updateCarouselChrome();
    scheduleSyncViewport();
  }

  function activate(index, moveFocus) {
    var len = tabs.length;
    if (index < 0) index = len - 1;
    if (index >= len) index = 0;

    activeIndex = index;
    updateTabSelectionUi();
    setPanelDomState();

    if (moveFocus && !isCarouselLayout()) {
      tabs[activeIndex].focus({ preventScroll: true });
    }

    if (isCarouselLayout()) {
      scrollCarouselTo(activeIndex, !isFirstActivate);
      updateCarouselChrome();
    } else if (viewport && !isFirstActivate) {
      viewport.scrollTop = 0;
      playViewportReveal();
    }

    isFirstActivate = false;
    scheduleSyncViewport();
  }

  function indexOfTab(tab) {
    return tabs.indexOf(tab);
  }

  function initCarouselDots() {
    if (!dotsHost) return;
    dotsHost.innerHTML = '';
    dotButtons = [];
    panels.forEach(function (panel, i) {
      var titleEl = panel.querySelector('.focus-tabs__panel-title');
      var label = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : 'Sector ' + (i + 1);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'focus-tabs__carousel-dot';
      b.setAttribute('aria-label', label);
      (function (idx) {
        b.addEventListener('click', function () {
          activate(idx, false);
        });
      })(i);
      dotsHost.appendChild(b);
      dotButtons.push(b);
    });
  }

  function onWindowResize() {
    scheduleSyncViewport();
    if (isCarouselLayout() && viewport && panels[activeIndex]) {
      suppressCarouselScrollSync = true;
      viewport.scrollLeft = panels[activeIndex].offsetLeft;
      window.setTimeout(function () {
        suppressCarouselScrollSync = false;
      }, 80);
    }
  }

  initCarouselDots();

  window.addEventListener('resize', onWindowResize);
  if (typeof mqDesktop.addEventListener === 'function') {
    mqDesktop.addEventListener('change', onLayoutModeChange);
  } else if (typeof mqDesktop.addListener === 'function') {
    mqDesktop.addListener(onLayoutModeChange);
  }

  if (list && typeof ResizeObserver !== 'undefined') {
    var listResizeObserver = new ResizeObserver(scheduleSyncViewport);
    listResizeObserver.observe(list);
  }

  if (viewport) {
    viewport.addEventListener('scroll', onCarouselScroll, { passive: true });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', function () {
      activate(activeIndex - 1, false);
    });
  }
  if (btnNext) {
    btnNext.addEventListener('click', function () {
      activate(activeIndex + 1, false);
    });
  }

  tabs.forEach(function (tab, idx) {
    tab.addEventListener('click', function () {
      activate(idx, false);
    });

    tab.addEventListener('keydown', function (e) {
      var key = e.key;
      var i = indexOfTab(tab);
      if (key === 'ArrowDown' || key === 'ArrowRight') {
        e.preventDefault();
        activate(i + 1, true);
      } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
        e.preventDefault();
        activate(i - 1, true);
      } else if (key === 'Home') {
        e.preventDefault();
        activate(0, true);
      } else if (key === 'End') {
        e.preventDefault();
        activate(tabs.length - 1, true);
      }
    });
  });

  setListCarouselAccess();
  activate(0, false);

  if (document.readyState === 'complete') {
    scheduleSyncViewport();
  } else {
    window.addEventListener('load', scheduleSyncViewport);
  }
})();
