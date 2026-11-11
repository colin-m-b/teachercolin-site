// "37 Days": teacher-only and archive-only content. Served by the game API, never as a static file.
// DRAFT for the content checkpoint: every fact to be checked against two sources; no invented quotations.

// One note per round: what really happened, what the game compresses, where each counterfactual option comes from.
export const NOTES = {
  1: {
    happened: '28 June: Franz Ferdinand and Sophie murdered in Sarajevo. 5–6 July: the Hoyos mission to Berlin; Germany promises full support (the "blank cheque"). 7 July: Vienna’s Council of Ministers; Tisza alone argues against war.',
    compressed: 'Three weeks of secret talks become one decision. Britain’s Irish crisis (Buckingham Palace conference, 21–24 July) runs alongside the whole game.',
    counterfactuals: 'Tisza’s line (no war without proof) is his real position on 1–7 July. Limited German support echoes later German hopes of a quick "fait accompli". A Serbian crackdown on the Black Hand had precedent: Pašić and Apis were already in open conflict in 1914. A public Serbian appeal to Russia came later in reality (24 July).',
  },
  2: {
    happened: '13 July: Wiesner’s telegram (no proof of Serbian government guilt; weapons traced to Serbian army stores). 14 July: Tisza agrees to an ultimatum. 20–23 July: Poincaré and Viviani in St Petersburg. 23 July, 6 pm: the ultimatum is handed over, timed for after the French left.',
    compressed: 'The Franco-Russian talks left few written records; the game turns them into one promise choice.',
    counterfactuals: 'A softer note was argued for by Tisza. German "softening" did not happen in July 1914. Grey’s mediation offers and private warnings came mostly after 24 July. Serbia’s election (due 14 August) was real; calming the press was urged by some Serbian diplomats.',
  },
  3: {
    happened: '24 July: Russian Council of Ministers agrees to support Serbia; Sazonov’s alarm. 25 July: Serbia’s reply accepts most points but refuses Austrian officials taking part in the judicial inquiry (point 6); Serbia mobilizes. Austria breaks off relations within the hour. 26 July: Russia’s "period preparatory to war"; the British fleet is kept together after exercises.',
    compressed: 'The reply and Vienna’s bar for accepting it are chosen secretly and revealed together.',
    counterfactuals: 'Full acceptance by Serbia was not seriously considered in Belgrade. Grey proposed the four-power conference on 26 July. The Kaiser read the reply on 28 July.',
  },
  4: {
    happened: '26 July: Grey proposes a conference of ambassadors in London; Germany declines. 28 July: Austria-Hungary declares war on Serbia. 28 July: the Kaiser proposes the "Halt in Belgrade". Russia prepares a partial mobilization. Serbia’s government moves to Niš.',
    compressed: 'Direct Russian–Austrian talks (Sazonov and Szápáry, 26–30 July) become one option.',
    counterfactuals: 'The "Halt in Belgrade" is the Kaiser’s real idea. German pressure on Vienna to accept talks came only on 29–30 July (Bethmann’s telegrams). Serbia’s offer to accept arbitration by The Hague or the great powers was in its reply of 25 July.',
  },
  5: {
    happened: '29 July: Belgrade shelled; the Tsar orders, then cancels, general mobilization after a telegram from the Kaiser. 29 July: Grey warns Germany’s ambassador privately. 30 July: Russia orders general mobilization; France pulls back 10 km. 31 July: Germany’s ultimatum to Russia; Belgium mobilizes.',
    compressed: 'Three days of fast-moving decisions become one round. The "Willy–Nicky" telegrams ran from 29 July to 1 August.',
    counterfactuals: 'A British naval promise to France came on 2 August in reality, after the game’s round 5 dates. Belgium appealed to its guarantors only after German troops crossed the border (4 August).',
  },
  6: {
    happened: '1 August: Germany declares war on Russia; Moltke tells the Kaiser an east-only war cannot be done. 2 August: German ultimatum to Belgium. 3 August: Germany declares war on France; Belgium refuses. 4 August: Germany invades Belgium; Britain declares war. Austria-Hungary declares war on Russia on 6 August, after the game ends.',
    compressed: 'Five days become one round, resolved in a fixed order: Russia, Germany, Austria, France, Belgium, Britain.',
    counterfactuals: 'French neutrality was demanded by Germany on 31 July; the demand for Toul and Verdun was in Germany’s instructions, though never delivered. Belgium letting German troops pass was what Germany asked for. Italy’s neutrality (2–3 August) is real.',
  },
};

// Real-1914 evidence packet, released in archive stage 3 (Clark). Paraphrased throughout.
export const EVIDENCE = [
  { date: '5–6 July', title: 'The "blank cheque"', text: 'After meeting Count Hoyos, the Kaiser and Bethmann Hollweg tell Austria-Hungary that Germany will stand by it, even if Russia intervenes, and urge it to act quickly.', source: 'Reports of the Austrian ambassador Szögyény, 5–6 July 1914 (paraphrased; see Geiss, July 1914, 1967).' },
  { date: '13 July', title: 'Wiesner’s telegram', text: 'Austria’s investigator finds no proof that the Serbian government planned or helped the murder, but traces the bombs to a Serbian army depot.', source: 'Wiesner to Vienna, 13 July 1914 (paraphrased).' },
  { date: '20–23 July', title: 'Poincaré in St Petersburg', text: 'France’s President and Prime Minister spend four days with the Tsar and his ministers. Almost no written record of what they agreed survives.', source: 'See Clark, The Sleepwalkers (2012), ch. 9.' },
  { date: '25 July', title: 'Serbia’s reply', text: 'Serbia accepts most of Austria-Hungary’s ten demands, but refuses to let Austrian officials take part in the investigation inside Serbia. It mobilizes its army the same afternoon.', source: 'Serbian reply, 25 July 1914 (paraphrased).' },
  { date: '28 July', title: 'The Kaiser reads the reply', text: 'The Kaiser writes that Serbia’s reply removes every reason for war, and suggests that Austria-Hungary occupy Belgrade only, as a pledge.', source: 'Wilhelm II to Jagow, 28 July 1914 (paraphrased).' },
  { date: '29 July', title: 'Grey’s private warning', text: 'Grey tells Germany’s ambassador privately that if France is drawn in, Britain could not stand aside for long.', source: 'Lichnowsky to Berlin, 29 July 1914 (paraphrased).' },
  { date: '30 July', title: 'Bethmann presses Vienna', text: 'Bethmann Hollweg telegraphs Vienna urging it to accept mediation, warning that Germany will not be dragged into a world war by Austria-Hungary ignoring advice.', source: 'Bethmann Hollweg to Tschirschky, 30 July 1914 (paraphrased).' },
  { date: '30 July', title: 'Russia mobilizes', text: 'After two days of hesitation, the Tsar agrees to general mobilization against both Austria-Hungary and Germany.', source: 'See Clark (2012), ch. 11; McMeekin, July 1914 (2013).' },
  { date: '1 August', title: 'One war plan', text: 'The Kaiser asks Moltke to attack Russia only. Moltke says it cannot be done: the army’s only plan attacks France first, through Belgium.', source: 'Moltke’s memoirs (paraphrased); see Mombauer, Helmuth von Moltke (2001).' },
  { date: '2–4 August', title: 'Belgium', text: 'Germany demands passage through Belgium. Belgium refuses on 3 August. German troops cross the border on 4 August, and Britain declares war that night.', source: 'German note to Belgium, 2 August 1914; British ultimatum, 4 August 1914 (paraphrased).' },
];
