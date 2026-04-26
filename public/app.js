/* ─── Tsohar.ai — app.js ─────────────────────────────────────────
   Hero screens per mode + streaming chat + Firebase history
──────────────────────────────────────────────────────────────── */

const DOM = {
  messages:     document.getElementById('messagesContainer'),
  input:        document.getElementById('userInput'),
  btnSend:      document.getElementById('btnSend'),
  btnNew:       document.getElementById('btnNewChat'),
  btnToggle:    document.getElementById('btnSidebarToggle'),
  sidebar:      document.getElementById('sidebar'),
  overlay:      document.getElementById('sidebarOverlay'),
  inputWrapper: document.getElementById('inputWrapper'),
  historyList:  document.getElementById('historyList'),
  historyEmpty: document.getElementById('historyEmpty'),
  modeLabel:    document.getElementById('headerModeLabel'),
};

let conversationHistory = [];
let currentConvId       = null;
let isStreaming          = false;
let currentMode         = 'normal';

/* ─── Mode metadata ──────────────────────────────────────────── */
const MODES = {
  normal: {
    name: 'Normal',
    heb:  'כְּלָלִי',
    title: 'La Torah en toute <em>profondeur</em>',
    sub:   'Michna, Talmud, Rishonim, Aharonim, Halakha, Kabbale — toutes les sources à portée de question.',
    chips: [
      { label: 'Chéma Israël',  fill: 'Explique-moi le Chéma Israël : ses 3 paragraphes, leur source, leurs lois selon le Shulchan Aruch (OH 61–88) et son sens mystique selon le Zohar.' },
      { label: 'Téchouva',      fill: 'Développe en profondeur le concept de Téchouva : les 4 étapes selon le Rambam (Hilkhot Téchouva 2:2), Yoma 86b, et la dimension mystique selon le Tanya et le Mesillat Yesharim.' },
      { label: 'Berechit',      fill: 'Développe le récit de la Création (Berechit 1-2) : sens du mot Berechit selon Rachi, les 6 jours selon le Ramban, Tselem Elohim et la vision kabbalistique du Zohar (Berechit 15b).' },
      { label: 'Pirké Avot',    fill: 'Développe le traité Pirké Avot : maximes de Hillel, Rabbi Akiva, Ben Zoma (Avot 1:1–2), Rambam (Shemoné Perakim) et Maharal (Derekh Hayyim).' },
    ],
    sources: [
      { fr: 'Berakhot',  heb: 'בְּרָכוֹת' },
      { fr: 'Rambam',    heb: 'רַמְבַּ"ם' },
      { fr: 'Rachi',     heb: 'רַשִׁ"י' },
      { fr: 'Zohar',     heb: 'זֹהַר' },
      { fr: 'Tanya',     heb: 'תַּנְיָא' },
      { fr: 'Michna',    heb: 'מִשְׁנָה' },
      { fr: 'Tosfot',    heb: 'תּוֹסָפוֹת' },
      { fr: 'Midrash',   heb: 'מִדְרָשׁ' },
      { fr: 'Ramban',    heb: 'רַמְבַּ"ן' },
      { fr: 'Guemara',   heb: 'גְּמָרָא' },
    ],
    video: false,
  },
  halakha: {
    name: 'Halakha',
    heb:  'הֲלָכָה',
    title: 'La décision <em>halakhique</em> en un instant',
    sub:   'Shulchan Aruch, Mishna Berura, Igrot Moshe — halacha lemaasseh, pratique et précise.',
    chips: [
      { label: 'Chabbat — Melakhot',  fill: 'Quelles sont les 39 Melakhot interdites le Chabbat ? Donne la liste selon la Michna (Shabbat 7:2) et explique 5 Melakhot en détail avec leurs sous-catégories (toladot) selon le Shulchan Aruch (OH 302–340).' },
      { label: 'Cacherout pratique',  fill: 'Quelle est la halacha pratique en cas de mélange viande-lait accidentel dans une casserole ? Sources : Shulchan Aruch YD 91-98, Rema, Mishna Berura, Rav Ovadia Yossef.' },
      { label: 'Prière — Amida',      fill: 'Quelles sont les lois halakhiques de la récitation de l\'Amida : posture, direction, vêtements, temps minimum, erreurs et leurs corrections ? Sources : SA OH 94–105, Mishna Berura.' },
      { label: 'Kippa — obligation',  fill: 'Quelle est la halacha pratique concernant le port de la kippa ? Sources : Shulchan Aruch OH 2:6, Mishna Berura, avis du Rav Ovadia Yossef et du Rav Moshe Feinstein.' },
    ],
    sources: [
      { fr: 'OH 1–697',          heb: 'אוֹרַח חַיִּים' },
      { fr: 'YD 1–403',          heb: 'יוֹרֶה דֵּעָה' },
      { fr: 'Mishna Berura',     heb: 'מִשְׁנָה בְּרוּרָה' },
      { fr: 'Rema',              heb: 'רמ"א' },
      { fr: 'Igrot Moshe',       heb: 'אִגְּרוֹת מֹשֶׁה' },
      { fr: 'Yabia Omer',        heb: 'יַבִּיעַ עֹמֶר' },
      { fr: 'Shulchan Aruch',    heb: 'שֻׁלְחָן עָרוּךְ' },
      { fr: 'Arukh HaShulhan',   heb: 'עָרוּךְ הַשֻׁלְחָן' },
      { fr: 'Taz',               heb: 'ט"ז' },
      { fr: 'Ben Ish Hai',       heb: 'בֶּן אִישׁ חַי' },
    ],
    video: false,
  },
  etude: {
    name: 'Étude',
    heb:  'עִיּוּן',
    title: 'Plongez dans <em>l\'océan du Talmud</em>',
    sub:   'Kushya, teirutz, svara — analyse rigoureuse comme dans le Beit Midrash, de la mishna à la maskana.',
    chips: [
      { label: 'Bava Metzia 2a',   fill: 'Analyse en profondeur la première Michna de Bava Metzia (שניים אוחזין) : les positions des Rishonim, la svara sous-jacente, la chakira de la Guemara et la conclusion du Rambam (Hilkhot Gézélah 15:1).' },
      { label: 'Kiddushin 2a',     fill: 'Analyse la Michna d\'ouverture de Kiddushin : pourquoi האיש מקדש et non האשה, la kushya des Tosfot, les 3 modes de kiddushin et leurs sources dans la Guemara (2b–3a).' },
      { label: 'Sanhedrin 37a',    fill: 'Développe la sugya de Sanhedrin 37a (כל המאבד נפש אחת) : contexte, hava amina, teirutz, la version complète et tronquée du texte, et les Rishonim sur le sens de אחד מן העולם.' },
      { label: 'Berakhot 34b',     fill: 'Analyse la sugya de Berakhot 34b sur les baalé téchouva : la tension avec d\'autres sources, la résolution des Tosfot, et l\'approche du Maharal dans Netiv HaTéchouva.' },
    ],
    sources: [
      { fr: 'Berakhot',   heb: 'בְּרָכוֹת' },
      { fr: 'Bava Metzia',heb: 'בָּבָא מְצִיעָא' },
      { fr: 'Sanhedrin',  heb: 'סַנְהֶדְרִין' },
      { fr: 'Rachi',      heb: 'רַשִׁ"י' },
      { fr: 'Tosfot',     heb: 'תּוֹסָפוֹת' },
      { fr: 'Ramban',     heb: 'רַמְבַּ"ן' },
      { fr: 'Rashba',     heb: 'רַשְׁבָּ"א' },
      { fr: 'Ritva',      heb: 'רִיטְבָ"א' },
      { fr: 'Hava Amina', heb: 'הָוָה אָמִינָא' },
      { fr: 'Maskana',    heb: 'מַסְקָנָא' },
    ],
    video: false,
  },
  mousssar: {
    name: 'Mousssar',
    heb:  'מוּסָר',
    title: 'Transformez votre âme, <em>une midah à la fois</em>',
    sub:   'Mesillat Yesharim, Hovot HaLevavot, Nefesh HaHayyim — l\'avodah intérieure au quotidien.',
    chips: [
      { label: 'Zehirout (Vigilance)',  fill: 'Explique-moi le chapitre 1 du Mesillat Yesharim sur la Zehirout (vigilance) de Ramhal : définition, obstacles, méthodes de travail, et application concrète dans la vie quotidienne.' },
      { label: 'Humilité — Anavah',     fill: 'Développe le concept d\'Anavah (humilité) dans les textes de Mousssar : le Rambam (Hilkhot Deot 2:3), le Mesillat Yesharim, et la vision du Ramhal sur la différence entre anava et shfélout.' },
      { label: 'Lashon Hara',           fill: 'Explique les lois et la dimension spirituelle du Lashon Hara (médisance) selon le Hafets Hayyim (Hilkhot Lashon Hara), le Rambam, et les sources talmudiques (Arakhin 15b).' },
      { label: 'Bitahon — Confiance',   fill: 'Développe le concept de Bitahon (confiance en Dieu) selon Rabbenu Bahya (Hovot HaLevavot, Shaar HaBitahon), le Hazon Ish et la différence avec Emounah.' },
    ],
    sources: [
      { fr: 'Mesillat Yesharim',  heb: 'מְסִלַּת יְשָׁרִים' },
      { fr: 'Hovot HaLevavot',    heb: 'חוֹבוֹת הַלְּבָבוֹת' },
      { fr: 'Nefesh HaHayyim',    heb: 'נֶפֶשׁ הַחַיִּים' },
      { fr: 'Tanya',              heb: 'תַּנְיָא' },
      { fr: 'Or HaHayyim',        heb: 'אוֹר הַחַיִּים' },
      { fr: 'Pirké Avot',         heb: 'פִּרְקֵי אָבוֹת' },
      { fr: 'Shaaré Téchouva',    heb: 'שַׁעֲרֵי תְּשׁוּבָה' },
      { fr: 'Orah Meisharim',     heb: 'אֹרַח מֵישָׁרִים' },
      { fr: 'Ben Ish Hai',        heb: 'בֶּן אִישׁ חַי' },
      { fr: 'Orḥot Tsadikim',    heb: 'אֹרְחוֹת צַדִּיקִים' },
    ],
    video: false,
  },
  medecine: {
    name: 'Médecine',
    heb:  'רְפוּאָה',
    title: 'L\'éthique médicale juive, <em>rigoureuse et bienveillante</em>',
    sub:   'Pikouach Nefech, Tzitz Eliezer, Nishmat Avraham — la Torah face aux défis de la médecine moderne.',
    chips: [
      { label: 'Pikouach Nefech',       fill: 'Quels sont les principes halakhiques du Pikouach Nefech (sauvetage de vie) en médecine juive ? Sources : Yoma 85b, Rambam Hilkhot Rotseah 1:14, Tzitz Eliezer, Nishmat Avraham.' },
      { label: 'Transplantation',       fill: 'Quelle est la position halakhique sur les transplantations d\'organes ? Analyse les avis du Tzitz Eliezer, du Rav Shlomo Zalman Auerbach, de l\'Igrot Moshe et du Rav Ovadia Yossef sur la définition de la mort et le prélèvement d\'organes.' },
      { label: 'Fin de vie',            fill: 'Quelle est la halacha concernant les soins palliatifs et la fin de vie ? Sources : Shulchan Aruch YD 336, Tzitz Eliezer (Ramat Rachel), Nishmat Avraham, loi israélienne sur le patient mourant.' },
      { label: 'Santé — Hilkhot Deot',  fill: 'Explique les obligations halakhiques de prendre soin de sa santé selon le Rambam (Hilkhot Deot 4:1–23) : alimentation, sommeil, exercice, et comment ces lois s\'appliquent aujourd\'hui.' },
    ],
    sources: [
      { fr: 'Tzitz Eliezer',       heb: 'צִיץ אֱלִיעֶזֶר' },
      { fr: 'Nishmat Avraham',     heb: 'נִשְׁמַת אַבְרָהָם' },
      { fr: 'Igrot Moshe YD',      heb: 'אִגְּרוֹת מֹשֶׁה' },
      { fr: 'Hilkhot Deot',        heb: 'הִלְכוֹת דֵּעוֹת' },
      { fr: 'Pikouach Nefech',     heb: 'פִּקּוּחַ נֶפֶשׁ' },
      { fr: 'Rav Auerbach',        heb: 'רַב אוֹיֶרבַּך' },
      { fr: 'Yoma 85b',            heb: 'יוֹמָא פה ב׳' },
      { fr: 'Torah u\'Refouah',    heb: 'תּוֹרָה וּרְפוּאָה' },
      { fr: 'Gosse',               heb: 'גּוֹסֵס' },
      { fr: 'Hilkhot Rotseah',     heb: 'הִלְכוֹת רוֹצֵחַ' },
    ],
    video: 'https://ik.imagekit.io/lrigu76hy/tailark/dna-video.mp4?updatedAt=1745736251477',
  },
};

