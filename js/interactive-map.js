(function () {
  'use strict';

  var container = document.querySelector('[data-map-src]');
  if (!container) return;

  var src = container.getAttribute('data-map-src');
  var wrap = container.closest('.our-reach__map-wrap');
  var tooltip = wrap && wrap.querySelector('.our-reach__tooltip');

  var FILL_PRIMARY = '#FFFDFB';
  var FILL_OPERATIONAL = '#94989E';

  // SVG coordinate thresholds (viewBox 0 0 2465 1395).
  // GCC / Arab-state paths cluster in the lower-middle of the artwork
  // (Saudi Arabia, UAE, Qatar, Oman, Israel/Jordan, Egypt, etc.).
  var GCC_X_MIN = 580;
  var GCC_Y_MIN = 1000;
  var GCC_X_MAX = 2000;
  var GCC_Y_MAX = 1395;

  var regionLabels = {
    primary: 'United Kingdom & Ireland',
    primarySub: 'Primary Focus',
    europe: 'Europe',
    europeSub: 'Operational Region',
    gcc: 'GCC',
    gccSub: 'Strategic Expansion'
  };

  function classifyRegion(cx, cy) {
    if (cx >= GCC_X_MIN && cx <= GCC_X_MAX && cy >= GCC_Y_MIN && cy <= GCC_Y_MAX) {
      return 'gcc';
    }
    return 'europe';
  }

  function setupPaths(svg) {
    var paths = svg.querySelectorAll('path[fill]');

    for (var i = 0; i < paths.length; i++) {
      var p = paths[i];
      var fill = (p.getAttribute('fill') || '').toUpperCase();

      if (fill === FILL_PRIMARY.toUpperCase()) {
        p.setAttribute('data-region', 'primary');
        p.setAttribute('data-tooltip', regionLabels.primary);
        p.setAttribute('data-tooltip-sub', regionLabels.primarySub);
        p.classList.add('map-path--interactive');
      } else if (fill === FILL_OPERATIONAL.toUpperCase()) {
        try {
          var bbox = p.getBBox();
          var cx = bbox.x + bbox.width / 2;
          var cy = bbox.y + bbox.height / 2;
          var region = classifyRegion(cx, cy);
          p.setAttribute('data-region', region);
          p.setAttribute('data-tooltip', regionLabels[region]);
          p.setAttribute('data-tooltip-sub', regionLabels[region + 'Sub']);
          p.classList.add('map-path--interactive');
        } catch (_) {
          // getBBox can throw if path has no geometry
        }
      }
    }
  }

  function showTooltip(e) {
    if (!tooltip) return;
    var target = e.currentTarget;
    var label = target.getAttribute('data-tooltip');
    var sub = target.getAttribute('data-tooltip-sub');
    if (!label) return;

    tooltip.innerHTML =
      '<span class="our-reach__tooltip-label">' + label + '</span>' +
      (sub ? '<span class="our-reach__tooltip-sub">' + sub + '</span>' : '');
    tooltip.classList.add('is-visible');

    positionTooltip(e);
  }

  function positionTooltip(e) {
    if (!tooltip || !tooltip.classList.contains('is-visible')) return;

    var rect = wrap.getBoundingClientRect();
    var x = e.clientX - rect.left + 16;
    var y = e.clientY - rect.top - 12;

    var tipW = tooltip.offsetWidth;
    var tipH = tooltip.offsetHeight;
    if (x + tipW > rect.width - 8) x = e.clientX - rect.left - tipW - 16;
    if (y - tipH < 0) y = e.clientY - rect.top + 20;
    else y = y - tipH;

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function hideTooltip() {
    if (!tooltip) return;
    tooltip.classList.remove('is-visible');
  }

  function attachEvents(svg) {
    var interactives = svg.querySelectorAll('.map-path--interactive');
    for (var i = 0; i < interactives.length; i++) {
      interactives[i].addEventListener('mouseenter', showTooltip);
      interactives[i].addEventListener('mousemove', positionTooltip);
      interactives[i].addEventListener('mouseleave', hideTooltip);
    }
  }

  fetch(src)
    .then(function (res) { return res.text(); })
    .then(function (svgText) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(svgText, 'image/svg+xml');
      var svg = doc.querySelector('svg');
      if (!svg) return;

      svg.removeAttribute('width');
      svg.removeAttribute('height');
      container.appendChild(document.adoptNode(svg));
      setupPaths(svg);
      attachEvents(svg);
    });
})();
