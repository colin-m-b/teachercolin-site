'use strict';
// "37 Days" — July Crisis simulation: game logic, version 9.
// v2 adds GATES: earlier promises and preparations open or close later options,
// so the crisis cascades instead of being decided only in the last two rounds.
//
//  Gate 0  German backing    Austria will not go to war unless Germany is backing it,
//                            and dares the harsh ultimatum only with a full "blank cheque"
//  Gate 1  Conference door   talks open in round 4 only if Austria agrees (or Germany forces it) AND someone proposed talks
//  Gate 2  Mobilization      Russian general mobilization in round 5 needs: Austria at war with Serbia,
//                            Russian preparations, and a French promise of support
//  Gate 3  One war plan      Germany has only the Schlieffen Plan: war with Russia means attacking France through Belgium
//  Gate 4  Promises          France can still declare neutrality, but after promising Russia it costs 2 prestige;
//                            Britain can fight "for France" only after a warning, a promise, a ready fleet or the French 10 km gesture
//  Gate 8  No turning back   once Russia orders general mobilization it cannot be stopped
//  Gate 5  Halt in Belgrade  Austria can take Belgrade and stop only if Germany proposed it in round 4
//  Gate 6  Ladder            no great-power war unless Austria is fighting Serbia, or Germany sent an ultimatum Russia ignored
//  Gate 7  Belgium           Belgium can only resist properly if it mobilized in round 5 (the Serbia team plays Belgium in rounds 5-6)

const POWERS = ['AH', 'DE', 'RU', 'FR', 'GB', 'RS'];
const NAME = { AH: 'Austria-Hungary', DE: 'Germany', RU: 'Russia', FR: 'France', GB: 'Britain', RS: 'Serbia', BE: 'Belgium' };
const o = (id, label, x = {}) => ({ id, label, ...x });
function hook(s, p) { s.prestige[p].commits += 1; }

