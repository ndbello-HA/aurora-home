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
  var installed = []; // apps visíveis na tela Apps
  var allApps = [];   // todos os apps da TV, usados para abrir pelos botões
  function findApp(entry) {
    if (!entry) return null;
    var keys = entry.match || [entry.name.toLowerCase()];
    for (var i = 0; i < allApps.length; i++) {
      var n = (allApps[i].name || "").toLowerCase();
      for (var k = 0; k < keys.length; k++) if (n.indexOf(keys[k]) !== -1) return allApps[i];
    }
    if (entry.id) return { id: entry.id, name: entry.name, icon: "" };
    return null;
  }
  function cfgApp(name) {
    var a = (CFG.apps || []).concat(CFG.menuApps || []);
    for (var i = 0; i < a.length; i++) if (a[i].name === name) return a[i];
    return { name: name, match: [name.toLowerCase()] };
  }
  function launch(app, label) {
    label = label || (app && app.name) || "app";
    if (app && IS_TV) toast("Abrindo " + (app.name || label) + "…");
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

  var GAME_SYS = /game ?hub|gamepad|game ?bar|gaming ?hub/i;
  function renderGames() {
    var box = $("games-grid"); box.innerHTML = "";
    var extra = (CFG.games || []).map(function (g) { return String(g).toLowerCase(); });
    var visibleIds = {};
    installed.forEach(function (a) { visibleIds[a.id] = true; });
    var list = IS_TV ? allApps.filter(function (a) {
      if (!visibleIds[a.id] || GAME_SYS.test(a.name + " " + a.id)) return false;
      var n = a.name.toLowerCase();
      return /game/i.test(a.cats) || extra.some(function (g) { return n.indexOf(g) !== -1; });
    }) : [{ name: "Jogo exemplo", id: "", c1: "#7b5ed6", c2: "#1c1150" }];
    if (!list.length) {
      box.innerHTML = '<div class="glass setbox" style="position:static">Nenhum jogo instalado ainda.<br>Instale jogos pela loja da Samsung e eles aparecem aqui. Se algum não aparecer, me diga o nome.</div>';
      return;
    }
    list.forEach(function (app) {
      var b = document.createElement("button");
      b.className = "app f";
      b.innerHTML = tileHTML({ name: app.name, c1: app.c1 || "#7b5ed6", c2: app.c2 || "#1c1150" }, app);
      b.onclick = function () { launch(app); };
      box.appendChild(b);
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
        var SYS_ID = /^(org|com|net|kr|samsung|tizen|tv)\./i;
        var SYS_NAME = /test|teste|factory|f[áa]brica|diagnos|calibr|service|servi[çc]o|daemon|panel|painel|debug|demo|aurora home|device care|cuidados|self|autodiag|e-manual|manual eletr|workspace/i;
        allApps = infos.filter(function (a) { return a.name; })
          .map(function (a) { return { id: a.id, name: String(a.name).replace(/[\s\u00a0\u200b-\u200f\u2028\u2029\ufeff]+/g, " ").trim(), icon: a.iconPath || "", visible: a.show !== false && !!a.iconPath, cats: (a.categories || []).join(" ") }; })
          .sort(function (x, y) { return (y.visible ? 1 : 0) - (x.visible ? 1 : 0); });
        installed = infos.filter(function (a) {
          var nm = String(a.name).replace(/[\s\u00a0\u200b-\u200f\u2028\u2029\ufeff]+/g, " ").trim();
          var id = String(a.id || "") + " " + String(a.packageId || "");
          return a.show !== false && nm && a.iconPath && !SYS_ID.test(a.id) && !SYS_NAME.test(nm) &&
            !/device ?care|devicecare|workspace|diagnos|selftest|test/i.test(nm.replace(/ /g, " ") + " " + id) && a.id.indexOf("AurHome001") !== 0;
        })
          .map(function (a) { return { id: a.id, name: a.name, icon: a.iconPath || "" }; })
          .sort(function (x, y) { return x.name.localeCompare(y.name); });
        done();
      }, function () { done(); });
    } catch (e) { done(); }
  }

  /* ---------- Destaque: modo cinema ---------- */
  function renderCinema() {
    var hs = haStates || {};
    var lights = CFG.cinemaLights || [], anyOn = false, known = false, parts = [];
    lights.forEach(function (l) {
      var st = (hs[l.entity] || {}).state;
      if (st === "on" || st === "off") known = true;
      if (st === "on") anyOn = true;
      parts.push('<span class="' + (st === "on" ? "on" : "") + '">💡 ' + l.label + ": " + (st === "on" ? "acesa" : st === "off" ? "apagada" : "…") + "</span>");
    });
    var ac = hs[CFG.cinemaClimate];
    if (ac) {
      var at = ac.attributes || {};
      parts.push("<span>❄ Ar: " + (ac.state === "off" ? "desligado" : (at.temperature ? at.temperature + "°" : "ligado")) +
        (at.current_temperature != null ? " · sala " + Math.round(at.current_temperature) + "°" : "") + "</span>");
    }
    $("cine-status").innerHTML = HA_ON ? parts.join("") : (IS_TV ? "" : "<span>Prévia — conecte o Home Assistant</span>");
    var dark = known && !anyOn;
    $("hero-title").textContent = dark ? "Cinema pronto" : "Hora do filme?";
    $("hero-sub").textContent = dark ? "Luzes da sala apagadas. Bom filme!" : "Apague as luzes da sala com um clique.";
    $("hero").className = "glass" + (dark ? " dark" : "");
  }
  function cinema(on) {
    var ent = on ? CFG.cinemaOn : CFG.cinemaOff;
    if (!HA_ON) { toast(on ? "Prévia: apagaria as luzes da sala" : "Prévia: acenderia as luzes da sala"); return; }
    toast(on ? "Modo cinema" : "Acendendo luzes");
    send({ type: "call_service", domain: "script", service: "turn_on", target: { entity_id: ent } });
  }
  $("cine-on").onclick = function () { cinema(true); };
  $("cine-off").onclick = function () { cinema(false); };
  renderCinema();

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

  /* ---------- Entradas (via Home Assistant / SmartThings) ---------- */
  $("inputs").onclick = function () {
    if (!IS_TV) { toast("Prévia: abriria o menu de entradas da Samsung"); return; }
    if (!(ws && ws.readyState === 1)) { toast("Home Assistant desconectado"); return; }
    toast("Abrindo entradas…");
    send({ type: "call_service", domain: "script", service: "turn_on", target: { entity_id: CFG.haSourceScript || "script.aurora_abrir_entradas" } });
    setTimeout(function () { try { tizen.application.getCurrentApplication().hide(); } catch (e) {} }, 200);
  };
  function renderSources() {
    var box = $("sources-grid"); if (!box) return;
    var cur = ((haStates[CFG.haTvEntity] || {}).attributes || {}).source;
    box.innerHTML = "";
    (CFG.sources || []).forEach(function (src) {
      var b = document.createElement("button");
      b.className = "ha glass f" + (cur === src.source ? " on" : "");
      b.innerHTML = '<div class="k">' + (cur === src.source ? "Atual" : "Entrada") + '</div><div class="v">' + src.label + "</div>";
      b.onclick = function () {
        if (!IS_TV) { toast("Prévia: trocaria para " + src.label); return; }
        if (!(ws && ws.readyState === 1)) { toast("Home Assistant desconectado"); return; }
        toast("Trocando para " + src.label + "…");
        send({ type: "call_service", domain: "media_player", service: "select_source", target: { entity_id: CFG.haTvEntity }, service_data: { source: src.source } });
        setTimeout(function () {
          try { tizen.application.getCurrentApplication().hide(); } catch (e) { toast("Aperte Voltar para ver a entrada"); }
        }, 1500);
      };
      box.appendChild(b);
    });
  }

  /* ---------- Home Assistant ---------- */
  var HA_ON = !!((IS_TV || window.__AURORA_FORCE_HA) && CFG.haUrl && (CFG.haToken || CFG.haAuth === "trusted") && (CFG.haEntities || []).length);
  var haStates = {}, ws = null, msgId = 1, haStatus = "", haAccess = CFG.haToken || "";
  var HA_BASE = (CFG.haUrl || "").replace(/\/$/, ""), HA_CLIENT = HA_BASE + "/";
  function setHaStatus(t) { haStatus = t; var el = $("casa-demo"); if (el && HA_ON) el.textContent = t; }
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function http(method, path, body, form, cb) {
    var x = new XMLHttpRequest();
    x.open(method, HA_BASE + path); x.timeout = 15000;
    if (form) x.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    else if (body) x.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
    x.onload = function () { var j = null; try { j = JSON.parse(x.responseText); } catch (e) {} cb(x.status, j, x.responseText); };
    x.onerror = function () { cb(0, null, "sem resposta (rede ou CORS)"); };
    x.ontimeout = function () { cb(0, null, "tempo esgotado"); };
    x.send(form ? Object.keys(body).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(body[k]); }).join("&") : (body ? JSON.stringify(body) : null));
  }
  function tokenFrom(params, cb) {
    params.client_id = HA_CLIENT;
    http("POST", "/auth/token", params, true, function (st, j, raw) {
      if (st === 200 && j && j.access_token) {
        haAccess = j.access_token;
        if (j.refresh_token) store("aurora_ha_refresh", j.refresh_token);
        cb(true);
      } else cb(false, "token " + st + " " + String(raw).slice(0, 80));
    });
  }
  function haLogin(cb) {
    if (CFG.haToken) { haAccess = CFG.haToken; cb(true); return; }
    var rt = load("aurora_ha_refresh");
    if (rt) {
      tokenFrom({ grant_type: "refresh_token", refresh_token: rt }, function (ok) {
        if (ok) cb(true); else { store("aurora_ha_refresh", null); haLogin(cb); }
      });
      return;
    }
    setHaStatus("entrando no Home Assistant…");
    http("POST", "/auth/login_flow", { client_id: HA_CLIENT, handler: ["trusted_networks", null], redirect_uri: HA_CLIENT + "?auth_callback=1", type: "authorize" }, false, function (st, j, raw) {
      if (st !== 200 || !j) {
        if (st === 0) {
          var origin = String(location.origin || location.protocol);
          try {
            var t = new WebSocket(HA_BASE.replace(/^http/, "ws") + "/api/websocket"), done = false;
            t.onopen = function () { if (done) return; done = true; t.close(); cb(false, "bloqueio CORS (rede ok) · origem: " + origin); };
            t.onerror = function () { if (done) return; done = true; cb(false, "sem rede até " + HA_BASE + " · origem: " + origin); };
          } catch (e) { cb(false, "login 0 · origem: " + origin); }
          return;
        }
        cb(false, "login " + st + " " + String(raw).slice(0, 80)); return;
      }
      function finish(r) {
        if (r.type === "create_entry" && r.result) tokenFrom({ grant_type: "authorization_code", code: r.result }, cb);
        else cb(false, "login: " + (r.reason || r.type || "?") + " " + JSON.stringify(r.errors || "").slice(0, 60));
      }
      if (j.type !== "form") { finish(j); return; }
      var opts = [], want = (CFG.haUser || "tv sala").toLowerCase(), uid = null;
      (j.data_schema || []).forEach(function (f) { if (f.name === "user" && f.options) opts = f.options; });
      opts.forEach(function (o) { var id = o[0] || o.value, nm = String(o[1] || o.label || "").toLowerCase(); if (!uid && nm.indexOf(want) !== -1) uid = id; });
      if (!uid) { cb(false, "usuário '" + want + "' não liberado para este IP"); return; }
      http("POST", "/auth/login_flow/" + j.flow_id, { client_id: HA_CLIENT, user: uid }, false, function (st2, j2, raw2) {
        if (st2 !== 200 || !j2) cb(false, "login2 " + st2 + " " + String(raw2).slice(0, 80)); else finish(j2);
      });
    });
  }
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
    if (d === "scene" || d === "script" || d === "button") return { v: "Ativar", on: false };
    if (st == null) return { v: "…", on: false };
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
    $("casa-demo").textContent = HA_ON ? haStatus : "demonstração — conecte seu Home Assistant";
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
      if (d === "scene" || d === "button") { toast("Demo: " + e.label); return; }
      e.state = e.state === "on" || (d === "climate" && e.state !== "off") ? "off" : (d === "climate" ? "cool" : "on");
      renderHA(); return;
    }
    var svc = d === "scene" ? ["scene", "turn_on"] : d === "script" ? ["script", "turn_on"] : d === "button" ? ["button", "press"] :
      d === "climate" ? ["climate", (haStates[e.entity] || {}).state === "off" ? "turn_on" : "turn_off"] : ["homeassistant", "toggle"];
    send({ type: "call_service", domain: svc[0], service: svc[1], target: { entity_id: e.entity } });
    if (d === "button" || d === "scene" || d === "script") toast(e.label);
  }

  function send(o) { if (ws && ws.readyState === 1) { o.id = msgId++; ws.send(JSON.stringify(o)); } else toast("Home Assistant desconectado"); }

  var haRetry = 5000;
  function haConnect() {
    if (!HA_ON) return;
    haLogin(function (ok, err) {
      if (!ok) { setHaStatus("erro: " + err); setTimeout(haConnect, haRetry = Math.min(haRetry * 2, 120000)); return; }
      var url = HA_BASE.replace(/^http/, "ws") + "/api/websocket";
      try { ws = new WebSocket(url); } catch (e) { setHaStatus("erro: websocket"); return; }
      ws.onmessage = function (m) {
        var d = JSON.parse(m.data);
        if (d.type === "auth_required") ws.send(JSON.stringify({ type: "auth", access_token: haAccess }));
        else if (d.type === "auth_ok") {
          haRetry = 5000; ws.__ok = true; setHaStatus("");
          send({ type: "get_states" });
          send({ type: "subscribe_events", event_type: "state_changed" });
        } else if (d.type === "auth_invalid") { haAccess = ""; if (CFG.haToken) setHaStatus("erro: token inválido"); ws.close(); }
        else if (d.type === "result" && Array.isArray(d.result)) {
          d.result.forEach(function (s) { haStates[s.entity_id] = s; }); renderHA(); renderCinema();
        } else if (d.type === "result" && d.success === false && d.error) {
          toast("Home Assistant: " + d.error.message);
        } else if (d.type === "event" && d.event && d.event.data && d.event.data.new_state) {
          var ns = d.event.data.new_state;
          if (ns.entity_id === CFG.haTvEntity) { haStates[ns.entity_id] = ns; if (page === "entradas") renderSources(); }
          if (CFG.haEntities.some(function (e) { return e.entity === ns.entity_id; })) { haStates[ns.entity_id] = ns; renderHA(); }
          if (ns.entity_id === CFG.cinemaClimate || (CFG.cinemaLights || []).some(function (l) { return l.entity === ns.entity_id; })) { haStates[ns.entity_id] = ns; renderCinema(); }
        }
      };
      ws.onclose = function () { if (!(ws && ws.__ok)) setHaStatus("erro: sem conexão com " + HA_BASE); setTimeout(haConnect, haRetry); };
    });
  }

  /* ---------- Páginas ---------- */
  var page = "home";
  function go(p) {
    page = p;
    ["home", "apps", "jogos", "entradas", "casa", "settings"].forEach(function (id) { $(id).className = "page" + (id === p ? " show" : ""); });
    var navs = document.querySelectorAll(".nav");
    for (var i = 0; i < navs.length; i++) navs[i].classList.toggle("active", navs[i].getAttribute("data-page") === p);
    if (p === "settings") renderSettings();
    if (p === "entradas") renderSources();
    var first = $(p).querySelector(".f");
    setFocus(first || document.querySelector('.nav[data-page="' + p + '"]'));
  }
  function renderSettings() {
    $("set-info").innerHTML =
      "<b>Versão:</b> 1.3.7<br>" +
      "<b>Apps encontrados na TV:</b> " + (IS_TV ? installed.length : "prévia no navegador") + "<br>" +
      "<b>Clima:</b> " + (CFG.city || "-") + " (Open-Meteo)<br>" +
      "<b>Home Assistant:</b> " + (HA_ON ? (ws && ws.readyState === 1 ? "conectado (" + HA_BASE + ")" : (haStatus || "conectando…")) : "não configurado") + "<br>" +
      "<b>Apps de jogos na TV:</b> " + (allApps.filter(function (a) { return /gam|jogo|game/i.test(a.name + " " + a.id); })
        .map(function (a) { return a.name + " <small>(" + a.id + (a.visible ? "" : ", oculto") + ")</small>"; }).join(" · ") || "nenhum") + "<br>" +
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
    renderAppsRow(); renderAllApps(); renderGames(); renderHA(); haConnect();
    setFocus($("apps-row").querySelector(".f") || navBtns[0]);
  });
})();
