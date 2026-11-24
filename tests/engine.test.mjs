import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Mock browser localStorage for Node testing
function installMockStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    _store: store,
  };
  return store;
}

installMockStorage();

const I18NMod = require('../src/i18n.js');
const EngineMod = require('../src/engine.js');

const I18N = I18NMod.I18N || I18NMod;
const Engine = EngineMod.Engine || EngineMod;

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('\n=== Matchblatt I18N & Engine Specification Suite ===');

// 1. I18N Tests
test('I18N exposes en and de languages with variable interpolation and fallback', () => {
  assert.ok(Array.isArray(I18N.LANGUAGES), 'I18N.LANGUAGES must be an array');
  assert.ok(I18N.LANGUAGES.includes('en') && I18N.LANGUAGES.includes('de'), 'Must support en and de');
  assert.equal(typeof I18N.t, 'function', 'I18N.t must be a function');

  const missing = I18N.t('__nonexistent_key__', 'en', { fallback: 'Custom Fallback' });
  assert.equal(missing, 'Custom Fallback', 'Missing key should return params.fallback');
  const rawMissing = I18N.t('__nonexistent_key_2__', 'de');
  assert.equal(rawMissing, '__nonexistent_key_2__', 'Missing key without fallback returns key');
});

// Helper to dispatch and assert no unexpected error
function mustDispatch(doc, action) {
  const res = Engine.dispatch(doc, action);
  assert.equal(res.error, null, `Unexpected error on ${action.type}: ${res.error}`);
  return res;
}

// Helper to build a standard ready-to-play match
function setupReadyMatch(bestOf = 5) {
  let doc = Engine.createStore({
    competition: 'NLA Swiss Volley',
    category: 'Women',
    matchNumber: 'SV-402',
    city: 'Bern',
    hall: 'Sporthalle Weissenstein',
    bestOf,
  });

  // Update meta if needed
  doc = mustDispatch(doc, {
    type: 'UPDATE_META',
    meta: { bestOf, city: 'Bern', referee1: 'M. Weber', scorer: 'L. Meier' },
  }).doc;

  // Update toss
  doc = mustDispatch(doc, {
    type: 'UPDATE_TOSS',
    toss: { firstServeSet1: 'A', initialLeft: 'A', decidingFirstServe: 'B', decidingInitialLeft: 'B' },
  }).doc;

  // Team A: minimal jersey-only players + 1 full player + 2 liberos
  doc = mustDispatch(doc, {
    type: 'UPDATE_TEAM',
    team: 'A',
    data: {
      name: 'Volley Köniz',
      shortName: 'VKÖ',
      players: [
        { number: '1', name: 'Anna Keller', birthdate: '12.04.1999', isCaptain: true },
        { number: '4', name: '', birthdate: '', isCaptain: false },
        { number: '7', name: '', birthdate: '', isCaptain: false },
        { number: '9', name: '', birthdate: '', isCaptain: false },
        { number: '11', name: '', birthdate: '', isCaptain: false },
        { number: '14', name: '', birthdate: '', isCaptain: false },
        { number: '15', name: '', birthdate: '', isCaptain: false },
        { number: '18', name: '', birthdate: '', isCaptain: false },
      ],
      liberos: [
        { number: '12', name: 'Lea Schmid', birthdate: '', isCaptain: false },
        { number: '99', name: '', birthdate: '', isCaptain: false },
      ],
      officials: { coach: 'S. Hofer', assistantCoach1: '', assistantCoach2: '', therapist: '', doctor: '' },
    },
  }).doc;

  // Team B: ONLY jersey numbers provided (optional fields test!)
  doc = mustDispatch(doc, {
    type: 'UPDATE_TEAM',
    team: 'B',
    data: {
      name: 'VBC Zürich',
      shortName: 'ZÜR',
      players: [
        { number: '2', name: '', birthdate: '', isCaptain: true },
        { number: '5', name: '', birthdate: '', isCaptain: false },
        { number: '8', name: '', birthdate: '', isCaptain: false },
        { number: '10', name: '', birthdate: '', isCaptain: false },
        { number: '13', name: '', birthdate: '', isCaptain: false },
        { number: '16', name: '', birthdate: '', isCaptain: false },
        { number: '20', name: '', birthdate: '', isCaptain: false },
      ],
      liberos: [
        { number: '3', name: '', birthdate: '', isCaptain: false },
      ],
      officials: { coach: '', assistantCoach1: '', assistantCoach2: '', therapist: '', doctor: '' },
    },
  }).doc;

  return doc;
}