/* ─── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderHero('normal');
  bindEvents();
  loadHistory();
});

/* ─── Animated background particles ─────────────────────────── */
const PTCL_CHARS = [
  'א','ב','ג','ד','ה','ו','ז','ח','ט','י',
  'כ','ל','מ','נ','ע','פ','צ','ק','ר','ש','ת',
  'אוֹר','אֱמֶת','תּוֹרָה','שָׁלוֹם','חָכְמָה',
];

const MODE_ACCENT = {
  normal:   '#C9A84C',
  halakha:  '#5B7EC9',
  etude:    '#E0973A',
  mousssar: '#C06080',
  medecine: '#35B890',
};

function createAnimatedBg(bgEl, mode) {
  const color  = MODE_ACCENT[mode] || '#C9A84C';
  const frag   = document.createDocumentFragment();
  const rnd    = (min, max) => min + Math.random() * (max - min);

  // Floating Hebrew letters / short words
  const letterCount = mode === 'medecine' ? 10 : 18; // fewer for video mode
  for (let i = 0; i < letterCount; i++) {
    const el   = document.createElement('span');
    el.className = 'hero-particle';
    el.textContent = PTCL_CHARS[Math.floor(Math.random() * PTCL_CHARS.length)];
    const size    = rnd(10, 28);
    const dur     = rnd(9, 18);
    const delay   = -rnd(0, dur);   // start at random phase immediately
    const opacity = rnd(0.05, 0.14);
    el.style.cssText = [
      `left:${rnd(2,95)}%`,
      `top:${rnd(5,88)}%`,
      `font-size:${size.toFixed(1)}px`,
      `color:${color}`,
      `--po:${opacity.toFixed(3)}`,
      `animation-duration:${dur.toFixed(1)}s`,
      `animation-delay:${delay.toFixed(1)}s`,
    ].join(';');
    frag.appendChild(el);
  }

  // Glowing orbs
  const dotCount = mode === 'medecine' ? 8 : 15;
  for (let i = 0; i < dotCount; i++) {
    const el      = document.createElement('span');
    el.className  = 'hero-dot';
    const size    = rnd(3, 7);
    const dur     = rnd(3, 7);
    const delay   = -rnd(0, dur);
    const opacity = rnd(0.18, 0.45);
    el.style.cssText = [
      `left:${rnd(2,96)}%`,
      `top:${rnd(2,94)}%`,
      `width:${size.toFixed(1)}px`,
      `height:${size.toFixed(1)}px`,
      `background:${color}`,
      `box-shadow:0 0 ${(size*2.4).toFixed(0)}px ${color}`,
      `--po:${opacity.toFixed(2)}`,
      `animation-duration:${dur.toFixed(1)}s`,
      `animation-delay:${delay.toFixed(1)}s`,
    ].join(';');
    frag.appendChild(el);
  }

  bgEl.appendChild(frag);
}

