// The Paris Peace Conference, 1919 — all historical content.
// Everything a student or the projector reads lives here, so a teacher can
// correct a fact in one place. Logic lives in engine.js.

// ---------------------------------------------------------------- meters
// Hidden until the epilogue. 0–100.
export const METERS = {
  resentment: { label: "German resentment", start: 30 },
  strain: { label: "Strain on Germany's economy", start: 35 },
  security: { label: "French sense of security", start: 25 },
  league: { label: "Strength of the League of Nations", start: 50 },
  asia: { label: "Japanese expansionism in China", start: 30 },
  awakening: { label: "Anti-colonial awakening", start: 20 },
  italy: { label: "Italian grievance", start: 30 },
};

// ---------------------------------------------------------------- delegations
export const DELEGATIONS = {
  fr: {
    name: "France",
    leader: "Georges Clemenceau",
    leaderTitle: "Prime Minister, “the Tiger”",
    color: "#1B3C8C",
    bodies: ["council", "plenary"],
    who: "You are the host nation. The war was fought on your soil. Ten of your northern departments are ruins: mines flooded, factories stripped, farmland cratered. About 1.4 million French soldiers are dead. Germany invaded France in 1870 and again in 1914, and its population is still much larger than yours.",
    wants: [
      "Security: make sure Germany can never invade again",
      "Make Germany pay to rebuild northern France",
      "Keep France's empire: Indochina (Vietnam, Laos, Cambodia) and West Africa",
      "Win Syria and Lebanon from the old Ottoman Empire",
    ],
    fears: "A Germany that recovers, rearms and wants revenge. Wilson's ideals sound fine in Washington; they do not stop an army crossing the Rhine.",
    facts: ["1.4 million soldiers killed", "Northern France devastated", "Alsace-Lorraine, lost in 1871, is now back in French hands"],
  },
  gb: {
    name: "Britain & the Dominions",
    leader: "David Lloyd George",
    leaderTitle: "Prime Minister, with Billy Hughes (Australia), Jan Smuts (South Africa) and Robert Borden (Canada)",
    color: "#7A1F2B",
    bodies: ["council", "plenary"],
    who: "You lead the largest empire in history. You won the December 1918 election promising to “make Germany pay” and to “hang the Kaiser”. But Britain lives by trade, and Germany was one of its best customers. The Dominions (Australia, Canada, South Africa, New Zealand) fought hard and now want a voice of their own.",
    wants: [
      "Destroy the German navy and take Germany's colonies",
      "Satisfy voters at home who want Germany punished",
      "But don't ruin Germany: Britain needs it as a trading partner",
      "Keep the Dominions loyal: Australia insists on keeping Asians out (the “White Australia” policy)",
      "Secure Iraq, Palestine and the route to India",
    ],
    fears: "A France that grows too strong in Europe; a Germany so bitter it turns to revolution; an empire that starts to break apart.",
    facts: ["About 900,000 soldiers of the British Empire killed", "1.3 million Indian soldiers served", "The Royal Navy rules the seas"],
  },
  us: {
    name: "United States",
    leader: "Woodrow Wilson",
    leaderTitle: "President",
    color: "#2F5D50",
    bodies: ["council", "plenary"],
    who: "You arrived in Europe a hero. Crowds in Paris, London and Rome cheered your Fourteen Points: open diplomacy, free trade, arms reduction, self-determination, and a League of Nations to keep the peace. The US joined the war late (1917) and lost far less than the others. But Republicans in the Senate must approve any treaty, and many of them distrust the League.",
    wants: [
      "A League of Nations, written into the treaty",
      "A fair peace that will not cause another war",
      "Self-determination for the peoples of Europe",
      "A treaty the US Senate will accept",
    ],
    fears: "A peace of revenge that sows the next war. A Senate that rejects your treaty. Being dragged into Europe's old quarrels and empires.",
    facts: ["About 116,000 Americans died", "The Fourteen Points (January 1918)", "The richest country in the world, owed money by Britain and France"],
  },
  it: {
    name: "Italy",
    leader: "Vittorio Orlando",
    leaderTitle: "Prime Minister, with Foreign Minister Sidney Sonnino",
    color: "#6B4E16",
    bodies: ["council", "plenary"],
    who: "In the secret Treaty of London (1915), Britain and France promised you land if you joined the war on their side. You joined, and lost about 650,000 men fighting Austria-Hungary in the Alps. Now Italians expect their reward, especially the port city of Fiume. Wilson says new borders should follow nationality, not secret deals.",
    wants: [
      "Everything promised in the Treaty of London: Trentino, South Tyrol, Istria, Dalmatia",
      "The port of Fiume, too",
      "Respect as one of the four great powers",
    ],
    fears: "Coming home empty-handed. Nationalists are already calling it a “mutilated victory”.",
    facts: ["About 650,000 soldiers killed", "Promised land in the 1915 Treaty of London", "Economy shaken by the war"],
  },
  de: {
    name: "Germany",
    leader: "Count Ulrich von Brockdorff-Rantzau",
    leaderTitle: "Foreign Minister of the new German republic",
    color: "#3B3B3B",
    bodies: [],
    who: "The Kaiser has fled to the Netherlands. A brand-new democratic government (later called the Weimar Republic) signed the armistice in November 1918, believing peace would follow Wilson's Fourteen Points. German soldiers marched home undefeated on German soil, so many Germans do not believe they lost the war. The Allied naval blockade continues, and Germans are going hungry. You have not been invited to the negotiations.",
    wants: [
      "A peace based on the Fourteen Points, as promised at the armistice",
      "No admission of sole guilt for the war",
      "Reparations Germany can actually pay",
      "Keep German land and German people inside Germany",
      "Keep the young democracy alive: extremists on the left and right are waiting for it to fail",
    ],
    fears: "A humiliating peace that destroys the new democracy and hands power to extremists.",
    facts: ["About 2 million soldiers killed", "Civilians dying from hunger under the blockade", "Not allowed at the negotiating table"],
  },
  jp: {
    name: "Japan",
    leader: "Baron Makino Nobuaki",
    leaderTitle: "Delegate, with former Prime Minister Saionji Kinmochi",
    color: "#8C2F1B",
    bodies: ["plenary"],
    who: "You are the only non-Western great power at the table, an ally of Britain since 1902. In 1914 you captured Germany's colony in Shandong, China, and its islands in the Pacific. You came to Paris with two aims. One is respect: a clause in the League's Covenant declaring the equality of races. The other is reward: keep Shandong. The Western powers treat you as a junior partner, and Japanese people face racist laws in the US and Australia.",
    wants: [
      "A racial equality clause in the League of Nations Covenant",
      "Keep Germany's former rights in Shandong",
      "Keep Germany's Pacific islands north of the equator",
      "Recognition as a true great power",
    ],
    fears: "Being treated as second-class. Leaving Paris with neither equality nor Shandong.",
    facts: ["Took Shandong and the German Pacific islands in 1914", "Secret 1917 agreements: Britain and France promised to back Japan on Shandong", "Rules Korea, where the March 1st independence uprising began in 1919"],
  },
  cn: {
    name: "China",
    leader: "V. K. Wellington Koo",
    leaderTitle: "Delegate, with Lu Zhengxiang",
    color: "#A0522D",
    bodies: ["plenary"],
    persona: "china",
  },
  va: {
    name: "Voices of Asia & Africa",
    leader: "Several delegations working together",
    leaderTitle: "",
    color: "#4A5A1E",
    bodies: ["plenary"],
    who: "You are delegates who came to Paris because Wilson promised self-determination. You speak for peoples who fought and laboured for the Allies, but the great powers rule over most of you. Each member of your delegation speaks for a different people, and you vote together.",
    wants: ["Each member has their own orders: read your persona"],
    fears: "Being ignored while Europe redraws the world.",
    facts: [],
  },
};

// The peoples who make up "Voices of Asia & Africa" (and China, when China
// has its own delegation in large classes).
export const PERSONAS = {
  china: {
    name: "China",
    leader: "V. K. Wellington Koo",
    who: "China joined the war on the Allied side in 1917 and sent about 140,000 labourers to dig trenches and unload ships in France. Your aim: get back Shandong, the birthplace of Confucius, which Germany seized in 1898 and Japan took in 1914. The problem: Japan holds secret promises from Britain and France, and in 1918 China's own government signed a loan deal with Japan that accepted Japanese rights in Shandong.",
    wants: ["Shandong returned to China", "An end to foreign privileges inside China", "Friends among the great powers, especially the US"],
    facts: ["About 140,000 Chinese labourers served in France", "Shandong taken by Japan in 1914", "Students in Beijing are watching Paris closely"],
  },
  vietnam: {
    name: "Vietnam",
    leader: "Nguyễn Ái Quốc (“Nguyen the Patriot”, later known as Ho Chi Minh)",
    who: "You are a young Vietnamese man working in Paris, retouching photographs. About 90,000 Vietnamese soldiers and workers were sent to France during the war. With other patriots you have written “The Demands of the Annamite People”: eight requests for equal rights under French rule. You are not even asking for independence yet, only fairness. Nobody invited you.",
    wants: [
      "Freedom of the press, of speech and to organize for the Vietnamese",
      "Equal justice for Vietnamese and French people",
      "Release of political prisoners",
      "Vietnamese representatives in the French parliament",
    ],
    facts: ["About 90,000 Vietnamese soldiers and workers sent to France", "Vietnam has been under French rule since the 1880s", "Wilson promised self-determination"],
  },
  africa: {
    name: "Africa & the African diaspora",
    leader: "W. E. B. Du Bois and Blaise Diagne (Pan-African Congress)",
    who: "In February 1919 you organized the first Pan-African Congress in Paris. Diagne is the first Black African elected to the French parliament; he recruited tens of thousands of West African soldiers for France in 1918, on the promise of rights in return. About 200,000 West Africans fought for France. In the East African campaign, around a million Africans were made to serve as porters, and roughly 100,000 of them died. Germany's African colonies (Togo, Cameroon, South West Africa, East Africa) are up for grabs.",
    wants: [
      "German colonies placed under international protection, not handed to new rulers",
      "African peoples given a growing share in their own government",
      "Land held in trust for Africans",
      "Recognition of what African soldiers sacrificed",
    ],
    facts: ["About 200,000 West Africans fought for France", "Around 100,000 African porters died in East Africa", "First Pan-African Congress, Paris, February 1919"],
  },
  arab: {
    name: "The Arab delegation",
    leader: "Emir Faisal",
    who: "Your father, Sharif Hussein of Mecca, led the Arab Revolt against the Ottoman Empire after Britain promised Arab independence (the McMahon–Hussein letters, 1915). Your soldiers fought alongside the British and entered Damascus in 1918. Then you learned of the secret Sykes–Picot Agreement (1916), dividing the Arab lands between Britain and France.",
    wants: ["An independent Arab kingdom including Syria", "Britain to keep its wartime promises", "No French rule in Syria"],
    facts: ["Arab Revolt, 1916–1918", "Sykes–Picot Agreement, 1916", "Faisal spoke to the Council of Ten in February 1919"],
  },
};