const ROUNDS = [
  // ---------------------------------------------------------------- ROUND 1
  {
    n: 1, dates: '28 June – 6 July 1914', title: 'The shots in Sarajevo',
    menu(s, p) {
      return {
        AH: [o('war', 'Side with General Conrad: use the crisis to crush Serbia by force', { hist: 1, esc: 2 }),
             o('coerce', 'Humiliate Serbia with tough demands, but avoid war if Serbia gives in', { esc: 1 }),
             o('probe', "Side with Hungary's Prime Minister Tisza: investigate first, no war without proof", { esc: 0 })],
        DE: [o('full', 'Promise full support, whatever Austria decides (the "blank cheque")', { hist: 1, esc: 2, commit: 1 }),
             o('limited', 'Support only a quick, limited action against Serbia', { esc: 1 }),
             o('none', 'Refuse support: urge Austria to settle this by diplomacy', { esc: 0 })],
        RU: [o('warn', 'Warn Austria privately: Russia will protect Serbia', { esc: 2, commit: 1 }),
             o('wait', 'Wait and watch: this is between Austria and Serbia', { hist: 1, esc: 1 }),
             o('restrain', 'Advise Serbia to cooperate with a fair investigation', { esc: 0 })],
        FR: [o('solid', 'Visit Russia as planned and show the alliance is rock solid', { hist: 1, esc: 2, commit: 1 }),
             o('calm', 'Visit Russia, but quietly urge calm in the Balkans', { esc: 0 }),
             o('postpone', 'Postpone the visit: France has problems at home', { esc: 1 })],
        GB: [o('ireland', 'Focus on the crisis in Ireland: the Balkans are far away', { hist: 1, esc: 1 }),
             o('restrain', 'Quietly ask Germany to hold Austria back', { esc: 0 }),
             o('entente', 'Secretly promise France and Russia that Britain will stand with them', { esc: 2, commit: 1 })],
        RS: [o('deny', "Deny everything: Serbia's government did not order the attack", { hist: 1, esc: 1, commit: 1 }),
             o('crackdown', 'Arrest the nationalist officers linked to the plot', { esc: 0 }),
             o('appeal', 'Ask Russia publicly for protection right away', { esc: 2 })],
      }[p];
    },
    resolve(s, c, E) {
      const f = s.f;
      f.support = c.DE; f.ahAim = c.AH; f.deBacking = c.DE !== 'none';
      E({ full: 'BLANK_CHEQUE', limited: 'LIMITED_SUPPORT', none: 'NO_SUPPORT' }[c.DE], ['DE', 'AH'], 'DE');
      E({ war: 'AH_AIM_WAR', coerce: 'AH_AIM_COERCE', probe: 'AH_PROBE' }[c.AH], ['AH'], 'AH');
      E({ warn: 'RU_WARNS_AH', wait: 'RU_WAITS', restrain: 'RU_RESTRAINS_RS' }[c.RU],
        c.RU === 'warn' ? ['RU', 'AH'] : c.RU === 'restrain' ? ['RU', 'RS'] : ['RU'], 'RU');
      if (c.RU === 'restrain') f.ruAdvisedCalm = true;
      E({ solid: 'FR_VISIT_SOLID', calm: 'FR_VISIT_CALM', postpone: 'FR_POSTPONES' }[c.FR],
        c.FR === 'postpone' ? 'public' : ['FR', 'RU'], 'FR');
      f.blackoutFR = c.FR !== 'postpone';
      E({ ireland: 'GB_IRELAND', restrain: 'GB_ASKS_DE', entente: 'GB_SECRET_PROMISE' }[c.GB],
        c.GB === 'ireland' ? 'public' : c.GB === 'restrain' ? ['GB', 'DE'] : ['GB', 'FR', 'RU'], 'GB');
      if (c.GB === 'restrain') f.gbAskedRestraint = true;
      if (c.GB === 'entente') f.gbPromisedFR = true;
      E({ deny: 'RS_DENIES', crackdown: 'RS_CRACKDOWN', appeal: 'RS_APPEALS_RU' }[c.RS], 'public', 'RS');
      if (c.RS === 'crackdown') f.serbGoodwill = true;
      if (c.RS === 'appeal') hook(s, 'RU');
    },
  },
  // ---------------------------------------------------------------- ROUND 2
  {
    n: 2, dates: '7 – 23 July 1914', title: 'The ultimatum',
    menu(s, p) {
      return {
        AH: [...(s.f.ahAim !== 'probe' ? [o('harsh', 'Send a 48-hour ultimatum Serbia will probably reject, with Austrian officials investigating inside Serbia', { hist: 1, esc: 2, commit: 1 })] : []),
             o('firm', 'Send firm demands Serbia could accept: punish the plotters and stop anti-Austrian propaganda', { esc: 1, commit: 1, def: s.f.ahAim === 'probe' ? 1 : 0 }),
             ...(s.f.ahAim !== 'war' ? [o('none', 'Send no ultimatum: ask the great powers to judge the evidence', { esc: 0 })] : [])],
        DE: [o('hurry', 'Urge Austria to act fast, while Europe still sympathizes', { hist: 1, esc: 2 }),
             o('soften', 'Ask to see the ultimatum and push Austria to soften it', { esc: 0 }),
             s.f.support === 'full'
               ? o('prepare', 'Quietly prepare the German army, just in case', { esc: 1 })
               : o('cheque', 'Now promise Austria full support, whatever it decides (a "blank cheque")', { esc: 2, commit: 1 })],
        RU: [o('pledge', 'Agree with France: firm support for each other if Austria threatens Serbia', { hist: 1, esc: 2, commit: 1 }),
             o('peace', 'Agree with France to push for a peaceful solution', { esc: 0 }),
             o('prep', 'Begin secret military preparations', { esc: 2 })],
        FR: [o('pledge', 'Promise Russia full support if Austria threatens Serbia', { hist: 1, esc: 2, commit: 1 }),
             o('restrain', 'Urge Russia not to provoke Austria or Germany', { esc: 0 }),
             o('vague', "Say nothing specific: keep France's options open", { esc: 1 })],
        GB: [o('aloof', 'Stay out of it: Ireland and politics at home come first', { hist: 1, esc: 1 }),
             o('talks', 'Tell Vienna and St Petersburg that Britain will mediate if asked', { esc: 0 }),
             o('warnG', 'Warn Germany privately that Britain may not stay neutral', { esc: 1 })],
        RS: [o('campaign', 'Carry on as normal: the election campaign comes first', { hist: 1, esc: 1 }),
             o('guarantee', 'Ask Russia for a firm promise of protection', { esc: 2 }),
             o('calm', 'Calm the Serbian press so Serbia looks reasonable to Europe', { esc: 0 })],
      }[p];
    },
    resolve(s, c, E) {
      const f = s.f;
      E('WIESNER_REPORT', ['AH'], null);
      let demand = c.AH;
      if (c.DE === 'cheque') { f.support = 'full'; f.deBacking = true; E('BLANK_CHEQUE_LATE', ['DE', 'AH'], 'DE'); }
      if (c.DE === 'soften') {
        if (demand === 'harsh') {
          if (f.support === 'full' && !f.gbAskedRestraint) E('DE_SOFTEN_REFUSED', ['DE', 'AH'], 'DE');
          else { demand = 'firm'; E('DE_FORCES_SOFTER', ['DE', 'AH'], 'DE'); }
        } else E('DE_SOFTEN_NOT_NEEDED', ['DE', 'AH'], 'DE');
      } else if (c.DE === 'hurry') E('DE_HURRIES', ['DE', 'AH'], 'DE');
      else if (c.DE === 'prepare') { f.gerPrep = true; E('DE_PREPARES', ['DE'], 'DE'); }
      if (demand === 'harsh' && f.support !== 'full') { demand = 'firm'; E('AH_NO_CHEQUE_SOFTER', ['AH', 'DE'], 'AH'); }
      f.demand = demand;
      E({ harsh: 'ULT_HARSH', firm: 'ULT_FIRM', none: 'NO_ULT' }[demand], 'public', 'AH');

      if (c.FR === 'pledge') f.frPromised = true;
      if (c.RU === 'pledge' && c.FR === 'pledge') E('FR_RU_PLEDGE', ['FR', 'RU'], ['FR', 'RU']);
      else {
        E({ pledge: 'FR_OFFERS_SUPPORT', restrain: 'FR_URGES_RESTRAINT', vague: 'FR_STAYS_VAGUE' }[c.FR], ['FR', 'RU'], 'FR');
        if (c.RU === 'pledge') E('RU_ASKS_PLEDGE', ['RU', 'FR'], 'RU');
      }
      if (c.RU === 'peace') E('RU_SEEKS_PEACE', ['RU', 'FR'], 'RU');
      if (c.RU === 'prep') { f.rusPrep = true; E('RU_SECRET_PREP', ['RU'], 'RU'); }

      E({ aloof: 'GB_ALOOF', talks: 'GB_OFFERS_TALKS', warnG: 'GB_WARNS_DE' }[c.GB],
        c.GB === 'warnG' ? ['GB', 'DE'] : c.GB === 'talks' ? 'public' : ['GB'], 'GB');
      if (c.GB === 'talks') f.proposal = true;
      if (c.GB === 'warnG') f.gbWarned = true;

      E({ campaign: 'RS_CAMPAIGNS', guarantee: 'RS_ASKS_GUARANTEE', calm: 'RS_CALMS_PRESS' }[c.RS],
        c.RS === 'guarantee' ? ['RS', 'RU'] : 'public', 'RS');
      if (c.RS === 'guarantee') hook(s, 'RU');
      if (c.RS === 'calm') f.serbGoodwill = true;

      if (f.blackoutFR) E('FR_AT_SEA', 'public', null);
      if (f.rusPrep && f.gerPrep && !f.deDetected) { f.deDetected = true; E('DE_DETECTS_RU_PREP', ['DE'], null); }
    },
  },
  // ---------------------------------------------------------------- ROUND 3
  {
    n: 3, dates: '24 – 25 July 1914', title: '48 hours',
    menu(s, p) {
      const d = s.f.demand;
      const frBase = [o('assure', 'Your ambassador in St Petersburg assures Russia of French support', { hist: 1, esc: 2, commit: 1 }),
                      o('wait', 'Wait for the President to return before promising anything', { esc: 0 })];
      const serbia = {
        harsh: [o('most', 'Accept most demands, refuse Austrian officials inside Serbia, and mobilize the army', { hist: 1, esc: 1 }),
                o('all', 'Accept every demand, even Austrian officials inside Serbia', { esc: 0, backDown: 1 }),
                o('reject', 'Reject the ultimatum and mobilize the army', { esc: 2, commit: 1 })],
        firm: [o('most', 'Accept some demands, argue over the rest, and mobilize the army', { def: 1, esc: 1 }),
               o('all', 'Accept the demands: they are firm but fair', { esc: 0 }),
               o('reject', 'Reject the demands and mobilize the army', { esc: 2, commit: 1 })],
        none: [o('most', "Cooperate partly with the great powers' inquiry, and mobilize the army", { def: 1, esc: 1 }),
               o('all', "Cooperate fully with the great powers' inquiry", { esc: 0 }),
               o('reject', 'Refuse the inquiry and mobilize the army', { esc: 2, commit: 1 })],
      }[d];
      return {
        RS: serbia,
        AH: [o('total', 'Anything less than total acceptance: break off relations', { hist: 1, esc: 2, commit: 1 }),
             o('most', 'Accept a reply that agrees to most of our demands', { esc: 1 }),
             o('goodwill', 'Accept any reply that shows good will, and negotiate the rest', { esc: 0, backDown: 1 })],
        RU: [o('support', 'Tell Serbia Russia will support it, and begin secret war preparations', { hist: 1, esc: 2, commit: 1 }),
             o('advise', 'Advise Serbia to accept as much as possible, and propose talks', { esc: 0 }),
             o('aloof', 'Stay out: Serbia must decide alone', { esc: 0, backDown: 1 })],
        FR: s.f.blackoutFR ? frBase : [...frBase, o('talks', 'Join Britain in calling for talks', { esc: 0 })],
        DE: [o('back', 'Back Austria fully and reject outside interference', { hist: 1, esc: 2 }),
             o('pass', 'Urge Vienna to accept mediation, and mean it', { esc: 0 }),
             o('warnRU', 'Warn Russia: if you mobilize, Germany will mobilize too', { esc: 1, commit: 1 })],
        GB: [o('extend', 'Ask Austria to give Serbia more time to reply', { hist: 1, esc: 0 }),
             o('conference', 'Propose a conference of the four powers not directly involved', { esc: 0 }),
             o('fleet', 'Keep the fleet together after its summer exercises, ready for action', { esc: 1 })],
      }[p];
    },
    resolve(s, c, E) {
      const f = s.f;
      f.reply = c.RS;
      f.humiliated = c.RS === 'all' && f.demand === 'harsh';
      f.gaveIn = c.RS === 'all' && f.demand !== 'none';
      let rel;
      if (c.RS === 'reject') rel = 'broken';
      else if (c.RS === 'all') rel = 'eased';
      else rel = c.AH === 'total' ? 'broken' : 'tense';
      f.relations = rel;
      E({ broken: 'RELATIONS_BROKEN', tense: 'TALKS_CONTINUE', eased: 'CRISIS_EASES' }[rel], 'public', ['RS', 'AH']);
      if (c.RS !== 'all') E('RS_MOBILIZES', 'public', 'RS');
      if (c.RS !== 'reject') E('KAISER_READS_REPLY', ['DE'], null);

      if (c.RU === 'support') { f.rusPrep = true; E('RU_BACKS_RS', ['RU', 'RS'], 'RU'); }
      else if (c.RU === 'advise') { f.ruAdvisedCalm = true; E('RU_ADVISES_RS', ['RU', 'RS'], 'RU'); }
      else E('RU_ALOOF', ['RU', 'RS'], 'RU');

      if (c.FR === 'assure') { f.frPromised = true; E('FR_ASSURES_RU', ['FR', 'RU'], 'FR'); }
      else if (c.FR === 'wait') E('FR_WAITS', ['FR'], 'FR');
      else { f.proposal = true; E('FR_CALLS_TALKS', 'public', 'FR'); }

      if (c.DE === 'back') { f.deBacking = true; E('DE_LOCALIZE', 'public', 'DE'); }
      else if (c.DE === 'pass') { f.proposal = true; E('DE_PASSES_PROPOSALS', ['DE', 'AH', 'GB'], 'DE'); }
      else E('DE_WARNS_RU', ['DE', 'RU'], 'DE');

      if (c.GB === 'extend') E(rel === 'broken' ? 'GB_EXTENSION_REFUSED' : 'GB_EXTENSION_ASKED', 'public', 'GB');
      else if (c.GB === 'conference') { f.proposal = true; E('GB_PROPOSES_CONFERENCE', 'public', 'GB'); }
      else { f.gbFleet = true; E('GB_FLEET', 'public', 'GB'); }

      if (f.rusPrep && (f.gerPrep || c.DE === 'warnRU') && !f.deDetected) { f.deDetected = true; E('DE_DETECTS_RU_PREP', ['DE'], null); }
    },
  },
  // ---------------------------------------------------------------- ROUND 4
  {
    n: 4, dates: '26 – 28 July 1914', title: 'Last chances for talks',
    menu(s, p) {
      const eased = s.f.relations === 'eased', backed = s.f.deBacking; // Gate 0
      return {
        AH: eased
          ? [...(backed ? [o('declare', 'Attack anyway: declare war on Serbia, although it gave in', { esc: 2 })] : []),
             o('mobilize', 'Keep the army ready and wait', { esc: 1 }),
             o('accept', "Accept Serbia's surrender: the crisis is over", { def: 1, esc: 0 })]
          : [...(backed ? [o('declare', 'Declare war on Serbia now', { hist: 1, esc: 2 })] : []),
             o('mobilize', 'Mobilize against Serbia, but hold off declaring war', { esc: 1, def: backed ? 0 : 1 }),
             o('talks', 'Accept talks with the other great powers', { esc: 0 })],
        DE: [o('backWar', "Support Austria and reject a conference", { hist: 1, esc: 2 }),
             o('halt', 'Propose a "Halt in Belgrade": Austria takes Belgrade, then negotiates', { esc: 1 }),
             o('press', 'Press Austria to accept talks, or lose German support', { esc: 0, backDown: 1 })],
        RU: [o('partial', 'Prepare a partial mobilization against Austria only', { hist: 1, esc: 2, commit: 1 }),
             o('talks', 'Offer Austria direct talks', { esc: 0 }),
             o('conference', "Accept Britain's idea of a conference", { esc: 0 })],
        FR: [o('back', 'Tell Russia France will honour the alliance', { esc: 2, commit: 1 }),
             o('caution', 'Urge Russia to avoid any step that gives Germany an excuse', { esc: 0 }),
             o('conference', "Support Britain's idea of a conference", { hist: 1, esc: 0 })],
        GB: [o('conference', 'Propose a conference of ambassadors in London', { hist: 1, esc: 0 }),
             o('warnG', 'Warn Germany clearly: Britain will not stay out of a general war', { esc: 1 }),
             o('silent', 'Say nothing: the Cabinet is divided', { esc: 1 })],
        RS: [o('defend', 'Move the government to Niš and prepare the army to defend Serbia', { hist: 1, esc: 1 }),
             o('hague', 'Offer to let the Hague Tribunal or the great powers judge the dispute', { esc: 0 }),
             o('tsar', 'Appeal directly to the Tsar for protection', { esc: 2 })],
      }[p];
    },
    resolve(s, c, E) {
      const f = s.f;
      if (c.GB === 'conference' || c.RU === 'talks') f.proposal = true; // endorsements (FR/RU 'conference', Serbia's Hague offer) are not proposals
      if (c.RS === 'hague') f.serbGoodwill = true; // Serbia's offer stands before Vienna decides
      if (c.RS === 'defend') f.serbReady = true;
      let ahTalks = c.AH === 'talks';
      if (c.AH === 'accept') { f.settled = true; E('AH_ACCEPTS_SURRENDER', 'public', 'AH'); }
      if (c.AH === 'declare') {
        f.ahSerbWar = true; E('AH_DECLARES_WAR_RS', 'public', 'AH');
        if (f.relations === 'eased' || f.serbGoodwill) { f.ahAggressor = true; E('EUROPE_SHOCKED', 'public', null); }
      } else if (c.AH === 'mobilize') {
        if (c.DE === 'press') { ahTalks = true; E('AH_YIELDS_TO_DE', 'public', ['AH', 'DE']); }
        else E('AH_MOBILIZES', 'public', 'AH');
      } else if (c.AH === 'talks') E('AH_ACCEPTS_TALKS', 'public', 'AH');
      if (ahTalks) {
        if (f.proposal) { f.conference = true; E('CONFERENCE_OPENS', 'public', null); }
        else E('AH_TALKS_NO_FORUM', 'public', null);
      }

      if (c.DE === 'backWar') { f.deBacking = true; E(f.proposal ? 'DE_REJECTS_CONFERENCE' : 'DE_BACKS_WAR', f.proposal ? 'public' : ['DE', 'AH'], 'DE'); }
      else if (c.DE === 'halt') { f.deBacking = true; f.haltOffered = true; E('HALT_PROPOSED', ['DE', 'AH', 'GB', 'RU'], 'DE'); }
      else { f.deBacking = false; E(c.AH === 'declare' ? 'DE_PRESS_IGNORED' : 'DE_PRESSES_AH', ['DE', 'AH'], 'DE'); }

      if (c.RU === 'partial') { f.rusPrep = true; E('RU_PREPARES_PARTIAL', 'public', 'RU'); }
      else if (c.RU === 'talks') E('RU_OFFERS_TALKS', 'public', 'RU');
      else E('RU_ACCEPTS_CONFERENCE', 'public', 'RU');

      if (c.FR === 'back') { f.frPromised = true; E('FR_BACKS_RU', ['FR', 'RU'], 'FR'); }
      else if (c.FR === 'caution') E('FR_URGES_CAUTION', ['FR', 'RU'], 'FR');
      else E('FR_SUPPORTS_CONFERENCE', 'public', 'FR');

      if (c.GB === 'conference') E('GB_CONFERENCE_LONDON', 'public', 'GB');
      else if (c.GB === 'warnG') { f.gbWarned = true; E('GB_WARNS_DE_CLEARLY', ['GB', 'DE'], 'GB'); }
      else E('GB_CABINET_DIVIDED', ['GB'], 'GB');

      if (c.RS === 'defend') E('RS_GOV_TO_NIS', 'public', 'RS');
      else if (c.RS === 'hague') { f.serbGoodwill = true; E('RS_OFFERS_HAGUE', 'public', 'RS'); }
      else { hook(s, 'RU'); f.tsarMoved = true; E('RS_APPEALS_TSAR', ['RS', 'RU'], 'RS'); }
    },
  },
  // ---------------------------------------------------------------- ROUND 5
  {
    n: 5, dates: '29 – 31 July 1914', title: 'Mobilization',
    menu(s, p) {
      const f = s.f, atWar = f.ahSerbWar, halt = f.haltOffered;
      let ah;
      if (!atWar && !f.deBacking) {
        ah = [o('stop', 'Keep negotiating: Vienna will not fight without Berlin', { def: 1, esc: 0 }),
              o('ready', 'Keep the army on the Serbian border', { esc: 1 })];
      } else if (f.settled && !atWar) {
        ah = [o('invade', 'Find a new excuse and invade Serbia', { esc: 2 }),
              o('stop', 'Keep the peace: Serbia has given in', { def: 1, esc: 0 })];
      } else if (f.conference && !atWar) {
        ah = [o('invade', 'Walk out of the talks and invade Serbia', { esc: 2 }),
              ...(halt ? [o('halt', 'Take Belgrade as a pledge while the talks go on', { esc: 1 })] : []),
              o('stop', 'Stay at the conference table', { def: 1, esc: 0 })];
      } else if (atWar) {
        ah = [o('invade', 'Shell Belgrade and invade Serbia with full force', { hist: 1, esc: 2 }),
              ...(halt ? [o('halt', 'Take Belgrade, then stop and negotiate ("Halt in Belgrade")', { esc: 1 })] : []),
              o('stop', 'Stop: offer Serbia a ceasefire and negotiate', { esc: 0, backDown: 1 })];
      } else {
        ah = [o('invade', 'Declare war and invade Serbia with full force', { hist: 1, esc: 2 }),
              ...(halt ? [o('halt', 'Declare war, take Belgrade, then stop and negotiate', { esc: 1 })] : []),
              o('stop', 'No war: keep negotiating', { esc: 0, backDown: 1 })];
      }
      const canGeneral = atWar && f.rusPrep && (f.frPromised || f.tsarMoved || f.ahAggressor); // Gate 2
      const ru = canGeneral
        ? [o('general', 'General mobilization against Austria and Germany', { hist: 1, esc: 2, commit: 1 }),
           o('partial', 'Partial mobilization against Austria only', { esc: 1, commit: 1 }),
           o('none', 'No mobilization yet: keep negotiating', { esc: 0, backDown: 1 })]
        : [o('partial', 'Partial mobilization against Austria only', { def: atWar ? 1 : 0, esc: 1, commit: 1 }),
           o('none', 'No mobilization yet: keep negotiating', { def: atWar ? 0 : 1, esc: 0, backDown: 1 })];
      return {
        AH: ah,
        RU: ru,
        DE: [o('ultimatum', 'If Russia mobilizes at all: demand it stops within 12 hours, or face war', { hist: 1, esc: 2 }),
             o('negotiate', 'Keep negotiating: the Kaiser telegraphs the Tsar personally', { esc: 0 }),
             o('mobilize', 'Mobilize the German army now', { esc: 2 })],
        FR: [o('support', 'Confirm full support for Russia and prepare the French army', { esc: 2, commit: 1 }),
             o('caution', 'Urge Russia to avoid steps that give Germany an excuse', { esc: 0 }),
             o('withdraw', 'Pull French troops 10 km back from the border to show peaceful intent', { hist: 1, esc: 0 })],
        GB: [o('warnG', 'Warn Germany privately: if France is attacked, Britain cannot stand aside', { hist: 1, esc: 1 }),
             o('noPromise', 'Promise nothing to anyone: the Cabinet is divided', { esc: 1 }),
             o('naval', 'Promise France the Royal Navy will protect its Channel coast', { esc: 2, commit: 1 })],
        RS: [o('mobilize', 'BELGIUM: Mobilize the army to defend Belgian neutrality', { hist: 1, esc: 1 }),
             o('quiet', 'BELGIUM: Stay quiet, and do nothing that might provoke Germany', { esc: 0 }),
             o('ask', 'BELGIUM: Ask Britain and France to confirm they will defend Belgium', { esc: 1 })],
      }[p];
    },
    resolve(s, c, E) {
      const f = s.f;
      const declare = () => {
        if (!f.ahSerbWar) {
          f.ahSerbWar = true; E('AH_DECLARES_WAR_RS', 'public', 'AH');
          if (f.relations === 'eased' || f.serbGoodwill || f.conference) { f.ahAggressor = true; E('EUROPE_SHOCKED', 'public', null); }
        }
      };
      if (c.AH === 'invade' && f.settled && !f.ahSerbWar) E('AH_NEW_PRETEXT', 'public', 'AH');
      let ahs = 'none';
      if (c.AH === 'invade') { ahs = 'full'; if (f.conference && !f.ahSerbWar) E('AH_WALKS_OUT', 'public', 'AH'); declare(); E('BELGRADE_SHELLED', 'public', 'AH'); }
      else if (c.AH === 'halt') { ahs = 'limited'; declare(); E(f.conference ? 'BELGRADE_PLEDGE_TALKS' : 'AH_HALT_PLAN', 'public', 'AH'); }
      else if (f.ahSerbWar) { f.ceasefire = true; E('AH_OFFERS_CEASEFIRE', 'public', 'AH'); }
      else if (c.AH === 'ready') E('AH_READY_ON_BORDER', 'public', 'AH');
      else if (!f.deBacking) E('AH_NO_BACKING', 'public', 'AH');
      else E(f.settled ? 'AH_KEEPS_PEACE' : f.conference ? 'AH_STAYS_IN_TALKS' : 'AH_KEEPS_TALKING', 'public', 'AH');
      if (ahs === 'limited') { f.haltSuccess = true; E('BELGRADE_OCCUPIED', 'public', null); }
      f.ahSerbia = ahs;

      if (c.RS === 'mobilize') { f.beMob = true; E('BE_MOBILIZES', 'public', 'RS'); }
      else if (c.RS === 'quiet') E('BE_QUIET', 'public', 'RS');
      else { hook(s, 'GB'); E('BE_ASKS_GUARANTORS', ['RS', 'GB', 'FR'], 'RS'); }

      f.rusMob = c.RU;
      E({ general: 'RU_GENERAL_MOB', partial: 'RU_PARTIAL_MOB', none: 'RU_HOLDS' }[c.RU], 'public', 'RU');

      if (c.DE === 'ultimatum') {
        if (c.RU !== 'none') { f.deUltimatum = true; E('DE_ULTIMATUM_RU', 'public', 'DE'); E('DE_ASKS_FRANCE', ['DE', 'FR'], null); }
        else E('DE_ULTIMATUM_NOT_SENT', ['DE'], 'DE');
      } else if (c.DE === 'negotiate') { f.deNegotiated = true; E('WILLY_NICKY', ['DE', 'RU'], 'DE'); }
      else { f.deMob = true; E('DE_MOBILIZES', 'public', 'DE'); if (c.RU === 'none') f.deStruckFirst = true; }

      if (c.FR === 'support') { f.frPromised = true; E('FR_CONFIRMS_SUPPORT', ['FR', 'RU'], 'FR'); }
      else if (c.FR === 'caution') E('FR_CAUTIONS_RU', ['FR', 'RU'], 'FR');
      else { f.frWithdrew = true; E('FR_WITHDRAWS_10KM', 'public', 'FR'); }

      if (c.GB === 'warnG') { f.gbWarned = true; E('GB_WARNS_DE_CLEARLY', ['GB', 'DE'], 'GB'); }
      else if (c.GB === 'noPromise') E('GB_NO_PROMISE', ['GB', 'FR'], 'GB');
      else { f.gbNaval = true; E('GB_NAVAL_PLEDGE', 'public', 'GB'); }
    },
  },
  // ---------------------------------------------------------------- ROUND 6
  {
    n: 6, dates: '1 – 4 August 1914', title: 'The lamps go out',
    menu(s, p) {
      const f = s.f, ahs = f.ahSerbia, mob = f.rusMob;
      return {
        AH: ahs !== 'none'
          ? [o('declareRU', 'If Russia is mobilizing against us, declare war on Russia too', { esc: 2 }),
             o('serbiaOnly', 'Fight Serbia only; do not declare war on Russia', { hist: 1, esc: 1 }),
             o('ceasefire', 'Offer Serbia a ceasefire and peace talks', { esc: 0, backDown: 1 })]
          : [o('declareRU', 'If Russia is mobilizing against us, declare war on Russia', { esc: 2 }),
             o('serbiaOnly', 'Stay out of any war unless Austria is attacked', { def: 1, esc: 0 })],
        DE: [o('schlieffen', 'If Russia mobilizes or attacks Austria: declare war on Russia and France, and attack France through Belgium', { hist: 1, esc: 2 }),
             o('standDown', 'Declare no war and keep negotiating, even if Russia attacks Austria (this breaks the alliance)', { esc: 0, backDown: (mob !== 'none' || ahs !== 'none') ? 1 : 0 })],
        RU: (ahs !== 'none' || f.deMob)
          ? (mob !== 'none'
            ? [o('standFirm', 'Stand firm: keep mobilizing, and fight Austria if it keeps attacking Serbia', { hist: 1, esc: 2, commit: 1 }),
               o('talks', 'Keep the army mobilized, but offer talks', { esc: 1 }),
               ...(mob !== 'general' ? [o('standDown', 'Stand down: halt mobilization', { esc: 0, backDown: 1 })] : [])]
            : [o('standFirm', f.deMob && ahs === 'none' ? 'Germany has mobilized: mobilize fully in response' : 'Mobilize fully now, and fight Austria if it keeps attacking Serbia', { esc: 2, commit: 1 }),
               o('talks', 'Keep negotiating; no mobilization', { def: 1, esc: 0 })])
          : (mob !== 'none'
            ? [o('talks', 'Keep the partial mobilization, and keep talking', { def: 1, esc: 1 }),
               o('standDown', 'Stand down: halt mobilization', { esc: 0, backDown: 1 })]
            : [o('talks', 'Keep negotiating; no mobilization', { def: 1, esc: 0 }),
               o('warnAH', 'Warn Austria: Russia will mobilize if Serbia is attacked', { esc: 1, commit: 1 })]),
        FR: [o('honor', 'Mobilize and stand by Russia: France will act in her own interests', { hist: 1, esc: 2 }),
             o('neutral', f.frPromised ? 'Declare that France will stay neutral, breaking its promises to Russia' : 'Declare that France will stay neutral', { esc: 0, backDown: 1 }), // Gate 4a
             o('waitGB', 'Mobilize, but do not fight unless France is attacked', { esc: 1 })],
        RS: f.beMob
          ? [o('resist', 'BELGIUM: if Germany demands to march through, refuse and fight', { hist: 1, esc: 2 }),
             o('allow', 'BELGIUM: if Germany demands to march through, protest but let them pass', { esc: 0 })]
          : [o('allow', 'BELGIUM: if Germany demands to march through, protest but let them pass', { def: 1, esc: 0 }),
             o('resistUnready', 'BELGIUM: if Germany demands to march through, fight anyway with an unready army', { esc: 2 })],
        GB: [...((f.gbPromisedFR || f.gbNaval || f.frWithdrew || f.gbFleet || f.gbWarned) ? [o('franceOrBelgium', 'Go to war if Germany attacks France or invades Belgium', { esc: 2 })] : []), // Gate 4b
             o('belgium', 'Go to war only if Germany invades Belgium and Belgium resists', { hist: 1, esc: 1 }),
             o('neutral', 'Stay neutral, whatever happens', { esc: 0, backDown: 1 })],
      }[p];
    },
    resolve(s, c, E) {
      const f = s.f;
      const mobFinal = c.RU === 'standFirm' ? 'general' : c.RU === 'talks' ? f.rusMob : 'none';
      const mobilizing = mobFinal !== 'none';
      f.rusMobFinal = mobFinal;
      if (c.RU === 'standFirm') E(f.rusMob === 'general' ? 'RU_STANDS_FIRM' : 'RU_MOBILIZES_FULLY', 'public', 'RU');
      else if (c.RU === 'talks') E(mobilizing ? 'RU_MOBILIZED_TALKS' : 'RU_TALKS', 'public', 'RU');
      else if (c.RU === 'warnAH') E('RU_WARNS_MOBILIZE', ['RU', 'AH'], 'RU');
      else E('RU_STANDS_DOWN', 'public', 'RU');

      let ahs = f.ahSerbia;
      const war = new Set();
      const add = (a, b) => war.add([a, b].sort().join('-'));
      if (c.AH === 'ceasefire' && ahs !== 'none') { ahs = 'none'; f.ceasefire = true; E('AH_CEASEFIRE', 'public', 'AH'); }
      if (ahs !== 'none') add('AH', 'RS');

      let deRu = false;
      const deCause = mobilizing && (ahs !== 'none' || f.deUltimatum || f.deMob); // Gate 6: the ladder (German mobilization meant war)
      if (c.DE === 'schlieffen') {
        if (deCause) { deRu = true; add('DE', 'RU'); E('DE_DECLARES_WAR_RU', 'public', 'DE'); }
      } else E('DE_STANDS_DOWN', 'public', 'DE');

      let ahRu = false;
      if (c.AH === 'declareRU') {
        if (mobilizing) { ahRu = true; E('AH_DECLARES_WAR_RU', 'public', 'AH'); }
        else E('AH_NO_CAUSE_RU', ['AH'], 'AH');
      } else if (c.AH === 'serbiaOnly') E(ahs !== 'none' ? 'AH_FIGHTS_SERBIA_ONLY' : 'AH_HOLDS', 'public', 'AH');
      // Russia only attacks Austria directly if Germany has not already made it a wider war
      if (!ahRu && !deRu && c.RU === 'standFirm' && ahs === 'full') {
        ahRu = true; E('RU_ATTACKS_AH', 'public', 'RU');
      }
      if (ahRu) add('AH', 'RU');
      if (c.DE === 'schlieffen' && !deRu) E('DE_NO_CAUSE', ['DE'], 'DE');
      if (ahRu && c.DE === 'standDown') { f.deAbandons = true; E('DE_ABANDONS_AH', 'public', null); } // breaking the Dual Alliance (1879)

      if (c.FR === 'neutral' && f.frPromised) { s.prestige.FR.broken += 1; E('FR_BREAKS_PROMISE', ['FR', 'RU'], null); }
      let deFr = false, deAttackedFr = false;
      if (deRu && c.DE === 'schlieffen') { deFr = true; deAttackedFr = true; E('KAISER_EAST_ONLY', ['DE'], null); E(c.FR === 'neutral' ? 'DE_DEMANDS_FORTS' : 'DE_DECLARES_WAR_FR', 'public', 'DE'); }
      if (deFr) add('DE', 'FR');
      if (deAttackedFr) E('FR_FIGHTS_INVASION', 'public', 'FR');
      else E({ honor: 'FR_MOBILIZES', neutral: 'FR_NEUTRAL', waitGB: 'FR_MOBILIZES_DEFENSIVE' }[c.FR], 'public', 'FR');

      let belInvaded = false, belPassage = false;
      if (deAttackedFr) {
        E('DE_ULTIMATUM_BELGIUM', 'public', null);
        if (c.RS === 'resist') { belInvaded = true; add('BE', 'DE'); E('BELGIUM_RESISTS', 'public', 'RS'); }
        else if (c.RS === 'resistUnready') { belInvaded = true; f.beUnready = true; add('BE', 'DE'); E('BELGIUM_RESISTS_UNREADY', 'public', 'RS'); }
        else { belPassage = true; E('BELGIUM_LETS_PASS', 'public', 'RS'); }
      } else E('BELGIUM_UNTOUCHED', 'public', 'RS');

      let gbIn = false;
      if (c.GB === 'franceOrBelgium' && deAttackedFr) gbIn = true;
      if (c.GB === 'belgium' && belInvaded) gbIn = true;
      if (gbIn) { add('DE', 'GB'); E('GB_DECLARES_WAR', 'public', 'GB'); }
      else E(c.GB === 'neutral' ? 'GB_NEUTRAL' : 'GB_STAYS_OUT', 'public', 'GB');

      const w = [...war];
      if (w.some(x => x !== 'AH-RS')) E('ITALY_NEUTRAL', 'public', null);
      Object.assign(f, { war: w, ahSerbiaFinal: ahs, belInvaded, belPassage, gbIn, deAttackedFr, deRu, ahRu });
    },
  },
];