/* ─── Hero renderer ──────────────────────────────────────────── */
function renderHero(mode) {
  const m = MODES[mode] || MODES.normal;

  // Build source pills (doubled for seamless infinite loop)
  const pillsHtml = [...m.sources, ...m.sources].map(s => `
    <span class="source-pill">
      <span class="source-pill-heb" lang="he" dir="rtl">${s.heb}</span>
      ${s.fr}
    </span>`).join('');

  // Build chips
  const chipsHtml = m.chips.map(c => `
    <button class="suggestion-chip" role="listitem" data-fill="${escHtmlAttr(c.fill)}">${escHtml(c.label)}</button>`
  ).join('');

  // Video bg for médecine
  const videoBg = m.video
    ? `<video autoplay loop muted playsinline aria-hidden="true" src="${m.video}"></video>`
    : '';

  DOM.messages.innerHTML = `
    <div class="hero-screen" data-mode="${mode}" id="welcomeScreen">
      <div class="hero-bg" id="heroBg">
        <div class="hero-bg-glow"></div>
        <div class="hero-bg-glow-2"></div>
        ${videoBg}
      </div>

      <div class="hero-body">
        <div class="hero-logo-wrap">
          <div class="hero-ring hero-ring-2"></div>
          <div class="hero-ring hero-ring-1"></div>
          <img src="logo.png" alt="Tsohar.ai" class="hero-logo-img" />
        </div>

        <div class="hero-eyebrow" aria-label="Mode actif : ${m.name}">
          <span class="hero-eyebrow-heb" lang="he" dir="rtl">${m.heb}</span>
          <span class="hero-eyebrow-sep">·</span>
          <span>Mode ${m.name}</span>
        </div>

        <h1 class="hero-title">${m.title}</h1>
        <p class="hero-sub">${m.sub}</p>

        <div class="hero-ornament" aria-hidden="true">
          <div class="hero-ornament-line"></div>
          <div class="hero-ornament-diamond"></div>
          <div class="hero-ornament-line"></div>
        </div>

        <div class="hero-chips" role="list">
          ${chipsHtml}
        </div>
      </div>

      <div class="hero-sources" aria-hidden="true">
        <div class="hero-sources-label">Sources disponibles</div>
        <div class="hero-slider">
          <div class="hero-slider-track">${pillsHtml}</div>
        </div>
      </div>
    </div>`;

  DOM.messages.classList.add('hero-active');

  // Inject animated particles into the background
  const bgEl = document.getElementById('heroBg');
  if (bgEl) createAnimatedBg(bgEl, mode);

  bindFillButtons();
}