// 2. Best-of-5 and Best-of-3 Match Setups
test('Best-of-5 and Best-of-3 match setup structure and dynamic format switching', () => {
  const doc5 = setupReadyMatch(5);
  assert.equal(doc5.state.meta.bestOf, 5);
  assert.equal(doc5.state.sets.length, 5);
  assert.equal(doc5.state.sets[0].isDeciding, false);
  assert.equal(doc5.state.sets[0].targetPoints, 25);
  assert.equal(doc5.state.sets[4].isDeciding, true);
  assert.equal(doc5.state.sets[4].targetPoints, 15);

  // Switch to Best-of-3 via UPDATE_META
  const doc3 = mustDispatch(doc5, { type: 'UPDATE_META', meta: { bestOf: 3 } }).doc;
  assert.equal(doc3.state.meta.bestOf, 3);
  assert.equal(doc3.state.sets.length, 3);
  assert.equal(doc3.state.sets[0].isDeciding, false);
  assert.equal(doc3.state.sets[1].isDeciding, false);
  assert.equal(doc3.state.sets[2].isDeciding, true);
  assert.equal(doc3.state.sets[2].targetPoints, 15);
});

// 3. Optional Player Fields & Libero Guard + Injury Redesignation
test('Optional player fields (only jersey # required), Libero lineup guard, and injury redesignation', () => {
  let doc = setupReadyMatch(5);
  // Team B has empty names/birthdates/officials and works cleanly
  assert.equal(doc.state.teams.B.players.length, 7);
  assert.equal(doc.state.teams.B.players[1].name, '');

  // Attempting to put active Libero #12 in Team A starting lineup warns/blocks without force
  const libAttempt = Engine.dispatch(doc, {
    type: 'SET_LINEUP',
    setIndex: 0,
    team: 'A',
    starters: ['12', '4', '7', '9', '11', '14'],
  });
  const blockedOrWarned = (libAttempt.warnings && libAttempt.warnings.length > 0) || libAttempt.error !== null;
  assert.ok(blockedOrWarned, 'Entering an active Libero in starting lineup must warn or error without force');

  // Valid lineups for A and B
  doc = mustDispatch(doc, {
    type: 'SET_LINEUP',
    setIndex: 0,
    team: 'A',
    starters: ['1', '4', '7', '9', '11', '14'],
  }).doc;
  doc = mustDispatch(doc, {
    type: 'SET_LINEUP',
    setIndex: 0,
    team: 'B',
    starters: ['2', '5', '8', '10', '13', '16'],
  }).doc;

  // Test Libero injury redesignation
  const redesRes = Engine.dispatch(doc, {
    type: 'REDESIGNATE_LIBERO',
    team: 'B',
    outLiberoNumber: '3',
    newLiberoNumber: '20',
  });
  assert.equal(redesRes.error, null, `REDESIGNATE_LIBERO should succeed: ${redesRes.error}`);
  assert.ok(
    redesRes.doc.state.teams.B.liberos.some((l) => l.number === '20'),
    'Player #20 should now be registered in Team B liberos'
  );
});