// China's dossier mirrors its persona when China is a delegation of its own.
Object.assign(DELEGATIONS.cn, {
  who: PERSONAS.china.who,
  wants: PERSONAS.china.wants,
  fears: "Leaving Paris with Shandong in Japanese hands and nothing to show the students at home.",
  facts: PERSONAS.china.facts,
});

export const ITALY_NPC_NOTE = "Italy is played by the game in this class: its votes follow Orlando's real instructions.";

// ---------------------------------------------------------------- jobs
export const JOBS = {
  head: { label: "Head of Delegation", does: "Casts your delegation's votes and declares threats. Listen to your team's recommendations first." },
  envoy: { label: "Envoy", does: "Sends and answers diplomatic notes. You may also walk to other delegations' tables during negotiation." },
  intel: { label: "Intelligence Officer", does: "Receives secret reports each round. Brief your team: only you see them." },
  press: { label: "Press Secretary", does: "Publishes your delegation's statement to the world. It appears on the big screen." },
};

// ---------------------------------------------------------------- press statements
// Every delegation picks a tone each round; the round topic is inserted.
export const PRESS_TONES = {
  firm: "Firm",
  conciliatory: "Conciliatory",
  outraged: "Outraged",
  principled: "Principled",
};
export const PRESS_LINES = {
  fr: {
    firm: "France will accept nothing less than security. We were invaded twice in fifty years.",
    conciliatory: "France is ready to listen, as long as our ruined towns are not forgotten.",
    outraged: "Our dead are not a bargaining chip. France was the battlefield of this war.",
    principled: "Justice means the aggressor repairs what it destroyed.",
  },
  gb: {
    firm: "The British Empire did its duty. The peace must reflect that sacrifice.",
    conciliatory: "A lasting peace must leave Germany able to work, trade and pay.",
    outraged: "The British public will not stand for a soft peace.",
    principled: "Britain seeks a settlement that the next generation will not have to fight over.",
  },
  us: {
    firm: "America did not cross the ocean to divide up the spoils of old empires.",
    conciliatory: "Every nation here has something to give. Let us find the common ground.",
    outraged: "Secret treaties and land grabs betray the men who died for a better world.",
    principled: "Peoples are not pawns. The peace must rest on the consent of the governed.",
  },
  it: {
    firm: "Italy kept its word in 1915. Now our allies must keep theirs.",
    conciliatory: "Italy seeks only what is fair, and what was promised.",
    outraged: "Six hundred thousand Italian dead deserve more than a mutilated victory.",
    principled: "Italian people belong in Italy.",
  },
  de: {
    firm: "Germany laid down its arms on the basis of the Fourteen Points. We expect them to be honoured.",
    conciliatory: "The German people want peace, work and bread. Give our democracy a chance.",
    outraged: "This is not a peace. It is a dictated peace, a Diktat.",
    principled: "No people can be asked to sign a lie about its own guilt.",
  },
  jp: {
    firm: "Japan fought as a loyal ally and expects to be treated as an equal.",
    conciliatory: "Japan seeks friendship and fairness among all nations.",
    outraged: "How can there be a League of equals that refuses to call races equal?",
    principled: "The equality of nations must include the equality of their peoples.",
  },
  cn: {
    firm: "China cannot give up Shandong, any more than Christians could give up Jerusalem.",
    conciliatory: "China was your ally. We ask only for what is ours.",
    outraged: "China sent its sons to France. Now our land is traded away in secret.",
    principled: "Self-determination must mean something in Asia too.",
  },
  va: {
    firm: "We will be heard, whether this Conference listens or not.",
    conciliatory: "We do not ask for the world. We ask for fairness.",
    outraged: "Our soldiers died for France and Britain. Our peoples are still not free.",
    principled: "If self-determination is right for Europe, it is right for Asia and Africa.",
  },
};

// ---------------------------------------------------------------- note templates
// Envoys build structured notes. {decision} and {option} slots are filled from the round.
export const NOTE_TYPES = {
  offer: { label: "Offer a deal", template: "We will vote “{optA}” on {decA} if you vote “{optB}” on {decB}." },
  request: { label: "Request support", template: "We ask you to support “{optA}” on {decA}." },
  warn: { label: "Issue a warning", template: "If {decA} ends with “{optA}”, our delegation will not forget it." },
  meet: { label: "Request a meeting", template: "We request a private meeting. Please send your envoy to our table." },
  support: { label: "Pledge support", template: "You have our support on {decA}. We are with you on “{optA}”." },
};
export const NOTE_REPLIES = {
  accept: "We accept.",
  decline: "We decline.",
  consider: "We will consider it. Come and talk.",
};

// ---------------------------------------------------------------- helpers for goals
// A goal is { text, max, score(outcome) }. Outcome: { dec: {id: option}, votes: {id: {del: option}}, threats: {...}, flags }
const dec = (id, pts, text) => ({ text, max: Math.max(...Object.values(pts)), score: (o) => pts[o.dec[id]] || 0 });
const voted = (id, option, pts, text, who) => ({ text, max: pts, score: (o, self) => ((o.votes[id] || {})[who || self] === option ? pts : 0) });
const custom = (max, text, fn) => ({ text, max, score: fn });