/* ─── Events ─────────────────────────────────────────────────── */
function bindEvents() {
  DOM.btnSend.addEventListener('click', handleSend);
  DOM.btnNew.addEventListener('click', newConversation);
  DOM.btnToggle.addEventListener('click', toggleSidebar);
  DOM.overlay.addEventListener('click', closeSidebar);

  DOM.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });
  DOM.input.addEventListener('input', () => {
    autoResize();
    DOM.btnSend.disabled = DOM.input.value.trim() === '' || isStreaming;
  });

  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMode(btn.dataset.mode); }
    });
  });

  bindFillButtons();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });
}

/* ─── Mode management ────────────────────────────────────────── */
function setMode(mode) {
  if (!MODES[mode]) return;
  currentMode = mode;

  // Update sidebar buttons
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  // Update header badge
  if (DOM.modeLabel) DOM.modeLabel.textContent = MODES[mode].name;

  // Update placeholder
  const phs = {
    normal:   'Posez votre question sur la Torah…',
    halakha:  'Posez votre question halakhique…',
    etude:    'Posez votre question pour une étude approfondie…',
    mousssar: 'Posez votre question sur le Mousssar…',
    medecine: 'Posez votre question sur la médecine juive…',
  };
  DOM.input.placeholder = phs[mode] || 'Posez votre question…';

  // Re-render hero only if no active conversation
  if (DOM.messages.classList.contains('hero-active')) {
    renderHero(mode);
  }

  if (window.innerWidth <= 768) closeSidebar();
}

