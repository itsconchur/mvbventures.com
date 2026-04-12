(function () {
  'use strict';

  var root = document.querySelector('[data-partner-carousel]');
  if (!root) return;

  var viewport = root.querySelector('.partner-carousel__viewport');
  var track = root.querySelector('.partner-carousel__track');
  var cards = track ? track.querySelectorAll('.partner-carousel__card') : [];
  var prevBtn = root.querySelector('.partner-carousel__btn[data-dir="-1"]');
  var nextBtn = root.querySelector('.partner-carousel__btn[data-dir="1"]');

  if (!viewport || !track || !cards.length) return;

  var isDragScroll = false;
  var dragPointerId = null;
  var dragStartX = 0;
  var dragStartScrollLeft = 0;
  var moveSamples = [];
  var inertiaRaf = null;
  var lastInertiaTime = null;

  var mqReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var SAMPLE_CAP = 6;
  var INERTIA_VEL_MIN = 0.045;
  var INERTIA_FRICTION = 0.945;
  var INERTIA_STOP = 0.12;

  function scrollBehavior() {
    return mqReduceMotion.matches ? 'auto' : 'smooth';
  }

  function nearestIndex() {
    var sl = viewport.scrollLeft;
    var best = 0;
    var bestDist = Infinity;
    var i;
    for (i = 0; i < cards.length; i++) {
      var d = Math.abs(cards[i].offsetLeft - sl);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  function scrollToIndex(index) {
    var i = Math.max(0, Math.min(index, cards.length - 1));
    viewport.scrollTo({
      left: cards[i].offsetLeft,
      behavior: scrollBehavior(),
    });
  }

  function updateButtons() {
    var maxScroll = viewport.scrollWidth - viewport.clientWidth;
    var sl = viewport.scrollLeft;
    var epsilon = 2;
    if (prevBtn) prevBtn.disabled = sl <= epsilon;
    if (nextBtn) nextBtn.disabled = sl >= maxScroll - epsilon;
  }

  function stopInertia() {
    if (inertiaRaf !== null) {
      cancelAnimationFrame(inertiaRaf);
      inertiaRaf = null;
    }
    lastInertiaTime = null;
    viewport.classList.remove('is-momentum');
  }

  function settleToNearestCard() {
    scrollToIndex(nearestIndex());
    window.requestAnimationFrame(updateButtons);
  }

  function recordMoveSample(scrollLeft, timeStamp) {
    moveSamples.push({ sl: scrollLeft, t: timeStamp });
    if (moveSamples.length > SAMPLE_CAP) moveSamples.shift();
  }

  function releaseVelocityPxPerMs() {
    if (moveSamples.length < 2) return 0;
    var a = moveSamples[moveSamples.length - 2];
    var b = moveSamples[moveSamples.length - 1];
    var dt = b.t - a.t;
    if (dt < 5) return 0;
    return (b.sl - a.sl) / dt;
  }

  function runInertia(initialVel) {
    stopInertia();
    if (mqReduceMotion.matches) {
      settleToNearestCard();
      return;
    }

    var vel = initialVel;
    viewport.classList.add('is-momentum');

    function frame(now) {
      if (lastInertiaTime === null) lastInertiaTime = now;
      var dt = Math.min(now - lastInertiaTime, 48);
      lastInertiaTime = now;

      var maxScroll = viewport.scrollWidth - viewport.clientWidth;
      var next = viewport.scrollLeft + vel * dt;
      if (next <= 0) {
        viewport.scrollLeft = 0;
        vel = 0;
      } else if (next >= maxScroll) {
        viewport.scrollLeft = maxScroll;
        vel = 0;
      } else {
        viewport.scrollLeft = next;
      }

      vel *= Math.pow(INERTIA_FRICTION, dt / 16.67);

      if (Math.abs(vel) < INERTIA_STOP) {
        stopInertia();
        settleToNearestCard();
        return;
      }

      inertiaRaf = window.requestAnimationFrame(frame);
    }

    inertiaRaf = window.requestAnimationFrame(frame);
  }

  function onNavClick(dir) {
    stopInertia();
    var next = nearestIndex() + dir;
    scrollToIndex(next);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      onNavClick(-1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      onNavClick(1);
    });
  }

  viewport.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onNavClick(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onNavClick(1);
    }
  });

  function endDragScroll(e) {
    if (!isDragScroll || e.pointerId !== dragPointerId) return;
    isDragScroll = false;
    dragPointerId = null;
    viewport.classList.remove('is-dragging');

    var v = releaseVelocityPxPerMs();
    moveSamples = [];

    try {
      viewport.releasePointerCapture(e.pointerId);
    } catch (err) {
      /* already released */
    }

    if (!mqReduceMotion.matches && Math.abs(v) > INERTIA_VEL_MIN) {
      runInertia(v);
    } else {
      settleToNearestCard();
    }
  }

  viewport.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    stopInertia();
    moveSamples = [];
    isDragScroll = true;
    dragPointerId = e.pointerId;
    dragStartX = e.clientX;
    dragStartScrollLeft = viewport.scrollLeft;
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture(e.pointerId);
    recordMoveSample(viewport.scrollLeft, e.timeStamp);
  });

  viewport.addEventListener('pointermove', function (e) {
    if (!isDragScroll || e.pointerId !== dragPointerId) return;
    var maxScroll = viewport.scrollWidth - viewport.clientWidth;
    var next = dragStartScrollLeft - (e.clientX - dragStartX);
    viewport.scrollLeft = Math.max(0, Math.min(maxScroll, next));
    recordMoveSample(viewport.scrollLeft, e.timeStamp);
  });

  viewport.addEventListener('pointerup', endDragScroll);
  viewport.addEventListener('pointercancel', endDragScroll);

  viewport.addEventListener('scroll', function () {
    window.requestAnimationFrame(updateButtons);
  });

  window.addEventListener('resize', function () {
    window.requestAnimationFrame(updateButtons);
  });

  updateButtons();
})();