function ending(f) {
  const w = f.war || [];
  if (!w.length) return 'peace';
  const part = new Set(w.flatMap(x => x.split('-')));
  if (part.has('GB')) return 'general';
  if (part.has('FR')) return 'continental';
  if (part.has('RU') || part.has('DE')) return 'eastern';
  return 'local';
}
function modifiers(f) {
  const m = [];
  if (f.haltSuccess && f.ahSerbiaFinal === 'limited') m.push('HALT_IN_BELGRADE');
  if (f.ceasefire) m.push('CEASEFIRE');
  if (f.belPassage) m.push('BELGIUM_LET_PASS');
  if (f.ahAggressor && (f.war || []).length) m.push('AUSTRIA_SEEN_AS_AGGRESSOR');
  if (f.deAbandons) m.push('GERMANY_ABANDONED_AUSTRIA');
  if (f.conference && !(f.war || []).length) m.push('CONFERENCE');
  return m;
}

// Secret objectives (version 5: built as a game of chicken, like 1914).
// Vienna and Berlin gain most if Serbia gives in or Russia backs down; a negotiated compromise costs them.
// Russia gains most from a compromise, but backing down again (as in 1909) costs it more than war.
// France loses most by abandoning Russia; Britain loses most by letting France fall alone.
// Max 7 for everyone; nobody gets 7 on the 1914 path, so every team can try to beat 1914.
const OBJECTIVES = {
  AH: ['Serbia is punished: beaten, or forced to accept the harsh ultimatum (3)', 'Russia stays out of the war (2)', 'Germany stands by Austria to the end (2)'],
  DE: ['Austria-Hungary comes out stronger: Serbia gives in or is beaten (3)', 'Britain stays out of any war (2)', 'Break the encirclement: Russia backs down or France abandons Russia (2)'],
  RU: ['Serbia is neither crushed nor humiliated (3)', 'Russia does not back down again, as it did in 1909 (2)', 'France stays loyal, ideally without a war with Germany (2)'],
  FR: ['The alliance with Russia holds (3)', 'If France fights, Britain fights too (2)', 'France is not invaded (2)'],
  GB: ['Belgium is protected (2)', 'Germany does not defeat France alone (2)', 'No great-power war (3)'],
  RS: ['No Austrian officials inside Serbia (3)', 'Serbia is not invaded, or holds out because it prepared its defences (2)', 'If war comes, Europe blames Austria-Hungary (1)', 'BELGIUM: neutrality respected, or defended with British help (1)'],
};