function bindFillButtons() {
  document.querySelectorAll('.suggestion-chip').forEach((el) => {
    el.addEventListener('click', () => {
      const text = el.dataset.fill;
      if (!text) return;
      fillInput(text);
      if (window.innerWidth <= 768) closeSidebar();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const text = el.dataset.fill;
        if (text) { fillInput(text); closeSidebar(); }
      }
    });
  });
}

function autoResize() {
  DOM.input.style.height = 'auto';
  DOM.input.style.height = Math.min(DOM.input.scrollHeight, 160) + 'px';
}

/* ─── Fill input (no auto-send) ─────────────────────────────── */
function fillInput(text) {
  DOM.input.value = text;
  autoResize();
  DOM.btnSend.disabled = false;
  DOM.input.focus();
  DOM.input.setSelectionRange(text.length, text.length);

  if (DOM.inputWrapper) {
    DOM.inputWrapper.classList.remove('filled-pulse');
    void DOM.inputWrapper.offsetWidth;
    DOM.inputWrapper.classList.add('filled-pulse');
    setTimeout(() => DOM.inputWrapper.classList.remove('filled-pulse'), 700);
  }
}

/* ─── Sidebar ────────────────────────────────────────────────── */
function toggleSidebar() {
  DOM.sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
}
function openSidebar() {
  DOM.sidebar.classList.add('open');
  DOM.overlay.classList.add('visible');
  DOM.btnToggle.setAttribute('aria-expanded', 'true');
}
function closeSidebar() {
  DOM.sidebar.classList.remove('open');
  DOM.overlay.classList.remove('visible');
  DOM.btnToggle.setAttribute('aria-expanded', 'false');
}