// 4. Lineup, Initial ✓ vs X, Clockwise Rotation on Side-Out, and Exact Exit Scores
test('Set start marks ✓ on serving Pos I and X on receiving Pos I; side-out rotates clockwise so Pos II serves first for receiver', () => {
  let doc = setupReadyMatch(5);
  doc = mustDispatch(doc, {
    type: 'SET_LINEUP',
    setIndex: 0,
    team: 'A',
    starters: ['1', '4', '7', '9', '11', '14'],
  }).doc;
  doc = mustDispatch(doc, {
    type: 'SET_LINEUP',
    setIndex: 0,
    team: 'B',
    starters: ['2', '5', '8', '10', '13', '16'],
  }).doc;
  doc = mustDispatch(doc, { type: 'CONFIRM_SET_START', setIndex: 0 }).doc;

  let set0 = doc.state.sets[0];
  assert.equal(set0.status, 'live');
  assert.equal(set0.servingTeam, 'A');
  // Serving team A: Pos I (index 0) has initialCheck: true, exitScore: null
  assert.equal(set0.lineups.A.serverPosIndex, 0);
  assert.equal(set0.lineups.A.positions[0].serviceTurns.length, 1);
  assert.equal(set0.lineups.A.positions[0].serviceTurns[0].initialCheck, true);
  assert.equal(set0.lineups.A.positions[0].serviceTurns[0].exitScore, null);

  // Receiving team B: Pos I (index 0) has initialX: true
  assert.equal(set0.lineups.B.serverPosIndex, 0);
  assert.equal(set0.lineups.B.positions[0].serviceTurns.length, 1);
  assert.equal(set0.lineups.B.positions[0].serviceTurns[0].initialX, true);

  // Team A scores 2 points on #1's serve (score 2:0)
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc;
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc;
  set0 = doc.state.sets[0];
  assert.deepEqual(set0.points, { A: 2, B: 0 });
  assert.equal(set0.lineups.A.serverPosIndex, 0, 'Serving team does not rotate while holding serve');
  assert.equal(set0.lineups.A.positions[0].serviceTurns[0].exitScore, null, 'Turn still open');

  // Side-out! Team B scores (score 2:1)
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'B' }).doc;
  set0 = doc.state.sets[0];
  assert.deepEqual(set0.points, { A: 2, B: 1 });
  assert.equal(set0.servingTeam, 'B');

  // Team A's Pos I service turn closed with exitScore = 2
  assert.equal(set0.lineups.A.positions[0].serviceTurns[0].exitScore, 2);

  // Team B rotated clockwise: [2, 5, 8, 10, 13, 16] -> [5, 8, 10, 13, 16, 2]
  // So #5 (originally Pos II, col index 1) is now in zone I (court[0]) and serving!
  assert.deepEqual(set0.lineups.B.court, ['5', '8', '10', '13', '16', '2']);
  assert.equal(set0.lineups.B.serverPosIndex, 1, 'Pos II (index 1) serves first for initial receiving team');
  assert.equal(set0.lineups.B.positions[1].serviceTurns.length, 1);
  assert.equal(set0.lineups.B.positions[1].serviceTurns[0].initialCheck, true);
  assert.equal(set0.lineups.B.positions[1].serviceTurns[0].exitScore, null);

  // Team B scores 1 more on serve (2:2), then Team A sides out (3:2)
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'B' }).doc;
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc;
  set0 = doc.state.sets[0];
  assert.deepEqual(set0.points, { A: 3, B: 2 });
  assert.equal(set0.lineups.B.positions[1].serviceTurns[0].exitScore, 2, 'Team B Pos II exits at score 2');
  assert.equal(set0.lineups.A.serverPosIndex, 1, 'Team A rotates to Pos II (#4)');
  assert.deepEqual(set0.lineups.A.court, ['4', '7', '9', '11', '14', '1']);
});