function outcome(s) {
  const f = s.f, ch = s.ch;
  const w = new Set(f.war || []);
  const at = (a, b) => w.has([a, b].sort().join('-'));
  const inWar = p => [...w].some(x => x.split('-').includes(p));
  const ruAtWar = at('AH', 'RU') || at('DE', 'RU');
  const ahs = f.ahSerbiaFinal;
  const capitulation = !!f.humiliated && !f.ahSerbWar;        // Serbia gave in to a harsh ultimatum, no war
  const settlement = !!f.gaveIn && !f.humiliated && !f.ahSerbWar; // Serbia accepted fair demands
  const localWin = ahs === 'full' && !ruAtWar;                  // Austria beats Serbia, Russia stands aside
  const halt = ahs === 'limited';                               // Belgrade held as a pledge
  const compromise = ahs === 'none' && !capitulation && !settlement; // talks, partial acceptance, ceasefire
  const greatWar = ['eastern', 'continental', 'general'].includes(ending(f));
  const russiaBackedDown = localWin || s.prestige.RU.broken > 0 || (capitulation && s.prestige.RU.commits > 0) || (f.deUltimatum && ch[6].RU === 'standDown');
  const frAbandoned = ch[6].FR === 'neutral' || (at('DE', 'RU') && !inWar('FR'));
  return { at, inWar, ruAtWar, ahs, capitulation, settlement, localWin, halt, compromise, greatWar, russiaBackedDown, frAbandoned };
}