/* ─── Firebase — History ─────────────────────────────────────── */
async function loadHistory() {
  if (typeof db === 'undefined') return;
  try {
    const snap = await db.collection('conversations')
      .orderBy('updatedAt', 'desc').limit(15).get();
    if (snap.empty) return;
    if (DOM.historyEmpty) DOM.historyEmpty.style.display = 'none';
    snap.forEach((doc) => renderHistoryItem(doc.id, doc.data()));
  } catch (err) {
    console.warn('Firestore load:', err.message);
  }
}

function renderHistoryItem(id, data) {
  if (!DOM.historyList) return;
  const emptyEl = document.getElementById('historyEmpty');
  if (emptyEl) emptyEl.style.display = 'none';

  const item = document.createElement('div');
  item.className = 'history-item';
  item.setAttribute('tabindex', '0');
  item.setAttribute('role', 'button');
  item.dataset.id = id;

  const date = data.updatedAt?.toDate
    ? data.updatedAt.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '';

  item.innerHTML = `
    <svg class="history-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <div class="history-item-text">
      <div class="history-title">${escHtml(data.title || 'Conversation')}</div>
      <div class="history-date">${date}</div>
    </div>
    <button class="history-delete" aria-label="Supprimer">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>`;

  item.addEventListener('click', (e) => {
    if (e.target.closest('.history-delete')) return;
    loadConversation(id, data);
    if (window.innerWidth <= 768) closeSidebar();
  });
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { loadConversation(id, data); closeSidebar(); }
  });
  item.querySelector('.history-delete').addEventListener('click', async (e) => {
    e.stopPropagation();
    await deleteConversation(id, item);
  });

  DOM.historyList.prepend(item);
}

async function saveConversation() {
  if (typeof db === 'undefined' || conversationHistory.length === 0) return;
  const title = conversationHistory[0].content.slice(0, 55) +
    (conversationHistory[0].content.length > 55 ? '…' : '');
  const payload = {
    title,
    messages: conversationHistory,
    mode: currentMode,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  try {
    if (currentConvId) {
      await db.collection('conversations').doc(currentConvId).set(payload);
    } else {
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      const ref = await db.collection('conversations').add(payload);
      currentConvId = ref.id;
      renderHistoryItem(currentConvId, { title, updatedAt: null });
    }
  } catch (err) {
    console.warn('Firestore save:', err.message);
  }
}

function loadConversation(id, data) {
  conversationHistory = data.messages || [];
  currentConvId = id;
  if (data.mode && MODES[data.mode]) setMode(data.mode);
  DOM.messages.classList.remove('hero-active');
  DOM.messages.innerHTML = '';
  conversationHistory.forEach((m) => appendMessage(m.role, m.content));
  scrollBottom();
}

async function deleteConversation(id, itemEl) {
  try {
    await db.collection('conversations').doc(id).delete();
    itemEl.remove();
    if (!DOM.historyList.querySelector('.history-item')) {
      const e = document.getElementById('historyEmpty');
      if (e) e.style.display = '';
    }
    if (currentConvId === id) currentConvId = null;
  } catch (err) {
    console.warn('Firestore delete:', err.message);
  }
}

/* ─── Send ───────────────────────────────────────────────────── */
async function handleSend() {
  const text = DOM.input.value.trim();
  if (!text || isStreaming) return;

  DOM.input.value = '';
  autoResize();
  DOM.btnSend.disabled = true;
  isStreaming = true;

  // Dismiss hero with a quick fade, then add messages
  const welcome = document.getElementById('welcomeScreen');
  if (welcome) {
    welcome.style.transition = 'opacity 0.18s, transform 0.18s';
    welcome.style.opacity = '0';
    welcome.style.transform = 'translateY(-8px)';
    await new Promise(r => setTimeout(r, 190));
    welcome.remove();
    DOM.messages.classList.remove('hero-active');
  }

  conversationHistory.push({ role: 'user', content: text });
  appendMessage('user', text);
  const botEl = appendMessage('assistant', null, true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory, mode: currentMode }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText  = '';
    const bubble  = botEl.querySelector('.message-bubble');
    let first     = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value, { stream: true }).split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const d = JSON.parse(line.slice(6).trim());
          if (d.error) { bubble.innerHTML = `<em class="err-msg">Erreur : ${escHtml(d.error)}</em>`; break; }
          if (d.done)  break;
          if (d.text)  {
            if (first) { bubble.innerHTML = ''; first = false; }
            fullText += d.text;
            bubble.innerHTML = renderMd(fullText);
            scrollBottom();
          }
        } catch { /* skip */ }
      }
    }

    conversationHistory.push({ role: 'assistant', content: fullText });
    saveConversation();
  } catch (err) {
    botEl.querySelector('.message-bubble').innerHTML =
      `<em class="err-msg">Serveur inaccessible. Lance <code>node server.js</code> puis recharge.</em>`;
    console.error(err);
  } finally {
    isStreaming = false;
    DOM.btnSend.disabled = DOM.input.value.trim() === '';
    scrollBottom();
  }
}

