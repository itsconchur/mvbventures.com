(function () {
  'use strict';

  var MODAL_ID = 'pitch-modal';
  var TRIGGER_HREF = 'invest-in-me-form.html';
  var FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/conchur@mvbventures.com';
  var SUBMIT_SUBJECT = 'MVB Ventures — Pitch to the team (company inbound)';

  var SECTORS = [
    'Fintech',
    'AI & ML',
    'DefenceTech',
    'EnergyTech',
    'Quantum',
    'Cybersecurity',
    'HealthTech',
    'Climate / Sustainability',
    'Infrastructure / DevTools',
    'Other'
  ];

  var STAGES = [
    'Idea / pre-product',
    'Pre-seed',
    'Seed',
    'Pre-revenue with MVP',
    'Early revenue',
    'Growing revenue'
  ];

  function buildOptions(values) {
    var html = '<option value="">Select…</option>';
    for (var i = 0; i < values.length; i++) {
      var v = values[i];
      html += '<option value="' + v.replace(/"/g, '&quot;') + '">' + v + '</option>';
    }
    return html;
  }

  function buildModal() {
    if (document.getElementById(MODAL_ID)) return document.getElementById(MODAL_ID);

    var wrap = document.createElement('div');
    wrap.id = MODAL_ID;
    wrap.className = 'pitch-modal';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.setAttribute('aria-labelledby', 'pitch-modal-title');

    wrap.innerHTML = [
      '<div class="pitch-modal__dialog" role="document">',
      '  <button type="button" class="pitch-modal__close" data-pitch-modal-close aria-label="Close">×</button>',
      '  <p class="pitch-modal__eyebrow">Pitch to the team</p>',
      '  <h2 class="pitch-modal__title" id="pitch-modal-title">Tell us about your company.</h2>',
      '  <p class="pitch-modal__lede">Founders with a live MVP or early revenue: we respond within 5 working days.</p>',
      '  <form class="pitch-modal__form" novalidate>',
      '    <div class="pitch-modal__success" role="status" aria-live="polite">',
      '      <div class="pitch-modal__success-mark" aria-hidden="true">',
      '        <span class="pitch-modal__success-halo"></span>',
      '        <svg class="pitch-modal__success-svg" viewBox="0 0 80 80" fill="none" aria-hidden="true">',
      '          <circle class="pitch-modal__success-ring" cx="40" cy="40" r="36"></circle>',
      '          <path class="pitch-modal__success-tick" d="M24 41.5 L35.5 53 L57 30"></path>',
      '        </svg>',
      '      </div>',
      '      <p class="pitch-modal__success-eyebrow">Received</p>',
      '      <h3 class="pitch-modal__success-title">Your pitch is in.</h3>',
      '      <p class="pitch-modal__success-body">A confirmation has been logged. We respond within <strong>5 working days</strong> — keep an eye on your inbox for a reply from <a href="mailto:conchur@mvbventures.com">conchur@mvbventures.com</a>.</p>',
      '      <button type="button" class="pitch-modal__success-dismiss" data-pitch-modal-close>Close</button>',
      '    </div>',
      '    <div class="pitch-modal__error" role="alert" aria-live="assertive">Something went wrong. Please try again, or email <a href="mailto:conchur@mvbventures.com">conchur@mvbventures.com</a>.</div>',
      '    <div class="pitch-modal__field">',
      '      <label class="pitch-modal__label" for="pitch-modal-company">Company<span class="pitch-modal__req" aria-hidden="true">*</span></label>',
      '      <input class="pitch-modal__input" id="pitch-modal-company" name="company" type="text" required>',
      '    </div>',
      '    <div class="pitch-modal__field">',
      '      <label class="pitch-modal__label" for="pitch-modal-sector">Sector<span class="pitch-modal__req" aria-hidden="true">*</span></label>',
      '      <select class="pitch-modal__select" id="pitch-modal-sector" name="sector" required>' + buildOptions(SECTORS) + '</select>',
      '    </div>',
      '    <div class="pitch-modal__field">',
      '      <label class="pitch-modal__label" for="pitch-modal-stage">Stage<span class="pitch-modal__req" aria-hidden="true">*</span></label>',
      '      <select class="pitch-modal__select" id="pitch-modal-stage" name="stage" required>' + buildOptions(STAGES) + '</select>',
      '    </div>',
      '    <div class="pitch-modal__field">',
      '      <label class="pitch-modal__label" for="pitch-modal-url">Website or deck URL</label>',
      '      <input class="pitch-modal__input" id="pitch-modal-url" name="url" type="text" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="acme.com" pattern="^(https?://)?([\\w-]+\\.)+[\\w-]{2,}(/.*)?$" title="Enter a domain like acme.com or a full URL">',
      '    </div>',
      '    <div class="pitch-modal__field">',
      '      <label class="pitch-modal__label" for="pitch-modal-pitch">One-paragraph pitch<span class="pitch-modal__req" aria-hidden="true">*</span></label>',
      '      <textarea class="pitch-modal__textarea" id="pitch-modal-pitch" name="pitch" required></textarea>',
      '    </div>',
      '    <div class="pitch-modal__field">',
      '      <label class="pitch-modal__label" for="pitch-modal-email">Your email<span class="pitch-modal__req" aria-hidden="true">*</span></label>',
      '      <input class="pitch-modal__input" id="pitch-modal-email" name="email" type="email" autocomplete="email" required>',
      '    </div>',
      '    <div class="pitch-modal__actions">',
      '      <button type="submit" class="pitch-modal__submit">Submit pitch</button>',
      '      <button type="button" class="pitch-modal__cancel" data-pitch-modal-close>Cancel</button>',
      '    </div>',
      '    <p class="pitch-modal__footnote">We respond within 5 working days.</p>',
      '  </form>',
      '</div>'
    ].join('');

    document.body.appendChild(wrap);
    return wrap;
  }

  var lastFocus = null;

  function openModal(modal) {
    lastFocus = document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    modal.removeAttribute('data-state');
    document.body.classList.add('pitch-modal-open');
    var first = modal.querySelector('input, select, textarea, button');
    if (first) {
      try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); }
    }
  }

  function closeModal(modal) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('pitch-modal-open');
    var form = modal.querySelector('form');
    if (form) form.reset();
    modal.removeAttribute('data-state');
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) { lastFocus.focus(); }
    }
  }

  function trapFocus(modal, e) {
    if (e.key !== 'Tab') return;
    var focusables = modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }

  function isPitchTrigger(anchor) {
    if (!anchor || anchor.tagName !== 'A') return false;
    var href = anchor.getAttribute('href');
    if (!href) return false;
    href = href.split('#')[0].split('?')[0];
    return href === TRIGGER_HREF || href.endsWith('/' + TRIGGER_HREF);
  }

  function init() {
    var modal = buildModal();

    document.addEventListener('click', function (e) {
      var anchor = e.target.closest ? e.target.closest('a') : null;
      if (!anchor) return;
      if (!isPitchTrigger(anchor)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
      e.preventDefault();
      openModal(modal);
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal(modal);
      var closer = e.target.closest('[data-pitch-modal-close]');
      if (closer) closeModal(modal);
    });

    document.addEventListener('keydown', function (e) {
      if (modal.getAttribute('aria-hidden') === 'true') return;
      if (e.key === 'Escape') closeModal(modal);
      else trapFocus(modal, e);
    });

    var form = modal.querySelector('form');
    var submitBtn = form.querySelector('.pitch-modal__submit');
    var submitBtnLabel = submitBtn ? submitBtn.textContent : '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var payload = { _subject: SUBMIT_SUBJECT, _template: 'table', _captcha: 'false' };
      var fd = new FormData(form);
      fd.forEach(function (value, key) { payload[key] = value; });
      if (payload.url && !/^https?:\/\//i.test(payload.url)) {
        payload.url = 'https://' + payload.url;
      }

      modal.setAttribute('data-state', 'pending');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; }

      fetch(FORMSUBMIT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (json) { return { ok: res.ok, json: json }; }); })
        .then(function (result) {
          if (!result.ok || (result.json && result.json.success === 'false')) {
            throw new Error((result.json && result.json.message) || 'Submission failed');
          }
          modal.setAttribute('data-state', 'success');
          form.reset();
          var dismiss = modal.querySelector('.pitch-modal__success-dismiss');
          if (dismiss) {
            try { dismiss.focus({ preventScroll: true }); } catch (err) { dismiss.focus(); }
          }
        })
        .catch(function () {
          modal.setAttribute('data-state', 'error');
        })
        .then(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtnLabel; }
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
