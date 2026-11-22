(function () {
  "use strict";
  var CFG = window.AURORA_CONFIG || {};
  var IS_TV = typeof window.tizen !== "undefined" && !!window.tizen.application;
  var $ = function (id) { return document.getElementById(id); };
  var stage = $("stage");

  /* ---------- Escala 1920x1080 para qualquer tela ---------- */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = "scale(" + s + ")";
    stage.style.left = (window.innerWidth - 1920 * s) / 2 + "px";
    stage.style.top = (window.innerHeight - 1080 * s) / 2 + "px";
  }
  window.addEventListener("resize", fit); fit();

  /* ---------- Estrelas ---------- */
  (function stars() {
    var g = $("stars"), ns = "http://www.w3.org/2000/svg", seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 140; i++) {
      var c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", (rnd() * 1920).toFixed(1));
      c.setAttribute("cy", (rnd() * 520).toFixed(1));
      c.setAttribute("r", (rnd() * 1.6 + 0.3).toFixed(2));
      c.setAttribute("opacity", (rnd() * 0.7 + 0.2).toFixed(2));
      g.appendChild(c);
    }
  })();

  /* ---------- Toast ---------- */
  var toastT;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.className = "show";
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = ""; }, 2600);
  }

  /* ---------- Relógio ---------- */
  var DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function tick() {
    var d = new Date();
    $("time").textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
    $("date").textContent = DIAS[d.getDay()] + ", " + d.getDate() + " de " + MESES[d.getMonth()];
  }
  tick(); setInterval(tick, 10000);

  function netState() {
    var on = navigator.onLine !== false;
    $("net").textContent = on ? "● Online" : "● Sem internet";
    $("net").className = "pill" + (on ? "" : " off");
  }
  window.addEventListener("online", netState); window.addEventListener("offline", netState); netState();

  /* ---------- Apps instalados ---------- */
  var installed = []; // {id, name, icon}
  function findApp(entry) {
    if (!entry) return null;
    var keys = entry.match || [entry.name.toLowerCase()];
    for (var i = 0; i < installed.length; i++) {
      var n = (installed[i].name || "").toLowerCase();
      for (var k = 0; k < keys.length; k++) if (n.indexOf(keys[k]) !== -1) return installed[i];
    }
    if (entry.id) return { id: entry.id, name: entry.name, icon: "" };
    return null;
  }
  function cfgApp(name) {
    var a = CFG.apps || [];
    for (var i = 0; i < a.length; i++) if (a[i].name === name) return a[i];
    return { name: name, match: [name.toLowerCase()] };
  }
  function launch(app, label) {
    label = label || (app && app.name) || "app";
    if (!app) { toast(label + " não está instalado"); return; }
    if (!IS_TV) { toast("Prévia: abriria " + label); return; }
    try {
      tizen.application.launch(app.id, function () {}, function () { toast("Não consegui abrir " + label); });
    } catch (e) { toast("Não consegui abrir " + label); }
  }

  function rgba(hex, a) {
    var h = hex.replace("#", ""); if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  function tileHTML(entry, app) {
    var c1 = entry.c1 || "#4b5bd6", c2 = entry.c2 || "#141a52";
    var inner = app && app.icon
      ? '<img src="' + app.icon + '" style="max-width:78%;max-height:78%;border-radius:18px" onerror="this.parentNode.innerHTML=\'<span>' + entry.name.replace(/'/g, "") + '</span>\'">'
      : "<span>" + entry.name + "</span>";
    return '<div class="tile" style="background:linear-gradient(150deg,' + rgba(c1, .48) + ',' + rgba(c2, .22) + ')">' + inner + "</div>" +
      '<div class="lbl">' + entry.name + "</div>";
  }

  function renderAppsRow() {
    var row = $("apps-row"); row.innerHTML = "";
    (CFG.apps || []).forEach(function (entry) {
      var app = findApp(entry);
      var b = document.createElement("button");
      b.className = "app f" + (app || !IS_TV ? "" : " missing");
      b.innerHTML = tileHTML(entry, app);
      b.onclick = function () { launch(app, entry.name); };
      row.appendChild(b);
    });
  }

  function renderAllApps() {
    var box = $("all-apps"); box.innerHTML = "";
    var list = installed.length ? installed : (CFG.apps || []).map(function (e) { return { name: e.name, id: e.id, c1: e.c1, c2: e.c2 }; });
    list.forEach(function (app) {
      var b = document.createElement("button");
      b.className = "app f";
      b.innerHTML = tileHTML({ name: app.name, c1: app.c1, c2: app.c2 }, app);
      b.onclick = function () { launch(app); };
      box.appendChild(b);
    });
  }

  function loadApps(done) {
    if (!IS_TV) { done(); return; }
    try {
      tizen.application.getAppsInfo(function (infos) {
        installed = infos.filter(function (a) { return a.show !== false && a.name; })
          .map(function (a) { return { id: a.id, name: a.name, icon: a.iconPath || "" }; })
          .sort(function (x, y) { return x.name.localeCompare(y.name); });
        done();
      }, function () { done(); });
    } catch (e) { done(); }
  }

  /* ---------- Destaque (carrossel) ---------- */
  var SLIDES = [
    { k: "TV ao vivo", t: "Descubra novos mundos", s: "Canais ao vivo, filmes e séries no Claro TV+.", cta: "Assistir agora", app: "Claro TV+" },
    { k: "Sessão de hoje", t: "Escolha o filme da noite", s: "Seus serviços favoritos a um clique do controle.", cta: "Abrir Netflix", app: "Netflix" },
    { k: "Novidades", t: "O que está bombando", s: "Vídeos, clipes e transmissões no YouTube.", cta: "Abrir YouTube", app: "YouTube" },
    { k: "Novelas e esportes", t: "Tudo da Globo", s: "Ao vivo e sob demanda no Globoplay.", cta: "Abrir Globoplay", app: "Globoplay" }
  ];
  var slide = 0;
  function showSlide(i) {
    slide = (i + SLIDES.length) % SLIDES.length;
    var s = SLIDES[slide];
    $("hero-kicker").textContent = s.k; $("hero-title").textContent = s.t;
    $("hero-sub").textContent = s.s; $("hero-cta").textContent = s.cta;
    $("dots").innerHTML = SLIDES.map(function (_, j) { return "<i" + (j === slide ? ' class="on"' : "") + "></i>"; }).join("");
  }
  $("hero-btn").onclick = function () { var s = SLIDES[slide]; launch(findApp(cfgApp(s.app)), s.app); };
  showSlide(0);
  setInterval(function () { if (current !== $("hero-btn")) showSlide(slide + 1); }, 9000);

  /* ---------- Clima (Open-Meteo) ---------- */
  var WMO = {
    0: ["Céu limpo", "☀", "☾"], 1: ["Poucas nuvens", "☀", "☾"], 2: ["Parcialmente nublado", "☁", "☁"], 3: ["Nublado", "☁", "☁"],
    45: ["Neblina", "≋", "≋"], 48: ["Neblina", "≋", "≋"], 51: ["Garoa", "☂", "☂"], 53: ["Garoa", "☂", "☂"], 55: ["Garoa forte", "☂", "☂"],
    61: ["Chuva fraca", "☂", "☂"], 63: ["Chuva", "☂", "☂"], 65: ["Chuva forte", "☂", "☂"], 80: ["Pancadas", "☂", "☂"],
    81: ["Pancadas", "☂", "☂"], 82: ["Temporal", "ϟ", "ϟ"], 95: ["Trovoadas", "ϟ", "ϟ"], 96: ["Trovoadas", "ϟ", "ϟ"], 99: ["Trovoadas", "ϟ", "ϟ"]
  };
  function weather() {
    $("w-city").textContent = CFG.city || "";
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + CFG.lat + "&longitude=" + CFG.lon +
      "&current=temperature_2m,weather_code,is_day&timezone=auto";
    var x = new XMLHttpRequest();
    x.open("GET", url); x.timeout = 10000;
    x.onload = function () {
      try {
        var c = JSON.parse(x.responseText).current, w = WMO[c.weather_code] || ["—", "☁", "☁"];
        $("w-temp").textContent = Math.round(c.temperature_2m) + "°";
        $("w-desc").textContent = w[0]; $("w-icon").textContent = c.is_day ? w[1] : w[2];
      } catch (e) { $("w-desc").textContent = "Sem dados"; }
    };
    x.onerror = x.ontimeout = function () {
      if (!IS_TV) { $("w-temp").textContent = "24°"; $("w-desc").textContent = "Exemplo (prévia)"; $("w-icon").textContent = "☀"; }
      else $("w-desc").textContent = "Sem conexão";
    };
    x.send();
  }
  weather(); setInterval(weather, 15 * 60 * 1000);

  /* ---------- Entradas (experimental) ---------- */
  var SOURCE_APPS = ["org.tizen.tv-source-menu", "com.samsung.tv.source-menu", "org.tizen.source-menu"];
  $("inputs").onclick = function () {
    if (!IS_TV) { toast("Prévia: abriria o menu de fontes"); return; }
    var i = 0;
    (function next() {
      if (i >= SOURCE_APPS.length) { toast("Use o botão Fonte do controle"); return; }
      try { tizen.application.launch(SOURCE_APPS[i++], function () {}, next); } catch (e) { next(); }
    })();
  };

  /* ---------- Home Assistant ---------- */
  var HA_ON = !!(CFG.haUrl && CFG.haToken && (CFG.haEntities || []).length);
  var haStates = {}, ws = null, msgId = 1;
  var DEMO = [
    { entity: "light.sala_de_jantar", label: "Luz da sala de jantar", state: "on" },
    { entity: "light.sala_de_tv", label: "Luz da sala de TV", state: "off" },
    { entity: "climate.ar_sala", label: "Ar da sala", state: "cool", temp: 23 },
    { entity: "scene.cinema", label: "Modo cinema", state: "scene" },
    { entity: "switch.abajur", label: "Abajur", state: "off" }
  ];

  function haLabel(e) {
    var d = e.entity.split(".")[0], s = haStates[e.entity] || {};
    var st = s.state != null ? s.state : e.state;
    if (d === "scene" || d === "script") return { v: "Ativar", on: false };
    if (d === "climate") {
      var t = (s.attributes && s.attributes.temperature) || e.temp;
      return { v: st === "off" ? "Desligado" : (t ? t + "° · " : "") + "Ligado", on: st !== "off" && st != null };
    }
    if (st === "on") return { v: "Ligado", on: true };
    if (st === "off") return { v: "Desligado", on: false };
    return { v: st == null ? "…" : String(st), on: false };
  }

  function renderHA() {
    var list = HA_ON ? CFG.haEntities : (IS_TV ? [] : DEMO);
    $("casa-title").style.display = list.length ? "" : "none";
    $("casa-demo").textContent = HA_ON ? "" : "demonstração — conecte seu Home Assistant";
    [$("casa-row"), $("casa-grid")].forEach(function (box) {
      box.innerHTML = "";
      list.forEach(function (e) {
        var l = haLabel(e), b = document.createElement("button");
        b.className = "ha glass f" + (l.on ? " on" : "");
        b.innerHTML = '<div class="k">' + e.label + '</div><div class="v">' + l.v + "</div>";
        b.onclick = function () { haToggle(e); };
        b.setAttribute("data-entity", e.entity);
        box.appendChild(b);
      });
    });
    if (!list.length && IS_TV) {
      $("casa-grid").innerHTML = '<div class="glass setbox" style="position:static">Home Assistant não configurado. Preencha haUrl, haToken e haEntities em js/config.js e reinstale.</div>';
    }
    refocus();
  }

  function haToggle(e) {
    var d = e.entity.split(".")[0];
    if (!HA_ON) {
      if (d === "scene") { toast("Demo: cena ativada"); return; }
      e.state = e.state === "on" || (d === "climate" && e.state !== "off") ? "off" : (d === "climate" ? "cool" : "on");
      renderHA(); return;
    }
    var svc = d === "scene" ? ["scene", "turn_on"] : d === "script" ? ["script", "turn_on"] :
      d === "climate" ? ["climate", (haStates[e.entity] || {}).state === "off" ? "turn_on" : "turn_off"] : ["homeassistant", "toggle"];
    send({ type: "call_service", domain: svc[0], service: svc[1], target: { entity_id: e.entity } });
  }

  function send(o) { if (ws && ws.readyState === 1) { o.id = msgId++; ws.send(JSON.stringify(o)); } else toast("Home Assistant desconectado"); }

  function haConnect() {
    if (!HA_ON) return;
    var url = CFG.haUrl.replace(/^http/, "ws").replace(/\/$/, "") + "/api/websocket";
    try { ws = new WebSocket(url); } catch (e) { return; }
    ws.onmessage = function (m) {
      var d = JSON.parse(m.data);
      if (d.type === "auth_required") ws.send(JSON.stringify({ type: "auth", access_token: CFG.haToken }));
      else if (d.type === "auth_ok") {
        send({ type: "get_states" });
        send({ type: "subscribe_events", event_type: "state_changed" });
      } else if (d.type === "auth_invalid") toast("Token do Home Assistant inválido");
      else if (d.type === "result" && Array.isArray(d.result)) {
        d.result.forEach(function (s) { haStates[s.entity_id] = s; }); renderHA();
      } else if (d.type === "event" && d.event && d.event.data && d.event.data.new_state) {
        var ns = d.event.data.new_state;
        if (CFG.haEntities.some(function (e) { return e.entity === ns.entity_id; })) { haStates[ns.entity_id] = ns; renderHA(); }
      }
    };
    ws.onclose = function () { setTimeout(haConnect, 10000); };
  }

  /* ---------- Páginas ---------- */
  var page = "home";
  function go(p) {
    page = p;
    ["home", "apps", "casa", "settings"].forEach(function (id) { $(id).className = "page" + (id === p ? " show" : ""); });
    var navs = document.querySelectorAll(".nav");
    for (var i = 0; i < navs.length; i++) navs[i].classList.toggle("active", navs[i].getAttribute("data-page") === p);
    if (p === "settings") renderSettings();
    var first = $(p).querySelector(".f");
    setFocus(first || document.querySelector('.nav[data-page="' + p + '"]'));
  }
  function renderSettings() {
    $("set-info").innerHTML =
      "<b>Versão:</b> 1.0.0<br>" +
      "<b>Apps encontrados na TV:</b> " + (IS_TV ? installed.length : "prévia no navegador") + "<br>" +
      "<b>Clima:</b> " + (CFG.city || "-") + " (Open-Meteo)<br>" +
      "<b>Home Assistant:</b> " + (HA_ON ? (ws && ws.readyState === 1 ? "conectado" : "configurado, conectando…") : "não configurado") + "<br>" +
      "<b>Para mudar:</b> edite js/config.js e reinstale pelo TizenBrew Installer.";
  }
  var navBtns = document.querySelectorAll(".nav");
  for (var n = 0; n < navBtns.length; n++) (function (b) {
    b.onclick = function () {
      if (b.getAttribute("data-page")) go(b.getAttribute("data-page"));
      else if (b.getAttribute("data-launch")) launch(findApp(cfgApp(b.getAttribute("data-launch"))), b.getAttribute("data-launch"));
      else if (b.getAttribute("data-launch-match")) launch(findApp({ name: b.textContent.trim(), match: [b.getAttribute("data-launch-match")] }), b.textContent.trim());
    };
  })(navBtns[n]);

  /* ---------- Navegação espacial pelo controle ---------- */
  var current = null;
  function visible(el) { return el.offsetParent !== null; }
  function focusables() {
    return Array.prototype.filter.call(document.querySelectorAll(".f"), visible);
  }
  function setFocus(el) {
    if (!el) return;
    if (current) current.classList.remove("focus");
    current = el; el.classList.add("focus");
    keepInView(el);
  }
  function refocus() {
    if (current && document.body.contains(current) && visible(current)) return;
    var ent = current && current.getAttribute && current.getAttribute("data-entity");
    var again = ent && document.querySelector('.page.show [data-entity="' + ent + '"]');
    setFocus(again || $(page).querySelector(".f") || navBtns[0]);
  }
  function keepInView(el) {
    var row = el.parentNode;
    if (!row || !row.classList || !row.classList.contains("row")) return;
    var idx = Array.prototype.indexOf.call(row.children, el);
    var w = el.offsetWidth + 26, visibleW = row.offsetWidth;
    var offset = Math.max(0, Math.min(idx * w - visibleW / 2 + w / 2, row.scrollWidth - visibleW));
    row.style.transform = "translateX(" + (-offset) + "px)";
  }
  function move(dir) {
    if (!current) { setFocus(focusables()[0]); return; }
    var a = current.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    var best = null, bestScore = Infinity;
    focusables().forEach(function (el) {
      if (el === current) return;
      var b = el.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2;
      var dx = bx - ax, dy = by - ay, main, cross;
      if (dir === "L") { if (b.right > a.left + 4) return; main = -dx; cross = Math.abs(dy); }
      if (dir === "R") { if (b.left < a.right - 4) return; main = dx; cross = Math.abs(dy); }
      if (dir === "U") { if (b.bottom > a.top + 4) return; main = -dy; cross = Math.abs(dx); }
      if (dir === "D") { if (b.top < a.bottom - 4) return; main = dy; cross = Math.abs(dx); }
      var score = main + cross * 2.2;
      if (score < bestScore) { bestScore = score; best = el; }
    });
    if (best) setFocus(best);
  }

  var KEYS = { 37: "L", 38: "U", 39: "R", 40: "D" };
  document.addEventListener("keydown", function (e) {
    if (KEYS[e.keyCode]) { e.preventDefault(); move(KEYS[e.keyCode]); }
    else if (e.keyCode === 13) { e.preventDefault(); if (current) current.click(); }
    else if (e.keyCode === 10009 || e.keyCode === 8 || e.keyCode === 27) {
      e.preventDefault();
      if (page !== "home") go("home");
      else setFocus(navBtns[0]);
    }
  });
  // Mouse (prévia no navegador)
  document.addEventListener("mouseover", function (e) {
    var el = e.target.closest && e.target.closest(".f"); if (el) setFocus(el);
  });

  /* ---------- Início ---------- */
  loadApps(function () {
    renderAppsRow(); renderAllApps(); renderHA(); haConnect();
    setFocus($("apps-row").querySelector(".f") || navBtns[0]);
  });
})();