// ---------------------------------------------------------------- rounds
// Each round: two or three decisions. body "council" = France, Britain, US, Italy.
// body "plenary" = every delegation except Germany (Germany was not invited).
export const ROUNDS = [
  // ============================================================ ROUND 1
  {
    id: "guilt",
    title: "Who Pays?",
    subtitle: "War guilt and reparations",
    date: "March 1919",
    question: "Who was responsible for the war, and who should pay for the damage?",
    source: {
      text: "The Allied and Associated Governments affirm and Germany accepts the responsibility of Germany and her allies for causing all the loss and damage… as a consequence of the war imposed upon them by the aggression of Germany and her allies.",
      cite: "Draft of what became Article 231, the “war guilt clause”",
    },
    context: [
      "About 9 million soldiers are dead. Northern France and Belgium are in ruins.",
      "Britain and France borrowed huge sums from the United States to fight the war, and now they must repay them.",
      "In Britain, Lloyd George won the December 1918 election on slogans like “Make Germany pay” and “Hang the Kaiser”.",
      "Germany signed the armistice expecting a peace based on Wilson's Fourteen Points, which said Germany should restore the land it invaded.",
    ],
    decisions: [
      {
        id: "guiltClause",
        body: "plenary",
        title: "The war guilt clause",
        question: "What should the treaty say about responsibility for the war?",
        options: [
          { id: "kaiser", label: "Germany is guilty, and the Kaiser goes on trial", detail: "Germany accepts responsibility for all loss and damage, and Kaiser Wilhelm II is put on trial for “a supreme offence against international morality”.", fx: { resentment: 14 }, term: "Germany accepted guilt for all loss and damage, and the Kaiser was to be put on trial." },
          { id: "art231", label: "Germany and its allies are responsible", detail: "Germany accepts the responsibility of “Germany and her allies” for causing the loss and damage. The Kaiser is not tried.", fx: { resentment: 9 }, term: "Germany accepted responsibility for causing the loss and damage of the war." },
          { id: "shared", label: "No guilt clause: responsibility was shared", detail: "The treaty states that the war arose from the actions of several powers. Germany pays for damage in lands it occupied, but is not singled out.", fx: { resentment: -6, security: -5 }, term: "The treaty made no single nation guilty for the war." },
        ],
        compromise: "art231",
        npc: { it: "kaiser" },
        historical: "kaiser",
        soften: { from: ["kaiser", "art231"], label: "Remove the war guilt clause", fx: { resentment: -10 } },
      },
      {
        id: "reparations",
        body: "council",
        title: "Reparations",
        question: "How much should Germany pay?",
        options: [
          { id: "full", label: "The full cost of the war, pensions included", detail: "Germany pays for all civilian damage plus the pensions of Allied soldiers and widows. The total is so large it will be fixed later by a Reparations Commission. Experts whisper of over 130 billion gold marks.", fx: { resentment: 10, strain: 25, security: 8 }, term: "Germany was to pay the full cost of the war, including Allied pensions: a bill later set at 132 billion gold marks." },
          { id: "fixed", label: "A fixed sum Germany can afford", detail: "Set a firm figure now, about 40 billion gold marks, which economists like John Maynard Keynes say Germany could really pay. Germany knows the bill and can plan.", fx: { resentment: 3, strain: 8, security: -3 }, term: "Germany was to pay a fixed 40 billion gold marks, a sum economists believed it could afford." },
          { id: "civil", label: "Repair civilian damage only", detail: "Following the Fourteen Points: Germany pays to rebuild the towns, homes and farms of France and Belgium. No pensions, no war costs.", fx: { resentment: 0, strain: 12, security: 2 }, term: "Germany was to pay to repair civilian damage in France and Belgium." },
        ],
        compromise: "civil",
        npc: { it: "full" },
        historical: "full",
        soften: { from: ["full"], label: "Reduce reparations to a fixed sum Germany can pay", fx: { strain: -12, resentment: -5 } },
      },
    ],
    threats: [
      {
        id: "wilsonShip",
        who: "us",
        label: "Order the George Washington readied to sail home",
        announce: "BREAKING: President Wilson orders his ship, the George Washington, prepared to sail. America will leave Paris unless Germany is spared the full cost of the war.",
        demand: { decision: "reparations", options: ["fixed", "civil"] },
        met: { text: "Wilson's threat worked. The ship stays in port, and America stays at the table.", fx: { league: 5 }, score: 2 },
        unmet: { text: "Wilson sails home in protest. He returns weeks later, but the conference has learned that America will walk away.", fx: { league: -12 }, score: -2 },
      },
      {
        id: "clemenceauRuins",
        who: "fr",
        label: "Take the delegates on a tour of the ruined north",
        announce: "BREAKING: Clemenceau invites every delegation to tour the ruins of Reims and the Somme. “See what Germany did, then tell me about mercy.”",
        demand: { decision: "reparations", options: ["full", "civil"] },
        met: { text: "The tour of the ruins persuaded the Council. France gets its repairs.", fx: { security: 5 }, score: 2 },
        unmet: { text: "France feels abandoned by its allies. Clemenceau's critics in Paris call him weak.", fx: { security: -8 }, score: -1 },
      },
    ],
    actions: [
      { id: "blockadePlea", who: "de", label: "Publish figures on hunger under the blockade", announce: "BERLIN: The German government publishes figures on children dying of hunger under the continuing Allied blockade.", fx: { resentment: 3 }, text: "World opinion stirs, a little, about hunger in Germany." },
    ],
    goals: {
      fr: [dec("reparations", { full: 3, civil: 2, fixed: 0 }, "Make Germany pay to rebuild France, ideally the full cost of the war"), dec("guiltClause", { kaiser: 2, art231: 2, shared: 0 }, "Write Germany's guilt into the treaty")],
      gb: [
        custom(2, "Voters at home: either the full cost of the war OR put the Kaiser on trial", (o) => (o.dec.reparations === "full" || o.dec.guiltClause === "kaiser" ? 2 : 0)),
        dec("reparations", { fixed: 2, civil: 1, full: 0 }, "The Treasury: keep Germany able to trade with Britain"),
      ],
      us: [dec("reparations", { fixed: 2, civil: 2, full: 0 }, "Keep reparations to what Germany can pay"), dec("guiltClause", { shared: 1, art231: 1, kaiser: 0 }, "Avoid a vengeful trial of the Kaiser")],
      it: [dec("reparations", { full: 2, civil: 1, fixed: 0 }, "Get the largest possible reparations (Italy wants its share)"), dec("guiltClause", { kaiser: 1, art231: 1, shared: 0 }, "Stand with France and Britain on guilt")],
      de: [dec("guiltClause", { shared: 3, art231: 0, kaiser: 0 }, "Avoid the war guilt clause"), dec("reparations", { fixed: 2, civil: 2, full: 0 }, "Keep reparations to what Germany can pay")],
      jp: [voted("guiltClause", "art231", 1, "Stay close to Britain, your ally: vote for the moderate guilt clause"), custom(1, "Build friendships: have at least one other delegation vote the same way as you", (o, self) => (Object.entries(o.votes.guiltClause || {}).some(([d, v]) => d !== self && v === (o.votes.guiltClause || {})[self]) ? 1 : 0))],
      china: [custom(1, "Win American friendship: vote the same way as the US on guilt", (o, self) => (o.votes.guiltClause && o.votes.guiltClause[self] && o.votes.guiltClause[self] === o.votes.guiltClause.us ? 1 : 0))],
      vietnam: [custom(1, "Principle: oppose punishing a whole people (vote “No guilt clause”) or win French goodwill (vote with France)", (o, self) => { const v = (o.votes.guiltClause || {})[self]; return v && (v === "shared" || v === (o.votes.guiltClause || {}).fr) ? 1 : 0; })],
      africa: [custom(1, "Diagne promised loyalty to France for rights in return: vote with France on guilt", (o, self) => { const v = (o.votes.guiltClause || {}); return v[self] && v[self] === v.fr ? 1 : 0; })],
      arab: [custom(1, "Keep Britain on side: vote with Britain on guilt", (o, self) => { const v = o.votes.guiltClause || {}; return v[self] && v[self] === v.gb ? 1 : 0; })],
    },
    intel: {
      fr: "Marshal Foch privately warns: “Germany's population is 60 million to our 40 million. In twenty years they will be back.” Whatever money you get, security matters more.",
      gb: "Treasury adviser John Maynard Keynes warns Lloyd George privately: a huge bill will wreck Germany, then Europe, then British trade. But the newspapers at home are watching every word.",
      us: "Senator Henry Cabot Lodge is already gathering votes against any treaty that ties America to Europe. If you give up too much, you lose the Senate; if you give up too little, Europe may not sign.",
      it: "Rome cables: “Reparations matter less than land. Do not quarrel with France now. We will need its vote on Fiume.”",
      de: "Your financial experts estimate Germany could pay perhaps 30 to 40 billion gold marks over many years. Anything higher, they warn, means printing money, and that ruins the currency.",
      jp: "Tokyo cables: “Europe's quarrels are not ours. Build goodwill now. You will need votes when racial equality and Shandong come up.”",
      cn: "The American delegation is friendly. If China votes with the US now, Wilson may remember it when Shandong is decided.",
      va: "Your contacts say France is counting votes. A delegation that helps France now might be heard later, or might simply be used.",
    },
    teaser: "Next session: the map of Europe. Where will Germany's new borders be drawn, and who will guard them?",
    reflect: "Was it fair to make one country pay for a war that many countries fought?",
    history: [
      "The final treaty included both Article 231, the war guilt clause, and Article 227, which called for the Kaiser to be tried. The trial never happened: the Netherlands refused to hand him over.",
      "The Allies could not agree on a figure, so a Reparations Commission set the bill in 1921 at 132 billion gold marks. South African leader Jan Smuts persuaded the Council to include Allied pensions, which roughly doubled the total.",
      "Wilson really did order his ship, the George Washington, prepared to sail in April 1919. He stayed.",
      "Germans called Article 231 the Kriegsschuldlüge, the “war guilt lie”. It became one of the most hated lines in the treaty.",
    ],
  },

  // ============================================================ ROUND 2
  {
    id: "borders",
    title: "Redrawing Germany",
    subtitle: "Borders, the Rhineland and the army",
    date: "April 1919",
    question: "How do you stop Germany from ever attacking again, without creating a new grievance?",
    source: {
      text: "You may strip Germany of her colonies, reduce her armaments to a mere police force and her navy to that of a fifth-rate power; all the same in the end if she feels that she has been unjustly treated in the peace of 1919 she will find means of exacting retribution from her conquerors.",
      cite: "David Lloyd George, the Fontainebleau Memorandum, 25 March 1919",
    },
    context: [
      "The River Rhine is France's natural defensive line. Marshal Foch wants the Rhineland, Germany's land west of the river, taken from Germany completely.",
      "A new Poland has been reborn after 123 years. It needs access to the sea, but the land in between has many German inhabitants, and the port of Danzig is almost entirely German.",
      "German-speaking Austria wants to join Germany. France is horrified at the idea.",
      "Wilson's Fourth Point called for armaments to be reduced by all nations, not just Germany.",
    ],
    decisions: [
      {
        id: "rhineland",
        body: "council",
        title: "The Rhineland",
        question: "What should happen to Germany's land west of the Rhine?",
        options: [
          { id: "buffer", label: "Make it a separate state under French protection", detail: "Foch's plan: cut the Rhineland from Germany and make it a “buffer state” protected by French troops. France also takes the Saar coalfield.", fx: { security: 22, resentment: 16 }, term: "The Rhineland was cut off from Germany as a separate buffer state under French protection." },
          { id: "occupy", label: "Occupy it for 15 years, demilitarize it forever", detail: "Allied troops occupy the Rhineland for 15 years. No German soldiers or forts there, ever. The Saar's coal goes to France for 15 years, then its people vote. Britain and the US promise to defend France if attacked.", fx: { security: 12, resentment: 8 }, term: "The Rhineland was occupied for 15 years and permanently demilitarized; the Saar's coal went to France for 15 years." },
          { id: "demil", label: "Demilitarize it, but no occupation", detail: "German troops and forts are banned from the Rhineland, but no foreign armies occupy it. It stays fully German.", fx: { security: 2, resentment: 2 }, term: "The Rhineland was demilitarized but not occupied." },
        ],
        compromise: "occupy",
        npc: { it: "occupy" },
        historical: "occupy",
        soften: { from: ["buffer", "occupy"], label: "End foreign control of the Rhineland sooner", fx: { resentment: -6, security: -5 } },
      },
      {
        id: "poland",
        body: "council",
        title: "Poland and Danzig",
        question: "How will the new Poland reach the sea?",
        options: [
          { id: "corridor", label: "A corridor to the sea; Danzig a Free City", detail: "Poland gets a strip of land to the Baltic, cutting East Prussia off from the rest of Germany. Danzig, a German city, becomes a “Free City” under the League of Nations.", fx: { resentment: 8, security: 4 }, term: "Poland received a corridor to the sea, splitting Germany in two; Danzig became a Free City under the League." },
          { id: "danzig", label: "Give Poland the corridor and Danzig itself", detail: "Poland gets the corridor and the port of Danzig outright, making Poland a strong ally for France in the east.", fx: { resentment: 14, security: 8 }, term: "Poland received a corridor to the sea and the German port of Danzig." },
          { id: "vote", label: "Let the people vote (plebiscites)", detail: "Hold votes in every disputed area and draw borders by the results, even if Poland ends up with weaker access to the sea.", fx: { resentment: -2, security: -4 }, term: "Disputed borders between Germany and Poland were settled by plebiscites, votes of the local people." },
        ],
        compromise: "corridor",
        npc: { it: "corridor" },
        historical: "corridor",
        soften: { from: ["corridor", "danzig"], label: "Hold plebiscites in the disputed eastern lands", fx: { resentment: -6 } },
      },
      {
        id: "military",
        body: "plenary",
        title: "Germany's armed forces",
        question: "How far should Germany be disarmed?",
        options: [
          { id: "police", label: "Reduce the army to a police force", detail: "No army at all, only a police force. No navy, no aircraft, no arms factories. Austria may never join Germany.", fx: { resentment: 14, security: 10 }, term: "Germany's army was reduced to a police force, and union with Austria was forbidden." },
          { id: "limit", label: "An army of 100,000 men, no tanks or air force", detail: "No conscription, no tanks, no military aircraft, no submarines, six battleships only. Austria may never join Germany.", fx: { resentment: 8, security: 6 }, term: "Germany's army was limited to 100,000 men with no tanks, air force or submarines; union with Austria was forbidden." },
          { id: "general", label: "Disarm Germany first, then everyone", detail: "The same limits as the 100,000-man option, but every League member must also cut its armed forces by 1930. Germany is the first step, not the only one.", fx: { resentment: 2, security: 2, league: 10 }, term: "Germany's army was limited to 100,000 men, and every League member promised to disarm by 1930." },
        ],
        compromise: "limit",
        npc: { it: "limit" },
        historical: "limit",
        soften: { from: ["police", "limit"], label: "Allow Germany a larger army for defence", fx: { resentment: -5, security: -6 } },
      },
    ],
    threats: [
      {
        id: "clemenceauLeave",
        who: "fr",
        label: "Threaten to leave the Conference",
        announce: "BREAKING: Clemenceau threatens to walk out of the Conference unless France gets real control of the Rhine.",
        demand: { decision: "rhineland", options: ["buffer", "occupy"] },
        met: { text: "France got its guarantees on the Rhine. Clemenceau stays.", fx: { security: 4 }, score: 2 },
        unmet: { text: "France walks out for three days. The Conference nearly collapses, and France returns bitter and afraid.", fx: { security: -12, league: -6 }, score: -2 },
      },
      {
        id: "lloydFontainebleau",
        who: "gb",
        label: "Publish the Fontainebleau Memorandum",
        announce: "BREAKING: Lloyd George circulates a memorandum warning that a harsh peace will make Germany seek revenge. He demands the Rhineland stay German.",
        demand: { decision: "rhineland", options: ["occupy", "demil"] },
        met: { text: "Britain's warning was heeded: the Rhineland stays German.", fx: { resentment: -3 }, score: 2 },
        unmet: { text: "Britain's warning was ignored. British opinion begins to turn against the treaty, and against France.", fx: { security: -5 }, score: -1 },
      },
    ],
    actions: [
      { id: "selfDetLetter", who: "persona", persona: ["vietnam", "africa", "arab", "china"], label: "Write to Wilson, quoting his own words on self-determination", announce: "LETTER TO THE PRESIDENT: Delegates of colonized peoples ask Wilson whether self-determination applies to them, or only to Europeans.", fx: { awakening: 6 }, text: "Wilson's secretary acknowledges receipt. Newspapers in Asia and Africa print the letter." },
    ],
    goals: {
      fr: [dec("rhineland", { buffer: 3, occupy: 2, demil: 0 }, "Control the Rhine: buffer state best, occupation acceptable"), dec("poland", { danzig: 2, corridor: 1, vote: 0 }, "Build a strong Poland as an ally in the east"), dec("military", { police: 2, limit: 1, general: 0 }, "Keep the German army as small as possible, but don't let France be disarmed")],
      gb: [dec("rhineland", { occupy: 2, demil: 2, buffer: 0 }, "Do not create a “new Alsace-Lorraine”: keep the Rhineland German"), dec("military", { limit: 1, police: 1, general: 0 }, "Shrink the German navy, but don't sign up to cut the Royal Navy"), dec("poland", { corridor: 1, vote: 1, danzig: 0 }, "Don't hand millions of Germans to Poland")],
      us: [dec("poland", { vote: 2, corridor: 1, danzig: 0 }, "Self-determination: borders should follow what people want"), dec("military", { general: 2, limit: 1, police: 0 }, "Point Four: disarmament for all"), dec("rhineland", { demil: 1, occupy: 1, buffer: 0 }, "No annexations")],
      it: [dec("military", { limit: 1, police: 1, general: 0 }, "Keep Germany and Austria apart, but don't disarm Italy"), voted("rhineland", "occupy", 1, "Back France on the Rhine (you need its vote on Fiume)")],
      de: [dec("rhineland", { demil: 2, occupy: 0, buffer: 0 }, "Keep the Rhineland free of foreign troops"), dec("poland", { vote: 3, corridor: 0, danzig: 0 }, "Keep Germans in Germany: let the people vote"), dec("military", { general: 2, limit: 0, police: 0 }, "If Germany disarms, everyone disarms")],
      jp: [dec("military", { limit: 1, police: 1, general: 0 }, "Protect the Japanese navy: avoid binding all nations to disarm"), custom(1, "Make a friend: vote the same way as Britain", (o, self) => { const v = o.votes.military || {}; return v[self] && v[self] === v.gb ? 1 : 0; })],
      china: [dec("poland", { vote: 1, corridor: 0, danzig: 0 }, "Set a precedent: borders by the people's will"), voted("military", "general", 1, "Support disarmament for all great powers")],
      vietnam: [dec("poland", { vote: 2, corridor: 0, danzig: 0 }, "If Poles get to vote on their future, why not the Vietnamese? Push for plebiscites")],
      africa: [dec("poland", { vote: 1, corridor: 0, danzig: 0 }, "Set a precedent for self-determination"), voted("military", "general", 1, "Support disarmament for all great powers")],
      arab: [dec("poland", { vote: 2, corridor: 0, danzig: 0 }, "Set a precedent for self-determination")],
    },
    intel: {
      fr: "Your generals report the Americans and British will offer a treaty promising to defend France if Germany attacks. But the US Senate has not agreed to anything yet. Can you trust a promise from Washington?",
      gb: "Your diplomats warn that if the Rhineland is cut off, German nationalists will have a cause for decades. Lloyd George has written that he “cannot conceive any greater cause of future war” than leaving millions of Germans under foreign rule.",
      us: "Your experts report the Danzig area is about 90% German. A corridor will cut East Prussia off from Germany. Self-determination and Polish access to the sea cannot both be fully honoured.",
      it: "A German–Austrian union would put a large German state right on Italy's northern border. Make sure it stays forbidden.",
      de: "Polish forces are already fighting German volunteers in Posen and Silesia. Whatever is decided on paper, there will be violence on the ground.",
      jp: "Britain is watching to see whether Japan is a reliable partner. Supporting Britain now may help Japan when Shandong comes to the table.",
      cn: "The Polish delegate, Paderewski, is a world-famous pianist and a celebrity in Paris. If self-determination works for Poland, use it as a precedent for Shandong.",
      va: "The Americans privately admit self-determination is meant “for Europe”. A public vote for plebiscites puts them on the record.",
    },
    teaser: "Next session: the question of equality. Japan has a proposal, China has a claim, and they cannot both win.",
    reflect: "Can a border ever be drawn that is fair to everyone who lives near it?",
    history: [
      "The Rhineland was occupied for 15 years and demilitarized forever. Britain and the US promised to defend France, but the US Senate never approved that promise, so Britain's lapsed too. France felt betrayed.",
      "Poland received a corridor to the Baltic, cutting East Prussia off from Germany. Danzig became a Free City under the League of Nations. In 1939, Hitler's demand for Danzig was the immediate trigger of the Second World War.",
      "Germany's army was limited to 100,000 men, with no tanks, air force or submarines, and union with Austria was forbidden. The treaty said this would “render possible” disarmament by all nations, but the other powers never disarmed.",
      "Some plebiscites were held: in Schleswig, East Prussia and Upper Silesia (1920–21), and in the Saar in 1935, where about 90% voted to rejoin Germany.",
    ],
  },

  // ============================================================ ROUND 3
  {
    id: "equality",
    title: "Shandong & Equality",
    subtitle: "The racial equality clause and the fate of Shandong",
    date: "April 1919",
    question: "Does the new world order treat all peoples as equals?",
    source: {
      text: "The equality of nations being a basic principle of the League of Nations, the High Contracting Parties agree to accord, as soon as possible, to all alien nationals of states members of the League equal and just treatment in every respect, making no distinction, either in law or in fact, on account of their race or nationality.",
      cite: "Japan's proposed racial equality amendment, February 1919",
    },
    context: [
      "Japan proposes adding a statement on the equality of races to the Covenant of the League of Nations.",
      "Australia's Prime Minister Billy Hughes fiercely opposes it, fearing it will end the “White Australia” policy. Many Americans, especially on the West Coast, also support laws against Asian immigrants.",
      "Shandong, in China, was German until Japan captured it in 1914. Britain and France secretly promised Japan it could keep it.",
      "China is an Allied power too. It says Shandong is Chinese land and must be returned.",
    ],
    decisions: [
      {
        id: "equalityClause",
        body: "plenary",
        title: "The racial equality clause",
        question: "Should the League's Covenant declare the equality of nations and fair treatment of their peoples?",
        options: [
          { id: "include", label: "Include it", detail: "The Covenant's preamble endorses “the principle of the equality of nations and just treatment of their nationals.”", fx: { awakening: 6, asia: -6, league: 5 }, term: "The League Covenant endorsed the equality of nations and just treatment of their peoples." },
          { id: "reject", label: "Leave it out", detail: "The Covenant says nothing about racial equality.", fx: { awakening: 4, asia: 8 }, term: "The League Covenant made no statement on racial equality." },
        ],
        compromise: "reject",
        npc: { it: "include" },
        historical: "reject",
        unanimity: "us",
      },
      {
        id: "shandong",
        body: "council",
        title: "Shandong",
        question: "Who gets Germany's former rights in Shandong?",
        options: [
          { id: "japan", label: "Japan, in full", detail: "All of Germany's rights in Shandong (the port of Qingdao, the railway, the mines) pass to Japan.", fx: { asia: 16, awakening: 8 }, term: "Germany's rights in Shandong passed to Japan." },
          { id: "promise", label: "Japan, with a promise to return it to China", detail: "Japan takes Germany's rights now, but promises in public to hand political control back to China later, keeping only economic rights.", fx: { asia: 8, awakening: 6 }, term: "Germany's rights in Shandong passed to Japan, which promised to return political control to China." },
          { id: "china", label: "Return it to China", detail: "Shandong goes back to China, its rightful owner, as self-determination demands.", fx: { asia: -4, awakening: 3 }, term: "Shandong was returned to China." },
        ],
        compromise: "promise",
        npc: { it: "promise" },
        historical: "promise",
      },
    ],
    threats: [
      {
        id: "japanLeave",
        who: "jp",
        label: "Threaten to leave the Conference and refuse to join the League",
        announce: "BREAKING: Japan's delegation announces it will leave Paris and refuse to join the League of Nations unless Japan receives Shandong.",
        demand: { decision: "shandong", options: ["japan", "promise"] },
        met: { text: "Japan keeps Shandong and stays. The League has its Asian great power.", fx: { asia: 4 }, score: 2 },
        unmet: { text: "Japan's delegation packs its bags. Japan will not join the League, and in Tokyo the army's voice grows louder.", fx: { league: -15, asia: 12 }, score: -1 },
      },
      {
        id: "chinaRefuse",
        who: "persona",
        persona: ["china"],
        label: "Announce China will refuse to sign the treaty",
        announce: "BREAKING: China's delegation declares it will not sign any treaty that hands Shandong to Japan.",
        demand: { decision: "shandong", options: ["china"] },
        met: { text: "China won back Shandong and will sign proudly.", fx: { awakening: 3 }, score: 2 },
        unmet: { text: "China will not sign. Its delegates will refuse to attend the signing ceremony.", fx: { awakening: 8 }, score: 1, flag: "chinaRefuses" },
      },
      {
        id: "hughesWalk",
        who: "gb",
        label: "Billy Hughes threatens to walk out",
        announce: "BREAKING: Australian Prime Minister Billy Hughes says Australia will leave the Conference, and campaign against the League, if the racial equality clause passes.",
        demand: { decision: "equalityClause", options: ["reject"] },
        met: { text: "Hughes got his way. The Dominions stay loyal to London.", fx: { awakening: 3 }, score: 2 },
        unmet: { text: "Hughes storms out of the Conference. Australia threatens to stay out of the League.", fx: { league: -6 }, score: -2 },
      },
    ],
    actions: [
      { id: "fourteenPoints", who: "de", label: "Print the Fourteen Points beside the draft treaty", announce: "BERLIN: German newspapers print Wilson's Fourteen Points side by side with the terms being drafted in Paris, and invite readers to compare them.", fx: { resentment: 2, league: -2 }, text: "Wilson's critics in Britain and America take up the comparison." },
      { id: "backEquality", who: "persona", persona: ["vietnam", "africa", "arab"], label: "Publicly back Japan's equality clause", announce: "STATEMENT: Delegates of colonized peoples publicly support Japan's call for racial equality.", fx: { awakening: 5 }, text: "Colonized peoples across the world take note of who voted against equality." },
    ],
    goals: {
      fr: [dec("shandong", { japan: 1, promise: 1, china: 0 }, "Keep France's secret 1917 promise to Japan"), custom(1, "Keep Japan in the League (no Japanese walkout)", (o) => (o.threatsUnmet.includes("japanLeave") ? 0 : 1))],
      gb: [dec("equalityClause", { reject: 2, include: 0 }, "Keep the Dominions happy: no racial equality clause"), dec("shandong", { japan: 1, promise: 1, china: 0 }, "Keep Britain's 1917 promise to Japan, your ally")],
      us: [custom(2, "Keep Japan in the League (no Japanese walkout)", (o) => (o.threatsUnmet.includes("japanLeave") ? 0 : 2)), dec("shandong", { china: 2, promise: 1, japan: 0 }, "Self-determination: China's claim to Shandong"), dec("equalityClause", { reject: 1, include: 0 }, "Avoid a fight with the Senate and Western states over Asian immigration")],
      it: [voted("equalityClause", "include", 1, "Italy supported the equality clause: vote for it"), dec("shandong", { promise: 1, japan: 1, china: 0 }, "Support the secret treaties: Italy's own claims depend on them")],
      de: [dec("shandong", { china: 1, promise: 0, japan: 0 }, "Better China than Japan, the power that took Germany's colony")],
      jp: [dec("equalityClause", { include: 3, reject: 0 }, "Win the racial equality clause"), dec("shandong", { japan: 3, promise: 2, china: 0 }, "Keep Shandong")],
      china: [dec("shandong", { china: 4, promise: 1, japan: 0 }, "Win back Shandong")],
      vietnam: [dec("equalityClause", { include: 3, reject: 0 }, "Racial equality in the Covenant")],
      africa: [dec("equalityClause", { include: 3, reject: 0 }, "Racial equality in the Covenant")],
      arab: [dec("equalityClause", { include: 2, reject: 0 }, "Racial equality in the Covenant")],
    },
    intel: {
      fr: "France's 1917 note to Japan promised support on Shandong. Clemenceau privately sympathizes with China, but a promise is a promise, and France may need Japan later.",
      gb: "Billy Hughes says he will “raise a storm” across the Empire if the equality clause passes. Lord Robert Cecil, your League expert, quietly thinks the clause is harmless.",
      us: "You are chairing the League commission. If the clause wins a majority but not every vote, you could rule that such an important change needs unanimity. Either way, someone will call it unfair.",
      it: "Italy's own claims rest on secret wartime treaties. If the Shandong promises to Japan are torn up, the Treaty of London could be next.",
      de: "Germany built Qingdao's port and brewery. Whatever happens, Germany loses it. Note who takes it, and remember.",
      jp: "Tokyo cables: “If equality fails, Shandong is the minimum. Do not leave Paris with neither.” Many in Tokyo will read rejection as an insult from the West.",
      cn: "Students in Beijing are reading every report from Paris. If Shandong goes to Japan, there will be protests in the streets. Your secret weakness: in 1918 China's own government accepted Japanese loans tied to Shandong.",
      va: "Japan rules Korea, where the March 1st uprising was crushed this spring. Japan demands equality in Paris. Is backing Japan the same as backing equality?",
    },
    teaser: "Next session: the spoils of empire. Germany's colonies and the Arab lands are about to be divided, and Africa and the Arab world want a voice.",
    reflect: "Can a peace be fair if it declares some peoples more equal than others?",
    history: [
      "On 11 April 1919, 11 of the 17 delegates on the League commission voted for Japan's equality clause. Wilson, chairing the commission, ruled that it needed unanimous support, so it was not adopted. Britain, under pressure from Australia's Billy Hughes, opposed it.",
      "On 30 April the Council of Four gave Germany's rights in Shandong to Japan. Japan made a verbal promise to return political control to China later.",
      "On 4 May 1919, thousands of students protested in Beijing. The May Fourth Movement became a turning point in modern Chinese nationalism.",
      "China refused to sign the treaty. Shandong was finally returned to China in 1922, at the Washington Conference.",
    ],
  },

  // ============================================================ ROUND 4
  {
    id: "empire",
    title: "The Spoils of Empire",
    subtitle: "Germany's colonies and the Arab lands",
    date: "May 1919",
    question: "Who should rule the peoples of Germany's lost colonies and the old Ottoman Empire, and who decides?",
    source: {
      text: "To those colonies and territories… which are inhabited by peoples not yet able to stand by themselves under the strenuous conditions of the modern world, there should be applied the principle that the well-being and development of such peoples form a sacred trust of civilisation.",
      cite: "Draft of Article 22 of the League Covenant (the mandate system)",
    },
    context: [
      "Germany's colonies in Africa (Togo, Cameroon, South West Africa, East Africa) and the Pacific must be given to someone.",
      "South Africa wants South West Africa. Australia wants German New Guinea. Japan wants the Pacific islands north of the equator.",
      "The Ottoman Empire's Arab lands (Syria, Lebanon, Iraq, Palestine) were promised to the Arabs by Britain in 1915, and secretly divided between Britain and France in 1916.",
      "The Pan-African Congress asks for German colonies to be placed under international protection, with Africans given a growing role in their own government.",
    ],
    decisions: [
      {
        id: "colonies",
        body: "plenary",
        title: "Germany's colonies",
        question: "What happens to Germany's colonies in Africa and the Pacific?",
        options: [
          { id: "annex", label: "Annex them: the victors take them as colonies", detail: "Britain, France, Belgium, South Africa, Australia, New Zealand and Japan simply take them over as their own colonies.", fx: { awakening: 10, league: -6 }, term: "Germany's colonies were annexed by the victors as ordinary colonies." },
          { id: "mandate", label: "League mandates, run by the victors", detail: "The victors govern the colonies as “mandates”, reporting to the League of Nations, until the peoples are judged “able to stand by themselves”. Nobody sets a date.", fx: { awakening: 7 }, term: "Germany's colonies became League of Nations mandates, governed by the victors." },
          { id: "trust", label: "International trusteeship with a path to self-rule", detail: "The Pan-African Congress plan: the League supervises directly, land is protected for Africans, and local people get a growing share in government, with a timetable.", fx: { awakening: 4, league: 8 }, term: "Germany's colonies were placed under League trusteeship with a timetable toward self-government." },
        ],
        compromise: "mandate",
        npc: { it: "annex" },
        historical: "mandate",
      },
      {
        id: "arab",
        body: "council",
        title: "The Arab lands",
        question: "What should happen to Syria, Lebanon, Iraq and Palestine?",
        options: [
          { id: "divide", label: "Divide them between Britain and France as mandates", detail: "Follow the Sykes–Picot Agreement: France takes Syria and Lebanon, Britain takes Iraq and Palestine, as League mandates.", fx: { awakening: 10 }, term: "The Arab lands were divided between Britain and France as League mandates." },
          { id: "faisal", label: "An independent Arab kingdom under Faisal", detail: "Keep Britain's 1915 promise: an independent Arab state with Faisal as king, from Damascus.", fx: { awakening: 4, league: 3 }, term: "An independent Arab kingdom under Faisal was recognized." },
          { id: "ask", label: "Ask the people: send a commission and follow its findings", detail: "Wilson's idea: send a commission to ask the people of Syria and Iraq what they want, and abide by the answer.", fx: { awakening: 5, league: 5 }, term: "A commission was sent to ask the peoples of the Arab lands what they wanted, and its findings were to be followed." },
        ],
        compromise: "ask",
        npc: { it: "divide" },
        historical: "divide",
      },
    ],
    threats: [
      {
        id: "hughesAnnex",
        who: "gb",
        label: "Hughes: “I speak for 60,000 dead”",
        announce: "BREAKING: Billy Hughes tells Wilson to his face that Australia will defy “the whole civilized world” to keep German New Guinea. He demands outright annexation.",
        demand: { decision: "colonies", options: ["annex", "mandate"] },
        met: { text: "Australia gets New Guinea. Hughes is satisfied.", fx: { awakening: 2 }, score: 2 },
        unmet: { text: "Hughes is furious, and the Dominions talk of quitting the League.", fx: { league: -6 }, score: -2 },
      },
      {
        id: "faisalRevolt",
        who: "persona",
        persona: ["arab", "africa", "vietnam", "china"],
        label: "Warn that the Arab peoples will rise if betrayed",
        announce: "BREAKING: The Arab delegation warns that if the Arab lands are divided between Britain and France, the Arab peoples will rise against them.",
        demand: { decision: "arab", options: ["faisal", "ask"] },
        met: { text: "The Arab cause is heard.", fx: { awakening: 3 }, score: 2 },
        unmet: { text: "The warning is ignored. Revolt will follow.", fx: { awakening: 10 }, score: 1, flag: "arabRevolt" },
      },
    ],
    actions: [
      { id: "colonialProtest", who: "de", label: "Protest the loss of the colonies and ask to govern them as League mandates", announce: "BERLIN: Germany protests the loss of all its colonies and asks to administer them itself as mandates of the League of Nations.", fx: { resentment: 2 }, text: "The Allies reply that Germany's record as a colonial ruler disqualifies it." },
      { id: "panAfrican", who: "persona", persona: ["africa", "vietnam", "arab", "china"], label: "Publish the Pan-African Congress resolutions", announce: "PARIS: The Pan-African Congress publishes its resolutions: African land held in trust for Africans, and African peoples given a growing role in their own government.", fx: { awakening: 8 }, text: "Newspapers in Paris, New York and Lagos print the resolutions." },
    ],
    goals: {
      fr: [dec("arab", { divide: 3, ask: 0, faisal: 0 }, "Win Syria and Lebanon for France"), dec("colonies", { annex: 2, mandate: 2, trust: 0 }, "Take Cameroon and Togo")],
      gb: [dec("arab", { divide: 2, ask: 0, faisal: 1 }, "Secure Iraq and Palestine (Faisal as a British friend is acceptable)"), dec("colonies", { annex: 2, mandate: 2, trust: 0 }, "Satisfy the Dominions: South West Africa, New Guinea, Samoa")],
      us: [dec("colonies", { trust: 2, mandate: 2, annex: 0 }, "No open land-grab: colonies under the League"), dec("arab", { ask: 2, faisal: 1, divide: 0 }, "Ask the people what they want")],
      it: [voted("colonies", "annex", 1, "Italy wants a share of the colonies: back annexation"), custom(1, "Get France's goodwill before Fiume: vote with France on colonies", (o, self) => { const v = o.votes.colonies || {}; return v[self] && v[self] === v.fr ? 1 : 0; })],
      de: [dec("colonies", { trust: 2, mandate: 1, annex: 0 }, "If Germany loses its colonies, don't let its enemies simply take them")],
      jp: [dec("colonies", { annex: 2, mandate: 2, trust: 0 }, "Keep the Pacific islands north of the equator")],
      china: [voted("colonies", "trust", 1, "Solidarity with Africa: vote for trusteeship"), dec("arab", { faisal: 1, ask: 1, divide: 0 }, "Solidarity: the Arab lands for the Arabs")],
      vietnam: [dec("colonies", { trust: 2, mandate: 0, annex: 0 }, "A path to self-rule for colonies"), dec("arab", { faisal: 1, ask: 1, divide: 0 }, "Solidarity: the Arab lands for the Arabs")],
      africa: [dec("colonies", { trust: 4, mandate: 1, annex: 0 }, "International trusteeship and a path to self-rule")],
      arab: [dec("arab", { faisal: 4, ask: 2, divide: 0 }, "An independent Arab kingdom")],
    },
    intel: {
      fr: "French troops are already in Lebanon. Britain's oil experts are eyeing Mosul in Iraq. A quiet deal with Britain could settle everything before Wilson notices.",
      gb: "Britain promised the Arabs independence (1915), divided their land with France (1916), and promised a Jewish homeland in Palestine (1917). All three promises cannot be kept.",
      us: "If the colonies are simply annexed, critics will say the war was fought for empire after all. The mandate idea came partly from Jan Smuts of South Africa, who wants South West Africa for himself.",
      it: "Italy is getting very little from the colonial share-out. Ask France and Britain what Italy gets.",
      de: "Germany will lose its colonies. The Allies justify this by saying Germany ruled them cruelly, which is true in South West Africa, where German troops killed tens of thousands of Herero and Nama people in 1904–08.",
      jp: "Australia and New Zealand fear Japanese power in the Pacific. Japan's islands are worth more as a mandate than not at all.",
      cn: "A precedent: if the colonies' peoples get a say, China's claim to Shandong is stronger.",
      va: "Faisal has Lawrence of Arabia at his side, but Britain has already promised Syria to France. The Pan-African Congress has no army, only the press and the conscience of the world.",
    },
    teaser: "Next session: self-determination. Italy wants Fiume, a young Vietnamese man has a petition, and the League itself needs a shape.",
    reflect: "Who decided whether a people was “able to stand by themselves”? Was that a fair test?",
    history: [
      "Germany's colonies became League mandates. Class B and C mandates, in Africa and the Pacific, were run almost exactly like colonies, and no dates were set for independence.",
      "Billy Hughes told Wilson that Australia would defy the world to keep New Guinea, and Australia got it as a Class C mandate.",
      "Wilson sent the King–Crane Commission to Syria in 1919. It found that most people wanted independence. The report was ignored and not published until 1922.",
      "In 1920 the Arab lands were divided: Syria and Lebanon to France, Iraq and Palestine to Britain. France drove Faisal out of Damascus in July 1920; Britain made him King of Iraq in 1921. Revolts broke out in Iraq (1920) and Syria (1925).",
    ],
  },

  // ============================================================ ROUND 5
  {
    id: "selfdet",
    title: "Self-Determination",
    subtitle: "Fiume, the Vietnamese petition and the League",
    date: "June 1919",
    question: "Self-determination for whom? And who will keep the peace?",
    source: {
      text: "All subject peoples are filled with hope by the prospect that an era of right and justice is opening to them… the Annamite people… present to the noble Governments of the Entente… the following humble claims.",
      cite: "“The Demands of the Annamite People”, signed Nguyễn Ái Quốc, June 1919",
    },
    context: [
      "Italy demands the port of Fiume, but most people in the countryside around it are Croats, part of the new Yugoslavia.",
      "A petition from “a group of Annamite patriots” asks France for equal rights in Vietnam. It does not ask for independence.",
      "The League of Nations needs its final shape. France wants it to have an army. Wilson wants it to rely on the pressure of world opinion and economic sanctions.",
    ],
    decisions: [
      {
        id: "fiume",
        body: "council",
        title: "Fiume",
        question: "Who gets the port of Fiume?",
        options: [
          { id: "italy", label: "Italy: Fiume and Dalmatia", detail: "Give Italy Fiume plus the Dalmatian coast promised in 1915.", fx: { italy: -18 }, term: "Italy received Fiume and the Dalmatian coast." },
          { id: "free", label: "Make Fiume a free city", detail: "Fiume becomes an independent free city. Italy gets the 1915 lands in Istria but not Dalmatia.", fx: { italy: 8 }, term: "Fiume became a free city." },
          { id: "yugo", label: "Yugoslavia: self-determination", detail: "Wilson's position: Fiume's hinterland is Croatian, so it goes to the new Yugoslavia.", fx: { italy: 18 }, term: "Fiume went to Yugoslavia." },
        ],
        compromise: "free",
        npc: { it: "italy" },
        historical: "free",
      },
      {
        id: "petition",
        body: "council",
        title: "The Vietnamese petition",
        question: "How should the Conference respond to “The Demands of the Annamite People”?",
        options: [
          { id: "ignore", label: "Ignore it: an internal French matter", detail: "Acknowledge receipt politely. Colonies are the business of the countries that rule them.", fx: { awakening: 10 }, term: "The Vietnamese petition was ignored." },
          { id: "refer", label: "Refer it to the League", detail: "The League will receive petitions from colonized peoples and may comment. It has no power to force change.", fx: { awakening: 5, league: 3 }, term: "The Vietnamese petition was referred to the League of Nations." },
          { id: "reform", label: "France grants the eight demands", detail: "France promises equal justice, freedom of the press and association, and Vietnamese representatives in the French parliament.", fx: { awakening: 2 }, term: "France promised the reforms demanded by the Vietnamese petition." },
        ],
        compromise: "refer",
        npc: { it: "ignore" },
        historical: "ignore",
      },
      {
        id: "league",
        body: "plenary",
        title: "The League of Nations",
        question: "What power should the League have to keep the peace?",
        options: [
          { id: "army", label: "Give the League its own army", detail: "France's plan: an international force under League command to stop aggressors.", fx: { league: 12, security: 8 }, term: "The League of Nations received its own international army." },
          { id: "covenant", label: "Collective security, sanctions and world opinion", detail: "Members promise to protect each other (Article 10) and use economic sanctions. Big decisions need every member to agree. No army.", fx: { league: 0 }, term: "The League relied on collective security and sanctions, without an army." },
          { id: "open", label: "Open the League to all, Germany included", detail: "The same rules as collective security, but Germany, Russia and every state may join at once, and colonized peoples may send petitions.", fx: { league: 6, resentment: -6 }, term: "The League was opened to all nations at once, Germany included." },
        ],
        compromise: "covenant",
        npc: { it: "covenant" },
        historical: "covenant",
        soften: { from: ["army", "covenant"], label: "Admit Germany to the League immediately", fx: { resentment: -6, league: 3 } },
      },
    ],
    threats: [
      {
        id: "orlandoWalk",
        who: "it",
        npcAuto: true,
        label: "Walk out of the Conference",
        announce: "BREAKING: Orlando walks out of the Conference. Italy will not return unless it receives Fiume.",
        demand: { decision: "fiume", options: ["italy"] },
        met: { text: "Italy gets Fiume, and Orlando returns a hero.", fx: { italy: -5 }, score: 2 },
        unmet: { text: "Orlando leaves Paris, and returns two weeks later empty-handed. In Italy, the phrase “mutilated victory” is on every nationalist's lips.", fx: { italy: 12 }, score: -1 },
      },
      {
        id: "quocHalls",
        who: "persona",
        persona: ["vietnam"],
        label: "Deliver the petition to every delegation, and to Wilson",
        announce: "PARIS: A young Vietnamese man, Nguyễn Ái Quốc, delivers “The Demands of the Annamite People” to every delegation, and asks to see President Wilson.",
        demand: { decision: "petition", options: ["reform", "refer"] },
        met: { text: "The petition is heard. Vietnamese readers in Paris and Hanoi celebrate.", fx: { awakening: 3 }, score: 2 },
        unmet: { text: "The petition is ignored. Wilson never replies. Nguyễn Ái Quốc concludes that the colonial powers will never give freedom willingly.", fx: { awakening: 12 }, score: 1, flag: "quocTurns" },
      },
    ],
    actions: [
      { id: "lodge", who: "us", label: "Accept Senate amendments to the League in advance", announce: "WASHINGTON: Wilson signals he could accept Senate amendments protecting America's freedom of action.", fx: { league: 4 }, text: "Senators are cautiously pleased. The League might pass the Senate after all." },
    ],
    goals: {
      fr: [dec("petition", { ignore: 3, refer: 1, reform: 0 }, "Indochina is French business: the petition must not set a precedent"), dec("league", { army: 3, covenant: 1, open: 0 }, "A League with teeth: its own army")],
      gb: [dec("league", { covenant: 2, open: 1, army: 0 }, "No international army telling the Royal Navy what to do"), dec("petition", { ignore: 1, refer: 1, reform: 0 }, "No precedent for India or Egypt")],
      us: [dec("league", { covenant: 2, open: 2, army: 0 }, "A League the Senate can accept (no army)"), dec("fiume", { yugo: 2, free: 1, italy: 0 }, "Self-determination: Fiume's region is Croatian"), custom(1, "Answer the petition, at least by referring it to the League", (o) => (o.dec.petition === "ignore" ? 0 : 1))],
      it: [dec("fiume", { italy: 4, free: 1, yugo: 0 }, "Win Fiume")],
      de: [dec("league", { open: 3, covenant: 0, army: 0 }, "Join the League as an equal, now")],
      jp: [dec("league", { covenant: 2, open: 1, army: 0 }, "A League of great powers, no army"), voted("fiume", "free", 1, "Stay neutral on Fiume")],
      china: [dec("league", { open: 1, covenant: 1, army: 1 }, "A League that might protect weaker nations like China"), dec("petition", { reform: 1, refer: 1, ignore: 0 }, "Solidarity with Vietnam")],
      vietnam: [dec("petition", { reform: 4, refer: 2, ignore: 0 }, "The eight demands granted, or at least heard")],
      africa: [dec("league", { open: 2, covenant: 0, army: 0 }, "A League open to all, where colonized peoples can petition"), dec("petition", { reform: 1, refer: 1, ignore: 0 }, "Solidarity with Vietnam")],
      arab: [dec("league", { open: 2, covenant: 0, army: 0 }, "A League open to all, where colonized peoples can petition")],
    },
    intel: {
      fr: "Your colonial ministry warns: “If the Annamites get a hearing, Algeria, Senegal and Madagascar will be next.” French police are already watching Nguyễn Ái Quốc.",
      gb: "Egypt rose in revolution in March 1919 after Britain refused to let its delegates come to Paris. In April, British troops killed hundreds of unarmed people at Amritsar in India. The world is watching how Britain treats its subject peoples.",
      us: "Wilson is exhausted; he fell seriously ill in April. Senator Lodge has 39 senators ready to block any League without changes. An army under League command would never pass.",
      it: "The poet Gabriele D'Annunzio is gathering veterans who say they will take Fiume by force if diplomats will not give it to Italy.",
      de: "Germany is not invited to join the League. Without a seat, every League decision will be made without you.",
      jp: "Japan is now one of the League's permanent Council members. A League army could one day be used against Japan in China.",
      cn: "China may appeal to the League in future disputes with Japan. A stronger League helps China.",
      va: "Nguyễn Ái Quốc's petition asks only for equal rights, not independence. If even this is refused, what is left except revolution?",
    },
    teaser: "Next session: the Hall of Mirrors. Germany receives the treaty. Will it sign?",
    reflect: "Who was self-determination really for?",
    history: [
      "Orlando walked out on 24 April 1919 after Wilson appealed directly to the Italian people over his head. He came back two weeks later with nothing new. Fiume was not settled at Paris: it became a free city in 1920, and Italy annexed it in 1924.",
      "In September 1919, the poet D'Annunzio and 2,600 followers seized Fiume. Mussolini borrowed his style. Italian nationalists called the peace a “mutilated victory”.",
      "Nguyễn Ái Quốc's petition was ignored. In 1920 he helped found the French Communist Party; in 1930 he founded the Indochinese Communist Party, and on 2 September 1945, as Ho Chi Minh, he declared Vietnam's independence in Hanoi.",
      "The League had no army. Decisions needed unanimity, and the US Senate refused to join. Germany was admitted only in 1926.",
    ],
  },
];