function score(s) {
  const f = s.f, O = outcome(s);
  const r = {};
  // Austria's goal is fixed, as it was for Vienna in 1914: remove Serbia as a threat
  const a1 = (O.capitulation || O.localWin) ? 3 : O.halt ? 2 : (O.settlement || O.ahs === 'full') ? 1 : 0;
  r.AH = [a1, O.ruAtWar ? 0 : 2, (f.deBacking && !f.deAbandons) ? 2 : 0];
  r.DE = [f.deAbandons ? 0 : (O.capitulation || O.localWin) ? 3 : (O.halt || O.settlement) ? 2 : O.ahs === 'full' ? 1 : 0, f.gbIn ? 0 : 2, (O.russiaBackedDown || O.frAbandoned) ? 2 : 0];
  const r1 = (O.compromise || O.settlement) ? 3 : O.halt ? 2 : (O.ahs === 'full' && O.ruAtWar) ? 2 : O.capitulation ? (f.ruAdvisedCalm ? 1 : 0) : 0;
  r.RU = [r1, O.russiaBackedDown ? 0 : 2, O.frAbandoned ? 0 : O.at('DE', 'RU') ? 1 : 2];
  r.FR = [O.frAbandoned ? 0 : 3, (!O.inWar('FR') || f.gbIn) ? 2 : 0, f.deAttackedFr ? 0 : 2];
  r.GB = [(f.belInvaded || f.belPassage) ? (f.gbIn ? 2 : 0) : 2, (O.at('DE', 'FR') && !f.gbIn) ? 0 : 2, O.greatWar ? 0 : 3];
  r.RS = [f.humiliated ? 0 : 3, O.ahs === 'none' ? 2 : (O.halt || f.serbReady) ? 1 : 0, (!f.ahSerbWar || f.ahAggressor) ? 1 : 0,
          !f.deAttackedFr ? 1 : (f.belInvaded && f.gbIn && !f.beUnready) ? 1 : 0];
  const out = {};
  for (const p of POWERS) {
    const prestige = -Math.min(2, s.prestige[p].broken);
    out[p] = { parts: r[p], prestige, total: r[p].reduce((a, b) => a + b, 0) + prestige };
  }
  return out;
}

module.exports = { POWERS, NAME, ROUNDS, ending, modifiers, score, outcome, OBJECTIVES };
