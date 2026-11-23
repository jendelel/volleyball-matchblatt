/**
 * Official Swiss Volley / FIVB Matchblatt ("Grosses Matchblatt") State Engine
 * Pure immutable state + command-log store with 500-step Undo/Redo, FIVB rotation/substitution/timeout/sanction
 * rule validation + overrides, deciding-set 8-point side switch, summary calculator, and localStorage persistence.
 */
(function (root) {
  'use strict';

  var I18N =
    (typeof window !== 'undefined' && window.Matchblatt && window.Matchblatt.I18N) ||
    (typeof module !== 'undefined' && module.exports && (function () {
      try {
        return require('./i18n.js');
      } catch (_e) {
        return null;
      }
    })()) ||
    null;

  function tr(key, lang, params) {
    if (I18N && typeof I18N.t === 'function') {
      return I18N.t(key, lang || 'en', params || {});
    }
    var template = (params && params.fallback) || key;
    return String(template).replace(/\{(\w+)\}/g, function (m, k) {
      return params && params[k] !== undefined ? String(params[k]) : m;
    });
  }

  var VERSION = 1;
  var STORAGE_KEY = 'matchblatt_doc_v1';
  var MAX_HISTORY = 500;
  var ROMAN_POSITIONS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

  var ACTIONS = {
    SET_LANGUAGE: 'SET_LANGUAGE',
    SET_PHASE: 'SET_PHASE',
    UPDATE_META: 'UPDATE_META',
    UPDATE_TOSS: 'UPDATE_TOSS',
    SWAP_TEAMS_AB: 'SWAP_TEAMS_AB',
    UPDATE_TEAM: 'UPDATE_TEAM',
    ADD_PLAYER: 'ADD_PLAYER',
    ADD_PLAYERS: 'ADD_PLAYERS',
    UPDATE_PLAYER: 'UPDATE_PLAYER',
    REMOVE_PLAYER: 'REMOVE_PLAYER',
    SET_CAPTAIN: 'SET_CAPTAIN',
    ADD_LIBERO: 'ADD_LIBERO',
    UPDATE_LIBERO: 'UPDATE_LIBERO',
    REMOVE_LIBERO: 'REMOVE_LIBERO',
    UPDATE_OFFICIALS: 'UPDATE_OFFICIALS',
    REDESIGNATE_LIBERO: 'REDESIGNATE_LIBERO',
    SET_LINEUP: 'SET_LINEUP',
    CONFIRM_SET_START: 'CONFIRM_SET_START',
    SCORE_POINT: 'SCORE_POINT',
    FINISH_SET: 'FINISH_SET',
    SUBSTITUTE: 'SUBSTITUTE',
    TIMEOUT: 'TIMEOUT',
    ADD_SANCTION: 'ADD_SANCTION',
    IMPROPER_REQUEST: 'IMPROPER_REQUEST',
    SWAP_SIDES: 'SWAP_SIDES',
    SET_REMARKS: 'SET_REMARKS',
    SET_MANUAL_OVERRIDE: 'SET_MANUAL_OVERRIDE',
    CLEAR_MANUAL_OVERRIDES: 'CLEAR_MANUAL_OVERRIDES',
    SET_SIGNATURE: 'SET_SIGNATURE',
    UPDATE_SET_TIMES: 'UPDATE_SET_TIMES'
  };

  // In-memory fallback storage when running in Node or restricted browser contexts
  var memoryStorage = Object.create(null);

  function getStorageBackend() {
    try {
      var ls =
        (typeof window !== 'undefined' && window.localStorage) ||
        (typeof globalThis !== 'undefined' && globalThis.localStorage);
      if (ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function') {
        return ls;
      }
    } catch (_err) {
      // Node 22+ without --localstorage-file or Safari private browsing restriction
    }
    return null;
  }

  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      var arr = new Array(obj.length);
      for (var i = 0; i < obj.length; i++) {
        arr[i] = deepClone(obj[i]);
      }
      return arr;
    }
    var copy = {};
    var keys = Object.keys(obj);
    for (var j = 0; j < keys.length; j++) {
      var k = keys[j];
      copy[k] = deepClone(obj[k]);
    }
    return copy;
  }

  function oppTeam(team) {
    return team === 'A' ? 'B' : 'A';
  }

  function validTeamKey(team) {
    return team === 'A' || team === 'B';
  }

  function normalizeNumber(val) {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  }

  function todayISOString() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  }

  function formatNowHHMM() {
    var d = new Date();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }

  function computeDurationMinutes(startTime, endTime) {
    if (!startTime || !endTime || typeof startTime !== 'string' || typeof endTime !== 'string') {
      return null;
    }
    var m1 = /^(\d{1,2}):(\d{2})$/.exec(startTime.trim());
    var m2 = /^(\d{1,2}):(\d{2})$/.exec(endTime.trim());
    if (!m1 || !m2) return null;
    var startTotal = parseInt(m1[1], 10) * 60 + parseInt(m1[2], 10);
    var endTotal = parseInt(m2[1], 10) * 60 + parseInt(m2[2], 10);
    if (isNaN(startTotal) || isNaN(endTotal)) return null;
    var diff = endTotal - startTotal;
    if (diff < 0) {
      diff += 24 * 60; // midnight wrap-around
    }
    return diff;
  }

  function parseQuickNumbers(input) {
    if (Array.isArray(input)) {
      return input.map(normalizeNumber).filter(Boolean);
    }
    if (input === null || input === undefined) return [];
    return String(input)
      .split(/[\s,;]+/)
      .map(normalizeNumber)
      .filter(Boolean);
  }

  function normalizeMatchType(val) {
    if (val == null) return 'championship';
    var v = String(val).trim().toLowerCase();
    if (v === 'cup' || v === 'coupe' || v === 'coppa') return 'cup';
    if (v === 'friendly' || v === 'freundschaftsspiel' || v === 'amical' || v === 'amichevole') return 'friendly';
    if (v === 'tournament' || v === 'turnier' || v === 'tournoi' || v === 'torneo') return 'tournament';
    if (v === 'championship' || v === 'meisterschaft' || v === 'championnat' || v === 'campionato') return 'championship';
    return 'championship';
  }

  function normalizeLevel(val, fallback) {
    var fb = fallback || 'regional';
    if (val == null || String(val).trim() === '') return fb;
    var v = String(val).trim().toLowerCase();
    if (v === 'national' || v === 'nazionale') return 'national';
    if (v === 'international' || v === 'internazionale') return 'international';
    if (v === 'regional' || v === 'régionale' || v === 'regionale') return 'regional';
    return fb;
  }

  function inferGenderFromCategory(cat, fallbackGender) {
    var fb = fallbackGender === 'men' ? 'men' : 'women';
    if (cat == null) return fb;
    var c = String(cat).trim().toLowerCase();
    if (!c) return fb;
    if (
      c.indexOf('women') !== -1 ||
      c.indexOf('frau') !== -1 ||
      c.indexOf('damen') !== -1 ||
      c.indexOf('femm') !== -1 ||
      c === 'f' ||
      c === 'w'
    ) {
      return 'women';
    }
    if (/\b(men|männer|maenner|herren|hommes|maschile|male)\b/.test(c) || c === 'm' || c === 'h') {
      return 'men';
    }
    return fb;
  }

  function normalizeGender(val, category, fallbackGender) {
    if (val != null && String(val).trim() !== '') {
      var v = String(val).trim().toLowerCase();
      if (
        v === 'men' ||
        v === 'male' ||
        v === 'm' ||
        v === 'h' ||
        v.indexOf('männ') !== -1 ||
        v.indexOf('maenn') !== -1 ||
        v.indexOf('herr') !== -1 ||
        v.indexOf('homm') !== -1 ||
        v.indexOf('masch') !== -1
      ) {
        return 'men';
      }
      if (
        v === 'women' ||
        v === 'female' ||
        v === 'w' ||
        v === 'f' ||
        v.indexOf('frau') !== -1 ||
        v.indexOf('damen') !== -1 ||
        v.indexOf('femm') !== -1
      ) {
        return 'women';
      }
    }
    return inferGenderFromCategory(category, fallbackGender || 'women');
  }

  function inferAgeGroupFromCategory(cat) {
    if (cat == null) return '';
    var m = /\b(U23|U19|U17)\b/i.exec(String(cat));
    return m ? m[1].toUpperCase() : '';
  }

  function normalizeAgeGroup(val, category) {
    if (val !== undefined && val !== null) {
      var v = String(val).trim().toUpperCase();
      if (v === 'U23' || v === 'U19' || v === 'U17') return v;
      return '';
    }
    return inferAgeGroupFromCategory(category);
  }

  function buildCategoryString(gender, ageGroup, lang) {
    var gLabel = gender === 'men'
      ? (lang === 'de' ? 'Männer' : 'Men')
      : (lang === 'de' ? 'Frauen' : 'Women');
    return ageGroup ? (gLabel + ' ' + ageGroup) : gLabel;
  }

  function normalizePlayer(raw) {
    if (!raw || typeof raw !== 'object') {
      var n = normalizeNumber(raw);
      return n ? { number: n, name: '', birthdate: '', license: '', isCaptain: false } : null;
    }
    var num = normalizeNumber(raw.number);
    if (!num) return null;
    return {
      number: num,
      name: raw.name != null ? String(raw.name).trim() : '',
      birthdate: raw.birthdate != null ? String(raw.birthdate).trim() : '',
      license: raw.license != null ? String(raw.license).trim() : '',
      isCaptain: Boolean(raw.isCaptain)
    };
  }

  function normalizeLibero(raw) {
    if (!raw || typeof raw !== 'object') {
      var n = normalizeNumber(raw);
      return n ? { number: n, name: '', birthdate: '', license: '', isCaptain: false, redesignated: false } : null;
    }
    var num = normalizeNumber(raw.number);
    if (!num) return null;
    var lib = {
      number: num,
      name: raw.name != null ? String(raw.name).trim() : '',
      birthdate: raw.birthdate != null ? String(raw.birthdate).trim() : '',
      license: raw.license != null ? String(raw.license).trim() : '',
      isCaptain: Boolean(raw.isCaptain),
      redesignated: Boolean(raw.redesignated)
    };
    if (raw.injured !== undefined) lib.injured = Boolean(raw.injured);
    if (raw.active !== undefined) lib.active = Boolean(raw.active);
    if (raw.replacedBy !== undefined) lib.replacedBy = String(raw.replacedBy);
    return lib;
  }

  function createEmptyTeamLineup() {
    var positions = [];
    for (var i = 0; i < 6; i++) {
      positions.push({
        starter: '',
        sub: null,
        subReentered: false,
        subScores: [],
        serviceTurns: []
      });
    }
    return {
      starters: null,
      court: null,
      serverPosIndex: 0,
      positions: positions
    };
  }

  function createEmptySet(number, isDeciding, leftTeam, firstServe) {
    var safeLeft = validTeamKey(leftTeam) ? leftTeam : 'A';
    var safeServe = validTeamKey(firstServe) ? firstServe : 'A';
    return {
      number: number,
      isDeciding: Boolean(isDeciding),
      targetPoints: isDeciding ? 15 : 25,
      status: number === 1 ? 'pending' : 'pending',
      startTime: '',
      endTime: '',
      durationMin: null,
      leftTeam: safeLeft,
      rightTeam: oppTeam(safeLeft),
      initialLeftTeam: safeLeft,
      firstServe: safeServe,
      servingTeam: safeServe,
      firstRallyPlayed: false,
      switchedAt8: false,
      pointsAtSwitch: null,
      winner: null,
      lineups: {
        A: createEmptyTeamLineup(),
        B: createEmptyTeamLineup()
      },
      points: { A: 0, B: 0 },
      slashedPoints: { A: [], B: [] },
      timeouts: { A: [], B: [] },
      subCount: { A: 0, B: 0 }
    };
  }

  function buildSetsForFormat(bestOf, toss, existingSets) {
    var count = bestOf === 3 ? 3 : 5;
    var firstServe1 = validTeamKey(toss.firstServeSet1) ? toss.firstServeSet1 : 'A';
    var initialLeft1 = validTeamKey(toss.initialLeft) ? toss.initialLeft : 'A';
    var sets = [];

    for (var i = 0; i < count; i++) {
      var isDeciding = i === count - 1;
      var defaultLeft = isDeciding
        ? (validTeamKey(toss.decidingInitialLeft) ? toss.decidingInitialLeft : (i % 2 === 0 ? initialLeft1 : oppTeam(initialLeft1)))
        : (i % 2 === 0 ? initialLeft1 : oppTeam(initialLeft1));
      var defaultServe = isDeciding
        ? (validTeamKey(toss.decidingFirstServe) ? toss.decidingFirstServe : firstServe1)
        : (i % 2 === 0 ? firstServe1 : oppTeam(firstServe1));

      var prev = existingSets && existingSets[i];
      if (prev && (prev.firstRallyPlayed || prev.status === 'live' || prev.status === 'finished')) {
        var cloned = deepClone(prev);
        cloned.number = i + 1;
        cloned.isDeciding = isDeciding;
        cloned.targetPoints = isDeciding ? 15 : 25;
        sets.push(cloned);
      } else if (prev && (prev.lineups.A.starters || prev.lineups.B.starters) && Boolean(prev.isDeciding) === isDeciding) {
        var kept = deepClone(prev);
        kept.number = i + 1;
        kept.isDeciding = isDeciding;
        kept.targetPoints = isDeciding ? 15 : 25;
        kept.initialLeftTeam = defaultLeft;
        kept.leftTeam = defaultLeft;
        kept.rightTeam = oppTeam(defaultLeft);
        kept.firstServe = defaultServe;
        kept.servingTeam = defaultServe;
        sets.push(kept);
      } else {
        sets.push(createEmptySet(i + 1, isDeciding, defaultLeft, defaultServe));
      }
    }
    return sets;
  }

  function syncUnplayedSetsWithToss(state) {
    var count = state.sets.length;
    var firstServe1 = validTeamKey(state.toss.firstServeSet1) ? state.toss.firstServeSet1 : 'A';
    var initialLeft1 = validTeamKey(state.toss.initialLeft) ? state.toss.initialLeft : 'A';

    for (var i = 0; i < count; i++) {
      var s = state.sets[i];
      if (s.firstRallyPlayed || s.status === 'live' || s.status === 'finished') {
        continue;
      }
      if (s.isDeciding) {
        var prevFinished = i > 0 && state.sets[i - 1] && state.sets[i - 1].status === 'finished' ? state.sets[i - 1] : null;
        var decLeft = validTeamKey(state.toss.decidingInitialLeft)
          ? state.toss.decidingInitialLeft
          : (prevFinished ? prevFinished.rightTeam : (i % 2 === 0 ? initialLeft1 : oppTeam(initialLeft1)));
        var decServe = validTeamKey(state.toss.decidingFirstServe)
          ? state.toss.decidingFirstServe
          : (prevFinished ? oppTeam(prevFinished.firstServe) : firstServe1);
        s.initialLeftTeam = decLeft;
        s.leftTeam = decLeft;
        s.rightTeam = oppTeam(decLeft);
        s.firstServe = decServe;
        s.servingTeam = decServe;
      } else {
        var prevSet = i > 0 && state.sets[i - 1] && state.sets[i - 1].status === 'finished' ? state.sets[i - 1] : null;
        var regLeft = prevSet ? prevSet.rightTeam : (i % 2 === 0 ? initialLeft1 : oppTeam(initialLeft1));
        var regServe = prevSet ? oppTeam(prevSet.firstServe) : (i % 2 === 0 ? firstServe1 : oppTeam(firstServe1));
        s.initialLeftTeam = regLeft;
        s.leftTeam = regLeft;
        s.rightTeam = oppTeam(regLeft);
        s.firstServe = regServe;
        s.servingTeam = regServe;
      }
    }
  }

  function createDefaultTeam(key, custom) {
    var c = custom && typeof custom === 'object' ? custom : {};
    var defaultName = key === 'A' ? 'Team A' : 'Team B';
    var defaultShort = key === 'A' ? 'TMA' : 'TMB';
    var defaultColor = key === 'A' ? '#1d4ed8' : '#dc2626';
    var officials = c.officials && typeof c.officials === 'object' ? c.officials : {};
    return {
      name: c.name != null ? String(c.name) : defaultName,
      shortName: c.shortName != null ? String(c.shortName) : defaultShort,
      color: c.color != null ? String(c.color) : defaultColor,
      players: Array.isArray(c.players) ? c.players.map(normalizePlayer).filter(Boolean) : [],
      liberos: Array.isArray(c.liberos) ? c.liberos.map(normalizeLibero).filter(Boolean) : [],
      officials: {
        coach: officials.coach != null ? String(officials.coach) : '',
        assistantCoach1: officials.assistantCoach1 != null ? String(officials.assistantCoach1) : '',
        assistantCoach2: officials.assistantCoach2 != null ? String(officials.assistantCoach2) : '',
        therapist: officials.therapist != null ? String(officials.therapist) : '',
        doctor: officials.doctor != null ? String(officials.doctor) : ''
      }
    };
  }

  function createStore(initialMeta) {
    var init = initialMeta && typeof initialMeta === 'object' ? initialMeta : {};
    var metaSrc = init.meta && typeof init.meta === 'object' ? init.meta : init;
    var tossSrc = init.toss && typeof init.toss === 'object' ? init.toss : {};
    var teamsSrc = init.teams && typeof init.teams === 'object' ? init.teams : {};

    var bestOf = Number(metaSrc.bestOf) === 3 ? 3 : 5;
    var lang = init.lang === 'de' || metaSrc.lang === 'de' ? 'de' : 'en';

    var toss = {
      firstServeSet1: validTeamKey(tossSrc.firstServeSet1) ? tossSrc.firstServeSet1 : 'A',
      initialLeft: validTeamKey(tossSrc.initialLeft) ? tossSrc.initialLeft : 'A',
      decidingFirstServe: validTeamKey(tossSrc.decidingFirstServe) ? tossSrc.decidingFirstServe : null,
      decidingInitialLeft: validTeamKey(tossSrc.decidingInitialLeft) ? tossSrc.decidingInitialLeft : null
    };

    var lineJudges = Array.isArray(metaSrc.lineJudges)
      ? [
          String(metaSrc.lineJudges[0] || ''),
          String(metaSrc.lineJudges[1] || ''),
          String(metaSrc.lineJudges[2] || ''),
          String(metaSrc.lineJudges[3] || '')
        ]
      : ['', '', '', ''];

    var resolvedGender = normalizeGender(metaSrc.gender, metaSrc.category, 'women');
    var resolvedAgeGroup = normalizeAgeGroup(metaSrc.ageGroup, metaSrc.category);
    var resolvedCategory =
      metaSrc.category != null
        ? String(metaSrc.category)
        : buildCategoryString(resolvedGender, resolvedAgeGroup, lang);

    var state = {
      lang: lang,
      phase: init.phase || 'setup',
      meta: {
        competition: metaSrc.competition != null ? String(metaSrc.competition) : '',
        matchType: normalizeMatchType(metaSrc.matchType),
        level: normalizeLevel(metaSrc.level, 'regional'),
        gender: resolvedGender,
        ageGroup: resolvedAgeGroup,
        category: resolvedCategory,
        matchNumber: metaSrc.matchNumber != null ? String(metaSrc.matchNumber) : '',
        city: metaSrc.city != null ? String(metaSrc.city) : '',
        hall: metaSrc.hall != null ? String(metaSrc.hall) : '',
        federation: metaSrc.federation != null ? String(metaSrc.federation) : 'Swiss Volley',
        date: metaSrc.date != null ? String(metaSrc.date) : todayISOString(),
        time: metaSrc.time != null ? String(metaSrc.time) : '16:00',
        bestOf: bestOf,
        referee1: metaSrc.referee1 != null ? String(metaSrc.referee1) : '',
        referee2: metaSrc.referee2 != null ? String(metaSrc.referee2) : '',
        scorer: metaSrc.scorer != null ? String(metaSrc.scorer) : '',
        assistantScorer: metaSrc.assistantScorer != null ? String(metaSrc.assistantScorer) : '',
        lineJudges: lineJudges
      },
      toss: toss,
      teams: {
        A: createDefaultTeam('A', teamsSrc.A),
        B: createDefaultTeam('B', teamsSrc.B)
      },
      currentSetIndex: 0,
      sets: buildSetsForFormat(bestOf, toss, null),
      sanctions: [],
      improperRequests: { A: null, B: null },
      remarks: init.remarks != null ? String(init.remarks) : '',
      manualOverrides: {},
      signatures: {
        captainA_pre: null,
        captainB_pre: null,
        coachA: null,
        coachB: null,
        captainA_post: null,
        captainB_post: null,
        scorer: null,
        assistantScorer: null,
        referee1: null,
        referee2: null
      },
      highlights: [],
      lastActionLabel: tr('actions.init', lang),
      lastActionType: null,
      justSwitchedAt8: false,
      setPointReached: null,
      canFinishSet: null,
      matchWinner: null
    };

    return {
      state: state,
      past: [],
      future: [],
      version: VERSION
    };
  }

  function isActiveLibero(teamObj, number) {
    var num = normalizeNumber(number);
    if (!num || !teamObj || !Array.isArray(teamObj.liberos)) return false;
    for (var i = 0; i < teamObj.liberos.length; i++) {
      var l = teamObj.liberos[i];
      if (normalizeNumber(l.number) === num && l.active !== false && !l.injured) {
        return true;
      }
    }
    return false;
  }

  function isInjuredLibero(teamObj, number) {
    var num = normalizeNumber(number);
    if (!num || !teamObj || !Array.isArray(teamObj.liberos)) return false;
    for (var i = 0; i < teamObj.liberos.length; i++) {
      var l = teamObj.liberos[i];
      if (normalizeNumber(l.number) === num && (l.injured === true || l.active === false)) {
        return true;
      }
    }
    return false;
  }

  function ensurePlayerOnRoster(teamObj, number) {
    var num = normalizeNumber(number);
    if (!num || !teamObj) return;
    if (isActiveLibero(teamObj, num)) return;
    for (var i = 0; i < teamObj.players.length; i++) {
      if (normalizeNumber(teamObj.players[i].number) === num) return;
    }
    if (teamObj.players.length < 14) {
      teamObj.players.push({
        number: num,
        name: '',
        birthdate: '',
        license: '',
        isCaptain: false
      });
    }
  }

  function getCurrentSet(state) {
    if (!state || !Array.isArray(state.sets)) return null;
    var idx = state.currentSetIndex || 0;
    return state.sets[idx] || state.sets[0] || null;
  }

  function getBenchPlayers(state, team, setIndex) {
    if (!state || !validTeamKey(team)) return [];
    var idx = setIndex != null ? setIndex : state.currentSetIndex;
    var set = state.sets[idx];
    var teamObj = state.teams[team];
    if (!teamObj) return [];
    var courtSet = Object.create(null);
    if (set && set.lineups[team] && Array.isArray(set.lineups[team].court)) {
      for (var i = 0; i < set.lineups[team].court.length; i++) {
        courtSet[normalizeNumber(set.lineups[team].court[i])] = true;
      }
    }
    var bench = [];
    for (var j = 0; j < teamObj.players.length; j++) {
      var p = teamObj.players[j];
      var num = normalizeNumber(p.number);
      if (!num) continue;
      if (courtSet[num]) continue;
      if (isActiveLibero(teamObj, num) || isInjuredLibero(teamObj, num)) continue;
      bench.push(p);
    }
    return bench;
  }

  function detectSetWinner(set) {
    if (!set) return null;
    var target = set.targetPoints || (set.isDeciding ? 15 : 25);
    var pA = set.points.A;
    var pB = set.points.B;
    if (pA >= target && pA - pB >= 2) return 'A';
    if (pB >= target && pB - pA >= 2) return 'B';
    return null;
  }

  function refreshSetWinFlags(state) {
    var set = getCurrentSet(state);
    if (!set || set.status !== 'live') {
      state.setPointReached = null;
      state.canFinishSet = null;
      return;
    }
    var w = detectSetWinner(set);
    state.setPointReached = w;
    state.canFinishSet = w;
  }

  function validateLineup(state, team, starters, setIndex) {
    var lang = (state && state.lang) || 'en';
    var warnings = [];
    var error = null;

    if (!state || !validTeamKey(team)) {
      error = 'Invalid team key';
      return { valid: false, ok: false, warnings: warnings, error: error };
    }

    var teamObj = state.teams[team];
    var teamLabel = (teamObj && teamObj.name) || ('Team ' + team);
    var normalized = Array.isArray(starters) ? starters.map(normalizeNumber) : [];

    if (normalized.length !== 6 || normalized.some(function (n) { return !n; })) {
      error = tr('warnings.incompleteLineup', lang, { team: teamLabel });
      return { valid: false, ok: false, warnings: warnings, error: error };
    }

    var seen = Object.create(null);
    for (var i = 0; i < 6; i++) {
      var num = normalized[i];
      if (seen[num]) {
        error = tr('warnings.duplicateLineupNumber', lang, { number: num, team: teamLabel });
        return { valid: false, ok: false, warnings: warnings, error: error };
      }
      seen[num] = true;

      if (isActiveLibero(teamObj, num)) {
        warnings.push(tr('warnings.liberoInStartingLineup', lang, { number: num, team: teamLabel }));
      } else if (isInjuredLibero(teamObj, num)) {
        warnings.push(tr('warnings.liberoInjuredReplaced', lang, { number: num }));
      }
    }

    return {
      valid: warnings.length === 0 && !error,
      ok: warnings.length === 0 && !error,
      warnings: warnings,
      error: error
    };
  }

  function findCourtColumnIndex(lineup, outNumber) {
    if (!lineup || !Array.isArray(lineup.court)) return -1;
    var outNorm = normalizeNumber(outNumber);
    var zoneIdx = -1;
    for (var i = 0; i < lineup.court.length; i++) {
      if (normalizeNumber(lineup.court[i]) === outNorm) {
        zoneIdx = i;
        break;
      }
    }
    if (zoneIdx === -1) return -1;
    // Invariant: court shifts left by 1 whenever serverPosIndex advances by 1 mod 6
    return (zoneIdx + (lineup.serverPosIndex || 0)) % 6;
  }

  function validateSubstitution(state, team, outNumber, inNumber, setIndex) {
    var lang = (state && state.lang) || 'en';
    var warnings = [];
    var error = null;

    if (!state || !validTeamKey(team)) {
      return { valid: false, ok: false, warnings: warnings, error: 'Invalid team', canOverride: false, colIndex: -1 };
    }

    var idx = setIndex != null ? setIndex : state.currentSetIndex;
    var set = state.sets[idx];
    if (!set || !set.lineups[team] || !Array.isArray(set.lineups[team].court)) {
      return {
        valid: false,
        ok: false,
        warnings: warnings,
        error: 'Set lineup is not initialized',
        canOverride: false,
        colIndex: -1
      };
    }

    var outNorm = normalizeNumber(outNumber);
    var inNorm = normalizeNumber(inNumber);
    if (!outNorm || !inNorm || outNorm === inNorm) {
      return {
        valid: false,
        ok: false,
        warnings: warnings,
        error: 'Both outgoing and incoming jersey numbers must be provided and distinct',
        canOverride: false,
        colIndex: -1
      };
    }

    var lineup = set.lineups[team];
    var teamObj = state.teams[team];
    var teamLabel = (teamObj && teamObj.name) || ('Team ' + team);

    var outOnCourt = lineup.court.some(function (n) { return normalizeNumber(n) === outNorm; });
    if (!outOnCourt) {
      error = tr('warnings.playerNotOnCourt', lang, { number: outNorm });
      return { valid: false, ok: false, warnings: warnings, error: error, canOverride: false, colIndex: -1 };
    }

    var inOnCourt = lineup.court.some(function (n) { return normalizeNumber(n) === inNorm; });
    if (inOnCourt) {
      error = tr('warnings.playerAlreadyOnCourt', lang, { number: inNorm });
      return { valid: false, ok: false, warnings: warnings, error: error, canOverride: false, colIndex: -1 };
    }

    var colIndex = findCourtColumnIndex(lineup, outNorm);
    var col = lineup.positions[colIndex];

    // Check active / injured Libero
    if (isActiveLibero(teamObj, inNorm)) {
      warnings.push(tr('warnings.liberoCannotSub', lang, { number: inNorm }));
    } else if (isInjuredLibero(teamObj, inNorm)) {
      warnings.push(tr('warnings.liberoInjuredReplaced', lang, { number: inNorm }));
    }

    // Check max 6 team substitutions per set
    if (set.subCount[team] >= 6) {
      warnings.push(tr('warnings.maxSubsReached', lang, { team: teamLabel, set: set.number }));
    }

    // Check whether incoming player has already played in a DIFFERENT column in this set
    for (var c = 0; c < 6; c++) {
      if (c === colIndex) continue;
      var otherCol = lineup.positions[c];
      var playedInOther =
        normalizeNumber(otherCol.starter) === inNorm ||
        (otherCol.sub !== null && normalizeNumber(otherCol.sub) === inNorm) ||
        (Array.isArray(otherCol.extraSubs) && otherCol.extraSubs.indexOf(inNorm) !== -1);
      if (playedInOther) {
        warnings.push(
          tr('warnings.subPlayerLockedOtherPos', lang, {
            number: inNorm,
            pos: ROMAN_POSITIONS[c],
            set: set.number
          })
        );
        break;
      }
    }

    // Check FIVB pair-lock rule within this column
    if (col) {
      if (col.sub !== null && col.subReentered) {
        warnings.push(
          tr('warnings.subAlreadyReentered', lang, {
            pos: ROMAN_POSITIONS[colIndex],
            starter: col.starter,
            sub: col.sub
          })
        );
      } else if (col.sub !== null && !col.subReentered) {
        if (inNorm !== normalizeNumber(col.starter)) {
          warnings.push(
            tr('warnings.subLockedToStarter', lang, {
              pos: ROMAN_POSITIONS[colIndex],
              starter: col.starter,
              sub: col.sub
            })
          );
        }
      }
    }

    return {
      valid: warnings.length === 0 && !error,
      ok: warnings.length === 0 && !error,
      warnings: warnings,
      error: error,
      canOverride: !error,
      colIndex: colIndex
    };
  }

  function validateTimeout(state, team, setIndex) {
    var lang = (state && state.lang) || 'en';
    var warnings = [];
    var error = null;

    if (!state || !validTeamKey(team)) {
      return { valid: false, ok: false, warnings: warnings, error: 'Invalid team' };
    }
    var idx = setIndex != null ? setIndex : state.currentSetIndex;
    var set = state.sets[idx];
    if (!set || set.status !== 'live') {
      return { valid: false, ok: false, warnings: warnings, error: 'Set is not live' };
    }
    var teamLabel = (state.teams[team] && state.teams[team].name) || ('Team ' + team);
    if (set.timeouts[team].length >= 2) {
      warnings.push(tr('warnings.maxTimeoutsReached', lang, { team: teamLabel, set: set.number }));
    }
    return {
      valid: warnings.length === 0,
      ok: warnings.length === 0,
      warnings: warnings,
      error: null
    };
  }

  /**
   * Internal helper to apply a single rally point (including side-out rotation & deciding-set 8-pt switch).
   */
  function applyRallyPointMut(state, setIndex, scoringTeam, byPenalty) {
    var set = state.sets[setIndex];
    var opp = oppTeam(scoringTeam);
    var wasPreSwitch = !set.switchedAt8;

    set.firstRallyPlayed = true;
    set.points[scoringTeam] += 1;
    var newScore = set.points[scoringTeam];

    set.slashedPoints[scoringTeam].push({
      point: newScore,
      postSwitch: set.switchedAt8,
      byPenalty: Boolean(byPenalty)
    });

    state.highlights.push({
      section: 'set',
      setIndex: setIndex,
      team: scoringTeam,
      point: newScore,
      postSwitch: set.switchedAt8,
      field: 'score'
    });

    var wasSideOut = scoringTeam !== set.servingTeam;
    if (wasSideOut) {
      var oldSrv = set.servingTeam;
      var oldLineup = set.lineups[oldSrv];
      if (oldLineup && Array.isArray(oldLineup.positions)) {
        var oldColIdx = oldLineup.serverPosIndex || 0;
        var oldTurns = oldLineup.positions[oldColIdx].serviceTurns;
        if (oldTurns.length > 0 && oldTurns[oldTurns.length - 1].exitScore === null) {
          oldTurns[oldTurns.length - 1].exitScore = set.points[oldSrv];
          state.highlights.push({
            section: 'set',
            setIndex: setIndex,
            team: oldSrv,
            col: oldColIdx,
            turnIndex: oldTurns.length - 1,
            field: 'service'
          });
        }
      }

      // Rotate scoring team clockwise by 1: II->I, III->II, IV->III, V->IV, VI->V, I->VI
      var newLineup = set.lineups[scoringTeam];
      if (newLineup && Array.isArray(newLineup.court) && newLineup.court.length === 6) {
        var c = newLineup.court;
        newLineup.court = [c[1], c[2], c[3], c[4], c[5], c[0]];
        newLineup.serverPosIndex = ((newLineup.serverPosIndex || 0) + 1) % 6;
        var newColIdx = newLineup.serverPosIndex;
        newLineup.positions[newColIdx].serviceTurns.push({
          initialCheck: true,
          exitScore: null,
          postSwitch: set.switchedAt8
        });
        state.highlights.push({
          section: 'set',
          setIndex: setIndex,
          team: scoringTeam,
          col: newColIdx,
          turnIndex: newLineup.positions[newColIdx].serviceTurns.length - 1,
          field: 'service'
        });
      }

      set.servingTeam = scoringTeam;
    }

    // Deciding Set automatic side switch at 8 points
    if (set.isDeciding && wasPreSwitch && (set.points.A >= 8 || set.points.B >= 8)) {
      set.pointsAtSwitch = { A: set.points.A, B: set.points.B };
      set.switchedAt8 = true;
      var tmpLeft = set.leftTeam;
      set.leftTeam = set.rightTeam;
      set.rightTeam = tmpLeft;
      state.justSwitchedAt8 = true;

      // If initialLeftTeam is actively serving across the 8-point court switch, mark its open serviceTurn postSwitch: true
      // so Panel 3 records the exit score cleanly when that service rotation concludes.
      var srvTeam = set.servingTeam;
      var srvLineup = set.lineups[srvTeam];
      if (srvLineup && Array.isArray(srvLineup.positions)) {
        var activeCol = srvLineup.serverPosIndex || 0;
        var activeTurns = srvLineup.positions[activeCol].serviceTurns;
        if (activeTurns.length > 0 && activeTurns[activeTurns.length - 1].exitScore === null) {
          activeTurns[activeTurns.length - 1].postSwitch = true;
          activeTurns[activeTurns.length - 1].carriedOverSwitch = !wasSideOut;
        }
      }

      state.highlights.push({
        section: 'set',
        setIndex: setIndex,
        team: set.initialLeftTeam,
        point: set.points[scoringTeam],
        field: 'switch8'
      });
    }

    refreshSetWinFlags(state);
    return { wasSideOut: wasSideOut, opp: opp };
  }

  function applyLineupToTeamMut(state, set, setIndex, team, starters) {
    var normalized = starters.map(normalizeNumber);
    var teamObj = state.teams[team];
    for (var i = 0; i < 6; i++) {
      ensurePlayerOnRoster(teamObj, normalized[i]);
    }
    set.lineups[team] = {
      starters: normalized.slice(),
      court: normalized.slice(),
      serverPosIndex: 0,
      positions: normalized.map(function (num) {
        return {
          starter: num,
          sub: null,
          subReentered: false,
          subScores: [],
          serviceTurns: []
        };
      })
    };
    state.highlights.push({
      section: 'set',
      setIndex: setIndex,
      team: team,
      field: 'lineup'
    });
  }

  function appendRemarkLine(state, text) {
    if (!text) return;
    state.remarks = state.remarks ? state.remarks + '\n' + text : text;
  }

  /**
   * Dispatch an action against `doc`, returning `{ doc: nextDoc, warnings: string[], error: string|null }`.
   * If validation fails or warnings require `action.force === true`, returns the original `doc` unmutated.
   */
  function dispatch(doc, action) {
    if (!doc || !doc.state) {
      return { doc: doc, warnings: [], error: 'Invalid store document' };
    }
    if (!action || typeof action.type !== 'string') {
      return { doc: doc, warnings: [], error: 'Action must have a string type' };
    }

    var prevState = doc.state;
    var lang = prevState.lang || 'en';
    var type = action.type;
    var warnings = [];

    // Pre-mutation validations that may return early without cloning/mutating
    if (type === ACTIONS.SET_LINEUP) {
      var targetSetIdx = action.setIndex != null ? action.setIndex : prevState.currentSetIndex;
      if (!prevState.sets[targetSetIdx]) {
        return { doc: doc, warnings: [], error: 'Invalid setIndex' };
      }

      var lineupInputs = [];
      if (action.lineups && typeof action.lineups === 'object') {
        if (action.lineups.A) lineupInputs.push({ team: 'A', starters: action.lineups.A });
        if (action.lineups.B) lineupInputs.push({ team: 'B', starters: action.lineups.B });
      }
      if (action.startersA) lineupInputs.push({ team: 'A', starters: action.startersA });
      if (action.startersB) lineupInputs.push({ team: 'B', starters: action.startersB });
      if (validTeamKey(action.team) && Array.isArray(action.starters)) {
        lineupInputs.push({ team: action.team, starters: action.starters });
      }

      if (lineupInputs.length === 0) {
        return { doc: doc, warnings: [], error: 'No team starters provided for SET_LINEUP' };
      }

      var luWarnings = [];
      for (var li = 0; li < lineupInputs.length; li++) {
        var check = validateLineup(prevState, lineupInputs[li].team, lineupInputs[li].starters, targetSetIdx);
        if (check.error && !action.force) {
          return { doc: doc, warnings: check.warnings, error: check.error };
        }
        for (var lw = 0; lw < check.warnings.length; lw++) {
          luWarnings.push(check.warnings[lw]);
        }
      }
      if (luWarnings.length > 0 && !action.force) {
        return { doc: doc, warnings: luWarnings, error: null };
      }
      warnings = luWarnings;
    }

    if (type === ACTIONS.CONFIRM_SET_START || type === 'START_SET') {
      var startIdx = action.setIndex != null ? action.setIndex : prevState.currentSetIndex;
      var curSet = prevState.sets[startIdx];
      if (!curSet) {
        return { doc: doc, warnings: [], error: 'Invalid setIndex' };
      }
      var candA =
        (action.lineups && action.lineups.A) ||
        action.startersA ||
        (curSet.lineups.A && curSet.lineups.A.starters);
      var candB =
        (action.lineups && action.lineups.B) ||
        action.startersB ||
        (curSet.lineups.B && curSet.lineups.B.starters);

      var valA = validateLineup(prevState, 'A', candA, startIdx);
      var valB = validateLineup(prevState, 'B', candB, startIdx);
      if (valA.error || valB.error) {
        return {
          doc: doc,
          warnings: valA.warnings.concat(valB.warnings),
          error: valA.error || valB.error
        };
      }
      var startWarnings = valA.warnings.concat(valB.warnings);
      if (startWarnings.length > 0 && !action.force) {
        return { doc: doc, warnings: startWarnings, error: null };
      }
      warnings = startWarnings;
    }

    if (type === ACTIONS.SCORE_POINT) {
      var spIdx = action.setIndex != null ? action.setIndex : prevState.currentSetIndex;
      var spSet = prevState.sets[spIdx];
      if (!spSet || spSet.status !== 'live') {
        return { doc: doc, warnings: [], error: 'Cannot score points before set has started' };
      }
      var resolvedScoringTeam = validTeamKey(action.team)
        ? action.team
        : action.side === 'left'
          ? spSet.leftTeam
          : action.side === 'right'
            ? spSet.rightTeam
            : null;
      if (!validTeamKey(resolvedScoringTeam)) {
        return { doc: doc, warnings: [], error: 'Invalid scoring team' };
      }
      if (detectSetWinner(spSet) && !action.force) {
        return {
          doc: doc,
          warnings: [tr('warnings.setAlreadyWon', lang, { set: spSet.number })],
          error: null
        };
      }
    }

    if (type === ACTIONS.FINISH_SET || type === 'END_SET' || type === 'CONFIRM_SET_END') {
      var finIdx = action.setIndex != null ? action.setIndex : prevState.currentSetIndex;
      var finSet = prevState.sets[finIdx];
      if (!finSet || finSet.status === 'finished') {
        return { doc: doc, warnings: [], error: 'Set is already finished or invalid' };
      }
      var detWinner = detectSetWinner(finSet);
      if (!detWinner && !action.force) {
        return {
          doc: doc,
          warnings: [],
          error: 'Set winning score (target points with 2-point lead) has not been reached'
        };
      }
    }

    if (type === ACTIONS.SUBSTITUTE) {
      var subCheck = validateSubstitution(prevState, action.team, action.outNumber, action.inNumber, action.setIndex);
      if (subCheck.error) {
        return { doc: doc, warnings: subCheck.warnings, error: subCheck.error };
      }
      if (subCheck.warnings.length > 0 && !action.force) {
        return { doc: doc, warnings: subCheck.warnings, error: null };
      }
      warnings = subCheck.warnings;
    }

    if (type === ACTIONS.TIMEOUT) {
      var toCheck = validateTimeout(prevState, action.team, action.setIndex);
      if (toCheck.error) {
        return { doc: doc, warnings: toCheck.warnings, error: toCheck.error };
      }
      if (toCheck.warnings.length > 0 && !action.force) {
        return { doc: doc, warnings: toCheck.warnings, error: null };
      }
      warnings = toCheck.warnings;
    }

    if (type === ACTIONS.IMPROPER_REQUEST) {
      if (!validTeamKey(action.team)) {
        return { doc: doc, warnings: [], error: 'Invalid team' };
      }
      if (prevState.improperRequests[action.team] && !action.force) {
        var irTeamLabel = prevState.teams[action.team].name || ('Team ' + action.team);
        return {
          doc: doc,
          warnings: [tr('warnings.improperRequestAlreadyRecorded', lang, { team: irTeamLabel })],
          error: null
        };
      }
    }

    if (type === ACTIONS.REDESIGNATE_LIBERO) {
      if (!validTeamKey(action.team)) {
        return { doc: doc, warnings: [], error: 'Invalid team' };
      }
      var newLibCandidate = normalizeNumber(
        action.newLiberoNumber != null
          ? action.newLiberoNumber
          : action.newNumber != null
            ? action.newNumber
            : action.replacementNumber != null
              ? action.replacementNumber
              : action.playerNumber != null
                ? action.playerNumber
                : action.inNumber != null
                  ? action.inNumber
                  : action.number
      );
      if (!newLibCandidate) {
        return { doc: doc, warnings: [], error: 'New Libero jersey number is required' };
      }
      var liveSet = getCurrentSet(prevState);
      if (
        liveSet &&
        liveSet.status === 'live' &&
        liveSet.lineups[action.team] &&
        Array.isArray(liveSet.lineups[action.team].court) &&
        liveSet.lineups[action.team].court.indexOf(newLibCandidate) !== -1 &&
        !action.force
      ) {
        return {
          doc: doc,
          warnings: [tr('warnings.playerAlreadyOnCourt', lang, { number: newLibCandidate })],
          error: null
        };
      }
    }

    // Clone next state cleanly for immutable update
    var state = deepClone(prevState);
    state.highlights = [];
    state.justSwitchedAt8 = false;
    state.lastActionType = type;

    switch (type) {
      case ACTIONS.SET_LANGUAGE:
      case 'SET_LANG':
      case 'CHANGE_LANGUAGE': {
        if (action.lang === 'en' || action.lang === 'de') {
          state.lang = action.lang;
          lang = state.lang;
        }
        state.lastActionLabel = state.lang === 'de' ? 'Sprache: Deutsch' : 'Language: English';
        break;
      }

      case ACTIONS.SET_PHASE: {
        var allowedPhases = ['setup', 'rosters', 'lineup', 'live', 'finished'];
        if (allowedPhases.indexOf(action.phase) !== -1) {
          state.phase = action.phase;
        }
        state.lastActionLabel = 'Phase: ' + state.phase;
        break;
      }

      case ACTIONS.UPDATE_META: {
        var rawPatch = action.meta && typeof action.meta === 'object' ? action.meta : action;
        var patch = Object.assign({}, rawPatch);
        if (action.key && action.value !== undefined && patch[action.key] === undefined) {
          patch[action.key] = action.value;
        }
        var prevBestOf = state.meta.bestOf;
        var metaFields = [
          'competition',
          'category',
          'matchNumber',
          'city',
          'hall',
          'federation',
          'date',
          'time',
          'referee1',
          'referee2',
          'scorer',
          'assistantScorer'
        ];
        for (var mf = 0; mf < metaFields.length; mf++) {
          var field = metaFields[mf];
          if (patch[field] !== undefined) {
            state.meta[field] = String(patch[field]);
            state.highlights.push({ section: 'header', field: field });
          }
        }
        if (patch.matchType !== undefined) {
          state.meta.matchType = normalizeMatchType(patch.matchType);
          state.highlights.push({ section: 'header', field: 'matchType' });
        }
        if (patch.level !== undefined) {
          state.meta.level = normalizeLevel(patch.level, state.meta.level || 'regional');
          state.highlights.push({ section: 'header', field: 'level' });
        }
        if (patch.gender !== undefined) {
          state.meta.gender = normalizeGender(patch.gender, state.meta.category, state.meta.gender);
          state.highlights.push({ section: 'header', field: 'gender' });
        } else if (patch.category !== undefined) {
          state.meta.gender = inferGenderFromCategory(patch.category, state.meta.gender || 'women');
        }
        if (patch.ageGroup !== undefined) {
          state.meta.ageGroup = normalizeAgeGroup(patch.ageGroup, '');
          state.highlights.push({ section: 'header', field: 'ageGroup' });
        } else if (patch.category !== undefined) {
          var inferredAge = inferAgeGroupFromCategory(patch.category);
          if (inferredAge) {
            state.meta.ageGroup = inferredAge;
          }
        }
        if ((patch.gender !== undefined || patch.ageGroup !== undefined) && patch.category === undefined) {
          state.meta.category = buildCategoryString(state.meta.gender, state.meta.ageGroup, lang);
        }
        if (Array.isArray(patch.lineJudges)) {
          state.meta.lineJudges = [
            String(patch.lineJudges[0] || ''),
            String(patch.lineJudges[1] || ''),
            String(patch.lineJudges[2] || ''),
            String(patch.lineJudges[3] || '')
          ];
          state.highlights.push({ section: 'officials', field: 'lineJudges' });
        }
        if (patch.bestOf !== undefined) {
          var nextBestOf = Number(patch.bestOf) === 3 ? 3 : 5;
          state.meta.bestOf = nextBestOf;
          if (nextBestOf !== prevBestOf) {
            state.sets = buildSetsForFormat(nextBestOf, state.toss, state.sets);
            if (state.currentSetIndex >= state.sets.length) {
              state.currentSetIndex = state.sets.length - 1;
            }
            refreshSetWinFlags(state);
          }
          state.highlights.push({ section: 'header', field: 'bestOf' });
        }
        state.lastActionLabel = tr('actions.metaUpdated', lang);
        break;
      }

      case ACTIONS.UPDATE_TOSS: {
        var tPatch = action.toss && typeof action.toss === 'object' ? action.toss : action;
        if (validTeamKey(tPatch.firstServeSet1)) {
          state.toss.firstServeSet1 = tPatch.firstServeSet1;
        }
        if (validTeamKey(tPatch.initialLeft)) {
          state.toss.initialLeft = tPatch.initialLeft;
        }
        if (tPatch.decidingFirstServe === null || validTeamKey(tPatch.decidingFirstServe)) {
          state.toss.decidingFirstServe = tPatch.decidingFirstServe;
        }
        if (tPatch.decidingInitialLeft === null || validTeamKey(tPatch.decidingInitialLeft)) {
          state.toss.decidingInitialLeft = tPatch.decidingInitialLeft;
        }
        syncUnplayedSetsWithToss(state);
        state.highlights.push({ section: 'header', field: 'toss' });
        state.lastActionLabel = tr('actions.tossUpdated', lang);
        break;
      }

      case ACTIONS.SWAP_TEAMS_AB: {
        var tmpTeam = state.teams.A;
        state.teams.A = state.teams.B;
        state.teams.B = tmpTeam;

        var sigs = state.signatures;
        var tmpCapPre = sigs.captainA_pre;
        sigs.captainA_pre = sigs.captainB_pre;
        sigs.captainB_pre = tmpCapPre;

        var tmpCoach = sigs.coachA;
        sigs.coachA = sigs.coachB;
        sigs.coachB = tmpCoach;

        var tmpCapPost = sigs.captainA_post;
        sigs.captainA_post = sigs.captainB_post;
        sigs.captainB_post = tmpCapPost;

        // If Set 1 hasn't played any rallies yet, swap any draft lineups entered for A & B
        for (var si = 0; si < state.sets.length; si++) {
          if (!state.sets[si].firstRallyPlayed && state.sets[si].status !== 'finished') {
            var tmpLu = state.sets[si].lineups.A;
            state.sets[si].lineups.A = state.sets[si].lineups.B;
            state.sets[si].lineups.B = tmpLu;
          }
        }

        state.highlights.push({ section: 'rosters', field: 'swapAB' });
        state.lastActionLabel = tr('actions.teamsSwappedAB', lang);
        break;
      }

      case ACTIONS.UPDATE_TEAM: {
        if (!validTeamKey(action.team)) {
          return { doc: doc, warnings: [], error: 'Invalid team key' };
        }
        var tKey = action.team;
        var targetTeam = state.teams[tKey];
        var src =
          (action.data && typeof action.data === 'object' && action.data) ||
          (action.patch && typeof action.patch === 'object' && action.patch) ||
          (action.updates && typeof action.updates === 'object' && action.updates) ||
          (action.teamData && typeof action.teamData === 'object' && action.teamData) ||
          action;

        if (src.name !== undefined) targetTeam.name = String(src.name);
        if (src.shortName !== undefined) targetTeam.shortName = String(src.shortName);
        if (src.color !== undefined) targetTeam.color = String(src.color);

        if (Array.isArray(src.players)) {
          var seenNums = Object.create(null);
          var cleanPlayers = [];
          var captainFound = false;
          for (var pi = 0; pi < src.players.length; pi++) {
            var np = normalizePlayer(src.players[pi]);
            if (!np || seenNums[np.number]) continue;
            seenNums[np.number] = true;
            if (np.isCaptain) {
              if (captainFound) np.isCaptain = false;
              else captainFound = true;
            }
            cleanPlayers.push(np);
            if (cleanPlayers.length >= 14) break;
          }
          targetTeam.players = cleanPlayers;
        }

        if (Array.isArray(src.liberos)) {
          var seenLibs = Object.create(null);
          var cleanLiberos = [];
          for (var lbi = 0; lbi < src.liberos.length; lbi++) {
            var nl = normalizeLibero(src.liberos[lbi]);
            if (!nl || seenLibs[nl.number]) continue;
            seenLibs[nl.number] = true;
            cleanLiberos.push(nl);
          }
          targetTeam.liberos = cleanLiberos;
        }

        if (src.officials && typeof src.officials === 'object') {
          var offKeys = ['coach', 'assistantCoach1', 'assistantCoach2', 'therapist', 'doctor'];
          for (var ok = 0; ok < offKeys.length; ok++) {
            var oField = offKeys[ok];
            if (src.officials[oField] !== undefined) {
              targetTeam.officials[oField] = String(src.officials[oField]);
            }
          }
        }

        state.highlights.push({ section: 'rosters', team: tKey });
        state.lastActionLabel = tr('actions.teamUpdated', lang, { team: targetTeam.name });
        break;
      }

      case ACTIONS.ADD_PLAYER:
      case ACTIONS.ADD_PLAYERS: {
        if (!validTeamKey(action.team)) {
          return { doc: doc, warnings: [], error: 'Invalid team key' };
        }
        var apTeam = state.teams[action.team];
        var rawItems = [];
        if (Array.isArray(action.players)) rawItems = action.players;
        else if (action.player) rawItems = [action.player];
        else if (action.numbers !== undefined) rawItems = parseQuickNumbers(action.numbers);
        else if (action.number !== undefined) rawItems = parseQuickNumbers(action.number);

        var existingMap = Object.create(null);
        for (var ep = 0; ep < apTeam.players.length; ep++) {
          existingMap[apTeam.players[ep].number] = true;
        }
        for (var ri = 0; ri < rawItems.length; ri++) {
          if (apTeam.players.length >= 14) break;
          var pEntry = normalizePlayer(rawItems[ri]);
          if (!pEntry || existingMap[pEntry.number]) continue;
          existingMap[pEntry.number] = true;
          if (pEntry.isCaptain) {
            for (var cp = 0; cp < apTeam.players.length; cp++) apTeam.players[cp].isCaptain = false;
          }
          apTeam.players.push(pEntry);
        }
        state.highlights.push({ section: 'rosters', team: action.team });
        state.lastActionLabel = tr('actions.teamUpdated', lang, { team: apTeam.name });
        break;
      }

      case ACTIONS.UPDATE_PLAYER: {
        if (!validTeamKey(action.team)) {
          return { doc: doc, warnings: [], error: 'Invalid team key' };
        }
        var upTeam = state.teams[action.team];
        var pIdx =
          typeof action.index === 'number'
            ? action.index
            : upTeam.players.findIndex(function (p) {
                return p.number === normalizeNumber(action.oldNumber || (action.player && action.player.number));
              });
        if (pIdx >= 0 && pIdx < upTeam.players.length) {
          var patchP = action.player || action;
          var updatedNum = patchP.number !== undefined ? normalizeNumber(patchP.number) : upTeam.players[pIdx].number;
          if (updatedNum) upTeam.players[pIdx].number = updatedNum;
          if (patchP.name !== undefined) upTeam.players[pIdx].name = String(patchP.name);
          if (patchP.birthdate !== undefined) upTeam.players[pIdx].birthdate = String(patchP.birthdate);
          if (patchP.license !== undefined) upTeam.players[pIdx].license = String(patchP.license);
          if (patchP.isCaptain !== undefined) {
            var makeCap = Boolean(patchP.isCaptain);
            if (makeCap) {
              for (var k = 0; k < upTeam.players.length; k++) upTeam.players[k].isCaptain = false;
            }
            upTeam.players[pIdx].isCaptain = makeCap;
          }
        }
        state.highlights.push({ section: 'rosters', team: action.team });
        state.lastActionLabel = tr('actions.teamUpdated', lang, { team: upTeam.name });
        break;
      }

      case ACTIONS.REMOVE_PLAYER: {
        if (!validTeamKey(action.team)) {
          return { doc: doc, warnings: [], error: 'Invalid team key' };
        }
        var rmTeam = state.teams[action.team];
        if (typeof action.index === 'number') {
          rmTeam.players.splice(action.index, 1);
        } else if (action.number !== undefined) {
          var rmNum = normalizeNumber(action.number);
          rmTeam.players = rmTeam.players.filter(function (p) { return p.number !== rmNum; });
        }
        state.highlights.push({ section: 'rosters', team: action.team });
        state.lastActionLabel = tr('actions.teamUpdated', lang, { team: rmTeam.name });
        break;
      }

      case ACTIONS.SET_CAPTAIN: {
        if (!validTeamKey(action.team)) {
          return { doc: doc, warnings: [], error: 'Invalid team key' };
        }
        var capTeam = state.teams[action.team];
        var capNum = normalizeNumber(action.number);
        for (var ci = 0; ci < capTeam.players.length; ci++) {
          capTeam.players[ci].isCaptain = capTeam.players[ci].number === capNum;
        }
        state.highlights.push({ section: 'rosters', team: action.team });
        state.lastActionLabel = tr('actions.teamUpdated', lang, { team: capTeam.name });
        break;
      }

      case ACTIONS.ADD_LIBERO: {
        if (!validTeamKey(action.team)) {
          return { doc: doc, warnings: [], error: 'Invalid team key' };
        }
        var alTeam = state.teams[action.team];
        var libObj = normalizeLibero(action.libero || action);
        if (libObj && !alTeam.liberos.some(function (l) { return l.number === libObj.number; })) {
          alTeam.liberos.push(libObj);
        }
        state.highlights.push({ section: 'rosters', team: action.team });
        state.lastActionLabel = tr('actions.teamUpdated', lang, { team: alTeam.name });
        break;
      }

      case ACTIONS.UPDATE_LIBERO: {
        if (!validTeamKey(action.team)) {
          return { doc: doc, warnings: [], error: 'Invalid team key' };
        }
        var ulTeam = state.teams[action.team];
        var lIdx =
          typeof action.index === 'number'
            ? action.index
            : ulTeam.liberos.findIndex(function (l) {
                return l.number === normalizeNumber(action.oldNumber || (action.libero && action.libero.number));
              });
        if (lIdx >= 0 && lIdx < ulTeam.liberos.length) {
          var lPatch = action.libero || action;
          if (lPatch.number !== undefined && normalizeNumber(lPatch.number)) {
            ulTeam.liberos[lIdx].number = normalizeNumber(lPatch.number);
          }
          if (lPatch.name !== undefined) ulTeam.liberos[lIdx].name = String(lPatch.name);
          if (lPatch.birthdate !== undefined) ulTeam.liberos[lIdx].birthdate = String(lPatch.birthdate);
          if (lPatch.license !== undefined) ulTeam.liberos[lIdx].license = String(lPatch.license);
          if (lPatch.isCaptain !== undefined) ulTeam.liberos[lIdx].isCaptain = Boolean(lPatch.isCaptain);
        }
        state.highlights.push({ section: 'rosters', team: action.team });
        state.lastActionLabel = tr('actions.teamUpdated', lang, { team: ulTeam.name });
        break;
      }

      case ACTIONS.REMOVE_LIBERO: {
        if (!validTeamKey(action.team)) {
          return { doc: doc, warnings: [], error: 'Invalid team key' };
        }
        var rlTeam = state.teams[action.team];
        if (typeof action.index === 'number') {
          rlTeam.liberos.splice(action.index, 1);
        } else if (action.number !== undefined) {
          var rlNum = normalizeNumber(action.number);
          rlTeam.liberos = rlTeam.liberos.filter(function (l) { return l.number !== rlNum; });
        }
        state.highlights.push({ section: 'rosters', team: action.team });
        state.lastActionLabel = tr('actions.teamUpdated', lang, { team: rlTeam.name });
        break;
      }

      case ACTIONS.UPDATE_OFFICIALS: {
        if (!validTeamKey(action.team)) {
          return { doc: doc, warnings: [], error: 'Invalid team key' };
        }
        var uoTeam = state.teams[action.team];
        var uoSrc = action.officials || action;
        var uoFields = ['coach', 'assistantCoach1', 'assistantCoach2', 'therapist', 'doctor'];
        for (var uf = 0; uf < uoFields.length; uf++) {
          var keyName = uoFields[uf];
          if (uoSrc[keyName] !== undefined) {
            uoTeam.officials[keyName] = String(uoSrc[keyName]);
          }
        }
        state.highlights.push({ section: 'rosters', team: action.team });
        state.lastActionLabel = tr('actions.teamUpdated', lang, { team: uoTeam.name });
        break;
      }

      case ACTIONS.REDESIGNATE_LIBERO: {
        var rlKey = action.team;
        var rlTeamObj = state.teams[rlKey];
        var outLibNum = normalizeNumber(
          action.outLiberoNumber != null
            ? action.outLiberoNumber
            : action.oldNumber != null
              ? action.oldNumber
              : action.injuredNumber != null
                ? action.injuredNumber
                : action.liberoNumber != null
                  ? action.liberoNumber
                  : action.outNumber
        );
        var inLibNum = normalizeNumber(
          action.newLiberoNumber != null
            ? action.newLiberoNumber
            : action.newNumber != null
              ? action.newNumber
              : action.replacementNumber != null
                ? action.replacementNumber
                : action.playerNumber != null
                  ? action.playerNumber
                  : action.inNumber != null
                    ? action.inNumber
                    : action.number
        );

        if (!outLibNum) {
          for (var fl = 0; fl < rlTeamObj.liberos.length; fl++) {
            if (rlTeamObj.liberos[fl].active !== false && !rlTeamObj.liberos[fl].injured) {
              outLibNum = rlTeamObj.liberos[fl].number;
              break;
            }
          }
        }

        if (outLibNum) {
          for (var ml = 0; ml < rlTeamObj.liberos.length; ml++) {
            if (rlTeamObj.liberos[ml].number === outLibNum) {
              rlTeamObj.liberos[ml].injured = true;
              rlTeamObj.liberos[ml].active = false;
              rlTeamObj.liberos[ml].replacedBy = inLibNum;
            }
          }
        }

        var rosterMatch = null;
        for (var rp = 0; rp < rlTeamObj.players.length; rp++) {
          if (rlTeamObj.players[rp].number === inLibNum) {
            rosterMatch = rlTeamObj.players[rp];
            break;
          }
        }

        var existingLibIdx = rlTeamObj.liberos.findIndex(function (l) { return l.number === inLibNum; });
        var newLibObj = {
          number: inLibNum,
          name: rosterMatch ? rosterMatch.name : (action.name || ''),
          birthdate: rosterMatch ? rosterMatch.birthdate : (action.birthdate || ''),
          license: rosterMatch ? (rosterMatch.license || '') : (action.license || ''),
          isCaptain: Boolean(rosterMatch && rosterMatch.isCaptain),
          redesignated: true,
          active: true,
          injured: false
        };
        if (existingLibIdx >= 0) {
          rlTeamObj.liberos[existingLibIdx] = newLibObj;
        } else {
          rlTeamObj.liberos.push(newLibObj);
        }

        var curS = getCurrentSet(state);
        var curSetNo = curS ? curS.number : 1;
        var curScoreStr = curS ? (curS.points.A + ':' + curS.points.B) : '0:0';
        var remarkMsg =
          lang === 'de'
            ? 'Libero-Neubestimmung Team ' + rlKey + ' (' + rlTeamObj.name + '): #' + inLibNum +
              (outLibNum ? ' ersetzt #' + outLibNum : '') + ' (Satz ' + curSetNo + ', ' + curScoreStr + ')'
            : 'Libero Redesignation Team ' + rlKey + ' (' + rlTeamObj.name + '): #' + inLibNum +
              (outLibNum ? ' replaces #' + outLibNum : '') + ' (Set ' + curSetNo + ', ' + curScoreStr + ')';
        appendRemarkLine(state, remarkMsg);

        state.highlights.push({ section: 'rosters', team: rlKey, field: 'liberos' });
        state.highlights.push({ section: 'remarks' });
        state.lastActionLabel = tr('actions.liberoRedesignated', lang, { team: rlTeamObj.name, inNum: inLibNum });
        break;
      }

      case ACTIONS.SET_LINEUP: {
        var luSetIdx = action.setIndex != null ? action.setIndex : state.currentSetIndex;
        var luSet = state.sets[luSetIdx];
        if (luSet.status === 'pending') {
          luSet.status = 'lineup';
        }
        if (state.phase === 'setup' || state.phase === 'rosters') {
          state.phase = 'lineup';
        }

        var appliedTeamLabel = 'A & B';
        if (action.lineups && typeof action.lineups === 'object') {
          if (action.lineups.A) applyLineupToTeamMut(state, luSet, luSetIdx, 'A', action.lineups.A);
          if (action.lineups.B) applyLineupToTeamMut(state, luSet, luSetIdx, 'B', action.lineups.B);
        }
        if (action.startersA) applyLineupToTeamMut(state, luSet, luSetIdx, 'A', action.startersA);
        if (action.startersB) applyLineupToTeamMut(state, luSet, luSetIdx, 'B', action.startersB);
        if (validTeamKey(action.team) && Array.isArray(action.starters)) {
          applyLineupToTeamMut(state, luSet, luSetIdx, action.team, action.starters);
          appliedTeamLabel = state.teams[action.team].name || action.team;
        }

        state.lastActionLabel = tr('actions.lineupSet', lang, {
          set: luSet.number,
          team: appliedTeamLabel
        });
        break;
      }

      case ACTIONS.CONFIRM_SET_START:
      case 'START_SET': {
        var csIdx = action.setIndex != null ? action.setIndex : state.currentSetIndex;
        state.currentSetIndex = csIdx;
        var csSet = state.sets[csIdx];

        if (action.lineups && action.lineups.A) applyLineupToTeamMut(state, csSet, csIdx, 'A', action.lineups.A);
        if (action.lineups && action.lineups.B) applyLineupToTeamMut(state, csSet, csIdx, 'B', action.lineups.B);
        if (action.startersA) applyLineupToTeamMut(state, csSet, csIdx, 'A', action.startersA);
        if (action.startersB) applyLineupToTeamMut(state, csSet, csIdx, 'B', action.startersB);

        if (validTeamKey(action.leftTeam)) {
          csSet.initialLeftTeam = action.leftTeam;
          csSet.leftTeam = action.leftTeam;
          csSet.rightTeam = oppTeam(action.leftTeam);
          if (csIdx === 0) state.toss.initialLeft = action.leftTeam;
          if (csSet.isDeciding) state.toss.decidingInitialLeft = action.leftTeam;
        }
        if (validTeamKey(action.firstServe)) {
          csSet.firstServe = action.firstServe;
          if (csIdx === 0) state.toss.firstServeSet1 = action.firstServe;
          if (csSet.isDeciding) state.toss.decidingFirstServe = action.firstServe;
        }

        var srv = csSet.firstServe;
        var rcv = oppTeam(srv);
        csSet.servingTeam = srv;
        csSet.status = 'live';
        csSet.startTime = action.startTime || csSet.startTime || formatNowHHMM();
        state.phase = 'live';

        // Reset court & initialize Position I service turns: ✓ for server, X for receiver
        ['A', 'B'].forEach(function (t) {
          var lu = csSet.lineups[t];
          lu.court = lu.starters.slice();
          lu.serverPosIndex = 0;
          for (var p = 0; p < 6; p++) {
            lu.positions[p] = {
              starter: lu.starters[p],
              sub: null,
              subReentered: false,
              subScores: [],
              serviceTurns: []
            };
          }
        });

        csSet.lineups[srv].positions[0].serviceTurns = [
          { initialCheck: true, exitScore: null, postSwitch: false }
        ];
        csSet.lineups[rcv].positions[0].serviceTurns = [
          { initialX: true, exitScore: null, postSwitch: false }
        ];

        state.highlights.push(
          { section: 'set', setIndex: csIdx, team: srv, col: 0, turnIndex: 0, field: 'service' },
          { section: 'set', setIndex: csIdx, team: rcv, col: 0, turnIndex: 0, field: 'service' }
        );
        refreshSetWinFlags(state);
        state.lastActionLabel = tr('actions.setStarted', lang, { set: csSet.number });
        break;
      }

      case ACTIONS.SCORE_POINT: {
        var idxScore = action.setIndex != null ? action.setIndex : state.currentSetIndex;
        var setScore = state.sets[idxScore];
        var scTeam = validTeamKey(action.team)
          ? action.team
          : action.side === 'left'
            ? setScore.leftTeam
            : setScore.rightTeam;

        var res = applyRallyPointMut(state, idxScore, scTeam, Boolean(action.byPenalty));
        var tName = state.teams[scTeam].shortName || state.teams[scTeam].name || scTeam;

        if (state.justSwitchedAt8) {
          state.lastActionLabel = tr('actions.switch8', lang, {
            team: tName,
            scoreA: setScore.points.A,
            scoreB: setScore.points.B
          });
        } else if (res.wasSideOut) {
          state.lastActionLabel = tr('actions.sideOutScored', lang, {
            team: tName,
            scoreA: setScore.points.A,
            scoreB: setScore.points.B
          });
        } else {
          state.lastActionLabel = tr('actions.pointScored', lang, {
            team: tName,
            scoreA: setScore.points.A,
            scoreB: setScore.points.B
          });
        }
        break;
      }

      case ACTIONS.FINISH_SET:
      case 'END_SET':
      case 'CONFIRM_SET_END': {
        var fIdx = action.setIndex != null ? action.setIndex : state.currentSetIndex;
        var fSet = state.sets[fIdx];
        var winner =
          detectSetWinner(fSet) ||
          (validTeamKey(action.winner) ? action.winner : fSet.points.A >= fSet.points.B ? 'A' : 'B');

        // Close winning server's current open serviceTurn with circled winning score
        var winSrv = fSet.servingTeam;
        var winLineup = fSet.lineups[winSrv];
        if (winLineup && Array.isArray(winLineup.positions)) {
          var wColIdx = winLineup.serverPosIndex || 0;
          var wTurns = winLineup.positions[wColIdx].serviceTurns;
          if (wTurns.length > 0 && wTurns[wTurns.length - 1].exitScore === null) {
            wTurns[wTurns.length - 1].exitScore = fSet.points[winSrv];
            wTurns[wTurns.length - 1].isWinningCircle = true;
            if (fSet.isDeciding && fSet.switchedAt8) {
              wTurns[wTurns.length - 1].postSwitch = true;
            }
            state.highlights.push({
              section: 'set',
              setIndex: fIdx,
              team: winSrv,
              col: wColIdx,
              turnIndex: wTurns.length - 1,
              field: 'service'
            });
          } else {
            wTurns.push({
              initialCheck: true,
              exitScore: fSet.points[winSrv],
              isWinningCircle: true,
              postSwitch: Boolean(fSet.switchedAt8)
            });
          }
        }

        fSet.endTime = action.endTime || fSet.endTime || formatNowHHMM();
        if (action.durationMin != null) {
          fSet.durationMin = Number(action.durationMin);
        } else {
          var computedDur = computeDurationMinutes(fSet.startTime, fSet.endTime);
          fSet.durationMin = computedDur !== null ? computedDur : 0;
        }
        fSet.winner = winner;
        fSet.status = 'finished';
        state.setPointReached = null;
        state.canFinishSet = null;

        // Check match winner
        var winsCount = { A: 0, B: 0 };
        for (var wi = 0; wi < state.sets.length; wi++) {
          if (state.sets[wi].winner === 'A') winsCount.A += 1;
          if (state.sets[wi].winner === 'B') winsCount.B += 1;
        }
        var setsNeeded = Math.ceil(state.meta.bestOf / 2);

        if (winsCount[winner] >= setsNeeded || fIdx >= state.sets.length - 1) {
          state.matchWinner = winsCount.A > winsCount.B ? 'A' : winsCount.B > winsCount.A ? 'B' : winner;
          state.phase = 'finished';
          state.highlights.push({ section: 'results', field: 'matchWinner' });
        } else {
          var nextSetIdx = fIdx + 1;
          state.currentSetIndex = nextSetIdx;
          var nextSet = state.sets[nextSetIdx];
          nextSet.status = 'lineup';
          state.phase = 'lineup';

          if (!nextSet.isDeciding) {
            nextSet.initialLeftTeam = fSet.rightTeam;
            nextSet.leftTeam = fSet.rightTeam;
            nextSet.rightTeam = fSet.leftTeam;
            nextSet.firstServe = oppTeam(fSet.firstServe);
            nextSet.servingTeam = nextSet.firstServe;
          } else {
            var decInitialLeft = validTeamKey(state.toss.decidingInitialLeft)
              ? state.toss.decidingInitialLeft
              : fSet.rightTeam;
            var decFirstServe = validTeamKey(state.toss.decidingFirstServe)
              ? state.toss.decidingFirstServe
              : oppTeam(fSet.firstServe);
            nextSet.initialLeftTeam = decInitialLeft;
            nextSet.leftTeam = decInitialLeft;
            nextSet.rightTeam = oppTeam(decInitialLeft);
            nextSet.firstServe = decFirstServe;
            nextSet.servingTeam = decFirstServe;
          }
        }

        state.lastActionLabel = tr('actions.setFinished', lang, {
          set: fSet.number,
          scoreA: fSet.points.A,
          scoreB: fSet.points.B
        });
        break;
      }

      case ACTIONS.SUBSTITUTE: {
        var sIdx = action.setIndex != null ? action.setIndex : state.currentSetIndex;
        var sSet = state.sets[sIdx];
        var sTeam = action.team;
        var sOpp = oppTeam(sTeam);
        var outNum = normalizeNumber(action.outNumber);
        var inNum = normalizeNumber(action.inNumber);
        var sLineup = sSet.lineups[sTeam];

        ensurePlayerOnRoster(state.teams[sTeam], inNum);

        var colIdx = findCourtColumnIndex(sLineup, outNum);
        var zonePos = sLineup.court.findIndex(function (n) { return normalizeNumber(n) === outNum; });
        sLineup.court[zonePos] = inNum;
        sSet.subCount[sTeam] += 1;

        var posCol = sLineup.positions[colIdx];
        var isExceptional = Boolean(action.exceptional);

        if (posCol.sub === null) {
          posCol.sub = inNum;
        } else if (!posCol.subReentered && inNum === normalizeNumber(posCol.starter)) {
          posCol.subReentered = true;
        } else {
          // Forced / Exceptional substitution beyond standard starter-sub pair
          posCol.subReentered = true;
          if (!Array.isArray(posCol.extraSubs)) posCol.extraSubs = [];
          posCol.extraSubs.push(inNum);
          posCol.exceptionalSub = inNum;
          isExceptional = true;
        }

        posCol.subScores.push({
          team: sSet.points[sTeam],
          opp: sSet.points[sOpp],
          postSwitch: sSet.switchedAt8,
          exceptional: isExceptional
        });

        if (action.exceptional || (warnings.length > 0 && action.force)) {
          var exNote =
            lang === 'de'
              ? 'Ausnahmespielerwechsel Team ' + sTeam + ' (' + state.teams[sTeam].name + '): #' +
                inNum + ' für #' + outNum + ' (Satz ' + sSet.number + ', ' + sSet.points[sTeam] + ':' + sSet.points[sOpp] + ')'
              : 'Exceptional Substitution Team ' + sTeam + ' (' + state.teams[sTeam].name + '): #' +
                inNum + ' for #' + outNum + ' (Set ' + sSet.number + ', ' + sSet.points[sTeam] + ':' + sSet.points[sOpp] + ')';
          appendRemarkLine(state, exNote);
          state.highlights.push({ section: 'remarks' });
        }

        state.highlights.push({
          section: 'set',
          setIndex: sIdx,
          team: sTeam,
          col: colIdx,
          field: 'sub'
        });
        state.lastActionLabel = tr('actions.substituted', lang, {
          team: state.teams[sTeam].shortName || sTeam,
          outNum: outNum,
          inNum: inNum
        });
        break;
      }

      case ACTIONS.TIMEOUT: {
        var tIdx = action.setIndex != null ? action.setIndex : state.currentSetIndex;
        var tSet = state.sets[tIdx];
        var tTeam = action.team;
        var tOpp = oppTeam(tTeam);

        tSet.timeouts[tTeam].push({
          team: tSet.points[tTeam],
          opp: tSet.points[tOpp],
          postSwitch: tSet.switchedAt8
        });

        state.highlights.push({
          section: 'set',
          setIndex: tIdx,
          team: tTeam,
          index: tSet.timeouts[tTeam].length - 1,
          field: 'timeout'
        });
        state.lastActionLabel = tr('actions.timeout', lang, {
          team: state.teams[tTeam].shortName || tTeam,
          score: tSet.points[tTeam] + ':' + tSet.points[tOpp]
        });
        break;
      }

      case ACTIONS.ADD_SANCTION: {
        var sanTeam = action.team;
        if (!validTeamKey(sanTeam)) {
          return { doc: doc, warnings: [], error: 'Invalid sanctioned team' };
        }
        var sanOpp = oppTeam(sanTeam);
        var sanSetIdx = action.setIndex != null ? action.setIndex : state.currentSetIndex;
        var sanSet = state.sets[sanSetIdx] || state.sets[0];
        var sType = action.sanctionType || action.subType || action.cardType || 'warning';

        var codeMap = {
          warning: 'W',
          penalty: 'P',
          expulsion: 'E',
          disqualification: 'D',
          delayWarning: 'W',
          delayPenalty: 'P'
        };
        var code = codeMap[sType] || 'W';
        var isDelay = sType === 'delayWarning' || sType === 'delayPenalty';
        var rawPerson = normalizeNumber(
          action.person != null
            ? action.person
            : action.playerNumber != null
              ? action.playerNumber
              : action.target != null
                ? action.target
                : isDelay
                  ? 'D'
                  : 'C'
        );
        var person = isDelay ? 'D' : (rawPerson || 'C');

        var teamPtsAtSanction = sanSet.points[sanTeam];
        var oppPtsAtSanction = sanSet.points[sanOpp];
        var shouldAwardPoint =
          (sType === 'penalty' || sType === 'delayPenalty') &&
          action.awardPoint !== false &&
          sanSet.status === 'live' &&
          !detectSetWinner(sanSet);

        var sanctionRecord = {
          id: 'san_' + (state.sanctions.length + 1),
          type: sType,
          sanctionType: sType,
          code: code,
          isDelay: isDelay,
          person: person,
          target: person,
          team: sanTeam,
          set: sanSet.number,
          points: { A: sanSet.points.A, B: sanSet.points.B },
          teamScore: teamPtsAtSanction,
          oppScore: oppPtsAtSanction,
          score: teamPtsAtSanction + ':' + oppPtsAtSanction,
          pointAwarded: Boolean(shouldAwardPoint)
        };
        state.sanctions.push(sanctionRecord);
        state.highlights.push({
          section: 'sanctions',
          index: state.sanctions.length - 1,
          team: sanTeam,
          field: code
        });

        if (shouldAwardPoint) {
          applyRallyPointMut(state, sanSetIdx, sanOpp, true);
        }

        state.lastActionLabel = tr('actions.sanction', lang, {
          code: isDelay ? 'D-' + code : code,
          team: state.teams[sanTeam].shortName || sanTeam
        });
        break;
      }

      case ACTIONS.IMPROPER_REQUEST: {
        var irTeam = action.team;
        var irOpp = oppTeam(irTeam);
        var irSet = getCurrentSet(state) || state.sets[0];
        var prevCount = state.improperRequests[irTeam] ? state.improperRequests[irTeam].count : 0;

        state.improperRequests[irTeam] = {
          count: prevCount + 1,
          set: irSet.number,
          points: { A: irSet.points.A, B: irSet.points.B },
          teamScore: irSet.points[irTeam],
          oppScore: irSet.points[irOpp],
          score: irSet.points[irTeam] + ':' + irSet.points[irOpp]
        };
        state.highlights.push({ section: 'sanctions', team: irTeam, field: 'improperRequest' });
        state.lastActionLabel = tr('actions.improperRequest', lang, {
          team: state.teams[irTeam].shortName || irTeam
        });
        break;
      }

      case ACTIONS.SWAP_SIDES: {
        var swIdx = action.setIndex != null ? action.setIndex : state.currentSetIndex;
        var swSet = state.sets[swIdx];
        if (swSet) {
          var prevL = swSet.leftTeam;
          swSet.leftTeam = swSet.rightTeam;
          swSet.rightTeam = prevL;
          if (!swSet.firstRallyPlayed && swSet.status !== 'finished') {
            swSet.initialLeftTeam = swSet.leftTeam;
            if (swIdx === 0) state.toss.initialLeft = swSet.leftTeam;
            if (swSet.isDeciding) state.toss.decidingInitialLeft = swSet.leftTeam;
          }
          state.highlights.push({ section: 'set', setIndex: swIdx, field: 'sides' });
        }
        state.lastActionLabel = tr('actions.sidesSwapped', lang);
        break;
      }

      case ACTIONS.SET_REMARKS: {
        state.remarks = action.remarks != null ? String(action.remarks) : '';
        state.highlights.push({ section: 'remarks' });
        state.lastActionLabel = tr('actions.remarksUpdated', lang);
        break;
      }

      case ACTIONS.SET_MANUAL_OVERRIDE: {
        var cellKey = String(action.cellKey || action.key || '').trim();
        if (!cellKey) {
          return { doc: doc, warnings: [], error: 'cellKey is required for SET_MANUAL_OVERRIDE' };
        }
        if (action.clear === true || action.value === null || action.value === undefined) {
          delete state.manualOverrides[cellKey];
        } else {
          state.manualOverrides[cellKey] = String(action.value);
        }
        state.highlights.push({ section: 'override', cellKey: cellKey });
        state.lastActionLabel = tr('actions.overrideSet', lang, { key: cellKey });
        break;
      }

      case ACTIONS.CLEAR_MANUAL_OVERRIDES: {
        state.manualOverrides = {};
        state.lastActionLabel = tr('actions.overridesCleared', lang);
        break;
      }

      case ACTIONS.SET_SIGNATURE: {
        var sigRole = String(action.role || action.key || '').trim();
        if (!sigRole || !Object.prototype.hasOwnProperty.call(state.signatures, sigRole)) {
          return { doc: doc, warnings: [], error: 'Invalid signature role: ' + sigRole };
        }
        var sigVal = action.dataUrl !== undefined ? action.dataUrl : action.value;
        state.signatures[sigRole] = sigVal ? String(sigVal) : null;
        state.highlights.push({ section: 'signatures', role: sigRole });
        state.lastActionLabel = tr('actions.signatureUpdated', lang, { role: sigRole });
        break;
      }

      case ACTIONS.UPDATE_SET_TIMES: {
        var utIdx = action.setIndex != null ? action.setIndex : state.currentSetIndex;
        var utSet = state.sets[utIdx];
        if (!utSet) {
          return { doc: doc, warnings: [], error: 'Invalid setIndex' };
        }
        if (action.startTime !== undefined) utSet.startTime = String(action.startTime);
        if (action.endTime !== undefined) utSet.endTime = String(action.endTime);
        if (action.durationMin !== undefined) {
          utSet.durationMin = action.durationMin === null ? null : Number(action.durationMin);
        } else {
          var recomputed = computeDurationMinutes(utSet.startTime, utSet.endTime);
          if (recomputed !== null) utSet.durationMin = recomputed;
        }
        state.highlights.push({ section: 'set', setIndex: utIdx, field: 'times' });
        state.lastActionLabel = tr('actions.setTimesUpdated', lang, { set: utSet.number });
        break;
      }

      default:
        return { doc: doc, warnings: [], error: 'Unknown action type: ' + type };
    }

    var nextPast = doc.past.slice();
    if (!action.skipHistory) {
      nextPast.push(prevState);
      if (nextPast.length > MAX_HISTORY) {
        nextPast = nextPast.slice(nextPast.length - MAX_HISTORY);
      }
    }

    var nextDoc = {
      state: state,
      past: nextPast,
      future: action.skipHistory ? doc.future.slice() : [],
      version: doc.version || VERSION
    };

    return {
      doc: nextDoc,
      warnings: warnings,
      error: null
    };
  }

  function canUndo(doc) {
    return Boolean(doc && Array.isArray(doc.past) && doc.past.length > 0);
  }

  function canRedo(doc) {
    return Boolean(doc && Array.isArray(doc.future) && doc.future.length > 0);
  }

  function undo(doc) {
    if (!canUndo(doc)) return doc;
    var nextPast = doc.past.slice(0, doc.past.length - 1);
    var restoredState = deepClone(doc.past[doc.past.length - 1]);
    var nextFuture = [deepClone(doc.state)].concat(doc.future || []);
    if (nextFuture.length > MAX_HISTORY) {
      nextFuture = nextFuture.slice(0, MAX_HISTORY);
    }
    return {
      state: restoredState,
      past: nextPast,
      future: nextFuture,
      version: doc.version || VERSION
    };
  }

  function redo(doc) {
    if (!canRedo(doc)) return doc;
    var nextState = deepClone(doc.future[0]);
    var nextFuture = doc.future.slice(1);
    var nextPast = (doc.past || []).concat([deepClone(doc.state)]);
    if (nextPast.length > MAX_HISTORY) {
      nextPast = nextPast.slice(nextPast.length - MAX_HISTORY);
    }
    return {
      state: nextState,
      past: nextPast,
      future: nextFuture,
      version: doc.version || VERSION
    };
  }

  /**
   * Compute per-set and full-match Results Summary (`T`, `S`, `W`, `P`, `durationMin`, `matchWinner`).
   */
  function computeSummary(state) {
    if (!state || !Array.isArray(state.sets)) {
      return {
        sets: [],
        totals: {
          A: { T: 0, S: 0, W: 0, P: 0 },
          B: { T: 0, S: 0, W: 0, P: 0 },
          totalDurationMin: 0,
          startTime: '',
          endTime: ''
        },
        matchWinner: null,
        matchWinnerName: null,
        setsScore: { A: 0, B: 0 }
      };
    }

    var setsSummary = [];
    var totA = { T: 0, S: 0, W: 0, P: 0 };
    var totB = { T: 0, S: 0, W: 0, P: 0 };
    var totalDurationMin = 0;
    var firstStartTime = '';
    var lastEndTime = '';

    for (var i = 0; i < state.sets.length; i++) {
      var s = state.sets[i];
      var played =
        s.status === 'live' ||
        s.status === 'finished' ||
        Boolean(s.firstRallyPlayed) ||
        s.points.A > 0 ||
        s.points.B > 0;

      var dur = null;
      if (played) {
        if (s.durationMin !== null && s.durationMin !== undefined) {
          dur = Number(s.durationMin);
        } else {
          dur = computeDurationMinutes(s.startTime, s.endTime);
        }
      }

      if (played && s.startTime && !firstStartTime) {
        firstStartTime = s.startTime;
      }
      if (s.endTime) {
        lastEndTime = s.endTime;
      }

      var rowA = {
        T: s.timeouts.A.length,
        S: s.subCount.A,
        W: s.winner === 'A' ? 1 : 0,
        P: s.points.A
      };
      var rowB = {
        T: s.timeouts.B.length,
        S: s.subCount.B,
        W: s.winner === 'B' ? 1 : 0,
        P: s.points.B
      };

      if (played) {
        totA.T += rowA.T;
        totA.S += rowA.S;
        totA.W += rowA.W;
        totA.P += rowA.P;

        totB.T += rowB.T;
        totB.S += rowB.S;
        totB.W += rowB.W;
        totB.P += rowB.P;

        if (typeof dur === 'number' && !isNaN(dur)) {
          totalDurationMin += dur;
        }
      }

      setsSummary.push({
        setIndex: i,
        setNumber: s.number,
        isDeciding: s.isDeciding,
        status: s.status,
        played: played,
        finished: s.status === 'finished',
        startTime: s.startTime || '',
        endTime: s.endTime || '',
        durationMin: dur,
        winner: s.winner,
        A: rowA,
        B: rowB
      });
    }

    var needed = Math.ceil(((state.meta && state.meta.bestOf) || 5) / 2);
    var matchWinner =
      state.matchWinner ||
      (totA.W >= needed ? 'A' : totB.W >= needed ? 'B' : null);

    var totalsObj = {
      A: totA,
      B: totB,
      totalDurationMin: totalDurationMin,
      startTime: firstStartTime || (state.meta && state.meta.time) || '',
      endTime: lastEndTime
    };

    return {
      sets: setsSummary,
      perSet: setsSummary,
      totals: totalsObj,
      matchTotals: totalsObj,
      matchWinner: matchWinner,
      matchWinnerName: matchWinner && state.teams[matchWinner] ? state.teams[matchWinner].name : null,
      setsScore: { A: totA.W, B: totB.W }
    };
  }

  function normalizeStateSnapshot(st) {
    if (!st || typeof st !== 'object') return st;
    if (!st.meta || typeof st.meta !== 'object') st.meta = {};
    st.meta.matchType = normalizeMatchType(st.meta.matchType);
    st.meta.level = normalizeLevel(st.meta.level, 'regional');
    st.meta.gender = normalizeGender(st.meta.gender, st.meta.category, 'women');
    st.meta.ageGroup = normalizeAgeGroup(st.meta.ageGroup, st.meta.category);
    if (st.meta.category == null || st.meta.category === '') {
      st.meta.category = buildCategoryString(st.meta.gender, st.meta.ageGroup, st.lang || 'en');
    }
    if (st.teams && typeof st.teams === 'object') {
      ['A', 'B'].forEach(function (tk) {
        var tm = st.teams[tk];
        if (!tm || typeof tm !== 'object') return;
        if (Array.isArray(tm.players)) {
          tm.players = tm.players.map(normalizePlayer).filter(Boolean);
        }
        if (Array.isArray(tm.liberos)) {
          tm.liberos = tm.liberos.map(normalizeLibero).filter(Boolean);
        }
      });
    }
    return st;
  }

  function normalizeDoc(raw) {
    if (!raw || typeof raw !== 'object' || !raw.state || typeof raw.state !== 'object') {
      return null;
    }
    var cloned = deepClone(raw);
    normalizeStateSnapshot(cloned.state);
    if (!Array.isArray(cloned.past)) {
      cloned.past = [];
    } else {
      for (var pi = 0; pi < cloned.past.length; pi++) {
        normalizeStateSnapshot(cloned.past[pi]);
      }
    }
    if (!Array.isArray(cloned.future)) {
      cloned.future = [];
    } else {
      for (var fi = 0; fi < cloned.future.length; fi++) {
        normalizeStateSnapshot(cloned.future[fi]);
      }
    }
    if (!cloned.version) cloned.version = VERSION;
    return cloned;
  }

  function saveToStorage(doc, key) {
    var storageKey = key || STORAGE_KEY;
    if (!doc || !doc.state) return false;
    var serialized = JSON.stringify(doc);
    var ls = getStorageBackend();
    if (ls) {
      try {
        ls.setItem(storageKey, serialized);
        return true;
      } catch (_e) {
        // If quota exceeded with large undo stack, trim older past states and retry
        try {
          var slimDoc = {
            state: doc.state,
            past: Array.isArray(doc.past) ? doc.past.slice(-60) : [],
            future: Array.isArray(doc.future) ? doc.future.slice(0, 60) : [],
            version: doc.version || VERSION
          };
          ls.setItem(storageKey, JSON.stringify(slimDoc));
          return true;
        } catch (_e2) {
          memoryStorage[storageKey] = serialized;
          return true;
        }
      }
    }
    memoryStorage[storageKey] = serialized;
    return true;
  }

  function loadFromStorage(key) {
    var storageKey = key || STORAGE_KEY;
    var rawStr = null;
    var ls = getStorageBackend();
    if (ls) {
      try {
        rawStr = ls.getItem(storageKey);
      } catch (_e) {
        rawStr = null;
      }
    }
    if (rawStr == null && Object.prototype.hasOwnProperty.call(memoryStorage, storageKey)) {
      rawStr = memoryStorage[storageKey];
    }
    if (!rawStr) return null;
    try {
      var parsed = JSON.parse(rawStr);
      return normalizeDoc(parsed);
    } catch (_err) {
      return null;
    }
  }

  function clearStorage(key) {
    var storageKey = key || STORAGE_KEY;
    delete memoryStorage[storageKey];
    var ls = getStorageBackend();
    if (ls) {
      try {
        ls.removeItem(storageKey);
      } catch (_e) {
        return false;
      }
    }
    return true;
  }

  /**
   * Create a realistic Swiss Volley NLA sample match (Volley Köniz vs VBC Zürich)
   * with complete rosters, Liberos, Set 1 completed (25:22), and Set 2 live (14:12)
   * with substitutions, starter re-entries, timeouts, rotations, sanctions, and Undo history.
   */
  function createDemoMatch(lang) {
    var safeLang = lang === 'en' ? 'en' : 'de';
    var doc = createStore({
      lang: safeLang,
      meta: {
        competition: 'Nationalliga A',
        matchType: 'championship',
        level: 'national',
        gender: 'women',
        ageGroup: '',
        category: safeLang === 'de' ? 'Frauen' : 'Women',
        matchNumber: '10428',
        city: 'Köniz',
        hall: 'Sporthalle Weissenstein',
        federation: 'Swiss Volley',
        date: todayISOString(),
        time: '17:30',
        bestOf: 5,
        referee1: 'M. Brunner',
        referee2: 'S. Keller',
        scorer: 'L. Meier',
        assistantScorer: 'N. Schmid',
        lineJudges: ['R. Wyss', 'P. Moser', '', '']
      },
      toss: {
        firstServeSet1: 'A',
        initialLeft: 'A',
        decidingFirstServe: null,
        decidingInitialLeft: null
      },
      teams: {
        A: {
          name: 'Volley Köniz',
          shortName: 'VKÖ',
          color: '#1d4ed8',
          players: [
            { number: '2', name: 'Bärtschi Lea', birthdate: '14.03.2001', license: '104202', isCaptain: false },
            { number: '4', name: 'Gerber Nina', birthdate: '22.07.1999', license: '101844', isCaptain: false },
            { number: '6', name: 'Hofer Alina', birthdate: '09.11.2002', license: '106512', isCaptain: false },
            { number: '7', name: 'Steiner Céline', birthdate: '18.05.1998', license: '100937', isCaptain: true },
            { number: '9', name: 'Künzi Mara', birthdate: '03.02.2003', license: '108309', isCaptain: false },
            { number: '11', name: 'Widmer Jana', birthdate: '27.09.2000', license: '103111', isCaptain: false },
            { number: '14', name: 'Zaugg Elena', birthdate: '11.12.2001', license: '104914', isCaptain: false },
            { number: '15', name: 'Lüthi Noemi', birthdate: '05.06.2004', license: '110215', isCaptain: false },
            { number: '17', name: 'Aebischer Sara', birthdate: '19.08.2002', license: '106817', isCaptain: false }
          ],
          liberos: [
            { number: '12', name: 'Schneeberger Mia', birthdate: '30.01.2000', license: '102712', isCaptain: false },
            { number: '18', name: 'Ryser Chiara', birthdate: '16.04.2004', license: '110418', isCaptain: false }
          ],
          officials: {
            coach: 'T. Lehmann',
            assistantCoach1: 'D. Sutter',
            assistantCoach2: '',
            therapist: 'K. Frei',
            doctor: ''
          }
        },
        B: {
          name: 'VBC Zürich',
          shortName: 'VBZ',
          color: '#dc2626',
          players: [
            { number: '3', name: 'Baumann Lara', birthdate: '08.04.2000', license: '102903', isCaptain: false },
            { number: '4', name: 'Keller Giulia', birthdate: '12.10.1997', license: '100404', isCaptain: true },
            { number: '5', name: 'Huber Svenja', birthdate: '25.01.2002', license: '106105', isCaptain: false },
            { number: '8', name: 'Meier Fiona', birthdate: '17.07.2001', license: '104708', isCaptain: false },
            { number: '10', name: 'Weber Anja', birthdate: '02.09.1999', license: '101910', isCaptain: false },
            { number: '13', name: 'Fischer Zoe', birthdate: '29.11.2003', license: '108613', isCaptain: false },
            { number: '15', name: 'Graf Nadine', birthdate: '14.06.2001', license: '104615', isCaptain: false },
            { number: '19', name: 'Vogel Liv', birthdate: '21.03.2004', license: '110319', isCaptain: false },
            { number: '20', name: 'Roth Camille', birthdate: '07.12.2000', license: '103220', isCaptain: false }
          ],
          liberos: [
            { number: '1', name: 'studer Hannah'.replace(/^s/, 'S'), birthdate: '15.05.1999', license: '101501', isCaptain: false },
            { number: '16', name: 'Bucher Yael', birthdate: '10.02.2003', license: '108216', isCaptain: false }
          ],
          officials: {
            coach: 'R. Rossi',
            assistantCoach1: 'M. Kälin',
            assistantCoach2: '',
            therapist: 'S. Betschart',
            doctor: ''
          }
        }
      }
    });

    function run(act) {
      var out = dispatch(doc, act);
      doc = out.doc;
    }

    function scoreRun(team, count) {
      for (var c = 0; c < count; c++) {
        run({ type: ACTIONS.SCORE_POINT, team: team });
      }
    }

    // --- SET 1: Volley Köniz 25 : 22 VBC Zürich ---
    run({
      type: ACTIONS.CONFIRM_SET_START,
      setIndex: 0,
      startTime: '17:30',
      leftTeam: 'A',
      firstServe: 'A',
      startersA: ['7', '4', '9', '11', '2', '14'],
      startersB: ['4', '8', '10', '15', '3', '13']
    });

    scoreRun('A', 2); // 2:0
    scoreRun('B', 2); // 2:2
    scoreRun('A', 3); // 5:2
    scoreRun('B', 3); // 5:5
    scoreRun('A', 4); // 9:5
    run({ type: ACTIONS.TIMEOUT, team: 'B' }); // B T1 at 5:9
    scoreRun('B', 3); // 9:8
    scoreRun('A', 3); // 12:8
    run({ type: ACTIONS.SUBSTITUTE, team: 'B', outNumber: '15', inNumber: '20' });
    scoreRun('B', 4); // 12:12
    run({ type: ACTIONS.TIMEOUT, team: 'A' }); // A T1 at 12:12
    scoreRun('A', 4); // 16:12
    run({ type: ACTIONS.SUBSTITUTE, team: 'A', outNumber: '11', inNumber: '15' });
    scoreRun('B', 3); // 16:15
    run({ type: ACTIONS.SUBSTITUTE, team: 'B', outNumber: '20', inNumber: '15' }); // Starter #15 re-enters (circles #20)
    scoreRun('A', 4); // 20:15
    run({ type: ACTIONS.TIMEOUT, team: 'B' }); // B T2 at 15:20
    scoreRun('B', 4); // 20:19
    run({ type: ACTIONS.SUBSTITUTE, team: 'A', outNumber: '15', inNumber: '11' }); // Starter #11 re-enters (circles #15)
    scoreRun('A', 3); // 23:19
    scoreRun('B', 3); // 23:22
    scoreRun('A', 2); // 25:22
    run({ type: ACTIONS.FINISH_SET, endTime: '17:56', durationMin: 26 });

    // --- SET 2 (Live in progress: Volley Köniz 14 : 12 VBC Zürich) ---
    // In Set 2, teams automatically switched sides (B on Left, A on Right) and B serves first.
    run({
      type: ACTIONS.CONFIRM_SET_START,
      setIndex: 1,
      startTime: '17:59',
      startersA: ['4', '9', '11', '2', '14', '7'],
      startersB: ['8', '10', '15', '3', '13', '4']
    });

    scoreRun('B', 2); // A 0 : 2 B
    scoreRun('A', 3); // A 3 : 2 B
    scoreRun('B', 2); // A 3 : 4 B
    scoreRun('A', 3); // A 6 : 4 B
    scoreRun('B', 3); // A 6 : 7 B
    run({ type: ACTIONS.ADD_SANCTION, team: 'B', sanctionType: 'warning', person: '8' });
    scoreRun('A', 4); // A 10 : 7 B
    run({ type: ACTIONS.TIMEOUT, team: 'B' }); // B T1 at 7:10
    scoreRun('B', 3); // A 10 : 10 B
    run({ type: ACTIONS.SUBSTITUTE, team: 'A', outNumber: '14', inNumber: '17' });
    scoreRun('A', 2); // A 12 : 10 B
    scoreRun('B', 2); // A 12 : 12 B
    scoreRun('A', 2); // A 14 : 12 B

    return doc;
  }

  var Engine = {
    VERSION: VERSION,
    STORAGE_KEY: STORAGE_KEY,
    MAX_HISTORY: MAX_HISTORY,
    ROMAN_POSITIONS: ROMAN_POSITIONS,
    ACTIONS: ACTIONS,
    createStore: createStore,
    dispatch: dispatch,
    undo: undo,
    redo: redo,
    canUndo: canUndo,
    canRedo: canRedo,
    validateLineup: validateLineup,
    validateSubstitution: validateSubstitution,
    validateTimeout: validateTimeout,
    computeSummary: computeSummary,
    getCurrentSet: getCurrentSet,
    getBenchPlayers: getBenchPlayers,
    isActiveLibero: isActiveLibero,
    parseQuickNumbers: parseQuickNumbers,
    normalizeDoc: normalizeDoc,
    saveToStorage: saveToStorage,
    loadFromStorage: loadFromStorage,
    clearStorage: clearStorage,
    createDemoMatch: createDemoMatch
  };

  if (typeof window !== 'undefined') {
    window.Matchblatt = window.Matchblatt || {};
    window.Matchblatt.Engine = Engine;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Engine;
  } else if (root) {
    root.Matchblatt = root.Matchblatt || {};
    root.Matchblatt.Engine = Engine;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