// 5. Substitutions: Normal, Re-entry circling, Pair-lock warning, >6 subs warning + Force/Exceptional override
test('Substitutions track sub #, scores, starter re-entry circle, pair-lock rules, and >6 subs override', () => {
  let doc = setupReadyMatch(5);
  doc = mustDispatch(doc, {
    type: 'SET_LINEUP',
    setIndex: 0,
    team: 'A',
    starters: ['1', '4', '7', '9', '11', '14'],
  }).doc;
  doc = mustDispatch(doc, {
    type: 'SET_LINEUP',
    setIndex: 0,
    team: 'B',
    starters: ['2', '5', '8', '10', '13', '16'],
  }).doc;
  doc = mustDispatch(doc, { type: 'CONFIRM_SET_START', setIndex: 0 }).doc;
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc; // 1:0
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'B' }).doc; // 1:1

  // Sub #15 IN for starter #4 (col index 1) at 1:1
  doc = mustDispatch(doc, {
    type: 'SUBSTITUTE',
    team: 'A',
    outNumber: '4',
    inNumber: '15',
  }).doc;

  let col1 = doc.state.sets[0].lineups.A.positions[1];
  assert.equal(col1.sub, '15');
  assert.equal(col1.subReentered, false);
  assert.equal(col1.subScores.length, 1);
  assert.equal(col1.subScores[0].team, 1);
  assert.equal(col1.subScores[0].opp, 1);
  assert.equal(doc.state.sets[0].subCount.A, 1);
  assert.ok(doc.state.sets[0].lineups.A.court.includes('15'));

  // Pair lock check: trying to sub #18 IN for #15 (instead of starter #4) must warn without force!
  const pairLockRes = Engine.dispatch(doc, {
    type: 'SUBSTITUTE',
    team: 'A',
    outNumber: '15',
    inNumber: '18',
  });
  assert.ok(pairLockRes.warnings.length > 0, 'Subbing a 3rd player into locked pair must return warning');
  assert.ok(pairLockRes.doc.state.sets[0].lineups.A.court.includes('15'), 'State must not mutate on unforced warning');

  // Starter #4 re-enters for #15 at 2:1 -> subReentered becomes true (circles sub # on sheet!)
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc; // 2:1
  doc = mustDispatch(doc, {
    type: 'SUBSTITUTE',
    team: 'A',
    outNumber: '15',
    inNumber: '4',
  }).doc;
  col1 = doc.state.sets[0].lineups.A.positions[1];
  assert.equal(col1.sub, '15');
  assert.equal(col1.subReentered, true, 'Starter re-entry marks subReentered = true so sub # is circled');
  assert.equal(col1.subScores.length, 2);
  assert.equal(col1.subScores[1].team, 2);
  assert.equal(col1.subScores[1].opp, 1);
  assert.equal(doc.state.sets[0].subCount.A, 2);

  // Attempting to sub #15 back in again in same set must warn (re-entry exhausted)
  const thirdEntryRes = Engine.dispatch(doc, {
    type: 'SUBSTITUTE',
    team: 'A',
    outNumber: '4',
    inNumber: '15',
  });
  assert.ok(thirdEntryRes.warnings.length > 0, 'Third sub in same column must warn');

  // Exceptional / forced override works and notes remarks if exceptional
  const forcedExceptional = mustDispatch(doc, {
    type: 'SUBSTITUTE',
    team: 'A',
    outNumber: '4',
    inNumber: '18',
    force: true,
    exceptional: true,
  }).doc;
  assert.ok(forcedExceptional.state.sets[0].lineups.A.court.includes('18'), 'Force override executes substitution');
  assert.ok(forcedExceptional.state.remarks.length > 0, 'Exceptional substitution records note in remarks');

  // Add more roster players to test >6 substitutions limit warning + force override
  let docMany = mustDispatch(doc, {
    type: 'UPDATE_TEAM',
    team: 'A',
    data: {
      players: [
        ...doc.state.teams.A.players,
        { number: '21', name: '', birthdate: '', isCaptain: false },
        { number: '22', name: '', birthdate: '', isCaptain: false },
      ],
    },
  }).doc;
  // Currently subCount.A === 2. Perform 4 more legal subs (2 pairs) to reach 6:
  docMany = mustDispatch(docMany, { type: 'SUBSTITUTE', team: 'A', outNumber: '7', inNumber: '18' }).doc; // 3
  docMany = mustDispatch(docMany, { type: 'SUBSTITUTE', team: 'A', outNumber: '18', inNumber: '7' }).doc; // 4
  docMany = mustDispatch(docMany, { type: 'SUBSTITUTE', team: 'A', outNumber: '9', inNumber: '21' }).doc; // 5
  docMany = mustDispatch(docMany, { type: 'SUBSTITUTE', team: 'A', outNumber: '21', inNumber: '9' }).doc; // 6
  assert.equal(docMany.state.sets[0].subCount.A, 6);

  // 7th sub without force warns and does not mutate
  const seventhWarn = Engine.dispatch(docMany, { type: 'SUBSTITUTE', team: 'A', outNumber: '11', inNumber: '22' });
  assert.ok(seventhWarn.warnings.length > 0, '7th substitution must warn');
  assert.equal(seventhWarn.doc.state.sets[0].subCount.A, 6);

  // 7th sub with force: true succeeds
  const seventhForced = mustDispatch(docMany, {
    type: 'SUBSTITUTE',
    team: 'A',
    outNumber: '11',
    inNumber: '22',
    force: true,
  }).doc;
  assert.equal(seventhForced.state.sets[0].subCount.A, 7);
});

