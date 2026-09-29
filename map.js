/* ==========================================================================
   Hatta Interactive Map — prototype component
   Plain ES5-style JavaScript, single global: window.HattaMap
   No frameworks, no build step, no external libraries, no eval, no innerHTML
   with data. Works from a web server (fetch) or from file:// (data/pois.js).

   Usage:
     <div id="hatta-map-widget" data-lang="en" dir="ltr"></div>
     <link rel="stylesheet" href="map.css">
     <script src="data/pois.js"></script>   <!-- optional, for file:// / kiosk -->
     <script src="map.js"></script>
     <script>
       window.HattaMap.init({
         container: '#hatta-map-widget',
         mode: 'web',            // 'web' | 'kiosk'
         orientation: 'auto',    // 'auto' | 'landscape' | 'portrait'
         lang: 'en',             // 'en' | 'ar'
         showLangToggle: true,   // false when the host website drives the language
         showLanding: true,      // web: intro overlay on load; kiosk: attract loop
         idleSeconds: 75,        // kiosk: seconds of inactivity before the attract loop
         hideCursor: true,       // kiosk: hide the mouse cursor after cursorHideSeconds (3) of stillness; any mouse movement shows it again
         dataUrl: 'data/pois.json',
         artwork: 'clean',       // 'clean' (printed pins/labels removed) | 'print' (original artwork)
         assetsBase: ''          // prefix for asset paths (e.g. '/o/hatta-map/')
       });
     </script>
   ========================================================================== */
