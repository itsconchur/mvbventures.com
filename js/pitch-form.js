(function () {
  var pitchForm = document.getElementById("company-inbound-form");

  var dropzone = document.getElementById("pitch-deck-dropzone");
  var fileInput = document.getElementById("pitch-deck-file");
  var fileNameEl = document.getElementById("pitch-deck-filename");
  var browseBtn = document.getElementById("pitch-deck-browse");
  var replaceBtn = document.getElementById("pitch-deck-replace");
  var deckLive = document.getElementById("pitch-deck-live");
  var hearAboutError = document.getElementById("hear-about-error");
  var emptyState = document.getElementById("pitch-deck-empty-state");

  function runDeckCelebrate() {
    if (!dropzone) return;
    dropzone.classList.remove("pitch-form__dropzone--celebrate");
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        dropzone.classList.add("pitch-form__dropzone--celebrate");
      });
    });
  }

  function setFileName() {
    if (!fileInput || !fileNameEl || !dropzone) return;
    if (fileInput.files && fileInput.files.length) {
      var name = fileInput.files[0].name;
      fileNameEl.textContent = name;
      dropzone.classList.add("has-file");
      if (deckLive) {
        deckLive.textContent =
          "PDF attached: " + name + ". Deck uploaded and ready to submit.";
      }
      runDeckCelebrate();
    } else {
      fileNameEl.textContent = "";
      dropzone.classList.remove("has-file", "pitch-form__dropzone--celebrate");
      if (deckLive) deckLive.textContent = "";
    }
  }

  if (browseBtn && fileInput) {
    browseBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (replaceBtn && fileInput) {
    replaceBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      fileInput.value = "";
      setFileName();
      fileInput.click();
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", function () {
      fileInput.click();
    });

    if (emptyState && fileInput) {
      emptyState.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fileInput.click();
        }
      });
    }

    ["dragenter", "dragover"].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("is-dragover");
      });
    });

    dropzone.addEventListener("drop", function (e) {
      var dt = e.dataTransfer;
      if (!dt || !dt.files || !dt.files.length) return;
      fileInput.files = dt.files;
      setFileName();
    });

    fileInput.addEventListener("change", setFileName);
  }

  /* ——— Custom selects (native <select> kept for validation + POST) ——— */
  var openSelect = null;

  function closeOpenSelect() {
    if (openSelect) {
      openSelect.close();
    }
  }

  document.addEventListener("click", function (e) {
    if (openSelect && openSelect.wrap && !openSelect.wrap.contains(e.target)) {
      closeOpenSelect();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openSelect) {
      var tr = openSelect.trigger;
      closeOpenSelect();
      tr.focus();
    }
  });

  function populateCountrySelect(select) {
    if (select.id !== "country" || !Array.isArray(window.MVB_PITCH_FORM_COUNTRIES)) return;
    if (select.getAttribute("data-countries-built") === "1") return;
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "Select…";
    select.appendChild(ph);
    var countries = window.MVB_PITCH_FORM_COUNTRIES;
    for (var c = 0; c < countries.length; c++) {
      var o = document.createElement("option");
      o.value = countries[c];
      o.textContent = countries[c];
      select.appendChild(o);
    }
    var ot = document.createElement("option");
    ot.value = "Other";
    ot.textContent = "Other";
    select.appendChild(ot);
    select.setAttribute("data-countries-built", "1");
  }

  function syncTriggerText(instance) {
    var sel = instance.select;
    var opt = sel.options[sel.selectedIndex];
    var text = opt ? opt.textContent.trim() : "";
    instance.valueEl.textContent = text || "Select…";
    instance.trigger.classList.toggle("is-placeholder", !sel.value);
  }

  function buildList(instance) {
    var sel = instance.select;
    var list = instance.list;
    instance.selectedLi = null;
    list.innerHTML = "";

    function addOption(opt) {
      if (opt.disabled) return;
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("data-value", opt.value);
      li.setAttribute("tabindex", "-1");
      li.className = "pitch-form__select-option";
      li.textContent = opt.textContent.trim();
      if (opt.selected) {
        li.setAttribute("aria-selected", "true");
        instance.selectedLi = li;
      } else {
        li.setAttribute("aria-selected", "false");
      }
      list.appendChild(li);
    }

    for (var i = 0; i < sel.children.length; i++) {
      var node = sel.children[i];
      if (node.tagName === "OPTGROUP") {
        var head = document.createElement("li");
        head.className = "pitch-form__select-group";
        head.setAttribute("role", "presentation");
        head.textContent = node.label;
        list.appendChild(head);
        for (var j = 0; j < node.children.length; j++) {
          addOption(node.children[j]);
        }
      } else if (node.tagName === "OPTION") {
        addOption(node);
      }
    }
  }

  function getOptionLis(instance) {
    return instance.list.querySelectorAll('li[role="option"]');
  }

  function getVisibleOptionLis(instance) {
    return Array.prototype.filter.call(getOptionLis(instance), function (li) {
      return !li.classList.contains("is-filtered-out");
    });
  }

  function applyFilter(instance) {
    if (!instance.searchable || !instance.searchInput) return;
    var q = instance.searchInput.value.trim().toLowerCase();
    var allOpts = instance.list.querySelectorAll('li[role="option"]');
    var i;
    for (i = 0; i < allOpts.length; i++) {
      var li = allOpts[i];
      var val = li.getAttribute("data-value");
      if (val === "" && q) {
        li.classList.add("is-filtered-out");
        continue;
      }
      if (!q) {
        li.classList.remove("is-filtered-out");
        continue;
      }
      var text = li.textContent.trim().toLowerCase();
      if (text.indexOf(q) >= 0) {
        li.classList.remove("is-filtered-out");
      } else {
        li.classList.add("is-filtered-out");
      }
    }
    var groups = instance.list.querySelectorAll("li.pitch-form__select-group");
    for (i = 0; i < groups.length; i++) {
      var gh = groups[i];
      var el = gh.nextElementSibling;
      var anyBelow = false;
      while (el && !el.classList.contains("pitch-form__select-group")) {
        if (el.getAttribute("role") === "option" && !el.classList.contains("is-filtered-out")) {
          anyBelow = true;
          break;
        }
        el = el.nextElementSibling;
      }
      if (!q) {
        gh.classList.remove("is-filtered-out");
      } else if (anyBelow) {
        gh.classList.remove("is-filtered-out");
      } else {
        gh.classList.add("is-filtered-out");
      }
    }
    var visible = getVisibleOptionLis(instance);
    var nonEmpty = 0;
    for (i = 0; i < visible.length; i++) {
      if (visible[i].getAttribute("data-value") !== "") nonEmpty++;
    }
    if (instance.emptyMsg) {
      instance.emptyMsg.hidden = !(q && nonEmpty === 0);
    }
  }

  function focusOption(instance, li) {
    var lis = getOptionLis(instance);
    for (var i = 0; i < lis.length; i++) {
      lis[i].classList.remove("is-focused");
    }
    if (li) {
      li.classList.add("is-focused");
      li.focus();
    }
  }

  function openList(instance) {
    closeOpenSelect();
    openSelect = instance;
    instance.wrap.classList.add("is-open");
    instance.trigger.setAttribute("aria-expanded", "true");
    instance.panel.hidden = false;
    if (instance.searchable && instance.searchInput) {
      instance.searchInput.value = "";
      applyFilter(instance);
      if (instance.emptyMsg) instance.emptyMsg.hidden = true;
      instance.list.scrollTop = 0;
      window.requestAnimationFrame(function () {
        instance.searchInput.focus();
      });
      return;
    }
    var toFocus = instance.selectedLi || getOptionLis(instance)[0];
    window.requestAnimationFrame(function () {
      focusOption(instance, toFocus);
    });
  }

  function closeList(instance) {
    instance.wrap.classList.remove("is-open");
    instance.trigger.setAttribute("aria-expanded", "false");
    instance.panel.hidden = true;
    if (instance.searchable && instance.searchInput) {
      instance.searchInput.value = "";
      applyFilter(instance);
    }
    if (instance.emptyMsg) instance.emptyMsg.hidden = true;
    var lis = getOptionLis(instance);
    for (var i = 0; i < lis.length; i++) {
      lis[i].classList.remove("is-focused");
    }
    if (openSelect === instance) openSelect = null;
  }

  function selectValue(instance, value) {
    instance.select.value = value;
    instance.select.dispatchEvent(new Event("change", { bubbles: true }));
    var lis = getOptionLis(instance);
    for (var i = 0; i < lis.length; i++) {
      var li = lis[i];
      var match = li.getAttribute("data-value") === value;
      li.setAttribute("aria-selected", match ? "true" : "false");
      if (match) instance.selectedLi = li;
    }
    syncTriggerText(instance);
    closeList(instance);
    instance.trigger.focus();
  }

  function moveFocus(instance, delta) {
    var lis = getVisibleOptionLis(instance);
    if (!lis.length) return;
    var active = document.activeElement;
    var idx = lis.indexOf(active);
    if (idx < 0) {
      if (instance.searchable && active === instance.searchInput && delta > 0) {
        focusOption(instance, lis[0]);
        lis[0].scrollIntoView({ block: "nearest" });
      }
      return;
    }
    if (delta < 0 && idx === 0 && instance.searchable && instance.searchInput) {
      instance.searchInput.focus();
      return;
    }
    var next = idx + delta;
    if (next < 0 || next >= lis.length) return;
    focusOption(instance, lis[next]);
    lis[next].scrollIntoView({ block: "nearest" });
  }

  function enhanceSelect(select) {
    if (select.closest(".pitch-form__select")) return;
    if (!select.classList.contains("is-select-input")) return;

    populateCountrySelect(select);

    var wrap = document.createElement("div");
    wrap.className = "pitch-form__select";

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "pitch-form__select-trigger";
    trigger.id = select.id + "-trigger";
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-autocomplete", "list");

    var ownerForm = select.closest("form");
    var label =
      ownerForm && select.id
        ? ownerForm.querySelector('label[for="' + select.id + '"]')
        : null;
    if (label) {
      if (!label.id) label.id = select.id + "-label";
      trigger.setAttribute("aria-labelledby", label.id);
    }

    var searchable = select.hasAttribute("data-searchable");

    var valueEl = document.createElement("span");
    valueEl.className = "pitch-form__select-value";
    var chevron = document.createElement("span");
    chevron.className = "pitch-form__select-chevron";
    chevron.setAttribute("aria-hidden", "true");
    trigger.appendChild(valueEl);
    trigger.appendChild(chevron);

    var panel = document.createElement("div");
    panel.className = "pitch-form__select-panel";
    panel.hidden = true;

    var list = document.createElement("ul");
    list.className = "pitch-form__select-list";
    list.setAttribute("role", "listbox");
    list.id = select.id + "-listbox";
    trigger.setAttribute("aria-controls", list.id);
    panel.appendChild(list);

    var searchInput = null;
    var emptyMsg = null;
    if (searchable) {
      var searchWrap = document.createElement("div");
      searchWrap.className = "pitch-form__select-search-wrap";
      searchInput = document.createElement("input");
      searchInput.type = "search";
      searchInput.className = "pitch-form__select-search form_input w-input";
      searchInput.setAttribute(
        "aria-label",
        "Filter " + (label ? label.textContent.replace(/\s*\*+\s*/g, "").trim() : "options")
      );
      searchInput.setAttribute("autocomplete", "off");
      searchInput.setAttribute("spellcheck", "false");
      searchInput.placeholder = "Type to search…";
      searchWrap.appendChild(searchInput);
      panel.insertBefore(searchWrap, list);
      emptyMsg = document.createElement("p");
      emptyMsg.className = "pitch-form__select-empty text-size-small";
      emptyMsg.hidden = true;
      emptyMsg.textContent = "No countries match.";
      panel.appendChild(emptyMsg);
    }

    select.classList.add("pitch-form__select-native", "visually-hidden");
    select.setAttribute("aria-hidden", "true");
    select.setAttribute("tabindex", "-1");

    var parent = select.parentNode;
    parent.insertBefore(wrap, select);
    wrap.appendChild(trigger);
    wrap.appendChild(panel);
    wrap.appendChild(select);

    var instance = {
      wrap: wrap,
      select: select,
      trigger: trigger,
      valueEl: valueEl,
      panel: panel,
      list: list,
      selectedLi: null,
      searchable: searchable,
      searchInput: searchInput,
      emptyMsg: emptyMsg,
      close: function () {
        closeList(instance);
      },
      refresh: function () {
        if (instance.searchable && instance.searchInput) {
          instance.searchInput.value = "";
        }
        buildList(instance);
        applyFilter(instance);
        syncTriggerText(instance);
      },
    };

    buildList(instance);
    applyFilter(instance);
    syncTriggerText(instance);
    wrap._pitchSelectInstance = instance;

    if (searchable && searchInput) {
      searchInput.addEventListener("input", function () {
        applyFilter(instance);
      });
      searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          e.stopPropagation();
          if (searchInput.value) {
            searchInput.value = "";
            applyFilter(instance);
          } else {
            closeList(instance);
            trigger.focus();
          }
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          var vis = getVisibleOptionLis(instance);
          if (vis[0]) focusOption(instance, vis[0]);
        }
      });
    }

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      if (wrap.classList.contains("is-open")) {
        closeList(instance);
      } else {
        openList(instance);
      }
    });

    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!wrap.classList.contains("is-open")) {
          openList(instance);
          if (e.key === "ArrowUp") {
            var all = getVisibleOptionLis(instance);
            if (all.length) focusOption(instance, all[all.length - 1]);
          }
        } else {
          moveFocus(instance, e.key === "ArrowDown" ? 1 : -1);
        }
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!wrap.classList.contains("is-open")) {
          openList(instance);
        }
      }
    });

    list.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeList(instance);
        trigger.focus();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveFocus(instance, 1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveFocus(instance, -1);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        var first = getVisibleOptionLis(instance)[0];
        if (first) focusOption(instance, first);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        var all = getVisibleOptionLis(instance);
        if (all.length) focusOption(instance, all[all.length - 1]);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        var t = e.target;
        if (t.getAttribute("role") === "option") {
          e.preventDefault();
          selectValue(instance, t.getAttribute("data-value"));
        }
      }
    });

    list.addEventListener("click", function (e) {
      var li = e.target.closest('li[role="option"]');
      if (!li || !list.contains(li)) return;
      selectValue(instance, li.getAttribute("data-value"));
    });
  }

  document.querySelectorAll("form.pitch-form select.is-select-input").forEach(function (sel) {
    enhanceSelect(sel);
  });

  document.querySelectorAll("form.pitch-form").forEach(function (f) {
    f.addEventListener("reset", function () {
      window.setTimeout(function () {
        setFileName();
        if (hearAboutError && f === pitchForm) hearAboutError.textContent = "";
        f.querySelectorAll(".pitch-form__select").forEach(function (wrap) {
          var native = wrap.querySelector("select.pitch-form__select-native");
          if (!native) return;
          var instance = wrap._pitchSelectInstance;
          if (instance) instance.refresh();
        });
      }, 0);
    });
  });

  if (pitchForm) {
    pitchForm.addEventListener("submit", function (e) {
      if (hearAboutError) hearAboutError.textContent = "";
      var boxes = pitchForm.querySelectorAll('input[name="hear_about[]"]');
      if (!boxes.length) return;
      var any = false;
      for (var i = 0; i < boxes.length; i++) {
        if (boxes[i].checked) {
          any = true;
          break;
        }
      }
      if (!any) {
        e.preventDefault();
        if (hearAboutError) {
          hearAboutError.textContent = "Please select at least one option for how you heard about us.";
        }
      }
    });
  }
})();