// ---------------------------------------------------------------- finale
export const FINALE = {
  date: "May–June 1919",
  terms: {
    title: "The Terms Are Handed Over",
    date: "7 May 1919, Trianon Palace Hotel, Versailles",
    source: {
      text: "We are required to admit that we alone are war-guilty; such an admission on my lips would be a lie.",
      cite: "Count Brockdorff-Rantzau, receiving the treaty while remaining seated, 7 May 1919",
    },
    germanyPrompt: "Read the treaty your conference has written. Choose up to three terms to challenge. The Conference will vote on each one.",
    deliveryOptions: [
      { id: "seated", label: "Stay seated and denounce the treaty", detail: "Like Brockdorff-Rantzau: proud, defiant, insulting to the Allies.", fx: { resentment: 4 } },
      { id: "standing", label: "Stand, and appeal for a just peace", detail: "Respectful, and appealing to the Fourteen Points.", fx: { resentment: -2 } },
    ],
  },
  counter: {
    title: "The German Counter-Proposals",
    date: "29 May – 16 June 1919",
    prompt: "Germany has challenged these terms. The Conference votes on each: soften the term, or refuse?",
  },
  sign: {
    title: "Sign or Refuse?",
    date: "16–23 June 1919",
    source: {
      text: "What hand would not wither that binds itself and us in these fetters?",
      cite: "Philipp Scheidemann, German Chancellor, who resigned rather than sign, 12 May 1919",
    },
    germany: [
      { id: "sign", label: "Sign the treaty", detail: "Accept the terms. The war is over, the blockade ends, and the republic survives, but its enemies will call you traitors." },
      { id: "refuse", label: "Refuse to sign", detail: "Reject the Diktat. Allied armies are ready to march into Germany and the blockade will continue." },
    ],
    china: [
      { id: "sign", label: "Sign the treaty", detail: "Stay inside the new world order, whatever happened to Shandong." },
      { id: "refuse", label: "Refuse to sign", detail: "Stay away from the Hall of Mirrors. China will make a separate peace with Germany." },
    ],
    paths: {
      vietnam: [
        { id: "petition", label: "Keep petitioning France", detail: "Work within the French system for equal rights." },
        { id: "revolution", label: "Turn to revolutionary politics", detail: "If the powers will not listen, organize to take freedom." },
      ],
      africa: [
        { id: "congress", label: "Hold more Pan-African Congresses", detail: "Build a worldwide movement through the press and conferences." },
        { id: "home", label: "Organize at home", detail: "Build unions, newspapers and parties inside the colonies." },
      ],
      arab: [
        { id: "kingdom", label: "Proclaim the Arab kingdom anyway", detail: "Faisal declares himself King of Syria in Damascus." },
        { id: "bargain", label: "Bargain with Britain", detail: "Accept British protection in exchange for an Arab throne." },
      ],
      china: [
        { id: "students", label: "Trust the students: build a new China", detail: "Back the May Fourth movement's call to modernize and stand up to foreign powers." },
        { id: "diplomacy", label: "Keep negotiating", detail: "Wait for the next conference and appeal to America." },
      ],
    },
  },
  ceremony: {
    title: "The Hall of Mirrors",
    date: "28 June 1919, Palace of Versailles",
    text: "Five years to the day after the assassination of Archduke Franz Ferdinand in Sarajevo, the treaty is signed in the same Hall of Mirrors where the German Empire was proclaimed in 1871.",
    reflect: "Look at the treaty your conference wrote. Who won? Who lost? Who was never really asked?",
  },
  history: [
    "Germany received the terms on 7 May 1919. Its counter-proposals of 29 May were almost entirely rejected. The main concession was a plebiscite in Upper Silesia (held in 1921).",
    "On 16 June the Allies gave Germany an ultimatum: sign within days or the war would resume. On 21 June the German fleet, held at Scapa Flow, scuttled itself rather than be handed over.",
    "The German National Assembly voted to sign on 23 June. Two German ministers signed in the Hall of Mirrors on 28 June 1919.",
    "China refused to sign: its delegates stayed away from the ceremony.",
    "Marshal Foch said of the treaty: “This is not peace. It is an armistice for twenty years.”",
  ],
};