// 6. Timeouts (max 2 + warning/override), Sanctions (cards, penalty point + rotation), Swap Sides
test('Timeouts (max 2 + override), Sanctions (Yellow/Red Penalty awarding point + rotation), and Swap Sides', () => {
  let doc = setupReadyMatch(5);
  doc = mustDispatch(doc, { type: 'SET_LINEUP', setIndex: 0, team: 'A', starters: ['1', '4', '7', '9', '11', '14'] }).doc;
  doc = mustDispatch(doc, { type: 'SET_LINEUP', setIndex: 0, team: 'B', starters: ['2', '5', '8', '10', '13', '16'] }).doc;
  doc = mustDispatch(doc, { type: 'CONFIRM_SET_START', setIndex: 0 }).doc;
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc; // 1:0

  // Two timeouts for Team B
  doc = mustDispatch(doc, { type: 'TIMEOUT', team: 'B' }).doc;
  doc = mustDispatch(doc, { type: 'TIMEOUT', team: 'B' }).doc;
  assert.equal(doc.state.sets[0].timeouts.B.length, 2);
  assert.deepEqual(doc.state.sets[0].timeouts.B[0], { team: 0, opp: 1, postSwitch: false });

  // 3rd timeout warns without force
  const to3Warn = Engine.dispatch(doc, { type: 'TIMEOUT', team: 'B' });
  assert.ok(to3Warn.warnings.length > 0, '3rd timeout must warn');
  assert.equal(to3Warn.doc.state.sets[0].timeouts.B.length, 2);

  // 3rd timeout with force succeeds
  const to3Force = mustDispatch(doc, { type: 'TIMEOUT', team: 'B', force: true }).doc;
  assert.equal(to3Force.state.sets[0].timeouts.B.length, 3);

  // Improper request
  doc = mustDispatch(doc, { type: 'IMPROPER_REQUEST', team: 'A' }).doc;
  assert.ok(doc.state.improperRequests.A, 'Improper request recorded for Team A');

  // Yellow warning card (no point awarded)
  doc = mustDispatch(doc, {
    type: 'ADD_SANCTION',
    team: 'A',
    sanctionType: 'warning',
    playerOrOfficial: '7',
  }).doc;
  assert.deepEqual(doc.state.sets[0].points, { A: 1, B: 0 });

  // Red Penalty card against serving Team A -> awards point + side-out rotation to Team B!
  doc = mustDispatch(doc, {
    type: 'ADD_SANCTION',
    team: 'A',
    sanctionType: 'penalty',
    playerOrOfficial: '9',
    awardPoint: true,
  }).doc;
  assert.deepEqual(doc.state.sets[0].points, { A: 1, B: 1 }, 'Penalty against A awards point to B');
  assert.equal(doc.state.sets[0].servingTeam, 'B', 'Penalty side-out gives serve to B');
  assert.equal(doc.state.sets[0].lineups.B.serverPosIndex, 1, 'Team B rotated clockwise on penalty side-out');
  assert.equal(doc.state.sets[0].slashedPoints.B[0].byPenalty, true, 'Point marked as byPenalty');

  // Swap sides manually
  const prevLeft = doc.state.sets[0].leftTeam;
  doc = mustDispatch(doc, { type: 'SWAP_SIDES' }).doc;
  assert.notEqual(doc.state.sets[0].leftTeam, prevLeft, 'SWAP_SIDES swaps leftTeam and rightTeam');
});