/* ─── DOM helpers ────────────────────────────────────────────── */
function appendMessage(role, text, isTyping = false) {
  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;
  wrap.setAttribute('role', 'article');

  const label = document.createElement('div');
  label.className = 'message-role';
  label.textContent = role === 'user' ? 'Vous' : 'Tsohar.ai';
  label.setAttribute('aria-hidden', 'true');

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  if (isTyping) {
    bubble.innerHTML = `<div class="typing-indicator" aria-label="Tsohar.ai réfléchit…">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>`;
  } else {
    bubble.innerHTML = role === 'user' ? escHtml(text) : renderMd(text || '');
  }

  wrap.appendChild(label);
  wrap.appendChild(bubble);
  DOM.messages.appendChild(wrap);
  scrollBottom();
  return wrap;
}

function scrollBottom() {
  DOM.messages.scrollTo({ top: DOM.messages.scrollHeight, behavior: 'smooth' });
}

/* ─── New conversation ───────────────────────────────────────── */
function newConversation() {
  conversationHistory = [];
  currentConvId       = null;
  isStreaming         = false;
  DOM.input.value     = '';
  DOM.btnSend.disabled = true;
  autoResize();
  if (window.innerWidth <= 768) closeSidebar();
  renderHero(currentMode);
}

/* ─── Markdown renderer ──────────────────────────────────────── */
function renderMd(text) {
  if (!text) return '';
  let h = escHtmlNl(text);

  h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  h = h.replace(/^## (.+)$/gm,  '<h2>$1</h2>');
  h = h.replace(/^# (.+)$/gm,   '<h1>$1</h1>');
  h = h.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  h = h.replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g,         '<em>$1</em>');
  h = h.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  h = h.replace(/^---+$/gm,      '<hr/>');
  h = h.replace(/^[*\-] (.+)$/gm,'<li>$1</li>');
  h = h.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  h = h.replace(/^\d+\. (.+)$/gm,'<li>$1</li>');
  h = h.replace(/`([^`]+)`/g,    '<code>$1</code>');
  h = h.replace(/([֐-׿יִ-ﯿ][^\n<]*)/g, '<span lang="he" dir="rtl">$1</span>');
  h = h.replace(/\n\n+/g, '</p><p>');
  h = '<p>' + h + '</p>';
  h = h.replace(/(?<!<\/h[123]>|<\/li>|<\/blockquote>|<hr\/>|<\/ul>)\n/g, '<br/>');
  h = h.replace(/<p>\s*<\/p>/g, '');
  h = h.replace(/<p>(<(?:h[123]|ul|hr\/|blockquote)[^>]*>)/g, '$1');
  h = h.replace(/(<\/(?:h[123]|ul|blockquote)>)<\/p>/g, '$1');
  return h;
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escHtmlAttr(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escHtmlNl(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