// ---------------------------------------------------------------- epilogue
// Each event returns { title, text, danger } from the outcome context.
// ctx: { m: meters, dec: decisions, flags: {...}, softened: Set, paths: {...}, signed }
export const EPILOGUE = [
  {
    year: "1919",
    title: (c) => (c.dec.shandong === "china" ? "Celebrations in Beijing" : "The May Fourth Movement"),
    text: (c) =>
      c.dec.shandong === "china"
        ? "Crowds in Beijing celebrate the return of Shandong. Chinese faith in the new world order, and in America, runs high."
        : "Thousands of students march in Beijing against the Shandong decision. Some lose faith in Western democracy and look to Soviet Russia instead; the Chinese Communist Party is founded in 1921.",
    danger: (c) => c.dec.shandong !== "china",
  },
  {
    year: "1920",
    title: (c) => (c.m.league >= 65 ? "America Joins the League" : "The US Senate Says No"),
    text: (c) =>
      c.m.league >= 65
        ? "After a hard fight, the Senate approves the treaty with amendments. The world's richest power sits in the League of Nations."
        : "The US Senate rejects the treaty. America never joins the League. Britain's promise to defend France lapses with America's.",
    danger: (c) => c.m.league < 65,
  },
  {
    year: "1920",
    title: (c) => (c.dec.arab === "divide" ? "Revolt in the Arab Lands" : c.dec.arab === "faisal" ? "The Kingdom of Syria" : "The Commission Reports"),
    text: (c) =>
      c.dec.arab === "divide"
        ? "France drives Faisal from Damascus. Revolt breaks out in Iraq against British rule. Arab nationalists will remember the betrayal for generations."
        : c.dec.arab === "faisal"
          ? "Faisal rules an independent Arab kingdom from Damascus. It is fragile, poor and surrounded by suspicious empires, but it is Arab."
          : "The commission finds that most people want independence. The great powers now have to decide whether to listen.",
    danger: (c) => c.dec.arab === "divide",
  },
  {
    year: "1923",
    title: (c) => (c.m.strain >= 55 ? "The Ruhr and Hyperinflation" : "Germany Pays, Slowly"),
    text: (c) =>
      c.m.strain >= 55
        ? "Germany falls behind on reparations. French and Belgian troops occupy the Ruhr, Germany's industrial heart. The German government prints money; a loaf of bread costs 200 billion marks. Savings are wiped out, and the middle class blames the treaty, and the republic that signed it."
        : "Germany grumbles but pays. The mark stays stable. Hard years, but the republic survives them.",
    danger: (c) => c.m.strain >= 55,
  },
  {
    year: "1925",
    title: () => "Locarno: A Spirit of Peace",
    text: (c) =>
      c.m.resentment < 50
        ? "Germany, France and Britain sign the Locarno treaties. Germany joins the League in 1926. For a few years, Europe dares to hope."
        : "Germany signs the Locarno treaties and accepts its western borders, but not its eastern ones. The corridor and Danzig still burn.",
    danger: () => false,
  },
  {
    year: "1929",
    title: () => "The Great Depression",
    text: (c) =>
      `The Wall Street Crash brings worldwide depression, and no treaty could have prevented it. American loans to Germany are recalled. ${c.m.strain >= 55 ? "Already weakened by reparations, Germany is hit hardest: six million are unemployed by 1932." : "Germany is hit hard: millions lose their jobs."}`,
    danger: () => true,
  },
  {
    year: "1930",
    title: (c) => (c.dec.petition === "reform" ? "Reform in Indochina" : "Revolt in Vietnam"),
    text: (c) =>
      c.dec.petition === "reform"
        ? "Vietnamese representatives sit in Paris. The independence movement grows, but through newspapers and elections."
        : `The Yên Bái mutiny against French rule is crushed. Nguyễn Ái Quốc founds the Indochinese Communist Party.${c.paths.vietnam === "revolution" || c.flags.quocTurns ? " The road leads to 1945, when he declares independence in Hanoi, and to thirty years of war." : ""}`,
    danger: (c) => c.dec.petition !== "reform",
  },
  {
    year: "1931",
    title: (c) => (c.m.asia >= 45 ? "Japan Invades Manchuria" : "An Uneasy Calm in Asia"),
    text: (c) =>
      c.m.asia >= 45
        ? `The Japanese army seizes Manchuria. ${c.m.league >= 60 ? "The League acts firmly, and Japan backs down, for now." : "The League condemns Japan, but does nothing. Japan simply leaves the League (1933). Every aggressor is watching."}`
        : "Japanese nationalists push for expansion, but a government that won respect at Paris holds them back, for now.",
    danger: (c) => c.m.asia >= 45 && c.m.league < 60,
  },
  {
    year: "1933",
    title: (c) => (score1933(c) >= 70 ? "Hitler Comes to Power" : score1933(c) >= 50 ? "Democracy Under Siege" : "The Republic Holds"),
    text: (c) => {
      const s = score1933(c);
      if (s >= 70) return "Adolf Hitler becomes Chancellor. He has promised to tear up the “Diktat” of Versailles, and millions believe him. Within months, Germany is a dictatorship.";
      if (s >= 50) return "Extremists win millions of votes promising to undo the treaty. Rule by emergency decree replaces parliament. The republic may not last.";
      return "The Depression brings hardship and extremists, but most Germans still back the republic. The treaty, many say, was harsh but survivable.";
    },
    danger: (c) => score1933(c) >= 50,
  },
  {
    year: "1935",
    title: (c) => (c.m.italy >= 45 ? "Italy Invades Ethiopia" : "Italy Stays Quiet"),
    text: (c) =>
      c.m.italy >= 45
        ? `Mussolini, who rose to power on the anger of the “mutilated victory”, invades Ethiopia. ${c.m.league >= 60 ? "The League's sanctions bite and Italy is forced to retreat." : "The League's sanctions are weak, and oil keeps flowing. The League is finished as a peacekeeper."}`
        : "Italy, satisfied with its gains, stays a cautious member of the League.",
    danger: (c) => c.m.italy >= 45 && c.m.league < 60,
  },
  {
    year: "1936",
    title: (c) => (c.dec.rhineland === "buffer" ? "The Rhineland Revolts" : "Troops March into the Rhineland"),
    text: (c) =>
      score1933(c) >= 70
        ? c.dec.rhineland === "buffer"
          ? "Germany demands the return of the Rhineland, the land the treaty tore away. Its people riot for reunion. France hesitates."
          : "Hitler sends troops into the demilitarized Rhineland. France and Britain do nothing. Many British people say Germany is only “walking into its own back garden”."
        : "German governments demand the treaty be revised, through negotiation rather than force.",
    danger: (c) => score1933(c) >= 70,
  },
  {
    year: "1937",
    title: (c) => (c.m.asia >= 50 ? "War in China" : "Tension in China"),
    text: (c) => (c.m.asia >= 50 ? "Japan launches a full-scale invasion of China. In Asia, the Second World War has begun." : "Japan and China clash on the borders, but full-scale war is avoided, for now."),
    danger: (c) => c.m.asia >= 50,
  },
  {
    year: "1939",
    title: (c) => (warRisk(c) >= 60 ? "War in Europe" : warRisk(c) >= 45 ? "On the Brink" : "A Fragile Peace"),
    text: (c) => {
      const r = warRisk(c);
      const danzig = c.dec.poland === "vote" ? "the Polish border" : "Danzig and the Polish Corridor";
      if (r >= 60) return `Germany demands ${danzig}. On 1 September 1939, German troops invade Poland. Britain and France declare war. Twenty years after Versailles, the world is at war again.`;
      if (r >= 45) return `A crisis over ${danzig} brings Europe to the brink. Whether it ends in war depends on choices made in 1939, not 1919.`;
      return "Europe has crises, but no world war. The treaty's grievances were softened enough, and the League strong enough, to hold, at least this far.";
    },
    danger: (c) => warRisk(c) >= 45,
  },
];