// 7. Full Match Flow (Best-of-3 to Deciding Set), 8-Point Automatic Switch, Set Winning Circle, and Summary Totals
test('Best-of-3 full match through Deciding Set 8-point switch, winning circle, and computeSummary totals', () => {
  let doc = setupReadyMatch(3); // Sets 1, 2, and Set 3 (isDeciding: true, targetPoints: 15)

  const playSetToScore = (d, setIdx, winner, loserPoints) => {
    const target = d.state.sets[setIdx].targetPoints;
    const loser = winner === 'A' ? 'B' : 'A';
    d = mustDispatch(d, { type: 'SET_LINEUP', setIndex: setIdx, team: 'A', starters: ['1', '4', '7', '9', '11', '14'] }).doc;
    d = mustDispatch(d, { type: 'SET_LINEUP', setIndex: setIdx, team: 'B', starters: ['2', '5', '8', '10', '13', '16'] }).doc;
    d = mustDispatch(d, { type: 'CONFIRM_SET_START', setIndex: setIdx }).doc;

    for (let i = 0; i < loserPoints; i++) {
      d = mustDispatch(d, { type: 'SCORE_POINT', team: loser }).doc;
    }
    for (let i = 0; i < target; i++) {
      d = mustDispatch(d, { type: 'SCORE_POINT', team: winner }).doc;
    }
    assert.equal(d.state.canFinishSet, winner, `Set ${setIdx + 1} should flag canFinishSet = ${winner}`);
    d = mustDispatch(d, { type: 'FINISH_SET' }).doc;
    return d;
  };

  // Set 1: A wins 25:20
  doc = playSetToScore(doc, 0, 'A', 20);
  const set1 = doc.state.sets[0];
  assert.equal(set1.status, 'finished');
  assert.equal(set1.winner, 'A');
  // Check winning circle on closing service turn of Team A
  const aPos = set1.lineups.A.positions[set1.lineups.A.serverPosIndex];
  const lastTurn = aPos.serviceTurns[aPos.serviceTurns.length - 1];
  assert.equal(lastTurn.exitScore, 25);
  assert.equal(lastTurn.isWinningCircle, true, 'Winning point in service box must have isWinningCircle: true');

  // Set 2: B wins 25:22 -> forces Deciding Set 3 (index 2)!
  assert.equal(doc.state.currentSetIndex, 1);
  doc = playSetToScore(doc, 1, 'B', 22);
  assert.equal(doc.state.currentSetIndex, 2);

  // Set 3 (Deciding Set): initialLeft is B (from toss.decidingInitialLeft = 'B'), firstServe is B
  doc = mustDispatch(doc, { type: 'SET_LINEUP', setIndex: 2, team: 'A', starters: ['1', '4', '7', '9', '11', '14'] }).doc;
  doc = mustDispatch(doc, { type: 'SET_LINEUP', setIndex: 2, team: 'B', starters: ['2', '5', '8', '10', '13', '16'] }).doc;
  doc = mustDispatch(doc, { type: 'CONFIRM_SET_START', setIndex: 2 }).doc;

  const initialLeftDeciding = doc.state.sets[2].initialLeftTeam;
  assert.equal(doc.state.sets[2].switchedAt8, false);

  // Score to 7:5 (B has 7, A has 5)
  for (let i = 0; i < 5; i++) doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc;
  for (let i = 0; i < 7; i++) doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'B' }).doc;
  assert.equal(doc.state.sets[2].switchedAt8, false);

  // B scores 8th point (B=8, A=5) -> automatic side switch at 8!
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'B' }).doc;
  const set3At8 = doc.state.sets[2];
  assert.equal(set3At8.switchedAt8, true, 'Deciding set must automatically switch at 8 points');
  assert.deepEqual(set3At8.pointsAtSwitch, { A: 5, B: 8 }, 'pointsAtSwitch must capture exact score at 8');
  assert.notEqual(set3At8.leftTeam, initialLeftDeciding, 'leftTeam and rightTeam must swap at 8 points');
  assert.equal(doc.state.justSwitchedAt8, true, 'justSwitchedAt8 notification flag should be set');

  // Subsequent points must have postSwitch: true
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc; // 6:8
  const latestSlashA = doc.state.sets[2].slashedPoints.A[doc.state.sets[2].slashedPoints.A.length - 1];
  assert.equal(latestSlashA.point, 6);
  assert.equal(latestSlashA.postSwitch, true, 'Points scored after 8-point switch must be marked postSwitch: true');

  // Undo across 8-point switch restores pre-switch court sides!
  const docBeforeUndo8 = doc;
  const undoneSwitch = Engine.undo(Engine.undo(docBeforeUndo8)); // undo 6:8 and undo 5:8
  assert.equal(undoneSwitch.state.sets[2].switchedAt8, false, 'Undo across 8-pt switch restores switchedAt8=false');
  assert.equal(undoneSwitch.state.sets[2].pointsAtSwitch, null, 'Undo across 8-pt switch clears pointsAtSwitch');
  assert.equal(undoneSwitch.state.sets[2].leftTeam, initialLeftDeciding, 'Undo across 8-pt switch restores leftTeam');

  // Redo back to 6:8
  doc = Engine.redo(Engine.redo(undoneSwitch));

  // Finish deciding set: B scores 7 more points to win 15:6
  for (let i = 0; i < 7; i++) doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'B' }).doc;
  const beforeFinishMatch = doc;
  doc = mustDispatch(doc, { type: 'FINISH_SET' }).doc;

  // Verify Undo across FINISH_SET restores live set!
  const undoneFinish = Engine.undo(doc);
  assert.equal(undoneFinish.state.sets[2].status, 'live', 'Undo after FINISH_SET restores set to live');
  assert.equal(undoneFinish.state.sets[2].points.B, beforeFinishMatch.state.sets[2].points.B);
  doc = Engine.redo(undoneFinish);

  assert.equal(doc.state.phase, 'finished', 'Match phase should be finished when B wins 2 sets in Bo3');
  const summary = Engine.computeSummary(doc.state);
  assert.equal(summary.matchWinner, 'B');
  assert.equal(summary.totals ? summary.totals.A.W : summary.matchTotals.A.W, 1);
  assert.equal(summary.totals ? summary.totals.B.W : summary.matchTotals.B.W, 2);
  assert.equal(summary.totals ? summary.totals.A.P : summary.matchTotals.A.P, 25 + 22 + 6);
  assert.equal(summary.totals ? summary.totals.B.P : summary.matchTotals.B.P, 20 + 25 + 15);
});

