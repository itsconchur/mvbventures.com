(function () {
  'use strict';

  var root = document.querySelector('[data-focus-tabs]');
  if (!root) return;

  var list = root.querySelector('.focus-tabs__list');
  var viewport = root.querySelector('.focus-tabs__viewport');
  var mqDesktop = window.matchMedia('(min-width: 992px)');
  var mqReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isFirstActivate = true;

  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var panels = Array.prototype.slice.call(root.querySelectorAll('[role="tabpanel"]'));
  if (!tabs.length || tabs.length !== panels.length) return;

  function playViewportReveal() {
    if (!viewport || mqReduceMotion.matches) return;
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

  if (list) {
    if (typeof ResizeObserver !== 'undefined') {
      var listResizeObserver = new ResizeObserver(scheduleSyncViewport);
      listResizeObserver.observe(list);
    }
    window.addEventListener('resize', scheduleSyncViewport);
    if (typeof mqDesktop.addEventListener === 'function') {
      mqDesktop.addEventListener('change', scheduleSyncViewport);
    } else if (typeof mqDesktop.addListener === 'function') {
      mqDesktop.addListener(scheduleSyncViewport);
    }
  }

  function activate(index, moveFocus) {
    var i;
    var len = tabs.length;
    if (index < 0) index = len - 1;
    if (index >= len) index = 0;

    for (i = 0; i < len; i++) {
      var tab = tabs[i];
      var panel = panels[i];
      var isSel = i === index;

      tab.setAttribute('aria-selected', isSel ? 'true' : 'false');
      tab.tabIndex = isSel ? 0 : -1;
      tab.classList.toggle('is-active', isSel);

      if (isSel) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    }

    if (moveFocus) {
      tabs[index].focus({ preventScroll: true });
    }

    if (viewport && !isFirstActivate) {
      viewport.scrollTop = 0;
      playViewportReveal();
    }
    isFirstActivate = false;

    scheduleSyncViewport();
  }

  function indexOfTab(tab) {
    return tabs.indexOf(tab);
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

  activate(0, false);

  if (document.readyState === 'complete') {
    scheduleSyncViewport();
  } else {
    window.addEventListener('load', scheduleSyncViewport);
  }
})();