export function score1933(c) {
  let s = c.m.resentment * 0.6 + c.m.strain * 0.45 + 18; // the Depression's push
  if (c.flags.forcedSign) s += 8;
  if (c.delivery === "seated") s += 2;
  return Math.round(Math.min(100, s));
}

export function warRisk(c) {
  let r = score1933(c) * 0.55 + (100 - c.m.league) * 0.25 + (c.m.italy >= 45 ? 6 : 0) + (c.m.asia >= 50 ? 6 : 0) + (100 - c.m.security) * 0.08;
  return Math.round(Math.min(100, r));
}

export const REAL_TIMELINE = [
  ["1919", "May Fourth protests in China; D'Annunzio seizes Fiume"],
  ["1920", "US Senate rejects the treaty; the Arab lands are divided between Britain and France"],
  ["1921", "The reparations bill is set at 132 billion gold marks"],
  ["1922", "Mussolini's March on Rome; Shandong returned to China"],
  ["1923", "France occupies the Ruhr; hyperinflation in Germany"],
  ["1925", "Locarno treaties; Germany joins the League in 1926"],
  ["1929", "The Great Depression begins"],
  ["1930", "Yên Bái mutiny; Indochinese Communist Party founded"],
  ["1931", "Japan invades Manchuria; leaves the League in 1933"],
  ["1933", "Hitler becomes Chancellor of Germany"],
  ["1935", "Italy invades Ethiopia; League sanctions fail"],
  ["1936", "German troops reoccupy the Rhineland"],
  ["1937", "Japan invades China"],
  ["1938", "Germany annexes Austria; the Munich Agreement"],
  ["1939", "Germany invades Poland over Danzig and the Corridor; the Second World War begins"],
  ["1945", "Ho Chi Minh declares Vietnam's independence in Hanoi"],
];