// 8. Unlimited Undo/Redo across points, side-outs, 8-pt switch, and localStorage persistence
test('Unlimited Undo/Redo across complex transitions + localStorage save/load/clear + Demo Match', () => {
  let doc = Engine.createDemoMatch('de');
  assert.ok(doc && doc.state, 'createDemoMatch must return a valid doc');
  assert.equal(doc.state.sets[0].status, 'finished', 'Demo match Set 1 should be finished');
  assert.equal(doc.state.sets[1].status, 'live', 'Demo match Set 2 should be live');

  const snapshotBefore = JSON.stringify(doc.state);
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc;
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'B' }).doc;
  doc = mustDispatch(doc, { type: 'TIMEOUT', team: 'A' }).doc;
  const snapshotAfter3 = JSON.stringify(doc.state);

  assert.equal(Engine.canUndo(doc), true);
  doc = Engine.undo(doc);
  doc = Engine.undo(doc);
  doc = Engine.undo(doc);
  assert.equal(JSON.stringify(doc.state), snapshotBefore, '3x undo must restore exact prior state');

  assert.equal(Engine.canRedo(doc), true);
  doc = Engine.redo(doc);
  doc = Engine.redo(doc);
  doc = Engine.redo(doc);
  assert.equal(JSON.stringify(doc.state), snapshotAfter3, '3x redo must restore exact forward state');

  // localStorage persistence
  Engine.saveToStorage(doc, 'test_matchblatt_v1');
  const loaded = Engine.loadFromStorage('test_matchblatt_v1');
  assert.ok(loaded && loaded.state, 'loadFromStorage must restore saved doc');
  assert.equal(loaded.state.teams.A.name, doc.state.teams.A.name);
  assert.deepEqual(loaded.state.sets[1].points, doc.state.sets[1].points);

  Engine.clearStorage('test_matchblatt_v1');
  assert.equal(Engine.loadFromStorage('test_matchblatt_v1'), null, 'clearStorage must remove saved doc');
});

// 9. Deciding Set active server carry-over across 8-point switch (initialLeftTeam serving through 8)
test('Deciding Set: initialLeftTeam serving across 8-point switch records postSwitch exitScore cleanly', () => {
  let doc = setupReadyMatch(3);
  doc = mustDispatch(doc, { type: 'SET_LINEUP', setIndex: 0, team: 'A', starters: ['1', '4', '7', '9', '11', '14'] }).doc;
  doc = mustDispatch(doc, { type: 'SET_LINEUP', setIndex: 0, team: 'B', starters: ['2', '5', '8', '10', '13', '16'] }).doc;
  doc = mustDispatch(doc, { type: 'CONFIRM_SET_START', setIndex: 0 }).doc;
  for (let i = 0; i < 25; i++) doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc;
  doc = mustDispatch(doc, { type: 'FINISH_SET' }).doc;

  doc = mustDispatch(doc, { type: 'SET_LINEUP', setIndex: 1, team: 'A', starters: ['1', '4', '7', '9', '11', '14'] }).doc;
  doc = mustDispatch(doc, { type: 'SET_LINEUP', setIndex: 1, team: 'B', starters: ['2', '5', '8', '10', '13', '16'] }).doc;
  doc = mustDispatch(doc, { type: 'CONFIRM_SET_START', setIndex: 1 }).doc;
  for (let i = 0; i < 25; i++) doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'B' }).doc;
  doc = mustDispatch(doc, { type: 'FINISH_SET' }).doc;

  // Set 3 (Deciding): toss.decidingInitialLeft = 'B', toss.decidingFirstServe = 'B'
  doc = mustDispatch(doc, { type: 'SET_LINEUP', setIndex: 2, team: 'A', starters: ['1', '4', '7', '9', '11', '14'] }).doc;
  doc = mustDispatch(doc, { type: 'SET_LINEUP', setIndex: 2, team: 'B', starters: ['2', '5', '8', '10', '13', '16'] }).doc;
  doc = mustDispatch(doc, { type: 'CONFIRM_SET_START', setIndex: 2 }).doc;

  // B (initialLeftTeam) serves 9 straight points (through 8-pt switch!) then A sides out at 9:1
  for (let i = 0; i < 9; i++) doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'B' }).doc;
  doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc;

  const bTurns = doc.state.sets[2].lineups.B.positions[0].serviceTurns;
  const closedPostSwitchTurn = bTurns.find((t) => t.exitScore === 9 && t.postSwitch === true);
  assert.ok(
    closedPostSwitchTurn,
    `Expected B Pos I to have a postSwitch closed turn with exitScore 9, got: ${JSON.stringify(bTurns)}`
  );
});

