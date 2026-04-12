(function () {
  if (!document.body.classList.contains('page-home')) return;

  var nav = document.querySelector('.navbar2_component');
  var hero = document.querySelector('header.hero-split');
  if (!nav || !hero) return;

  var mql = window.matchMedia('(max-width: 991px)');

  function update() {
    if (!mql.matches) {
      nav.classList.add('is-home-nav-visible');
      return;
    }

    var btn = nav.querySelector('.w-nav-button');
    var menuOpen = btn && btn.classList.contains('w--open');
    var rect = hero.getBoundingClientRect();
    var heroFullyScrolledPast = rect.bottom <= 0;
    var show = menuOpen || heroFullyScrolledPast;
    nav.classList.toggle('is-home-nav-visible', show);
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  var btn = nav.querySelector('.w-nav-button');
  if (btn) {
    new MutationObserver(update).observe(btn, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }
})();