// ---------------------------------------------------------------- debrief (Extended)
export const DEBRIEF = [
  "Which delegation do you think was treated most unfairly? Use one specific term of the treaty as evidence.",
  "Was there any outcome your conference could have chosen that would have been fair to everyone? Why or why not?",
  "In our epilogue, what mattered more for the road to 1939: the treaty, or events no treaty could control (like the Depression)?",
  "The colonized peoples were mostly ignored in 1919. How did that shape the rest of the twentieth century, in Vietnam, China, Africa and the Middle East?",
  "Historians still disagree about whether the treaty was too harsh, too soft, or just badly enforced. Which do you find most convincing after playing?",
];

// ---------------------------------------------------------------- presets
export const PRESETS = {
  express: {
    label: "Express",
    lessons: 2,
    rounds: ["guilt", "borders", "equality"],
    negotiateMin: 8,
    plan: [
      "Lesson 1: join and assign delegations (15 min), Round 1: Who Pays?, Round 2: Redrawing Germany",
      "Lesson 2: Round 3: Shandong & Equality, the German finale, epilogue and verdict",
    ],
  },
  standard: {
    label: "Standard",
    lessons: 3,
    rounds: ["guilt", "borders", "equality", "empire", "selfdet"],
    negotiateMin: 10,
    plan: [
      "Lesson 1: join and assign delegations (15 min), Round 1: Who Pays?, Round 2: Redrawing Germany",
      "Lesson 2: recap, Round 3: Shandong & Equality, Round 4: The Spoils of Empire",
      "Lesson 3: recap, Round 5: Self-Determination, the German finale, epilogue and verdict",
    ],
  },
  extended: {
    label: "Extended",
    lessons: 4,
    rounds: ["guilt", "borders", "equality", "empire", "selfdet"],
    negotiateMin: 12,
    plan: [
      "Lesson 1: join and assign delegations (15 min), Round 1: Who Pays?, Round 2: Redrawing Germany",
      "Lesson 2: recap, Round 3: Shandong & Equality, Round 4: The Spoils of Empire",
      "Lesson 3: recap, Round 5: Self-Determination, the German finale, epilogue and verdict",
      "Lesson 4: guided debrief, then students begin the perspective essay",
    ],
  },
};

