'use strict';
// "37 Days": public content that sits around the tested engine (scenario.js, engine.js, content.js stay unchanged).
// Everything here is safe to publish. Secret material (briefings, teacher notes, the evidence packet)
// lives only in netlify/july1914/ and is served by the game API to the right key.
//
// DRAFT STATUS: all Vietnamese glosses need a fluent speaker's check before go-live (plan: content rules).

const TEAM = {
  AH: { name: 'Austria-Hungary', capital: 'Vienna', leaders: 'Berchtold, Conrad, Tisza', colour: '#B8860B' },
  DE: { name: 'Germany', capital: 'Berlin', leaders: 'Wilhelm II, Bethmann Hollweg, Moltke', colour: '#3A3A3A' },
  RU: { name: 'Russia', capital: 'St Petersburg', leaders: 'Nicholas II, Sazonov', colour: '#2E7D32' },
  FR: { name: 'France', capital: 'Paris', leaders: 'Poincaré, Viviani', colour: '#1F4E9C' },
  GB: { name: 'Britain', capital: 'London', leaders: 'Grey, Asquith', colour: '#B03A2E' },
  RS: { name: 'Serbia', capital: 'Belgrade', leaders: 'Pašić', colour: '#7B3F8C' },
};
// The Serbia team plays Belgium from round 5 (scenario.js, Gate 7).
const BELGIUM_FROM = 5;
const teamName = (p, round) => (p === 'RS' && round >= BELGIUM_FROM ? 'Belgium (Serbia team)' : TEAM[p].name);

const ROLE = {
  leader: { name: 'Leader', job: 'You read the cabinet briefing and submit your team’s decision.' },
  general: { name: 'General', job: 'You read the military briefing: readiness, timetables and war plans. Your Leader needs it.' },
  envoy: { name: 'Envoy', job: 'In diplomacy windows you visit one other table and can log a secret promise.' },
};
// Who does what at each team size (plan: five pairs and one trio; a team of one does everything).
function roleSet(size) { return size >= 3 ? ['leader', 'general', 'envoy'] : size === 2 ? ['leader', 'general'] : ['leader']; }
function powers(size, role) {
  const roles = roleSet(size);
  if (!roles.includes(role)) return null;
  return {
    submit: role === 'leader',
    envoy: role === 'envoy' || (size === 2 && role === 'general') || size === 1,
    briefings: size === 1 ? ['leader', 'general'] : role === 'general' ? ['general'] : ['leader'],
  };
}

// Scene-setting telegram at the start of each round (public, state-independent).
const INTROS = {
  1: '28 June 1914, Sarajevo. Archduke Franz Ferdinand, heir to the throne of Austria-Hungary, and his wife Sophie are shot dead by Gavrilo Princip, a 19-year-old Bosnian Serb.',
  2: 'Early July. Governments talk in secret. In public, Europe goes on summer holiday.',
  3: '24 July. Europe waits for Serbia’s answer to Vienna.',
  4: '26 July. The great powers look for a way out of the crisis.',
  5: '29 July. Armies begin to move.',
  6: '1 August. The last days before 4 August.',
};

const STEPS = {
  telegram: { name: 'Telegrams', hint: 'Read the new telegrams and your briefing.' },
  council: { name: 'Council', hint: 'Discuss with your team. What does your briefing say?' },
  diplomacy: { name: 'Diplomacy', hint: 'Envoys: visit one other table for 2 minutes.' },
  decision: { name: 'Decision', hint: 'Leaders: submit your decision now.' },
  result: { name: 'Result', hint: 'Watch the projector.' },
};
const DIPLOMACY_ROUNDS = [2, 3, 4, 5];
const DEFAULT_SECONDS = { telegram: 120, council: 150, diplomacy: 120, decision: 60, result: 60 };

// Practice round: no stakes, teaches the screen. Kiel Week was real (23–30 June 1914; a British squadron attended).
const PRACTICE = {
  prompt: 'Practice telegram. Kiel Week, June 1914: Germany invites guests to its great naval regatta. How does your government reply?',
  options: [
    { id: 'ships', label: 'Send some of your best ships, to show strength' },
    { id: 'diplomat', label: 'Send a diplomat, to stay polite' },
    { id: 'decline', label: 'Politely decline: there is too much work at home' },
  ],
};

const STARTERS = ['We chose this because…', 'We are afraid that…', 'Our main goal is…', 'If another team does X, then…'];

// Points available for each secret objective, in the order of scenario.OBJECTIVES (max 7 each).
const OBJ_MAX = { AH: [3, 2, 2], DE: [3, 2, 2], RU: [3, 2, 2], FR: [3, 2, 2], GB: [2, 2, 3], RS: [3, 2, 1, 1] };