// 10. Official Swiss Volley Header Checkbox Metadata & Optional Player License Field
test('Swiss Volley header metadata (matchType, level, gender, ageGroup), normalizeDoc backward-compat, and optional player license', () => {
  let doc = Engine.createStore();
  assert.equal(doc.state.meta.matchType, 'championship');
  assert.equal(doc.state.meta.level, 'regional');
  assert.ok(doc.state.meta.gender === 'women' || doc.state.meta.gender === 'men');
  assert.equal(doc.state.meta.ageGroup, '');

  const upd = mustDispatch(doc, {
    type: 'UPDATE_META',
    meta: { matchType: 'cup', level: 'national', gender: 'men', ageGroup: 'U23' },
  });
  doc = upd.doc;
  assert.equal(doc.state.meta.matchType, 'cup');
  assert.equal(doc.state.meta.level, 'national');
  assert.equal(doc.state.meta.gender, 'men');
  assert.equal(doc.state.meta.ageGroup, 'U23');
  assert.ok(
    Array.isArray(doc.state.highlights) && doc.state.highlights.some((h) => h.section === 'header'),
    'UPDATE_META should emit a header highlight descriptor'
  );

  // Player & libero optional license string alongside birthdate (only jersey number required)
  doc = mustDispatch(doc, {
    type: 'UPDATE_TEAM',
    team: 'A',
    data: {
      name: 'VC Smash Winterthur',
      players: [
        { number: '7', name: 'K. Freitag', license: '15417', birthdate: '', isCaptain: true },
        { number: '12', name: '', license: '', birthdate: '', isCaptain: false },
      ],
      liberos: [
        { number: '18', name: 'Je. Kilchenmann', license: '123009', birthdate: '', isCaptain: false },
      ],
    },
  }).doc;
  assert.equal(doc.state.teams.A.players[0].license, '15417');
  assert.equal(doc.state.teams.A.players[1].license, '');
  assert.equal(doc.state.teams.A.liberos[0].license, '123009');

  // Legacy saved doc without matchType/level/gender/ageGroup normalizes cleanly
  const legacyDoc = {
    version: 1,
    state: {
      ...doc.state,
      meta: { competition: '2D', category: 'Frauen U19', matchNumber: '159', bestOf: 5 },
    },
    past: [],
    future: [],
  };
  const normalized = Engine.normalizeDoc(legacyDoc);
  assert.equal(normalized.state.meta.matchType, 'championship');
  assert.equal(normalized.state.meta.gender, 'women');
  assert.equal(normalized.state.meta.ageGroup, 'U19');
});

// 11. Set Start & Finish Time Defaults and Optional Custom / Cleared Times
test('CONFIRM_SET_START defaults Set 1 to meta.time (game start), supports custom/cleared times, and FINISH_SET computes or clears durationMin', () => {
  let doc = setupReadyMatch(5);
  doc = mustDispatch(doc, { type: 'UPDATE_META', meta: { time: '19:15' } }).doc;

  // Set 1 without explicit startTime defaults to scheduled game start (meta.time = '19:15')
  doc = mustDispatch(doc, {
    type: 'CONFIRM_SET_START',
    setIndex: 0,
    startersA: ['1', '4', '7', '9', '11', '14'],
    startersB: ['2', '5', '8', '10', '13', '16'],
  }).doc;
  assert.equal(doc.state.sets[0].startTime, '19:15', 'Set 1 startTime should default to scheduled game start meta.time');

  // Score Set 1 to 25:0 and finish with explicit endTime (and adjusted startTime)
  for (let i = 0; i < 25; i++) doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc;
  doc = mustDispatch(doc, { type: 'FINISH_SET', startTime: '19:16', endTime: '19:41' }).doc;
  assert.equal(doc.state.sets[0].startTime, '19:16');
  assert.equal(doc.state.sets[0].endTime, '19:41');
  assert.equal(doc.state.sets[0].durationMin, 25);

  // Set 2 with optional cleared ('') start & end times records empty strings and null durationMin (not 0')
  doc = mustDispatch(doc, {
    type: 'CONFIRM_SET_START',
    setIndex: 1,
    startTime: '',
    startersA: ['1', '4', '7', '9', '11', '14'],
    startersB: ['2', '5', '8', '10', '13', '16'],
  }).doc;
  assert.equal(doc.state.sets[1].startTime, '', 'Optional cleared startTime should remain empty string');

  for (let i = 0; i < 25; i++) doc = mustDispatch(doc, { type: 'SCORE_POINT', team: 'B' }).doc;
  doc = mustDispatch(doc, { type: 'FINISH_SET', endTime: '' }).doc;
  assert.equal(doc.state.sets[1].endTime, '', 'Optional cleared endTime should remain empty string');
  assert.equal(doc.state.sets[1].durationMin, null, 'durationMin should be null when start/end time is omitted');
});

console.log(`\nEngine suite finished: ${passed} tests passed.\n`);