// ---------------------------------------------------------------- assessment
export const PERSPECTIVES = [
  {
    id: "soldier",
    title: "A British soldier who fought on the Western Front",
    intro: "You enlisted in 1915 and survived the Somme and Passchendaele. Many of your friends did not come home. Back in Britain, jobs are scarce, and politicians promise “homes fit for heroes”.",
    consider: [
      "What do you think Germany owes Britain, and the men who died?",
      "Lloyd George promised to “make Germany pay”. Did the treaty deliver?",
      "You fought beside soldiers from India, Australia, Canada and Africa. Was the treaty fair to them?",
      "Will your sons have to fight Germany again?",
    ],
  },
  {
    id: "widow",
    title: "A German woman whose husband died in the war",
    intro: "Your husband was killed at Verdun in 1916. The blockade left your children hungry through the winter of 1918–19. The Kaiser is gone, and a new republic signed the armistice expecting a fair peace based on Wilson's Fourteen Points.",
    consider: [
      "How do you feel about Article 231, the war guilt clause?",
      "Can your family, and your country, afford the reparations?",
      "Do you trust the new democratic government that signed the treaty?",
      "Who do you blame for your husband's death?",
    ],
  },
  {
    id: "general",
    title: "An American general",
    intro: "You commanded American troops in France in 1918, arriving when the war was nearly won and the other armies were exhausted. Now you watch your President in Paris, trying to build a new world order.",
    consider: [
      "Did the treaty match Wilson's Fourteen Points?",
      "From a soldier's view, is Germany disarmed enough to keep the peace, or too much to stay stable?",
      "Should America join the League of Nations and help enforce this treaty?",
      "What did you think of the decisions on Shandong, the colonies and racial equality?",
    ],
  },
  {
    id: "farmer",
    title: "A French farmer whose land on the Western Front was destroyed",
    intro: "Your farm near the Somme lies under shell craters, barbed wire and unexploded shells. Your village was flattened. Your eldest son was killed in 1914. Germany has invaded France twice in your lifetime.",
    consider: [
      "Who should pay to rebuild your farm and village?",
      "Does the treaty keep France safe from a third invasion?",
      "Is it fair to demand so much from Germany? Is it fair to demand less?",
      "Soldiers from France's colonies, from West Africa and Vietnam, fought to defend your land. What do you think they deserved?",
    ],
  },
];

export const ASSESSMENT = {
  title: "Was the Treaty of Versailles Fair?",
  subtitle: "A perspective piece. MYP Individuals and Societies, Year 5",
  question: "Was the Treaty of Versailles fair to all parties?",
  task: "Choose one perspective. Writing in the first person, as that person in 1919 or 1920, explain whether the Treaty of Versailles was fair, and why or why not. Use specific terms of the treaty and specific events from the conference simulation as evidence. Your character can have strong feelings, but your argument must be supported.",
  length: "400–600 words",
  steps: [
    "Choose your perspective, and read the questions to consider.",
    "Look back at your conference notebook below. Underline evidence you can use.",
    "Plan with the organizer: your claim, three pieces of evidence, and one point another person would disagree with.",
    "Write your piece in the first person, in the voice of your character.",
    "Check your work against the rubric.",
  ],
  criteria: [
    {
      id: "A",
      name: "Criterion A: Knowing and understanding",
      strands: "i. use terminology in context; ii. demonstrate knowledge and understanding of subject-specific content and concepts through developed descriptions, explanations and examples",
      bands: [
        ["0", "The student does not reach a standard described by any of the descriptors below."],
        ["1–2", "Uses limited terminology (such as reparations, war guilt, armistice). Shows basic knowledge of the treaty's terms, with few or inaccurate examples."],
        ["3–4", "Uses some terminology accurately. Describes some terms of the treaty with simple examples."],
        ["5–6", "Uses a range of terminology accurately. Explains several terms of the treaty and how they affected your character, with relevant examples."],
        ["7–8", "Uses a wide range of terminology consistently and accurately (e.g. Article 231, reparations, demilitarized, mandate, self-determination). Gives detailed, accurate explanations of the treaty's terms and their effects, with well-chosen examples."],
      ],
    },
    {
      id: "C",
      name: "Criterion C: Communicating",
      strands: "i. communicate information and ideas effectively using an appropriate style for the audience and purpose; ii. structure information and ideas in a way that is appropriate to the specified format",
      bands: [
        ["0", "The student does not reach a standard described by any of the descriptors below."],
        ["1–2", "Communicates with a limited sense of the character's voice. Little structure."],
        ["3–4", "Communicates somewhat effectively; the character's voice is sometimes clear. Some structure."],
        ["5–6", "Communicates effectively in a mostly consistent first-person voice suited to the character and the time. Clear structure."],
        ["7–8", "Communicates very effectively in a convincing, consistent voice for the character and the period. Ideas are structured purposefully, building to a clear judgement."],
      ],
    },
    {
      id: "D",
      name: "Criterion D: Thinking critically",
      strands: "ii. synthesize information to make valid, well-supported arguments; iv. interpret different perspectives and their implications",
      bands: [
        ["0", "The student does not reach a standard described by any of the descriptors below."],
        ["1–2", "States an opinion on fairness with little support. Shows little awareness of other perspectives."],
        ["3–4", "Makes a simple argument about fairness with some support. Identifies at least one other perspective."],
        ["5–6", "Makes a clear, supported argument about fairness. Explains how at least one other party saw the treaty differently, and why."],
        ["7–8", "Makes a valid, well-supported argument about fairness, weighing evidence. Interprets several perspectives and the implications of the treaty for each of them."],
      ],
    },
  ],
};

// ---------------------------------------------------------------- Germany's home front
// Germany chooses one each round, alongside a formal objection.
export const GERMAN_STANCES = [
  { id: "fulfil", label: "Cooperate", detail: "Tell Germans the republic will cooperate with the terms and rebuild. Calms anger, but nationalists call you weak.", fx: { resentment: -4 } },
  { id: "protest", label: "Protest through diplomacy", detail: "Lodge a formal protest and appeal to the Fourteen Points. Keeps your options open.", fx: {} },
  { id: "defy", label: "Stir up national anger", detail: "Let the newspapers rage against the “Diktat”. Unites Germans now, but feeds the extremists' story that Germany was betrayed.", fx: { resentment: 6 } },
];
