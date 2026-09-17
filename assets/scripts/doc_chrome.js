/*! Shared doc chrome: edit body + agent requests.
 * Pages set <html data-doc-path="relative/to/root.html">.
 * API 优先同源；仅 file:// 时回退本机 serve_docs 默认端口。
 */
(function () {
  function apiUrls(path) {
    var urls = [path];
    if (location.protocol === "http:" || location.protocol === "https:") {
      urls.push(location.origin + path);
    } else {
      urls.push("http://127.0.0.1:8765" + path);
    }
    return urls;
  }
  var SAVE_HTML = apiUrls("/api/save-html");
  var SAVE_AGENT = apiUrls("/api/agent-request");
  var DOC_PATH =
    document.documentElement.getAttribute("data-doc-path") ||
    (location.pathname || "").replace(/^\//, "") ||
    "summary.html";
  var DOC_BASENAME = DOC_PATH.split("/").pop() || "document.html";
  var NOTE_HINT = DOC_PATH.replace(/\.html?$/i, ".note.md");

  var bodyEl = document.getElementById("doc-body");
  var chrome = document.getElementById("doc-chrome");
  var hint = document.getElementById("doc-hint");
  var reqSidebar = document.getElementById("agent-req-sidebar");
  var reqOverlay = document.getElementById("agent-req-overlay");
  var reqText = document.getElementById("agent-req-text");
  var reqStatus = document.getElementById("agent-req-status");
  var reqTarget = document.getElementById("agent-req-target");
  var reqList = document.getElementById("agent-req-list");
  var reqCount = document.getElementById("agent-req-count");
  var linkPath = document.getElementById("agent-req-link-path");
  var linkFrom = document.getElementById("agent-req-link-from");
  var linkTo = document.getElementById("agent-req-link-to");
  var btnPick = reqSidebar ? reqSidebar.querySelector('[data-agent="pick"]') : null;
  if (!bodyEl || !chrome) return;

  var state = { editing: false, snapshot: "", dirty: false };
  var reqState = { open: false, target: null, focusEl: null, items: [], pick: false, hoverEl: null };
  var btnEdit = chrome.querySelector('[data-doc="edit"]');
  var btnSave = chrome.querySelector('[data-doc="save"]');
  var btnCancel = chrome.querySelector('[data-doc="cancel"]');
  var btnAgent = chrome.querySelector('[data-doc="agent-req"]');

  function setHint(text) {
    if (hint) hint.textContent = text || "";
  }

  function setReqStatus(text) {
    if (reqStatus) reqStatus.textContent = text || "";
  }

  function clip(s, n) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    if (s.length <= n) return s;
    return s.slice(0, n - 1) + "…";
  }

  function agentPrompt(path) {
    path = path || "agent-requests/pending.md";
    return (
      "请阅读 @" + path + " 中的「要求清单」并逐条修改本仓库设计文档：" +
      "按需更新设计正文 HTML、medias/diagrams/、配对 *.note.md、specs/；" +
      "遵守 specs/doc.md 与 specs/diagram.md。对照与待决写入配对 *.note.md（当前页对应 " +
      NOTE_HINT + "），正式结论写入正文（当前页 " + DOC_PATH + "）。"
    );
  }

  function headingPath(el) {
    var parts = [];
    var node = el;
    while (node && node !== bodyEl) {
      if (/^H[1-4]$/.test(node.tagName)) {
        parts.unshift(clip(node.textContent.replace(/\s*待设计\s*$/, ""), 40));
      } else if (node.classList && node.classList.contains("module-card")) {
        var h = node.querySelector("h4");
        if (h) parts.unshift("模块:" + clip(h.textContent.replace(/\s*待设计\s*$/, ""), 30));
      } else if (node.classList && node.classList.contains("diagram-panel")) {
        parts.unshift("框图:" + (node.getAttribute("data-slot") || node.id || "diagram"));
      }
      if (node.id && !/^doc-/.test(node.id)) {
        var idPart = "#" + node.id;
        if (parts.indexOf(idPart) < 0) parts.unshift(idPart);
      }
      node = node.parentElement;
    }
    return parts.filter(Boolean).join(" › ") || "正文";
  }

  function nearestAnchor(el) {
    var node = el;
    while (node && node !== bodyEl) {
      if (node.id) return node.id;
      node = node.parentElement;
    }
    return "";
  }

  function clearFocusMark() {
    if (reqState.focusEl) {
      reqState.focusEl.classList.remove("agent-req-focus");
      reqState.focusEl = null;
    }
  }

  function clearHover() {
    if (reqState.hoverEl) {
      reqState.hoverEl.classList.remove("agent-pick-hover");
      reqState.hoverEl = null;
    }
  }

  function clearLink() {
    if (linkPath) linkPath.setAttribute("d", "");
    if (linkFrom) {
      linkFrom.setAttribute("cx", "0");
      linkFrom.setAttribute("cy", "0");
    }
    if (linkTo) {
      linkTo.setAttribute("cx", "0");
      linkTo.setAttribute("cy", "0");
    }
    if (reqOverlay) {
      reqOverlay.classList.remove("open");
      reqOverlay.setAttribute("aria-hidden", "true");
    }
  }

  function updateLink() {
    if (!reqState.open || !reqState.focusEl || !reqSidebar || !linkPath) {
      clearLink();
      return;
    }
    var elRect = reqState.focusEl.getBoundingClientRect();
    var sideRect = reqSidebar.getBoundingClientRect();
    if (elRect.width < 1 && elRect.height < 1) {
      clearLink();
      return;
    }
    var fromX = sideRect.left;
    var fromY = Math.min(Math.max(sideRect.top + 120, sideRect.top + 40), sideRect.bottom - 40);
    var toX = elRect.right;
    var toY = elRect.top + elRect.height / 2;
    if (elRect.right > sideRect.left - 8) {
      toX = elRect.left;
    }
    var midX = (fromX + toX) / 2;
    var d =
      "M " + fromX + " " + fromY +
      " C " + midX + " " + fromY + ", " + midX + " " + toY + ", " + toX + " " + toY;
    linkPath.setAttribute("d", d);
    if (linkFrom) {
      linkFrom.setAttribute("cx", String(fromX));
      linkFrom.setAttribute("cy", String(fromY));
    }
    if (linkTo) {
      linkTo.setAttribute("cx", String(toX));
      linkTo.setAttribute("cy", String(toY));
    }
    if (reqOverlay) {
      reqOverlay.classList.add("open");
      reqOverlay.setAttribute("aria-hidden", "false");
    }
  }

  function setReqOpen(on) {
    if (!reqSidebar) return;
    reqState.open = !!on;
    reqSidebar.hidden = !on;
    reqSidebar.classList.toggle("open", !!on);
    document.body.classList.toggle("agent-req-open", !!on);
    if (btnAgent) btnAgent.classList.toggle("primary", !!on && !state.editing);
    if (!on) {
      setPickMode(false);
      clearFocusMark();
      clearLink();
    } else {
      requestAnimationFrame(updateLink);
      if (reqText) reqText.focus();
    }
  }

  function renderTarget() {
    if (!reqTarget) return;
    var t = reqState.target;
    if (!t) {
      reqTarget.className = "agent-req-target empty";
      reqTarget.textContent = "尚未选用。点「选用元素」后点击正文模块/标题/框图，或先选中文字。";
      return;
    }
    reqTarget.className = "agent-req-target";
    reqTarget.innerHTML =
      '<div><span class="k">类型：</span>' + escapeHtml(t.kind) +
      '　<span class="k">位置：</span>' + escapeHtml(t.location) +
      (t.anchor ? '　<span class="k">锚点：</span>#' + escapeHtml(t.anchor) : "") +
      "</div>" +
      (t.quote ? '<div class="quote">' + escapeHtml(t.quote) + "</div>" : "");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setTarget(target, focusEl) {
    clearFocusMark();
    reqState.target = target;
    if (focusEl && bodyEl.contains(focusEl)) {
      reqState.focusEl = focusEl;
      focusEl.classList.add("agent-req-focus");
    }
    renderTarget();
    if (target) {
      setReqOpen(true);
      setReqStatus("已选用目标，填写说明后「加入清单」");
      requestAnimationFrame(updateLink);
    } else {
      clearLink();
      setReqStatus(reqState.items.length ? "清单 " + reqState.items.length + " 条，可继续选用" : "");
    }
  }

  function setPickMode(on) {
    reqState.pick = !!on;
    document.body.classList.toggle("agent-pick-mode", reqState.pick);
    if (btnPick) btnPick.classList.toggle("primary", reqState.pick);
    if (!on) clearHover();
    if (on) {
      setReqOpen(true);
      setReqStatus("点选模式：点击正文中的标题、段落、模块或框图");
      setHint("点选要修改的元素…");
    } else if (!reqState.target) {
      setHint(reqState.items.length ? "清单 " + reqState.items.length + " 条" : "");
    }
  }

  function captureSelection() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setReqStatus("没有选中文字");
      return false;
    }
    var range = sel.getRangeAt(0);
    if (!bodyEl.contains(range.commonAncestorContainer)) {
      setReqStatus("请在正文区域内选中");
      return false;
    }
    var quote = clip(sel.toString(), 500);
    if (!quote) {
      setReqStatus("选区为空");
      return false;
    }
    var node = range.commonAncestorContainer;
    if (node.nodeType === 3) node = node.parentElement;
    var focus = node.closest(".module-card, .diagram-panel, h1, h2, h3, h4, p, li, tr, figcaption, td, th") || node;
    setTarget({
      kind: "选区",
      location: headingPath(node),
      anchor: nearestAnchor(node),
      quote: quote
    }, focus);
    return true;
  }

  function captureElement(el) {
    if (!el || !bodyEl.contains(el)) return false;
    var card = el.closest(".module-card");
    var panel = el.closest(".diagram-panel");
    var heading = el.closest("h1,h2,h3,h4");
    var focus = card || panel || heading || el.closest("p,li,tr,figcaption,td,th") || el;
    var quote = clip(focus.innerText || focus.textContent || "", 500);
    var kind = card ? "模块" : panel ? "框图" : heading ? "标题" : "元素";
    setTarget({
      kind: kind,
      location: headingPath(focus),
      anchor: nearestAnchor(focus),
      quote: quote
    }, focus);
    return true;
  }

  function renderList() {
    if (!reqList) return;
    reqList.innerHTML = "";
    reqState.items.forEach(function (item, idx) {
      var li = document.createElement("li");
      li.className = "agent-req-item";
      li.innerHTML =
        "<header><div><div class=\"loc\">" + (idx + 1) + ". [" + escapeHtml(item.kind) + "] " +
        escapeHtml(item.location) +
        (item.anchor ? " (#" + escapeHtml(item.anchor) + ")" : "") +
        "</div><div class=\"snip\">" + escapeHtml(item.quote || "（无摘录）") +
        "</div></div><button type=\"button\" data-del=\"" + idx + "\">删除</button></header>" +
        "<div class=\"note\">" + escapeHtml(item.note) + "</div>";
      reqList.appendChild(li);
    });
    if (reqCount) reqCount.textContent = "(" + reqState.items.length + ")";
  }

  function buildMarkdown() {
    if (!reqState.items.length) return "";
    var lines = [
      "来源页：`" + DOC_PATH + "`\n",
      "共 " + reqState.items.length + " 条，请按序号逐条处理。\n"
    ];
    reqState.items.forEach(function (item, i) {
      lines.push("### " + (i + 1) + ". [" + item.kind + "] " + item.location);
      if (item.anchor) lines.push("- 锚点：`#" + item.anchor + "`");
      if (item.quote) {
        lines.push("- 原文摘录：");
        lines.push("");
        lines.push("> " + item.quote.replace(/\n/g, "\n> "));
      }
      lines.push("- 修改说明：" + item.note);
      lines.push("");
    });
    return lines.join("\n");
  }

  function addCurrentToList() {
    var note = (reqText && reqText.value || "").trim();
    if (!reqState.target) {
      setReqStatus("请先选用元素");
      return false;
    }
    if (!note) {
      setReqStatus("请填写修改说明");
      return false;
    }
    reqState.items.push({
      kind: reqState.target.kind,
      location: reqState.target.location,
      anchor: reqState.target.anchor || "",
      quote: reqState.target.quote || "",
      note: note
    });
    if (reqText) reqText.value = "";
    setTarget(null);
    renderList();
    setReqStatus("已加入清单（" + reqState.items.length + "），可继续选用");
    setHint("清单 " + reqState.items.length + " 条");
    return true;
  }

  function lockDiagrams() {
    bodyEl.querySelectorAll(".diagram-panel, script").forEach(function (el) {
      el.setAttribute("contenteditable", "false");
      el.setAttribute("data-doc-lock", "1");
    });
  }

  function clearLockAttrs(root) {
    root.removeAttribute("contenteditable");
    root.querySelectorAll("[contenteditable], [data-doc-lock], [data-diagram-inited]").forEach(function (el) {
      el.removeAttribute("contenteditable");
      el.removeAttribute("data-doc-lock");
      el.removeAttribute("data-diagram-inited");
    });
  }

  function serializeBody() {
    var clone = bodyEl.cloneNode(true);
    clearLockAttrs(clone);
    clone.querySelectorAll(".agent-req-focus, .agent-pick-hover").forEach(function (el) {
      el.classList.remove("agent-req-focus", "agent-pick-hover");
    });
    return clone.outerHTML;
  }

  function setEditing(on) {
    state.editing = !!on;
    document.body.classList.toggle("doc-editing", state.editing);
    bodyEl.contentEditable = state.editing ? "true" : "false";
    btnEdit.hidden = state.editing;
    btnSave.hidden = !state.editing;
    btnCancel.hidden = !state.editing;
    if (btnAgent) btnAgent.hidden = state.editing;
    if (state.editing) {
      setReqOpen(false);
      state.snapshot = bodyEl.innerHTML;
      state.dirty = false;
      lockDiagrams();
      setHint("正文可编辑；框图区域已锁定");
    } else {
      bodyEl.removeAttribute("contenteditable");
      clearLockAttrs(bodyEl);
    }
  }

  function postJson(url, payload) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().then(function (body) {
        if (!res.ok || !body.ok) throw new Error((body && body.error) || ("HTTP " + res.status));
        return body;
      });
    });
  }

  function saveHtml(html) {
    var chain = Promise.reject();
    SAVE_HTML.forEach(function (url) {
      chain = chain.catch(function () {
        return postJson(url, { html: html, path: DOC_PATH });
      });
    });
    return chain;
  }

  function saveAgentRequest(text) {
    var chain = Promise.reject();
    SAVE_AGENT.forEach(function (url) {
      chain = chain.catch(function () {
        return postJson(url, { text: text, source: DOC_PATH });
      });
    });
    return chain;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        if (!document.execCommand("copy")) throw new Error("copy failed");
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        ta.remove();
      }
    });
  }

  function downloadText(filename, text) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  function downloadHtml() {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([document.documentElement.outerHTML], {
      type: "text/html;charset=utf-8"
    }));
    a.download = DOC_BASENAME;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  function submitAll() {
    var md = buildMarkdown();
    if (!md) {
      setReqStatus("清单为空，请先加入条目");
      return;
    }
    setReqStatus("正在提交…");
    saveAgentRequest(md).then(function (body) {
      setReqStatus("已提交 " + reqState.items.length + " 条 → " + (body.path || "agent-requests/pending.md"));
    }).catch(function () {
      var fallback =
        "# Agent 修改要求\n\n## 要求清单\n\n" + md + "\n## 处理说明（给 Agent）\n\n" +
        agentPrompt("agent-requests/pending.md") + "\n";
      downloadText("pending.md", fallback);
      setReqStatus("已下载 pending.md（本地服务未开），放入 agent-requests/ 后 @ 引用");
    });
  }

  bodyEl.addEventListener("input", function () {
    if (!state.editing) return;
    state.dirty = true;
    setHint("未保存");
  });

  bodyEl.addEventListener("mouseup", function () {
    if (!reqState.open || reqState.pick || state.editing) return;
    var sel = window.getSelection();
    if (sel && !sel.isCollapsed) captureSelection();
  });

  bodyEl.addEventListener("mousemove", function (e) {
    if (!reqState.pick) return;
    var el = e.target;
    if (!(el instanceof Element) || !bodyEl.contains(el)) return;
    var focus = el.closest(".module-card, .diagram-panel, h1, h2, h3, h4, p, li, tr, figcaption") || el;
    if (reqState.hoverEl === focus) return;
    clearHover();
    reqState.hoverEl = focus;
    focus.classList.add("agent-pick-hover");
  });

  bodyEl.addEventListener("click", function (e) {
    if (!reqState.pick) return;
    e.preventDefault();
    e.stopPropagation();
    captureElement(e.target);
    setPickMode(false);
    setHint("");
    if (reqText) reqText.focus();
  }, true);

  window.addEventListener("scroll", function () {
    if (reqState.open && reqState.focusEl) updateLink();
  }, true);
  window.addEventListener("resize", function () {
    if (reqState.open && reqState.focusEl) updateLink();
  });

  btnEdit.addEventListener("click", function () { setEditing(true); });
  btnCancel.addEventListener("click", function () {
    if (state.dirty && !confirm("放弃未保存的正文修改？")) return;
    bodyEl.innerHTML = state.snapshot;
    state.dirty = false;
    setEditing(false);
    setHint("");
    if (window.__navInitDiagrams) window.__navInitDiagrams();
  });
  btnSave.addEventListener("click", function () {
    setHint("正在保存…");
    var html = serializeBody();
    saveHtml(html).then(function () {
      state.dirty = false;
      state.snapshot = bodyEl.innerHTML;
      setEditing(false);
      setHint("已保存");
    }).catch(function () {
      downloadHtml();
      setHint("已下载（本地服务未开）");
    });
  });

  if (btnAgent && reqSidebar && reqText) {
    btnAgent.addEventListener("click", function () {
      if (reqState.open) {
        setReqOpen(false);
        setHint(reqState.items.length ? "清单 " + reqState.items.length + " 条（边栏已收起）" : "");
        return;
      }
      setReqOpen(true);
      if (!reqState.target && !reqState.items.length) setPickMode(true);
    });
    reqSidebar.querySelector('[data-agent="close"]').addEventListener("click", function () {
      setReqOpen(false);
      setHint(reqState.items.length ? "清单 " + reqState.items.length + " 条（边栏已收起）" : "");
    });
    reqSidebar.querySelector('[data-agent="capture-sel"]').addEventListener("click", function () {
      if (captureSelection()) setPickMode(false);
    });
    reqSidebar.querySelector('[data-agent="pick"]').addEventListener("click", function () {
      setPickMode(!reqState.pick);
    });
    reqSidebar.querySelector('[data-agent="add"]').addEventListener("click", function () {
      if (addCurrentToList()) setPickMode(true);
    });
    reqSidebar.querySelector('[data-agent="clear-list"]').addEventListener("click", function () {
      if (!reqState.items.length) return;
      if (!confirm("清空待提交清单？")) return;
      reqState.items = [];
      renderList();
      setReqStatus("清单已清空");
      setHint("");
    });
    reqSidebar.querySelector('[data-agent="submit"]').addEventListener("click", submitAll);
    reqSidebar.querySelector('[data-agent="copy"]').addEventListener("click", function () {
      if (!reqState.items.length) {
        setReqStatus("清单为空，请先加入并提交");
        return;
      }
      var prompt = agentPrompt("agent-requests/pending.md") + "\n\n" + buildMarkdown();
      copyText(prompt).then(function () {
        setReqStatus("已复制 " + reqState.items.length + " 条，请粘贴到 Cursor 当前对话");
      }).catch(function () {
        setReqStatus("复制失败，请先一并提交后 @agent-requests/pending.md");
      });
    });
    if (reqList) {
      reqList.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-del]");
        if (!btn) return;
        var idx = Number(btn.getAttribute("data-del"));
        if (Number.isNaN(idx)) return;
        reqState.items.splice(idx, 1);
        renderList();
        setReqStatus("已删除，剩余 " + reqState.items.length + " 条");
        setHint(reqState.items.length ? "清单 " + reqState.items.length + " 条" : "");
      });
    }
    renderTarget();
    renderList();
  }

  window.addEventListener("beforeunload", function (e) {
    if (state.editing && state.dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
})();