// Vote stages: the order in which historians got the evidence (plan: archive lesson).
const STAGES = {
  0: { name: 'Newspapers, July 1914', short: 'Exit ticket', note: 'Public telegrams only' },
  1: { name: 'Colour Books (1914)', short: 'Colour Books', note: 'The two documents each government chose to publish' },
  2: { name: 'Fischer (1961)', short: 'Fischer', note: 'Everything Germany and Austria-Hungary saw and wrote' },
  3: { name: 'Clark (2012)', short: 'Clark', note: 'Every archive, plus a real-1914 evidence packet' },
};
const VOTE_QUESTION = 'Which power was most responsible for the war?';
const VOTE_QUESTION_PEACE = 'Which power did most to bring Europe to the brink of war?';

// Tap-to-gloss glossary. Simple English + Vietnamese (DRAFT: needs a fluent speaker's check).
const GLOSSARY = [
  { term: 'ultimatum', match: ['ultimatum', 'ultimatums'], en: 'A final list of demands, with a time limit and a threat if they are refused.', vi: 'tối hậu thư' },
  { term: 'mobilize', match: ['mobilize', 'mobilizes', 'mobilized', 'mobilizing', 'mobilization'], en: 'To call up soldiers and get an army ready for war.', vi: 'động viên quân đội; tổng động viên' },
  { term: 'neutrality', match: ['neutrality', 'neutral'], en: 'Not taking sides in a war.', vi: 'sự trung lập; trung lập' },
  { term: 'alliance', match: ['alliance', 'ally', 'allies', 'allied'], en: 'An agreement between countries to help each other, especially in war.', vi: 'liên minh; đồng minh' },
  { term: 'guarantee', match: ['guarantee', 'guarantors'], en: 'A firm promise to protect someone or something.', vi: 'sự bảo đảm' },
  { term: 'mediation', match: ['mediation', 'mediate'], en: 'When a neutral country helps two sides reach an agreement.', vi: 'sự hòa giải, làm trung gian' },
  { term: 'prestige', match: ['prestige'], en: 'How much respect a country has. Backing down can lose it.', vi: 'uy tín, thể diện' },
  { term: 'blank cheque', match: ['blank cheque'], en: 'A promise of support with no limits: "whatever you decide, we will back you".', vi: 'tấm séc khống (sự ủng hộ vô điều kiện)' },
  { term: 'conference', match: ['conference'], en: 'A formal meeting where countries discuss a problem.', vi: 'hội nghị' },
  { term: 'ambassador', match: ['ambassador'], en: 'A country’s top diplomat in another country.', vi: 'đại sứ' },
  { term: 'Cabinet', match: ['Cabinet'], en: 'The group of senior ministers who lead a government.', vi: 'nội các' },
  { term: 'Tsar', match: ['Tsar'], en: 'The emperor of Russia (Nicholas II).', vi: 'Sa hoàng' },
  { term: 'Kaiser', match: ['Kaiser'], en: 'The emperor of Germany (Wilhelm II).', vi: 'Hoàng đế Đức' },
  { term: 'ceasefire', match: ['ceasefire'], en: 'An agreement to stop fighting.', vi: 'ngừng bắn' },
  { term: 'pledge', match: ['pledge'], en: 'A promise; or something held until a promise is kept.', vi: 'lời cam kết; vật bảo đảm' },
  { term: 'General Staff', match: ['General Staff'], en: 'The officers who plan an army’s wars.', vi: 'Bộ Tổng tham mưu' },
  { term: 'declare war', match: ['declares war', 'declare war', 'declaring war', 'declaration of war'], en: 'To announce officially that a country is at war.', vi: 'tuyên chiến' },
  { term: 'invade', match: ['invade', 'invades', 'invaded', 'invasion'], en: 'To send an army into another country.', vi: 'xâm lược' },
  { term: 'negotiate', match: ['negotiate', 'negotiating', 'negotiates', 'talks'], en: 'To discuss in order to reach an agreement.', vi: 'đàm phán' },
  { term: 'Home Rule', match: ['Home Rule'], en: 'Self-government for Ireland inside the United Kingdom.', vi: 'quyền tự trị (của Ireland)' },
  { term: 'Dual Alliance', match: ['Dual Alliance'], en: 'The 1879 alliance between Germany and Austria-Hungary.', vi: 'Liên minh Kép (Đức – Áo-Hung, 1879)' },
  { term: 'assassin', match: ['assassin'], en: 'A person who murders an important person.', vi: 'kẻ ám sát' },
  { term: 'humiliate', match: ['humiliate', 'humiliated', 'humiliation'], en: 'To make someone lose respect in front of others.', vi: 'làm bẽ mặt, sỉ nhục' },
  { term: 'encirclement', match: ['encirclement'], en: 'Germany’s fear of being surrounded by France and Russia.', vi: 'sự bao vây' },
  { term: 'objective', match: ['objective', 'objectives'], en: 'A goal your team is trying to reach.', vi: 'mục tiêu' },
];

module.exports = {
  TEAM, BELGIUM_FROM, teamName, ROLE, roleSet, powers, INTROS, STEPS, DIPLOMACY_ROUNDS, DEFAULT_SECONDS,
  PRACTICE, STARTERS, OBJ_MAX, STAGES, VOTE_QUESTION, VOTE_QUESTION_PEACE, GLOSSARY,
};
