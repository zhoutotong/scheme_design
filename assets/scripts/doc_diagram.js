  (function () {
    // In-page must use embed.diagrams.net (app.diagrams.net often blocks iframes → blank).
    var EMBED_ORIGIN = "https://embed.diagrams.net";
    var EDIT_SRC = EMBED_ORIGIN + "/?embed=1&ui=atlas&spin=1&proto=json&libraries=0&saveAndExit=0&noSaveBtn=0&noExitBtn=1";
    // 预览用隐藏 iframe 从同一引擎导出 PNG，页面只显示静态图，避免 Fit/缩放一段时间后留白
    var PREVIEW_SRC = EMBED_ORIGIN + "/?embed=1&ui=min&chrome=0&nav=0&layers=0&toolbar=0&proto=json&spin=0&libraries=0&saveAndExit=0&noSaveBtn=1&noExitBtn=1";

    var lightboxApi = null;

    function ensureLightbox() {
      if (lightboxApi) return lightboxApi;
      var root = document.createElement("div");
      root.className = "diagram-lightbox";
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.innerHTML =
        '<div class="diagram-lightbox-bar">' +
          '<span class="lb-title"></span>' +
          '<span class="lb-scale">100%</span>' +
          '<button type="button" data-lb="zoom-out">缩小</button>' +
          '<button type="button" data-lb="zoom-in">放大</button>' +
          '<button type="button" data-lb="fit">适应</button>' +
          '<button type="button" data-lb="reset">1:1</button>' +
          '<button type="button" data-lb="close">关闭</button>' +
        '</div>' +
        '<div class="diagram-lightbox-stage"><img alt="" /></div>';
      document.body.appendChild(root);

      var titleEl = root.querySelector(".lb-title");
      var scaleEl = root.querySelector(".lb-scale");
      var stage = root.querySelector(".diagram-lightbox-stage");
      var img = stage.querySelector("img");
      var scale = 1;
      var tx = 0;
      var ty = 0;
      var dragging = false;
      var moved = false;
      var lastX = 0;
      var lastY = 0;
      var fitScale = 1;

      function applyTransform() {
        img.style.transform =
          "translate(-50%, -50%) translate(" + tx + "px," + ty + "px) scale(" + scale + ")";
        if (scaleEl) scaleEl.textContent = Math.round(scale * 100) + "%";
      }

      function measureFit() {
        var nw = img.naturalWidth || 1;
        var nh = img.naturalHeight || 1;
        var sw = Math.max(stage.clientWidth - 48, 80);
        var sh = Math.max(stage.clientHeight - 48, 80);
        fitScale = Math.min(sw / nw, sh / nh, 1);
        if (!isFinite(fitScale) || fitScale <= 0) fitScale = 1;
      }

      function setView(nextScale, nextTx, nextTy) {
        scale = Math.max(0.2, Math.min(nextScale, 8));
        tx = nextTx;
        ty = nextTy;
        applyTransform();
      }

      function fitToWindow() {
        measureFit();
        setView(fitScale, 0, 0);
      }

      function open(src, title) {
        if (!src) return;
        titleEl.textContent = title || "框图";
        img.alt = title || "框图";
        img.onload = function () { fitToWindow(); };
        if (img.getAttribute("src") === src && img.complete && img.naturalWidth) {
          fitToWindow();
        } else {
          img.src = src;
        }
        root.classList.add("open");
        document.body.classList.add("diagram-lb-lock");
      }

      function close() {
        root.classList.remove("open");
        document.body.classList.remove("diagram-lb-lock");
        stage.classList.remove("is-dragging");
        dragging = false;
      }

      root.querySelector('[data-lb="close"]').addEventListener("click", function (e) {
        e.stopPropagation();
        close();
      });
      root.querySelector('[data-lb="zoom-in"]').addEventListener("click", function (e) {
        e.stopPropagation();
        setView(scale * 1.25, tx, ty);
      });
      root.querySelector('[data-lb="zoom-out"]').addEventListener("click", function (e) {
        e.stopPropagation();
        setView(scale / 1.25, tx, ty);
      });
      root.querySelector('[data-lb="fit"]').addEventListener("click", function (e) {
        e.stopPropagation();
        fitToWindow();
      });
      root.querySelector('[data-lb="reset"]').addEventListener("click", function (e) {
        e.stopPropagation();
        setView(1, 0, 0);
      });

      stage.addEventListener("pointerdown", function (e) {
        if (e.button !== 0) return;
        dragging = true;
        moved = false;
        lastX = e.clientX;
        lastY = e.clientY;
        stage.classList.add("is-dragging");
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      });
      stage.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX;
        var dy = e.clientY - lastY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
        tx += dx;
        ty += dy;
        lastX = e.clientX;
        lastY = e.clientY;
        applyTransform();
      });
      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        stage.classList.remove("is-dragging");
        try { stage.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      stage.addEventListener("pointerup", endDrag);
      stage.addEventListener("pointercancel", endDrag);
      stage.addEventListener("click", function (e) {
        if (!moved && e.target === stage) close();
      });
      stage.addEventListener("wheel", function (e) {
        e.preventDefault();
        setView(scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12), tx, ty);
      }, { passive: false });

      document.addEventListener("keydown", function (e) {
        if (!root.classList.contains("open")) return;
        if (e.key === "Escape") {
          e.preventDefault();
          close();
        } else if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          setView(scale * 1.25, tx, ty);
        } else if (e.key === "-") {
          e.preventDefault();
          setView(scale / 1.25, tx, ty);
        } else if (e.key === "0") {
          e.preventDefault();
          fitToWindow();
        }
      });
      window.addEventListener("resize", function () {
        if (root.classList.contains("open")) measureFit();
      });

      lightboxApi = { open: open, close: close };
      return lightboxApi;
    }

    function openDiagramLightbox(src, title) {
      ensureLightbox().open(src, title);
    }

    function parseSlot(slot) {
      var el = document.getElementById("drawio-data-" + slot);
      if (!el) return null;
      try {
        var raw = JSON.parse(el.textContent);
        if (raw.encoding === "base64" && raw.xml_b64) {
          raw.xml = decodeURIComponent(escape(atob(raw.xml_b64)));
        }
        return raw;
      } catch (e) {
        console.error(e);
        return null;
      }
    }

    function writeSlot(slot, data) {
      var el = document.getElementById("drawio-data-" + slot);
      if (!el) return;
      var prev = parseSlot(slot) || {};
      var xml = data.xml || "";
      var b64 = btoa(unescape(encodeURIComponent(xml)));
      el.textContent = JSON.stringify({
        path: data.path || prev.path,
        encoding: "base64",
        xml_b64: b64,
        edit_url: prev.edit_url || "",
        edit_helper: prev.edit_helper || ""
      });
    }

    function apiUrls(path) {
      var urls = [path];
      if (location.protocol === "http:" || location.protocol === "https:") {
        urls.push(location.origin + path);
      } else {
        urls.push("http://127.0.0.1:8765" + path);
      }
      return urls;
    }
    var SAVE_ENDPOINTS = apiUrls("/api/save-drawio");

    function downloadText(filename, text, mime) {
      var blob = new Blob([text], { type: mime || "application/xml;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 0);
    }

    function postSave(url, payload) {
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().then(function (body) {
          if (!res.ok || !body.ok) {
            throw new Error((body && body.error) || ("HTTP " + res.status));
          }
          return body;
        });
      });
    }

    function saveDrawioToRepo(payload) {
      var chain = Promise.reject();
      SAVE_ENDPOINTS.forEach(function (url) {
        chain = chain.catch(function () { return postSave(url, payload); });
      });
      return chain;
    }

    function basename(path) {
      var i = path.lastIndexOf("/");
      return i >= 0 ? path.slice(i + 1) : path;
    }

    function initPanel(panel) {
      if (panel.getAttribute("data-diagram-inited") === "1") return;
      panel.setAttribute("data-diagram-inited", "1");
      var slot = panel.getAttribute("data-slot");
      var data = parseSlot(slot);
      if (!data || !data.xml) {
        var h = panel.querySelector(".hint");
        if (h) h.textContent = "框图数据缺失";
        return;
      }

      var state = {
        xml: data.xml,
        path: data.path || "diagram.drawio",
        editUrl: data.edit_url || "",
        editHelper: data.edit_helper || "",
        dirty: false,
        frameReady: false,
        previewReady: false,
        loadTimer: null,
        previewTimer: null,
        editing: false,
        fullscreen: false,
        pendingPng: null,
        exportResolve: null
      };

      var previewBtn = panel.querySelector('[data-mode="preview"]');
      var editBtn = panel.querySelector('[data-mode="edit"]');
      var downloadBtn = panel.querySelector('[data-action="download"]');
      var zoomBtn = panel.querySelector('[data-action="zoom"]');
      var fsBtn = panel.querySelector('[data-action="fullscreen"]');
      var exitFsBtn = panel.querySelector('[data-action="exit-fullscreen"]');
      var external = panel.querySelector("#diagram-" + slot + "-external");
      var previewView = panel.querySelector(".diagram-view.preview");
      var editView = panel.querySelector(".diagram-view.edit");
      var iframe = editView.querySelector("iframe");
      var previewFrame = previewView.querySelector("iframe.diagram-preview-frame");
      var previewImg = previewView.querySelector("img.diagram-preview-img");
      var loading = panel.querySelector(".diagram-loading");
      var fallback = panel.querySelector(".diagram-fallback");
      var fallbackLink = panel.querySelector("#diagram-" + slot + "-fallback-link");
      var retryBtn = panel.querySelector('[data-action="retry-edit"]');
      var hint = panel.querySelector(".hint");

      if (external) external.href = state.editHelper || state.editUrl || external.href;
      if (fallbackLink) fallbackLink.href = state.editHelper || state.editUrl || fallbackLink.href;

      function showLoading(on) {
        if (loading) loading.hidden = !on;
      }

      function showFallback(on) {
        if (fallback) fallback.classList.toggle("visible", !!on);
        if (iframe) iframe.style.display = on ? "none" : "block";
      }

      function clearLoadTimer() {
        if (state.loadTimer) {
          clearTimeout(state.loadTimer);
          state.loadTimer = null;
        }
      }

      function clearPreviewTimer() {
        if (state.previewTimer) {
          clearTimeout(state.previewTimer);
          state.previewTimer = null;
        }
      }

      function applyPreviewPng(dataUrl) {
        if (!dataUrl || String(dataUrl).indexOf("data:image") !== 0) return;
        state.pendingPng = dataUrl;
        if (previewImg) previewImg.src = dataUrl;
      }

      function exportPreviewPng() {
        if (!previewFrame || !previewFrame.contentWindow || !state.previewReady) return;
        try {
          previewFrame.contentWindow.postMessage(JSON.stringify({
            action: "export",
            format: "png",
            xml: state.xml,
            embedImages: 1,
            border: 8,
            background: "#ffffff"
          }), EMBED_ORIGIN);
        } catch (e) {}
      }

      function loadIntoPreview() {
        if (!previewFrame || !previewFrame.contentWindow) return;
        previewFrame.contentWindow.postMessage(JSON.stringify({
          action: "load",
          xml: state.xml
        }), EMBED_ORIGIN);
      }

      function startPreviewExporter(forceReload) {
        if (!previewFrame) return;
        clearPreviewTimer();
        var needSrc = forceReload || previewFrame.getAttribute("src") !== PREVIEW_SRC;
        if (needSrc) {
          state.previewReady = false;
          previewFrame.setAttribute("src", PREVIEW_SRC);
        } else if (state.previewReady) {
          loadIntoPreview();
        } else if (!previewFrame.getAttribute("src")) {
          previewFrame.setAttribute("src", PREVIEW_SRC);
        }
        state.previewTimer = setTimeout(function () {
          state.previewTimer = null;
        }, 15000);
      }

      function updateFsButtons() {
        if (zoomBtn) zoomBtn.hidden = !!state.editing;
        if (fsBtn) fsBtn.hidden = !state.editing || state.fullscreen;
        if (exitFsBtn) exitFsBtn.hidden = !state.editing || !state.fullscreen;
        downloadBtn.hidden = !state.editing;
      }

      function openZoom() {
        var src = (previewImg && previewImg.currentSrc) || (previewImg && previewImg.src) || "";
        var title = (previewImg && previewImg.getAttribute("alt")) || "框图";
        openDiagramLightbox(src, title);
      }

      function setFullscreen(on) {
        state.fullscreen = !!on;
        panel.classList.toggle("is-fullscreen", state.fullscreen);
        document.body.classList.toggle("diagram-fs-lock", state.fullscreen);
        updateFsButtons();
        if (state.fullscreen) {
          var req = panel.requestFullscreen || panel.webkitRequestFullscreen;
          if (req) {
            try { req.call(panel); } catch (e) {}
          }
          hint.textContent = "全屏编辑";
        } else {
          if (document.fullscreenElement || document.webkitFullscreenElement) {
            var exit = document.exitFullscreen || document.webkitExitFullscreen;
            if (exit) {
              try { exit.call(document); } catch (e) {}
            }
          }
          if (state.editing) {
            hint.textContent = "";
          }
        }
      }

      function loadIntoEditor() {
        iframe.contentWindow.postMessage(JSON.stringify({
          action: "load",
          xml: state.xml,
          autosave: 1
        }), EMBED_ORIGIN);
      }

      function startEditor(forceReload) {
        showFallback(false);
        showLoading(true);
        state.frameReady = false;
        clearLoadTimer();
        requestAnimationFrame(function () {
          if (forceReload || iframe.getAttribute("src") !== EDIT_SRC) {
            iframe.setAttribute("src", EDIT_SRC);
          } else if (state.frameReady) {
            loadIntoEditor();
            showLoading(false);
          }
        });
        state.loadTimer = setTimeout(function () {
          if (!state.frameReady) {
            showLoading(false);
            showFallback(true);
            hint.textContent = "加载超时";
          }
        }, 15000);
      }

      function requestPngExport() {
        return new Promise(function (resolve) {
          var source = null;
          if (iframe && state.frameReady && iframe.contentWindow) source = iframe;
          else if (previewFrame && state.previewReady && previewFrame.contentWindow) source = previewFrame;
          if (!source) {
            resolve(state.pendingPng || null);
            return;
          }
          var done = false;
          var timer = setTimeout(function () {
            if (done) return;
            done = true;
            state.exportResolve = null;
            resolve(state.pendingPng || null);
          }, 8000);
          state.exportResolve = function (dataUrl) {
            if (done) return;
            done = true;
            clearTimeout(timer);
            state.exportResolve = null;
            resolve(dataUrl || null);
          };
          try {
            source.contentWindow.postMessage(JSON.stringify({
              action: "export",
              format: "png",
              xml: state.xml,
              spin: source === iframe ? "导出预览…" : undefined,
              embedImages: 1,
              border: 8,
              background: "#ffffff"
            }), EMBED_ORIGIN);
          } catch (e) {
            done = true;
            clearTimeout(timer);
            state.exportResolve = null;
            resolve(state.pendingPng || null);
          }
        });
      }

      function setMode(mode) {
        state.editing = mode === "edit";
        document.body.classList.toggle("diagram-editing", state.editing);
        previewBtn.classList.toggle("active", !state.editing);
        editBtn.classList.toggle("active", state.editing);
        previewView.classList.toggle("active", !state.editing);
        editView.classList.toggle("active", state.editing);
        updateFsButtons();
        if (state.editing) {
          hint.textContent = "";
          startEditor(false);
        } else {
          clearLoadTimer();
          showLoading(false);
          if (state.fullscreen) setFullscreen(false);
          hint.textContent = state.dirty ? "未保存" : "";
          if (state.dirty || !state.pendingPng) startPreviewExporter(false);
        }
      }

      function onMessage(evt) {
        var fromEdit = iframe && evt.source === iframe.contentWindow;
        var fromPreview = previewFrame && evt.source === previewFrame.contentWindow;
        if (!fromEdit && !fromPreview) return;
        if (evt.origin !== EMBED_ORIGIN && evt.origin.indexOf("diagrams.net") === -1) return;
        if (typeof evt.data !== "string" || !evt.data.length) return;
        var msg;
        try { msg = JSON.parse(evt.data); } catch (e) { return; }

        if (fromPreview) {
          if (msg.event === "init") {
            state.previewReady = true;
            clearPreviewTimer();
            loadIntoPreview();
          } else if (msg.event === "load") {
            state.previewReady = true;
            clearPreviewTimer();
            exportPreviewPng();
          } else if (msg.event === "export" && msg.data && String(msg.format || "").toLowerCase() === "png") {
            applyPreviewPng(msg.data);
            if (state.exportResolve) state.exportResolve(msg.data);
          }
          return;
        }

        if (msg.event === "init") {
          state.frameReady = true;
          clearLoadTimer();
          showLoading(false);
          showFallback(false);
          loadIntoEditor();
        } else if (msg.event === "load") {
          state.frameReady = true;
          clearLoadTimer();
          showLoading(false);
        } else if (msg.event === "autosave" || msg.event === "save") {
          if (msg.xml) {
            state.xml = msg.xml;
            state.dirty = true;
            writeSlot(slot, { path: state.path, xml: state.xml });
            hint.textContent = "已暂存，待写回";
          }
          if (msg.event === "save") {
            try {
              iframe.contentWindow.postMessage(JSON.stringify({
                action: "status",
                message: "已暂存",
                modified: false
              }), EMBED_ORIGIN);
            } catch (e) {}
          }
        } else if (msg.event === "export") {
          if (msg.data && String(msg.format || "").toLowerCase() === "png") {
            applyPreviewPng(msg.data);
            if (state.exportResolve) state.exportResolve(msg.data);
          } else if (msg.data && String(msg.data).indexOf("<") === 0) {
            state.xml = msg.data;
            state.dirty = true;
            writeSlot(slot, { path: state.path, xml: state.xml });
          }
        } else if (msg.event === "exit") {
          if (state.fullscreen) setFullscreen(false);
          setMode("preview");
        }
      }

      function syncNativeFs() {
        var nativeOn = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (!nativeOn && state.fullscreen) {
          state.fullscreen = false;
          panel.classList.remove("is-fullscreen");
          document.body.classList.remove("diagram-fs-lock");
          updateFsButtons();
        }
      }

      document.addEventListener("fullscreenchange", syncNativeFs);
      document.addEventListener("webkitfullscreenchange", syncNativeFs);
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && state.fullscreen) {
          e.preventDefault();
          setFullscreen(false);
        }
      });

      window.addEventListener("message", onMessage);
      previewBtn.addEventListener("click", function () { setMode("preview"); });
      editBtn.addEventListener("click", function () { setMode("edit"); });
      if (zoomBtn) zoomBtn.addEventListener("click", openZoom);
      if (previewImg) previewImg.addEventListener("click", function () {
        if (!state.editing) openZoom();
      });
      if (fsBtn) fsBtn.addEventListener("click", function () {
        if (!state.editing) setMode("edit");
        setFullscreen(true);
      });
      if (exitFsBtn) exitFsBtn.addEventListener("click", function () { setFullscreen(false); });
      if (retryBtn) retryBtn.addEventListener("click", function () { startEditor(true); });
      downloadBtn.addEventListener("click", function () {
        hint.textContent = "正在保存…";
        requestPngExport().then(function (png) {
          var payload = { path: state.path, xml: state.xml, slot: slot,
            html: document.documentElement.getAttribute("data-doc-path") || "summary.html" };
          if (png) payload.png = png;
          return saveDrawioToRepo(payload);
        }).then(function (body) {
          state.dirty = false;
          hint.textContent = body.synced ? "已保存" : "已保存（内嵌未同步）";
          startPreviewExporter(true);
        }).catch(function () {
          downloadText(basename(state.path), state.xml, "application/xml;charset=utf-8");
          hint.textContent = "已下载";
        });
      });

      startPreviewExporter(true);
    }

    function initAllDiagrams() {
      document.querySelectorAll(".diagram-panel[data-slot]").forEach(initPanel);
    }
    window.__navInitDiagrams = initAllDiagrams;
    initAllDiagrams();
  })();
