(function () {
  var form = document.getElementById("company-inbound-form");
  if (!form) return;

  var dropzone = document.getElementById("pitch-deck-dropzone");
  var fileInput = document.getElementById("pitch-deck-file");
  var fileNameEl = document.getElementById("pitch-deck-filename");
  var browseBtn = document.getElementById("pitch-deck-browse");
  var hearAboutError = document.getElementById("hear-about-error");

  function setFileName() {
    if (!fileInput || !fileNameEl) return;
    if (fileInput.files && fileInput.files.length) {
      fileNameEl.textContent = fileInput.files[0].name;
    } else {
      fileNameEl.textContent = "";
    }
  }

  if (browseBtn && fileInput) {
    browseBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", function () {
      fileInput.click();
    });

    dropzone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInput.click();
      }
    });

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
    var toFocus = instance.selectedLi || getOptionLis(instance)[0];
    window.requestAnimationFrame(function () {
      focusOption(instance, toFocus);
    });
  }

  function closeList(instance) {
    instance.wrap.classList.remove("is-open");
    instance.trigger.setAttribute("aria-expanded", "false");
    instance.panel.hidden = true;
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
    var lis = Array.prototype.slice.call(getOptionLis(instance));
    if (!lis.length) return;
    var active = document.activeElement;
    var idx = lis.indexOf(active);
    if (idx < 0) idx = 0;
    var next = Math.min(Math.max(0, idx + delta), lis.length - 1);
    focusOption(instance, lis[next]);
    lis[next].scrollIntoView({ block: "nearest" });
  }

  function enhanceSelect(select) {
    if (select.closest(".pitch-form__select")) return;
    if (!select.classList.contains("is-select-input")) return;

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

    var label = form.querySelector('label[for="' + select.id + '"]');
    if (label) {
      if (!label.id) label.id = select.id + "-label";
      trigger.setAttribute("aria-labelledby", label.id);
    }

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
      close: function () {
        closeList(instance);
      },
      refresh: function () {
        buildList(instance);
        syncTriggerText(instance);
      },
    };

    buildList(instance);
    syncTriggerText(instance);
    wrap._pitchSelectInstance = instance;

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
            var all = getOptionLis(instance);
            focusOption(instance, all[all.length - 1]);
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
        var first = getOptionLis(instance)[0];
        if (first) focusOption(instance, first);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        var all = getOptionLis(instance);
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

  form.querySelectorAll("select.is-select-input").forEach(function (sel) {
    enhanceSelect(sel);
  });

  if (form) {
    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        setFileName();
        if (hearAboutError) hearAboutError.textContent = "";
        form.querySelectorAll(".pitch-form__select").forEach(function (wrap) {
          var native = wrap.querySelector("select.pitch-form__select-native");
          if (!native) return;
          var instance = wrap._pitchSelectInstance;
          if (instance) instance.refresh();
        });
      }, 0);
    });
  }

  form.addEventListener("submit", function (e) {
    if (hearAboutError) hearAboutError.textContent = "";
    var boxes = form.querySelectorAll('input[name="hear_about[]"]');
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
})();