(function () {
  'use strict';

  window.HattaMap = window.HattaMap || {};

  /* ------------------------------------------------------------------ i18n */
  var STRINGS = {
    en: {
      title: 'Explore Hatta', subtitle: "Dubai's mountain adventures",
      kicker: 'Dubai Culture · Interactive map', openMap: 'Open the map', browse: 'Browse places',
      touch: 'Touch anywhere to explore', directory: 'Places', about: 'About Hatta', home: 'Home',
      search: 'Search places', all: 'All', featured: 'Featured places', allPlaces: 'All places',
      showOnMap: 'Show on map', directions: 'Get directions', close: 'Close', backToMap: 'Back to map',
      zoomIn: 'Zoom in', zoomOut: 'Zoom out', resetView: 'Reset view',
      scan: 'Scan to navigate', scanSub: 'Opens this place in Google Maps on your phone.',
      openIn: 'Open in', google: 'Google Maps', waze: 'Waze', apple: 'Apple Maps',
      noDesc: 'Marked on the Explore Hatta map. Details for this place will be added.',
      hint: 'Drag to move · pinch or scroll to zoom',
      noResults: 'No places match your search.',
      directionsTitle: 'Directions from Dubai', busTitle: 'Bus routes',
      sourceNote: 'Map artwork and place descriptions: Department of Economy and Tourism, Dubai. Prototype only.',
      featuredBadge: 'Featured', langName: 'EN', otherLang: 'العربية',
      generic: 'Marked on the Explore Hatta map.',
      moreInfo: 'Opening hours, contact and prices: to be confirmed.'
    },
    ar: {
      title: 'استكشف حتا', subtitle: 'مغامرات دبي الجبلية',
      kicker: 'دبي للثقافة · خريطة تفاعلية', openMap: 'افتح الخريطة', browse: 'تصفّح الأماكن',
      touch: 'المس الشاشة للاستكشاف', directory: 'الأماكن', about: 'عن حتا', home: 'الرئيسية',
      search: 'ابحث عن مكان', all: 'الكل', featured: 'أماكن مميّزة', allPlaces: 'كل الأماكن',
      showOnMap: 'عرض على الخريطة', directions: 'الاتجاهات', close: 'إغلاق', backToMap: 'العودة إلى الخريطة',
      zoomIn: 'تكبير', zoomOut: 'تصغير', resetView: 'إعادة الضبط',
      scan: 'امسح الرمز للتوجّه', scanSub: 'يفتح هذا المكان في خرائط جوجل على هاتفك.',
      openIn: 'افتح في', google: 'خرائط جوجل', waze: 'ويز', apple: 'خرائط آبل',
      noDesc: 'مُدرج على خريطة استكشف حتا. ستُضاف تفاصيل هذا المكان لاحقاً.',
      hint: 'اسحب للتحريك · قرّب بإصبعين أو بعجلة الفأرة',
      noResults: 'لا توجد أماكن مطابقة لبحثك.',
      directionsTitle: 'الاتجاهات من دبي', busTitle: 'خطوط الحافلات',
      sourceNote: 'الرسم التوضيحي للخريطة وأوصاف الأماكن: دائرة الاقتصاد والسياحة، دبي. نموذج أولي.',
      featuredBadge: 'مميّز', langName: 'العربية', otherLang: 'EN',
      generic: 'مُدرج على خريطة استكشف حتا.',
      moreInfo: 'ساعات العمل والتواصل والأسعار: قيد التأكيد.'
    }
  };

  /* ------------------------------------------------------------------ icons (24x24) */
  var ICONS = {
    market: '<path d="M3 4h2l2.4 10.2A2 2 0 0 0 9.4 16H18a2 2 0 0 0 1.9-1.4L22 8H7"/><circle cx="10" cy="20" r="1.6"/><circle cx="17" cy="20" r="1.6"/>',
    tesla: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
    dam: '<path d="M3 20h18v-2H3zM4 15c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1v2c-1.5 0-1.5 1-3 1s-1.5-1-3-1-1.5 1-3 1-1.5-1-3-1-1.5 1-3 1zM4 10c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1v2c-1.5 0-1.5 1-3 1s-1.5-1-3-1-1.5 1-3 1-1.5-1-3-1-1.5 1-3 1zM6 4h12v3H6z"/>',
    government: '<path d="M12 2 2 8h20zM4 10h3v8H4zm6.5 0h3v8h-3zM17 10h3v8h-3zM2 20h20v2H2z"/>',
    hotel: '<path d="M3 5h2v9h7V8h5a4 4 0 0 1 4 4v7h-2v-3H5v3H3zM7 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>',
    mtb: '<path d="M6 13a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm12-6a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM14 4h4v2h-2.6l2 4H15l-1.6-3.2L10 12h3v2H8.6L6.7 9.5 8 8l1.7 2.8L12.8 6H10V4z"/>',
    hospital: '<path d="M5 3h3v7h8V3h3v18h-3v-8H8v8H5z"/>',
    gas: '<path d="M4 3h9a1 1 0 0 1 1 1v6h1.5a2.5 2.5 0 0 1 2.5 2.5V17a1 1 0 0 0 2 0v-6.6l-2-2V6l2 2h1v9a3 3 0 0 1-6 0v-4.5a.5.5 0 0 0-.5-.5H14v9H4zm2 2v5h6V5z"/>',
    view360: '<path d="M12 5C6.5 5 2.5 9 1 12c1.5 3 5.5 7 11 7s9.5-4 11-7c-1.5-3-5.5-7-11-7zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>',
    hiking: '<path d="M13.5 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM9.8 8.4 12 7l3 1.6 2.3 3.2-1.6 1.2-1.9-2.6-1 3.5 2.4 2.5V22h-2v-4.8l-2.6-2.6-1 4.6L6 22l-.8-1.8 2.8-1.1 1.6-7.4-1.4.9V16H6.3V11.4z"/>',
    ambulance: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
    atm: '<path d="M2 6h20v12H2zm2 2v8h16V8zm8 1.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM5 10h2v4H5zm12 0h2v4h-2z"/>',
    restarea: '<path d="M12 3 2 20h20zm0 4.6L18.2 18H13v-5h-2v5H5.8z"/>',
    horse: '<path d="M6 21v-8a6 6 0 0 1 12 0v8h-3v-8a3 3 0 0 0-6 0v8zm2-15.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z"/>',
    police: '<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5zm0 3.2 5.5 2v3.8c0 3.6-2.3 6.9-5.5 8.2-3.2-1.3-5.5-4.6-5.5-8.2V7.2z"/>',
    parking: '<path d="M6 3h7a5 5 0 0 1 0 10H9.5v8H6zm3.5 3v4H13a2 2 0 0 0 0-4z"/>',
    bus: '<path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-1 1.7V21a1 1 0 0 1-2 0v-2H7v2a1 1 0 0 1-2 0v-2.3A2 2 0 0 1 4 17zm2 1v6h12V5zm1.5 8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>',
    heritage: '<path d="M4 3h3v2.5h2V3h2v2.5h2V3h2v2.5h2V3h3v6l-1.5 1.5V21h-4v-5a2.5 2.5 0 0 0-5 0v5h-4V10.5L4 9z"/>',
    landmark: '<path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2l-6.1 3.4 1.4-6.8-5.1-4.7 6.9-.8z"/>',
    lake: '<path d="M2 8c2 0 2-1.5 4-1.5S8 8 10 8s2-1.5 4-1.5S16 8 18 8s2-1.5 4-1.5v2.5C20 9 20 10.5 18 10.5S16 9 14 9s-2 1.5-4 1.5S8 9 6 9s-2 1.5-4 1.5zm0 6c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5v2.5c-2 0-2 1.5-4 1.5s-2-1.5-4-1.5-2 1.5-4 1.5-2-1.5-4-1.5-2 1.5-4 1.5z"/>',
    park: '<path d="M12 2 6.5 10h3L5 16h5.5v6h3v-6H19l-4.5-6h3z"/>',
    cafe: '<path d="M3 5h14v2h2a3 3 0 0 1 0 6h-2.2A6 6 0 0 1 11 17H9a6 6 0 0 1-6-6zm14 4v2h2a1 1 0 0 0 0-2zM3 19h16v2H3z"/>',
    restaurant: '<path d="M5 2h2v6a2 2 0 0 0 2-2V2h2v4a4 4 0 0 1-3 3.9V22H6V9.9A4 4 0 0 1 3 6V2h2v4a2 2 0 0 0 0 0zm12 0c2 0 3 2.5 3 6s-1 5-2 5.5V22h-2v-8.5C14 13 13 11 13 8s2-6 4-6z"/>',
    lodge: '<path d="M12 3 2 11h3v10h5v-6h4v6h5V11h3z"/>',
    camp: '<path d="M12 3 2 20h20zm0 4.6L18.2 18H13v-5h-2v5H5.8z"/>',
    farm: '<path d="M12 22c0-6 2-9 8-11-1 6-3 9-8 11zm0 0c0-5-2-8-8-10 1 5 3 8 8 10zM12 2c1.5 2 1.5 5 0 8-1.5-3-1.5-6 0-8z"/>',
    adventure: '<path d="M14 2 3 22h18L14 9.5 11.6 13zM6.4 20 12 9.5 17.6 20z"/>',
    kayak: '<path d="M2 12c4-3 16-3 20 0-4 3-16 3-20 0zm7 0a3 1 0 1 0 6 0 3 1 0 1 0-6 0zM4 4l3 3-1.4 1.4L2.6 5.4zm16 0 1.4 1.4-3 3L17 7z"/>',
    nature: '<path d="M4 20c2-8 8-12 16-12-1 8-6 13-14 13zM5.5 19c5-4 7.5-6.5 10-10-4 2-7 5-10 10z"/>',
    medical: '<path d="M5 3h3v7h8V3h3v18h-3v-8H8v8H5z"/>',
    sports: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 0 1 5.6 2.3A15 15 0 0 0 12 11a15 15 0 0 0-5.6-4.7A8 8 0 0 1 12 4zM4.2 10.3A13 13 0 0 1 10 13a13 13 0 0 1-5.6 5.5A8 8 0 0 1 4.2 10.3zm15.6 0a8 8 0 0 1-.2 8.2A13 13 0 0 1 14 13a13 13 0 0 1 5.8-2.7zM12 15a11 11 0 0 0 4.4 4.3A8 8 0 0 1 7.6 19.3 11 11 0 0 0 12 15z"/>',
    hall: '<path d="M3 21V9l9-6 9 6v12h-6v-6H9v6z"/>',
    viewpoint: '<path d="M12 5C6.5 5 2.5 9 1 12c1.5 3 5.5 7 11 7s9.5-4 11-7c-1.5-3-5.5-7-11-7zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>'
  };
  var UI_ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    home: '<path d="M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    nav: '<path d="M3 11 21 3l-8 18-2-8z"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'
  };

  /* ------------------------------------------------------------------ DOM helpers */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'style' && typeof v === 'object') { for (var s in v) n.style.setProperty(s, v[s]); }
        else if (k.indexOf('on') === 0 && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      }
    }
    if (children) appendAll(n, children);
    return n;
  }
  function appendAll(n, children) {
    if (!Array.isArray(children)) children = [children];
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c === null || c === undefined || c === false) continue;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
  }
  function svg(markup, cls) {
    // markup comes only from the constant ICONS tables above (never from data)
    var wrap = document.createElementNS(SVG_NS, 'svg');
    wrap.setAttribute('viewBox', '0 0 24 24');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.setAttribute('focusable', 'false');
    if (cls) wrap.setAttribute('class', cls);
    var parser = new DOMParser();
    var doc = parser.parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + markup + '</svg>', 'image/svg+xml');
    var kids = doc.documentElement.childNodes;
    for (var i = 0; i < kids.length; i++) wrap.appendChild(document.importNode(kids[i], true));
    return wrap;
  }
  function icon(type) { return svg(ICONS[type] || ICONS.landmark); }
  function uicon(type) { return svg(UI_ICONS[type]); }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function safeUrl(u) { return (/^https?:\/\//i).test(u || '') ? u : ''; }
  function clampNum(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ------------------------------------------------------------------ init */
  window.HattaMap.init = function (userConfig) {
    var cfg = {
      container: '#hatta-map-widget', mode: 'web', orientation: 'auto', lang: null,
      showLangToggle: true, showLanding: true, showHome: true, showLogo: true, idleSeconds: 75, dataUrl: 'data/pois.json',
      assetsBase: '', mapImage: 'auto', artwork: 'clean', hideCursor: true, cursorHideSeconds: 3, maxZoomFactor: 5.5,
      tier2At: 1.45, tier3At: 2.5
    };
    for (var k in userConfig) if (Object.prototype.hasOwnProperty.call(userConfig, k)) cfg[k] = userConfig[k];

    var root = typeof cfg.container === 'string' ? document.querySelector(cfg.container) : cfg.container;
    if (!root) throw new Error('HattaMap: container not found');
    var kiosk = cfg.mode === 'kiosk';
    var lang = cfg.lang || root.getAttribute('data-lang') || 'en';
    if (lang !== 'ar') lang = 'en';
    var defaultLang = lang;
    var T = STRINGS[lang];
    var base = cfg.assetsBase || '';

    var data = null, pois = [], byId = {}, cats = [], catById = {};
    var W = 4117, H = 2341;

    /* ---- state ---- */
    var s = 1, tx = 0, ty = 0, fitScale = 1, maxScale = 5;
    var activeId = null, filter = null, panelMode = null, dirTab = 'featured', searchQ = '';
    var markers = {};       // id -> element
    var labelSize = {}, layoutPending = false;   // collision handling cache
    var i18nNodes = [];     // {node, key, attr}
    var idleTimer = null, hintTimer = null, attractTimer = null, anim = null, raf = null;
    var landingEl = null;

    /* ---- build chrome ---- */
    clear(root);
    root.classList.add('hm-root');
    if (kiosk) root.classList.add('hm-kiosk');
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    function t(key) { return STRINGS[lang][key] || key; }
    function tn(node, key, attr) { i18nNodes.push({ node: node, key: key, attr: attr }); if (attr) node.setAttribute(attr, t(key)); else node.textContent = t(key); return node; }
    function L(obj) { // localised field
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      var v = obj[lang];
      if (!v || v === 'TBC') v = obj.en || '';
      return v;
    }
    function Lalt(obj) { var o = lang === 'ar' ? 'en' : 'ar'; var v = obj && obj[o]; return (v && v !== 'TBC') ? v : ''; }

    // header
    var brandTile = el('img', { class: 'hm-brand-tile', src: base + 'assets/brand/hatta-logo-tile.png', alt: 'Hatta' });
    var brandTitle = tn(el('div', { class: 'hm-brand-title' }), 'title');
    var brandSub = tn(el('div', { class: 'hm-brand-sub' }), 'subtitle');
    var searchInput = tn(el('input', { type: 'search', autocomplete: 'off', spellcheck: 'false' }), 'search', 'placeholder');
    var searchBox = el('div', { class: 'hm-search' }, [searchInput, uicon('search')]);
    var headerMid = el('div', { class: 'hm-header-mid' }, kiosk ? null : searchBox);
    // Home: back to the first screen (landing / attract), map reset. Arrow flips in RTL via CSS.
    var homeBtn = tn(el('button', { class: 'hm-btn hm-ghost hm-home', type: 'button' }, [uicon('back'), tn(el('span'), 'home')]), 'home', 'aria-label');
    var dirBtn = tn(el('button', { class: 'hm-btn', type: 'button' }, [uicon('list'), tn(el('span'), 'directory')]), 'directory', 'aria-label');
    var langToggle = buildLangToggle();
    // Dubai Culture logo, top right (top left in Arabic): the trimmed logo file, so it aligns with the buttons
    var headerLogo = el('img', { class: 'hm-header-logo', src: base + 'assets/brand/dubai-culture-tight.png', alt: 'Dubai Culture' });
    var header = el('div', { class: 'hm-header' }, [
      cfg.showHome ? homeBtn : null,
      el('div', { class: 'hm-brand' }, [brandTile, el('div', { class: 'hm-brand-text' }, [brandTitle, brandSub])]),
      headerMid,
      el('div', { class: 'hm-header-end' }, [dirBtn, cfg.showLangToggle ? langToggle : null, cfg.showLogo ? headerLogo : null])
    ]);

    // map
    var baseImg = el('img', { class: 'hm-base', alt: '', draggable: 'false' });
    var markersLayer = el('div', { class: 'hm-markers' });
    var stage = el('div', { class: 'hm-stage' }, [baseImg, markersLayer]);
    var viewport = el('div', { class: 'hm-viewport', role: 'application' }, [stage]);
    tn(viewport, 'title', 'aria-label');
    var chips = el('div', { class: 'hm-chips', role: 'group' });
    var zoomBox = el('div', { class: 'hm-zoom' }, [
      tn(el('button', { type: 'button', onclick: function () { zoomBy(1.6); } }, uicon('plus')), 'zoomIn', 'aria-label'),
      tn(el('button', { type: 'button', onclick: function () { zoomBy(1 / 1.6); } }, uicon('minus')), 'zoomOut', 'aria-label'),
      tn(el('button', { type: 'button', onclick: function () { resetView(true); } }, uicon('home')), 'resetView', 'aria-label')
    ]);
    var hint = tn(el('div', { class: 'hm-hint' }), 'hint');
    var mapwrap = el('div', { class: 'hm-mapwrap' }, [viewport, chips, zoomBox, hint]);

    // panel
    var panelTitle = el('div', { class: 'hm-panel-title' });
    var panelClose = tn(el('button', { class: 'hm-close', type: 'button', onclick: function () { closePanel(); } }, uicon('close')), 'close', 'aria-label');
    var panelBody = el('div', { class: 'hm-panel-body' });
    var panel = el('aside', { class: 'hm-panel', hidden: true }, [el('div', { class: 'hm-panel-head' }, [panelTitle, panelClose]), panelBody]);

    var body = el('div', { class: 'hm-body' }, [mapwrap, panel]);

    // footer
    var aboutBtn = el('button', { class: 'hm-btn hm-ghost', type: 'button' }, [uicon('info'), tn(el('span'), 'about')]);
    var footer = el('div', { class: 'hm-footer' }, [
      el('div', { class: 'hm-footer-brand' }, [tn(el('span'), 'kicker')]),
      el('div', { class: 'hm-footer-actions' }, [aboutBtn])
    ]);

    appendAll(root, [header, body, footer]);

    homeBtn.addEventListener('click', function () { goStart(); });
    dirBtn.addEventListener('click', function () { panelMode === 'directory' ? closePanel() : openDirectory(); });
    aboutBtn.addEventListener('click', function () { panelMode === 'about' ? closePanel() : openAbout(); });
    searchInput.addEventListener('input', function () { searchQ = searchInput.value.trim(); if (panelMode !== 'directory') openDirectory(); else renderDirectory(); });
    searchInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var first = panelBody.querySelector('[data-poi]'); if (first) first.click(); } });

    function buildLangToggle() {
      var en = el('button', { type: 'button', text: 'EN', 'aria-pressed': lang === 'en' ? 'true' : 'false', onclick: function () { setLang('en'); } });
      var ar = el('button', { type: 'button', text: 'العربية', 'aria-pressed': lang === 'ar' ? 'true' : 'false', onclick: function () { setLang('ar'); } });
      var box = el('div', { class: 'hm-lang', role: 'group', 'aria-label': 'Language' }, [en, ar]);
      box._en = en; box._ar = ar; return box;
    }

    /* ---- orientation ---- */
    var mql = window.matchMedia ? window.matchMedia('(orientation: portrait)') : null;
    function applyOrientation() {
      var portrait = cfg.orientation === 'portrait' || (cfg.orientation === 'auto' && (mql ? mql.matches : root.clientHeight > root.clientWidth));
      root.classList.toggle('hm-portrait', portrait);
      root.classList.toggle('hm-landscape', !portrait);
    }
    applyOrientation();
    if (mql && cfg.orientation === 'auto') { (mql.addEventListener ? mql.addEventListener('change', applyOrientation) : mql.addListener(applyOrientation)); }

    /* ---- data ---- */
    function onData(d) {
      data = d; pois = d.pois || []; cats = d.categories || [];
      byId = {}; catById = {};
      pois.forEach(function (p, i) { byId[p.id] = p; p._idx = i; });
      cats.forEach(function (c) { catById[c.id] = c; });
      W = (d._meta && d._meta.artwork && d._meta.artwork.width) || W;
      H = (d._meta && d._meta.artwork && d._meta.artwork.height) || H;
      stage.style.width = W + 'px'; stage.style.height = H + 'px';
      var big = kiosk || (window.innerWidth * (window.devicePixelRatio || 1) > 2200);
      var img = cfg.mapImage === '4k' ? '4k' : cfg.mapImage === '2k' ? '2k' : (big ? '4k' : '2k');
      var artName = cfg.artwork === 'print' ? 'hatta-map-base-' : 'hatta-map-clean-';
      baseImg.src = base + 'assets/map/' + artName + img + '.jpg';
      buildChips(); buildMarkers();
      resetView(false);
      if (cfg.showLanding) showLanding(kiosk); else showHint();
      if (kiosk) armIdle();
    }
    if (window.HattaMapData) { onData(window.HattaMapData); }
    else {
      fetch(base + cfg.dataUrl).then(function (r) { return r.json(); }).then(onData).catch(function (err) {
        panelTitle.textContent = 'Data error'; clear(panelBody); panelBody.appendChild(el('p', { text: 'Could not load ' + cfg.dataUrl + ' (' + err + '). Serve the folder over HTTP or include data/pois.js.' })); panel.hidden = false;
      });
    }

    /* ---- chips ---- */
    function buildChips() {
      clear(chips);
      chips.appendChild(chipEl(null, t('all'), 'var(--hm-ink)'));
      cats.forEach(function (c) { chips.appendChild(chipEl(c.id, L(c.label), c.color)); });
      syncChips();
    }
    function chipEl(id, label, color) {
      var b = el('button', { class: 'hm-chip', type: 'button', 'data-cat': id || '', style: { '--c': color } }, [el('span', { class: 'hm-dot' }), el('span', { text: label })]);
      b.addEventListener('click', function () { setFilter(filter === id ? null : id); });
      return b;
    }
    function syncChips() {
      var list = chips.querySelectorAll('.hm-chip');
      for (var i = 0; i < list.length; i++) {
        var id = list[i].getAttribute('data-cat') || null;
        list[i].setAttribute('aria-pressed', (id === filter) ? 'true' : 'false');
      }
    }
    function setFilter(id) { filter = id; syncChips(); updateMarkerVisibility(); if (panelMode === 'directory') renderDirectory(); }

    /* ---- markers ---- */
    function buildMarkers() {
      clear(markersLayer); markers = {};
      pois.forEach(function (p) {
        var color = (catById[p.category] || {}).color || '#B5552B';
        var m = el('button', {
          class: 'hm-marker' + (p.featured ? ' hm-featured' : '') + (p.generic ? ' hm-nolabel' : ''),
          type: 'button', 'data-id': p.id, 'data-tier': p.tier, 'data-cat': p.category,
          style: { left: (p.x * 100) + '%', top: (p.y * 100) + '%', '--c': color }
        }, [el('span', { class: 'hm-pin' }, icon(p.icon)), el('span', { class: 'hm-label', text: L(p.name) })]);
        m.setAttribute('aria-label', L(p.name));
        m.addEventListener('click', function (e) { if (e.detail === 0) selectPOI(p.id, true); }); // keyboard only; taps handled by pointer logic
        markersLayer.appendChild(m); markers[p.id] = m;
      });
      updateMarkerVisibility();
      measureLabels();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureLabels);
    }
    function refreshMarkerLabels() {
      pois.forEach(function (p) { var m = markers[p.id]; if (!m) return; m.querySelector('.hm-label').textContent = L(p.name); m.setAttribute('aria-label', L(p.name)); });
      measureLabels();
    }

    /* ---- collision handling: keep pins apart, let labels give way to more important places ---- */
    function measureLabels() {
      pois.forEach(function (p) { var m = markers[p.id]; if (m) m.classList.remove('hm-nolabel-c'); });
      pois.forEach(function (p) {
        var m = markers[p.id]; if (!m) return;
        var l = m.querySelector('.hm-label');
        labelSize[p.id] = p.generic ? { w: 0, h: 0 } : { w: l.offsetWidth, h: l.offsetHeight };
      });
      layoutMarkers();
    }
    function rectsOverlap(a, b, pad) {
      return !(a[0] + a[2] + pad < b[0] || b[0] + b[2] + pad < a[0] || a[1] + a[3] + pad < b[1] || b[1] + b[3] + pad < a[1]);
    }
    function scheduleLayout() {
      if (layoutPending) return; layoutPending = true;
      requestAnimationFrame(function () { layoutPending = false; layoutMarkers(); });
    }
    function layoutMarkers() {
      if (!pois.length) return;
      var fs = parseFloat(getComputedStyle(root).fontSize) || 16, v = vpSize(), items = [];
      pois.forEach(function (p) {
        var m = markers[p.id]; if (!m) return;
        if (m.classList.contains('hm-hidden')) { m.classList.remove('hm-collide'); return; }
        var sx = tx + p.x * W * s, sy = ty + p.y * H * s;
        if (sx < -120 || sx > v.w + 120 || sy < -120 || sy > v.h + 160) { m.classList.remove('hm-collide', 'hm-nolabel-c'); return; }
        var D = (p.tier === 3 ? 1.85 : 2.35) * fs, pinH = D + 0.5 * fs, ls = labelSize[p.id] || { w: 0, h: 0 };
        var cy = sy - pinH + D / 2, gap = 0.3 * fs, cands = null;
        if (ls.w) cands = [
          [[sx - ls.w / 2, sy + 0.27 * fs, ls.w, ls.h], ''],                       // below the tail (default)
          [[sx - ls.w / 2, sy - pinH - gap - ls.h, ls.w, ls.h], 'hm-lab-top'],       // above the pin
          [[sx + D / 2 + gap, cy - ls.h / 2, ls.w, ls.h], 'hm-lab-right'],           // right of the pin
          [[sx - D / 2 - gap - ls.w, cy - ls.h / 2, ls.w, ls.h], 'hm-lab-left']      // left of the pin
        ];
        items.push({ p: p, m: m, cx: sx, cy: cy, r: D / 2, pin: [sx - D / 2, sy - pinH, D, pinH], label: cands });
      });
      items.sort(function (a, b) {
        if (a.p.id === activeId) return -1; if (b.p.id === activeId) return 1;
        if (a.p.tier !== b.p.tier) return a.p.tier - b.p.tier;
        if (a.p.featured !== b.p.featured) return a.p.featured ? -1 : 1;
        return a.p._idx - b.p._idx;
      });
      // pass 1 — pins: a pin is dropped if it would sit on a more important pin
      var pins = [], i, j;
      items.forEach(function (it) {
        var keep = it.p.id === activeId;
        if (!keep) {
          keep = true;
          for (i = 0; i < pins.length; i++) {
            var dx = pins[i].cx - it.cx, dy = pins[i].cy - it.cy, rr = (pins[i].r + it.r) * 1.0;
            if (dx * dx + dy * dy < rr * rr) { keep = false; break; }
          }
        }
        it.m.classList.toggle('hm-collide', !keep);
        if (keep) pins.push(it);
      });
      // pass 2 — labels: shown only where they touch no pin and no label already placed
      var rects = pins.map(function (it) { return it.pin; }), POS = ['hm-lab-top', 'hm-lab-right', 'hm-lab-left'];
      for (i = 0; i < pins.length; i++) {
        var it = pins[i], chosen = null, c, k;
        if (it.label) {
          if (it.p.id === activeId) chosen = it.label[0];
          else for (c = 0; c < it.label.length && !chosen; c++) {
            var free = true;
            for (j = 0; j < rects.length; j++) { if (rectsOverlap(it.label[c][0], rects[j], 3)) { free = false; break; } }
            if (free) chosen = it.label[c];
          }
        }
        for (k = 0; k < POS.length; k++) it.m.classList.remove(POS[k]);
        if (chosen && chosen[1]) it.m.classList.add(chosen[1]);
        it.m.classList.toggle('hm-nolabel-c', !!it.label && !chosen);
        if (chosen) rects.push(chosen[0]);
      }
    }
    function currentTier() { var zf = s / fitScale; return zf >= cfg.tier3At ? 3 : zf >= cfg.tier2At ? 2 : 1; }
    function updateMarkerVisibility() {
      var tier = currentTier();
      pois.forEach(function (p) {
        var m = markers[p.id]; if (!m) return;
        var show = filter ? (p.category === filter) : (p.tier <= tier);
        if (p.id === activeId) show = true;
        m.classList.toggle('hm-hidden', !show);
        m.classList.toggle('hm-dim', !!filter && p.category !== filter && p.id !== activeId);
      });
      scheduleLayout();
    }

    /* ---- view maths ---- */
    function vpSize() { return { w: viewport.clientWidth || 1, h: viewport.clientHeight || 1 }; }
    function fitPad() { var fs = parseFloat(getComputedStyle(root).fontSize) || 16; return { top: 4.9 * fs, side: 1 * fs, bottom: 1.2 * fs }; }
    function computeFit() { var v = vpSize(), p = fitPad(); fitScale = Math.min((v.w - 2 * p.side) / W, (v.h - p.top - p.bottom) / H); maxScale = Math.max(fitScale * cfg.maxZoomFactor, 1); }
    function clampView() {
      var v = vpSize(); var mw = W * s, mh = H * s;
      tx = mw <= v.w ? clampNum(tx, 0, v.w - mw) : clampNum(tx, v.w - mw, 0);
      ty = mh <= v.h ? clampNum(ty, 0, v.h - mh) : clampNum(ty, v.h - mh, 0);
    }
    var lastTier = 0;
    function apply() {
      stage.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + s.toFixed(5) + ')';
      markersLayer.style.setProperty('--inv', (1 / s).toFixed(5));
      var tier = currentTier(); if (tier !== lastTier) { lastTier = tier; updateMarkerVisibility(); }
      scheduleLayout();
    }
    function setView(nx, ny, ns) { s = clampNum(ns, fitScale, maxScale); tx = nx; ty = ny; clampView(); apply(); }
    function zoomAt(px, py, factor) { // px,py in viewport px
      var ns = clampNum(s * factor, fitScale, maxScale); var r = ns / s;
      setView(px - (px - tx) * r, py - (py - ty) * r, ns);
    }
    function zoomBy(factor) { var v = vpSize(); animateTo(null, null, s * factor, v.w / 2, v.h / 2, 320); }
    function worldToVp(wx, wy) { return { x: tx + wx * s, y: ty + wy * s }; }
    function resetView(animated) {
      computeFit(); var v = vpSize(), p = fitPad(); var ns = fitScale;
      var nx = p.side + ((v.w - 2 * p.side) - W * ns) / 2, ny = p.top + ((v.h - p.top - p.bottom) - H * ns) / 2;
      if (animated) animateView(nx, ny, ns, typeof animated === 'number' ? animated : 450); else { setView(nx, ny, ns); }
    }
    function animateTo(nx, ny, ns, fx, fy, dur) { // zoom about focal point (fx,fy) to scale ns
      ns = clampNum(ns, fitScale, maxScale); var r = ns / s;
      animateView(fx - (fx - tx) * r, fy - (fy - ty) * r, ns, dur);
    }
    function animateView(nx, ny, ns, dur, done) {
      cancelAnim();
      var v = vpSize(); ns = clampNum(ns, fitScale, maxScale);
      // clamp target
      var mw = W * ns, mh = H * ns;
      nx = mw <= v.w ? clampNum(nx, 0, v.w - mw) : clampNum(nx, v.w - mw, 0);
      ny = mh <= v.h ? clampNum(ny, 0, v.h - mh) : clampNum(ny, v.h - mh, 0);
      var from = { x: tx, y: ty, s: s }, start = null;
      anim = function (now) {
        if (!start) start = now;
        var p = Math.min(1, (now - start) / dur), e = easeInOut(p);
        s = from.s + (ns - from.s) * e; tx = from.x + (nx - from.x) * e; ty = from.y + (ny - from.y) * e;
        apply();
        if (p < 1) raf = requestAnimationFrame(anim); else { anim = null; if (done) done(); }
      };
      raf = requestAnimationFrame(anim);
    }
    function cancelAnim() { if (raf) cancelAnimationFrame(raf); raf = null; anim = null; }
    function flyToPOI(p) {
      var v = vpSize();
      var targetS = Math.max(s, fitScale * cfg.tier2At * 1.15);
      if (p.tier === 3) targetS = Math.max(targetS, fitScale * cfg.tier3At * 1.05);
      var wx = p.x * W, wy = p.y * H;
      var cx = v.w / 2, cy = v.h / 2 + (root.classList.contains('hm-portrait') ? 0 : 20);
      animateView(cx - wx * targetS, cy - wy * targetS, targetS, 550);
    }

    /* ---- pointer interaction ---- */
    var pointers = {}, pCount = 0, dragging = false, downTarget = null, downX = 0, downY = 0, lastX = 0, lastY = 0, lastT = 0, vx = 0, vy = 0, pinchD = 0, pinchMid = null, lastTap = 0;
    viewport.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
      cancelAnim(); userActive();
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY }; pCount = Object.keys(pointers).length;
      try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (pCount === 1) {
        downTarget = e.target.closest ? e.target.closest('.hm-marker') : null;
        downX = lastX = e.clientX; downY = lastY = e.clientY; lastT = performance.now(); vx = vy = 0; dragging = false;
      } else if (pCount === 2) {
        var ids = Object.keys(pointers), a = pointers[ids[0]], b = pointers[ids[1]];
        pinchD = Math.hypot(a.x - b.x, a.y - b.y); pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; dragging = true; downTarget = null;
      }
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var rect = viewport.getBoundingClientRect();
      if (pCount >= 2) {
        var ids = Object.keys(pointers), a = pointers[ids[0]], b = pointers[ids[1]];
        var d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (pinchD > 0) {
          var f = d / pinchD;
          // pan by midpoint delta, then zoom about midpoint
          tx += mid.x - pinchMid.x; ty += mid.y - pinchMid.y;
          zoomAt(mid.x - rect.left, mid.y - rect.top, f);
        }
        pinchD = d; pinchMid = mid;
        return;
      }
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (!dragging && Math.hypot(e.clientX - downX, e.clientY - downY) > 6) { dragging = true; viewport.classList.add('hm-dragging'); }
      if (dragging) {
        var now = performance.now(), dt = Math.max(1, now - lastT);
        vx = 0.7 * vx + 0.3 * (dx / dt); vy = 0.7 * vy + 0.3 * (dy / dt); lastT = now;
        tx += dx; ty += dy; clampView(); apply();
      }
      lastX = e.clientX; lastY = e.clientY;
    });
    function endPointer(e) {
      if (!pointers[e.pointerId]) return;
      delete pointers[e.pointerId]; pCount = Object.keys(pointers).length;
      try { viewport.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (pCount === 1) { var id = Object.keys(pointers)[0]; lastX = pointers[id].x; lastY = pointers[id].y; pinchD = 0; return; }
      if (pCount > 0) return;
      viewport.classList.remove('hm-dragging');
      if (!dragging) {
        var now = performance.now();
        if (downTarget) { selectPOI(downTarget.getAttribute('data-id'), true); lastTap = 0; }
        else if (now - lastTap < 320) { var rect = viewport.getBoundingClientRect(); animateTo(null, null, s * 1.8, e.clientX - rect.left, e.clientY - rect.top, 320); lastTap = 0; }
        else { lastTap = now; }
      } else if (e.type === 'pointerup' && (Math.abs(vx) > 0.25 || Math.abs(vy) > 0.25)) {
        momentum();
      }
      dragging = false; downTarget = null;
    }
    viewport.addEventListener('pointerup', endPointer);
    viewport.addEventListener('pointercancel', endPointer);
    viewport.addEventListener('lostpointercapture', function (e) { if (pointers[e.pointerId]) endPointer(e); });
    function momentum() {
      cancelAnim(); var last = performance.now();
      anim = function (now) {
        var dt = Math.min(40, now - last); last = now;
        tx += vx * dt; ty += vy * dt; vx *= Math.pow(0.94, dt / 16); vy *= Math.pow(0.94, dt / 16);
        clampView(); apply();
        if (Math.abs(vx) > 0.02 || Math.abs(vy) > 0.02) raf = requestAnimationFrame(anim); else anim = null;
      };
      raf = requestAnimationFrame(anim);
    }
    viewport.addEventListener('wheel', function (e) {
      e.preventDefault(); userActive(); cancelAnim();
      var rect = viewport.getBoundingClientRect();
      var f = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016) * (e.ctrlKey ? 2.2 : 1));
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, f);
    }, { passive: false });
    viewport.addEventListener('dblclick', function (e) { e.preventDefault(); });
    viewport.addEventListener('contextmenu', function (e) { if (kiosk) e.preventDefault(); });
    root.addEventListener('keydown', function (e) {
      var step = 80;
      if (e.key === 'Escape') { if (landingEl) { hideLanding(); } else closePanel(); }
      else if (e.target === viewport || e.target.classList.contains('hm-marker')) {
        if (e.key === 'ArrowLeft') { tx += step; } else if (e.key === 'ArrowRight') { tx -= step; }
        else if (e.key === 'ArrowUp') { ty += step; } else if (e.key === 'ArrowDown') { ty -= step; }
        else if (e.key === '+' || e.key === '=') { zoomBy(1.4); return; } else if (e.key === '-') { zoomBy(1 / 1.4); return; } else return;
        e.preventDefault(); clampView(); apply();
      }
    });
    viewport.setAttribute('tabindex', '0');

    // resize: keep the world point at the viewport centre stable
    var ro = window.ResizeObserver ? new ResizeObserver(function () { onResize(); }) : null;
    if (ro) ro.observe(viewport); else window.addEventListener('resize', onResize);
    var lastVp = vpSize();
    function onResize() {
      var v = vpSize(); if (v.w === lastVp.w && v.h === lastVp.h) return;
      var cx = (lastVp.w / 2 - tx) / s, cy = (lastVp.h / 2 - ty) / s; // world centre
      var wasFit = Math.abs(s - fitScale) < 1e-6;
      computeFit(); applyOrientation();
      lastVp = v;
      if (wasFit || s < fitScale) { resetView(false); return; }
      tx = v.w / 2 - cx * s; ty = v.h / 2 - cy * s; clampView(); apply();
    }

    /* ---- selection / panel ---- */
    function selectPOI(id, fly) {
      var p = byId[id]; if (!p) return;
      if (activeId && markers[activeId]) markers[activeId].classList.remove('hm-active');
      activeId = id; if (markers[id]) markers[id].classList.add('hm-active');
      updateMarkerVisibility();
      openPanel('poi'); renderPOI(p);
      if (fly) requestAnimationFrame(function () { flyToPOI(p); });
    }
    function openPanel(mode) { panelMode = mode; panel.hidden = false; panel.classList.toggle('hm-tall', mode === 'directory'); panelBody.scrollTop = 0; requestAnimationFrame(onResize); }
    function closePanel() {
      panel.hidden = true; panelMode = null;
      if (activeId && markers[activeId]) markers[activeId].classList.remove('hm-active');
      activeId = null; updateMarkerVisibility(); requestAnimationFrame(onResize);
    }
    function openDirectory() { openPanel('directory'); renderDirectory(); }
    function openAbout() { openPanel('about'); renderAbout(); }

    function renderPOI(p) {
      var cat = catById[p.category] || {}; var color = cat.color || '#B5552B';
      panelTitle.textContent = L(cat.label) || '';
      clear(panelBody);
      var hero;
      if (p.image) hero = el('div', { class: 'hm-hero' }, el('img', { src: base + p.image, alt: L(p.name) }));
      else hero = el('div', { class: 'hm-hero hm-hero-icon', style: { '--c': color } }, icon(p.icon));
      var badges = el('div', { class: 'hm-badges' }, [
        el('span', { class: 'hm-badge', style: { '--c': color } }, [el('span', { class: 'hm-dot' }), el('span', { text: L((data.iconLabels || {})[p.icon]) || L(cat.label) })]),
        p.featured ? el('span', { class: 'hm-badge hm-badge-featured', text: '★ ' + t('featuredBadge') }) : null
      ]);
      var desc = L(p.description);
      var body = [
        badges,
        el('h2', { class: 'hm-poi-name', text: L(p.name) }),
        Lalt(p.name) ? el('div', { class: 'hm-poi-name-alt', text: Lalt(p.name) }) : null,
        el('div', { class: 'hm-rule' }),
        el('p', { class: 'hm-desc', text: desc || (p.generic ? t('generic') : t('noDesc')) }),
        el('p', { class: 'hm-note', text: t('moreInfo') })
      ];
      var actions = el('div', { class: 'hm-actions' });
      actions.appendChild(el('button', { class: 'hm-btn', type: 'button', onclick: function () { flyToPOI(p); } }, [uicon('pin'), el('span', { text: t('showOnMap') })]));
      var g = safeUrl(p.navigation && p.navigation.googleMaps);
      if (g) {
        if (kiosk) {
          body.push(actions);
          if (p.navigation.qr) body.push(el('div', { class: 'hm-qr' }, [
            el('img', { src: base + p.navigation.qr, alt: 'QR code' }),
            el('div', { class: 'hm-qr-text' }, [el('strong', { text: t('scan') }), el('span', { text: t('scanSub') })])
          ]));
        } else {
          var sheet = el('div', { class: 'hm-navsheet', hidden: true });
          var q = encodeURIComponent((p.navigation.mapsQuery || L(p.name)) + ' Hatta Dubai');
          [['google', g], ['waze', 'https://waze.com/ul?q=' + q + '&navigate=yes'], ['apple', 'https://maps.apple.com/?q=' + q]].forEach(function (pair) {
            sheet.appendChild(el('a', { href: pair[1], target: '_blank', rel: 'noopener noreferrer' }, [el('span', { text: t(pair[0]) }), uicon('ext')]));
          });
          actions.appendChild(el('button', { class: 'hm-btn hm-primary', type: 'button', onclick: function () { sheet.hidden = !sheet.hidden; } }, [uicon('nav'), el('span', { text: t('directions') })]));
          body.push(actions, sheet);
        }
      } else body.push(actions);
      if (desc) body.push(el('p', { class: 'hm-note', text: t('sourceNote') }));
      var main = el('div', { class: 'hm-poi-main' }, body);
      panelBody.appendChild(el('div', { class: 'hm-poi' }, [hero, main]));
    }

    function renderDirectory() {
      panelTitle.textContent = t('directory');
      clear(panelBody);
      var tabs = el('div', { class: 'hm-dir-tabs' });
      var tabList = [['featured', t('featured')], ['all', t('allPlaces')]].concat(cats.map(function (c) { return [c.id, L(c.label)]; }));
      tabList.forEach(function (tb) {
        var b = el('button', { class: 'hm-dir-tab', type: 'button', text: tb[1], 'aria-pressed': dirTab === tb[0] ? 'true' : 'false' });
        b.addEventListener('click', function () { dirTab = tb[0]; renderDirectory(); });
        tabs.appendChild(b);
      });
      panelBody.appendChild(tabs);
      var q = searchQ.toLowerCase();
      function matches(p) { if (!q) return true; return (p.name.en || '').toLowerCase().indexOf(q) >= 0 || (p.name.ar || '').indexOf(searchQ) >= 0; }
      var list;
      if (dirTab === 'featured') list = pois.filter(function (p) { return p.featured && matches(p); });
      else if (dirTab === 'all') list = pois.filter(function (p) { return !p.generic && matches(p); });
      else list = pois.filter(function (p) { return p.category === dirTab && matches(p); });
      if (q && dirTab !== 'all') { list = pois.filter(function (p) { return !p.generic && matches(p); }); }
      if (!list.length) { panelBody.appendChild(el('div', { class: 'hm-empty', text: t('noResults') })); return; }
      if (dirTab === 'featured' && !q) {
        var grid = el('div', { class: 'hm-cards' });
        list.forEach(function (p) {
          var c = el('button', { class: 'hm-card', type: 'button', 'data-poi': p.id }, [el('img', { src: base + p.image, alt: '' }), el('span', { text: L(p.name) })]);
          c.addEventListener('click', function () { selectPOI(p.id, true); });
          grid.appendChild(c);
        });
        panelBody.appendChild(grid);
        return;
      }
      list.sort(function (a, b) { return (b.featured - a.featured) || (a.tier - b.tier) || L(a.name).localeCompare(L(b.name)); });
      var rows = el('div', { class: 'hm-rows' });
      list.forEach(function (p) {
        var cat = catById[p.category] || {};
        var r = el('button', { class: 'hm-row', type: 'button', 'data-poi': p.id, style: { '--c': cat.color || '#B5552B' } }, [
          el('span', { class: 'hm-row-pin' }, icon(p.icon)),
          el('span', { class: 'hm-row-text' }, [el('div', { class: 'hm-row-name', text: L(p.name) }), el('div', { class: 'hm-row-sub', text: (p.featured ? '★ ' : '') + (L((data.iconLabels || {})[p.icon]) || L(cat.label)) })]),
          uicon('chev')
        ]);
        r.addEventListener('click', function () { selectPOI(p.id, true); });
        rows.appendChild(r);
      });
      panelBody.appendChild(rows);
    }

    function renderAbout() {
      panelTitle.textContent = t('about');
      clear(panelBody);
      var a = data.about || {};
      var wrap = el('div', { class: 'hm-about hm-poi' }, [
        el('div', { class: 'hm-hero' }, el('img', { src: base + 'assets/images/hatta-dam.jpg', alt: '' })),
        el('div', { class: 'hm-poi-main' }, [
        el('h2', { class: 'hm-poi-name', text: L(a.title) }),
        el('div', { class: 'hm-poi-name-alt', text: L(a.subtitle) }),
        el('div', { class: 'hm-rule' }),
        el('p', { text: L(a.intro) }),
        el('div', { class: 'hm-section', text: t('directionsTitle') }),
        el('p', { text: L(a.directions) }),
        el('div', { class: 'hm-section', text: t('busTitle') }),
        el('div', { class: 'hm-kv' }, (a.busRoutes || []).map(function (r) { return el('div', null, [el('b', { text: r.code }), el('span', { text: ' ' + L(r) })]); })),
        el('p', { class: 'hm-note', text: t('sourceNote') })
        ])
      ]);
      panelBody.appendChild(wrap);
    }

    /* ---- language ---- */
    function setLang(l) {
      if (l !== 'ar') l = 'en';
      lang = l; T = STRINGS[lang];
      root.setAttribute('lang', lang); root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      i18nNodes.forEach(function (n) { if (n.attr) n.node.setAttribute(n.attr, t(n.key)); else n.node.textContent = t(n.key); });
      [langToggle].concat(landingEl ? [landingEl._lang] : []).forEach(function (tg) { if (!tg) return; tg._en.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false'); tg._ar.setAttribute('aria-pressed', lang === 'ar' ? 'true' : 'false'); });
      if (data) { buildChips(); refreshMarkerLabels(); }
      if (panelMode === 'poi' && activeId) renderPOI(byId[activeId]);
      else if (panelMode === 'directory') renderDirectory();
      else if (panelMode === 'about') renderAbout();
      if (landingEl) renderLandingText();
    }

    /* ---- landing / attract ---- */
    function showLanding(attract) {
      hideLanding(true);
      var landing = el('div', { class: 'hm-landing' + (attract ? ' hm-attract hm-animate' : '') });
      landing.appendChild(el('img', { class: 'hm-landing-bg', src: base + 'assets/map/' + (cfg.artwork === 'print' ? 'hatta-map-base-2k.jpg' : 'hatta-map-clean-2k.jpg'), alt: '' }));
      landing.appendChild(el('div', { class: 'hm-landing-top' }, [el('img', { src: base + 'assets/brand/hatta-logo-tile.png', alt: 'Hatta' }), el('img', { src: base + 'assets/brand/dubai-culture-white.png', alt: 'Dubai Culture' })]));
      var kicker = el('div', { class: 'hm-landing-kicker' }), title = el('h1', { class: 'hm-landing-title' }), intro = el('p', { class: 'hm-landing-intro' });
      var cards = el('div', { class: 'hm-landing-cards' });
      var featured = pois.filter(function (p) { return p.featured && p.image; });
      featured.forEach(function (p) { cards.appendChild(el('div', { class: 'hm-landing-card', 'data-id': p.id }, [el('img', { src: base + p.image, alt: '' }), el('span', { text: L(p.name) })])); });
      var lt = buildLangToggle();
      var openBtn = el('button', { class: 'hm-btn hm-primary', type: 'button', onclick: function (e) { e.stopPropagation(); hideLanding(); } }, [uicon('pin'), el('span')]);
      var browseBtn = el('button', { class: 'hm-btn', type: 'button', onclick: function (e) { e.stopPropagation(); hideLanding(); openDirectory(); } }, [uicon('list'), el('span')]);
      var touch = el('div', { class: 'hm-landing-touch' }, [el('span', { class: 'hm-ring' }), el('span')]);
      var actions = el('div', { class: 'hm-landing-actions' }, attract ? [lt, touch] : [lt, openBtn, browseBtn]);
      landing.appendChild(el('div', { class: 'hm-landing-main' }, [kicker, title, intro, cards, actions]));
      var credit = el('span');
      landing.appendChild(el('div', { class: 'hm-landing-foot' }, [credit, el('span', { text: 'Wild Camel HyperMedia · prototype' })]));
      landing._els = { kicker: kicker, title: title, intro: intro, open: openBtn.lastChild, browse: browseBtn.lastChild, touch: touch.lastChild, credit: credit, cards: cards };
      landing._lang = lt;
      lt._en.addEventListener('click', function (e) { e.stopPropagation(); });
      lt._ar.addEventListener('click', function (e) { e.stopPropagation(); });
      if (attract) landing.addEventListener('pointerup', function (e) { if (e.target.closest && e.target.closest('.hm-lang')) return; hideLanding(); });
      root.appendChild(landing); landingEl = landing; renderLandingText();
      if (attract) { var i = 0; attractTimer = setInterval(function () { i = (i + 1) % Math.max(1, featured.length); var cs = cards.children; for (var k = 0; k < cs.length; k++) cs[k].classList.toggle('hm-lead', k === i); var lead = cs[i]; if (lead) cards.scrollTo({ left: lead.offsetLeft - cards.offsetLeft - 8, behavior: 'smooth' }); }, 3200); if (cards.children[0]) cards.children[0].classList.add('hm-lead'); }
    }
    function renderLandingText() {
      if (!landingEl) return; var e = landingEl._els;
      e.kicker.textContent = t('kicker'); e.title.textContent = L(data.about && data.about.title) || t('title');
      e.intro.textContent = L(data.about && data.about.intro); e.open.textContent = t('openMap'); e.browse.textContent = t('browse'); e.touch.textContent = t('touch');
      e.credit.textContent = t('sourceNote');
      var cs = e.cards.children; for (var k = 0; k < cs.length; k++) { var p = byId[cs[k].getAttribute('data-id')]; if (p) cs[k].lastChild.textContent = L(p.name); }
    }
    function hideLanding(immediate) {
      if (attractTimer) { clearInterval(attractTimer); attractTimer = null; }
      if (!landingEl) return;
      var n = landingEl; landingEl = null;
      if (immediate) { if (n.parentNode) n.parentNode.removeChild(n); return; }
      n.classList.add('hm-out'); setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 480);
      showHint(); if (kiosk) armIdle();
    }
    function showHint() { hint.classList.remove('hm-fade'); clearTimeout(hintTimer); hintTimer = setTimeout(function () { hint.classList.add('hm-fade'); }, 4500); }

    /* ---- kiosk cursor: shown while a mouse moves, hidden after a few seconds of stillness ---- */
    var cursorTimer = null;
    function hideCursorSoon() {
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(function () { root.classList.add('hm-hide-cursor'); }, (cfg.cursorHideSeconds || 3) * 1000);
    }
    if (kiosk && cfg.hideCursor) {
      root.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;   // touch/pen: nothing to show
        root.classList.remove('hm-hide-cursor'); hideCursorSoon();
      }, { passive: true });
      hideCursorSoon();
    }

    /* ---- kiosk idle ---- */
    function armIdle() {
      if (!kiosk) return; clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { goHome(); showLanding(true); }, Math.max(15, cfg.idleSeconds) * 1000);
    }
    function userActive() { if (kiosk && !landingEl) armIdle(); }
    ['pointerdown', 'keydown', 'wheel'].forEach(function (ev) { root.addEventListener(ev, userActive, { passive: true }); });
    // idle reset (kiosk): everything back to defaults, including the language
    function goHome(animated) { closePanel(); setFilter(null); searchQ = ''; if (searchInput) searchInput.value = ''; dirTab = 'featured'; if (lang !== defaultLang) setLang(defaultLang); resetView(animated || false); }
    // Home button: back to the first screen, map reset, language kept
    function goStart() {
      closePanel(); setFilter(null); searchQ = ''; if (searchInput) searchInput.value = ''; dirTab = 'featured'; resetView(false);
      if (cfg.showLanding) showLanding(kiosk); else showHint();
    }

    /* ---- public API ---- */
    var api = {
      setLang: setLang, select: function (id) { selectPOI(id, true); }, openDirectory: openDirectory, openAbout: openAbout,
      close: closePanel, reset: function (animated) { goHome(animated); }, home: goStart, showLanding: function () { showLanding(kiosk); }, filter: setFilter,
      getState: function () { return { lang: lang, scale: s, activeId: activeId, filter: filter, panel: panelMode }; }
    };
    root._hattaMap = api;
    return api;
  };
})();
