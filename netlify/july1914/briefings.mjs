// "37 Days": role briefings. SECRET: served only by the game API, to the matching role key.
// netlify.toml blocks /netlify/* on the public site so this file is never published as a static file.
//
// DRAFT for the content checkpoint. Rules (plan: content production):
//   B1 English, 60 words max, no invented quotations (paraphrase only), facts to be checked against two sources.
//   Briefings do not depend on game state; where the situation may differ, they say "if".
// Leader = cabinet briefing. General = military briefing (readiness, timetables, war plans).
// The Serbia team plays Belgium from round 5.

export const BRIEFINGS = {
  AH: {
    1: {
      leader: 'Archduke Franz Ferdinand, heir to your throne, has been murdered by a Bosnian Serb. Many in Vienna blame Serbia. Foreign Minister Berchtold must choose. General Conrad wants war. Hungary’s Prime Minister Tisza warns that war without proof could bring in Russia. Austria-Hungary cannot face Russia without Germany behind it.',
      general: 'Conrad has urged war on Serbia many times before 1914. The army can beat Serbia alone, but not Serbia and Russia together. Many soldiers are on harvest leave until 25 July, so a quick strike is not possible. A war with Russia would need German help.',
    },
    2: {
      leader: 'Your investigator in Sarajevo has reported: read his telegram carefully. Tisza will accept strong demands only if Austria-Hungary promises to take no Serbian land. Your demands must satisfy the army. But if Serbia accepts everything, can you still punish it? The French President is in Russia until 23 July.',
      general: 'Harvest leave means the army cannot mobilize quickly until late July. Conrad warns that delay helps Serbia prepare and lets Europe’s sympathy fade. Mobilizing against Serbia takes about two weeks. If Russia joins in, troops must go north to Galicia instead of south to Serbia.',
    },
    3: {
      leader: 'Serbia must reply by 6 pm on 25 July. Decide now what reply you will accept. If you accept too little, the army will say Austria-Hungary is weak. If you demand total acceptance, Europe may see you as the aggressor. Remember: you cannot fight without German support.',
      general: 'Serbia may be mobilizing. Some in Vienna want to declare war early, so that diplomats cannot stop it. But the army will not be ready to invade Serbia until mid-August. Every week of waiting gives Serbia time to prepare its defences.',
    },
    4: {
      leader: 'Britain may propose a conference. Germany may push you towards talks, or back you fully. A declaration of war on Serbia would make it hard for other powers to step in: that is why some in Vienna want one. But it could also bring Russia into the crisis.',
      general: 'The army is mobilizing against Serbia. If Russia mobilizes, Conrad must decide where the reserve army goes: south to Serbia, or north against Russia. Belgrade is on the border, within reach of Austro-Hungarian guns across the river.',
    },
    5: {
      leader: 'Russia may mobilize. If Germany has proposed a "Halt in Belgrade", you could hold the city as a pledge and negotiate. A full invasion pleases the army, but Russia will see it as an attack on its Slav friend. Germany’s support is your guarantee.',
      general: 'Conrad’s problem: troops are on trains to Serbia. If Russia mobilizes in full, most of the army must turn north to Galicia. Germany expects you to hold Russia in the east while its own army attacks France.',
    },
    6: {
      leader: 'This is the moment of decision. War with Russia means fighting on two fronts. Without German support, Austria-Hungary cannot face Russia. A ceasefire now would cost prestige, but might save the empire from a long war.',
      general: 'If war with Russia comes, your armies in Galicia face a much larger Russian army. German help in the east will be small at first, because Germany’s main army is going west, against France.',
    },
  },
  DE: {
    1: {
      leader: 'Austria’s envoy, Count Hoyos, arrives on 5 July. He asks: will Germany stand by Austria-Hungary? Austria is Germany’s only reliable great-power ally. If it is weakened, Germany is alone between France and Russia. But full support could pull Germany into a war with Russia.',
      general: 'Moltke’s General Staff believes war with Russia and France will come sooner or later. Russia’s army and railways grow every year. Some officers think a war now is better than a war later. Germany has only one war plan: attack France first, then turn on Russia.',
    },
    2: {
      leader: 'Vienna is preparing its demands. Berlin’s policy is "localization": keep any war between Austria and Serbia, and warn the other powers to stay out. Acting fast, while Europe is shocked, makes this easier. The Kaiser leaves for his summer cruise to Norway, so everything looks normal.',
      general: 'Germany can mobilize faster than Russia or France. Secret preparations might be seen by Russian spies and make things worse. If Russia starts to prepare, every day of delay helps Russia, not Germany.',
    },
    3: {
      leader: 'Serbia replies on 25 July. Britain may propose mediation. If you reject all outside help, Europe may blame Germany. If you pass proposals on to Vienna, you may weaken your only ally. A clear warning to Russia might scare it off, or push it to prepare faster.',
      general: 'Watch Russia closely: any sign of military preparation matters. Moltke’s timetable assumes Germany must defeat France in about six weeks, before Russia’s huge army is ready.',
    },
    4: {
      leader: 'Austria-Hungary may declare war on Serbia. Britain may propose a conference in London. Chancellor Bethmann Hollweg wants Russia, not Germany, to look like the aggressor. Then German workers and Britain will see Germany as defending itself.',
      general: 'If Russia mobilizes, even partly, Moltke says Germany cannot wait for long. The war plan begins by taking the Belgian fortress city of Liège in the first days. Every hour of Russian mobilization shortens the time Germany has to beat France.',
    },
    5: {
      leader: 'Russia may be mobilizing. You can send an ultimatum, mobilize first, or let the Kaiser telegraph the Tsar personally: they are cousins. If Germany moves first, Britain and the German public may blame Germany.',
      general: 'Moltke: for Germany, mobilization means war, because the plan requires crossing into Luxembourg and Belgium at once. Once the trains roll, the plan cannot easily be stopped or changed.',
    },
    6: {
      leader: 'If Russia mobilizes against you or attacks Austria, the war plan sends the army through Belgium into France. In 1839 the great powers, Prussia among them, promised to protect Belgium’s neutrality. Invading Belgium may bring Britain in. Standing down keeps peace for now, but may break the alliance with Austria.',
      general: 'There is no ready plan for a war against Russia alone. The plan: march through Belgium, defeat France in about six weeks, then move troops east by rail. Liège must fall in the first days. If Belgium resists, every day of delay matters.',
    },
  },
  RU: {
    1: {
      leader: 'You are Tsar Nicholas II and Foreign Minister Sazonov. Russia sees itself as the protector of Serbia and the Slavs. In 1909, Russia backed down when Austria-Hungary annexed Bosnia and Germany threatened. A second retreat would be a humiliation. But Russia’s army reforms are not finished.',
      general: 'The "Great Programme" to expand the army will not be complete until about 1917. Russia’s army is huge but slow: it needs weeks to mobilize across vast distances. Any war plan against Austria-Hungary must also watch Germany.',
    },
    2: {
      leader: 'If the French President visits St Petersburg (20 to 23 July), you can agree what France and Russia will do if Austria moves against Serbia. A firm joint stand might stop Austria. It might also encourage Serbia to refuse Vienna’s demands.',
      general: 'Secret preparations, such as cancelling leave and getting the railways ready, would make a later mobilization faster. But Germany may notice, and treat them as a threat.',
    },
    3: {
      leader: 'Vienna’s demands have arrived. Sazonov fears they mean a European war. You can advise Serbia to accept as much as it can, or promise to support it. What you tell Belgrade now will shape Serbia’s reply.',
      general: 'A "period preparatory to war" lets the army recall men and prepare railways without full mobilization. It is hard to hide, and Germany is watching closely.',
    },
    4: {
      leader: 'Austria-Hungary may declare war on Serbia. Britain may propose a conference. Sazonov can offer Vienna direct talks, or accept a conference. A partial mobilization against Austria-Hungary only would warn Vienna without threatening Germany. In theory.',
      general: 'The generals warn: Russia has no proper plan for a partial mobilization. It would disrupt the full plan if war with Germany came later. The Chief of Staff, Yanushkevich, prefers general mobilization.',
    },
    5: {
      leader: 'Austro-Hungarian guns may be firing on Belgrade. The Tsar fears that general mobilization will mean war with Germany. Partial mobilization warns Austria-Hungary only. Once a general mobilization is ordered, it cannot be stopped.',
      general: 'Every day of delay helps Germany and Austria-Hungary. Russia’s mobilization takes weeks; Germany’s takes days. The generals say that if general mobilization is not ordered now, Russia will be caught unready.',
    },
    6: {
      leader: 'Germany may be demanding that Russia stop mobilizing. Stopping now would be a humiliation worse than 1909. Keeping the army mobilized while offering talks keeps both doors open, if Germany accepts.',
      general: 'France has promised to attack Germany quickly if Germany attacks Russia. Russia has promised France an early attack on East Prussia. Russia’s armies can strike Austria-Hungary in Galicia, or Germany in East Prussia.',
    },
  },
  FR: {
    1: {
      leader: 'You are President Poincaré and Prime Minister Viviani. The alliance with Russia (1894) protects France against Germany, which took Alsace-Lorraine in 1871. A state visit to Russia is planned for 20 to 23 July. At home, a scandal fills the newspapers: the trial of Madame Caillaux, wife of a former minister.',
      general: 'France’s war plan, Plan XVII, is an attack into Alsace-Lorraine. France needs Russia to attack Germany from the east at the same time. Otherwise, Germany’s whole army could fall on France.',
    },
    2: {
      leader: 'You can promise Russia support, urge restraint, or stay vague. If France seems unreliable, Russia may drift away and leave France alone against Germany. If France promises too much, Russia may take risks.',
      general: 'The French army is smaller than Germany’s. France depends on Russia, and perhaps Britain, to even the odds. If war comes, France must mobilize at once to match Germany.',
    },
    3: {
      leader: 'If the President visited Russia, he and the Prime Minister are now at sea, with poor radio contact, until 29 July. Ministers in Paris and the ambassador in St Petersburg, Paléologue, speak for France. Paléologue strongly supports Russia.',
      general: 'General Joffre wants to recall soldiers on leave and prepare the frontier. Every day France waits, Germany’s faster mobilization gains ground.',
    },
    4: {
      leader: 'Britain may propose a conference. Germany will try to make Russia look like the aggressor. France must not look like one either, because Britain is watching. Will you tell Russia France will honour the alliance, urge caution, or back the conference?',
      general: 'Joffre warns that if Germany mobilizes and France does not, France could lose land before its army is ready. He asks for the frontier troops to be put in position.',
    },
    5: {
      leader: 'Russia may be mobilizing. Britain has not promised to help France. If France looks peaceful, British opinion may swing towards France. If France confirms its support for Russia, the alliance holds, but France may be dragged into war.',
      general: 'Pulling troops 10 km back from the border would give up ground for a few days. Joffre dislikes the idea, but understands the politics: Britain must see that Germany, not France, strikes first.',
    },
    6: {
      leader: 'Germany may demand to know whether France will stay neutral. Neutrality could mean German demands for French fortresses as a guarantee. Breaking with Russia would leave France alone in the future.',
      general: 'If Germany attacks through Belgium, the French left wing could be outflanked. France needs British troops on its left and the Royal Navy in the Channel.',
    },
  },
  GB: {
    1: {
      leader: 'You are Foreign Secretary Grey and Prime Minister Asquith. The Cabinet is focused on Ireland, where Home Rule could lead to civil war. Britain has friendly understandings (ententes) with France and Russia, but no alliance. Many Liberal ministers oppose any promise to fight in Europe.',
      general: 'Britain’s army is small: the Expeditionary Force has six infantry divisions. Britain’s strength is the Royal Navy. Secret staff talks with France since 1906 have planned how British troops could cross to France if war came.',
    },
    2: {
      leader: 'Grey hears little from Vienna. Britain can offer to mediate, warn Germany privately, or stay out. A warning might restrain Germany, or it might leak and anger the ministers who want peace. Ireland still fills Cabinet meetings.',
      general: 'The Royal Navy is holding a large test mobilization and review at Spithead in July. After it, the fleets would normally disperse and sailors would go on leave.',
    },
    3: {
      leader: 'Grey thinks Vienna’s note is the harshest one state has ever sent another. You can ask Vienna for more time, propose a conference, or keep the fleet ready. The Cabinet will not agree to any promise to France.',
      general: 'If the fleet is kept together after the exercises, it sends a quiet signal of strength to Germany, without any public promise.',
    },
    4: {
      leader: 'Grey can propose a conference of ambassadors in London. If Germany refuses, will Britain warn Berlin? The Cabinet is split, and several ministers say they would resign rather than go to war.',
      general: 'If Germany attacks France through Belgium, the 1839 treaty that protects Belgian neutrality becomes the key question. The army can send the Expeditionary Force to France within about two weeks.',
    },
    5: {
      leader: 'Russia may be mobilizing. France asks whether Britain will help. Germany may ask Britain to stay neutral, and promise to take no French land in Europe. That promise says nothing about French colonies or Belgium.',
      general: 'Under the 1912 naval arrangement, the French fleet is in the Mediterranean, so France’s Channel coast is unguarded. Many officers feel Britain has a moral duty to protect it.',
    },
    6: {
      leader: 'Britain must decide by 4 August. The Cabinet will not fight for Russia, and is divided about France. Belgium is different: many ministers, and much of the public, would support war if Germany invades Belgium and Belgium resists.',
      general: 'The fleet has moved to its war base at Scapa Flow. If Britain stays out and Germany defeats France, Germany could control the coast across the Channel from Britain.',
    },
  },
  RS: {
    1: {
      leader: 'You are Prime Minister Pašić. The assassin was a Bosnian Serb, armed in Belgrade by the "Black Hand", a secret society of Serbian officers. Your government did not order the murder, but some officials may have heard of a plot. Serbia is exhausted after the Balkan Wars of 1912–13.',
      general: 'The Black Hand is led by Colonel Dimitrijević ("Apis"), head of military intelligence. Arresting its officers could split the army. The army has battle experience, but is short of weapons and ammunition after two wars.',
    },
    2: {
      leader: 'An election is due in August, and Pašić is campaigning. Serbian newspapers attack Austria-Hungary every day. Calming them could make Serbia look reasonable. A firm promise from Russia might stop Austria.',
      general: 'The army could hold the river border for a short time, and the mountains favour defence. Without Russian help, Serbia cannot win a long war against Austria-Hungary.',
    },
    3: {
      leader: 'If the demands include Austrian officials investigating inside Serbia, accepting would let a foreign power act on Serbian soil. No independent state can easily agree to that. Serbia has 48 hours.',
      general: 'If Serbia rejects any demand, war may follow quickly. Belgrade sits on the border, within range of Austrian guns. Mobilizing now would let the army move inland to defensive positions.',
    },
    4: {
      leader: 'Austria-Hungary may declare war. Moving the government to Niš, further south, would keep it safe. Serbia can also offer to let the court at The Hague judge the dispute, or appeal directly to the Tsar.',
      general: 'The army’s best plan: give up the border towns and fight in the hills inland, where Austria-Hungary’s larger numbers matter less.',
    },
    5: {
      leader: 'You now play Belgium: King Albert I and his government. Belgium has been neutral since 1839, when the great powers, including Britain, France and Prussia, promised to protect it. Germany’s armies may want to cross Belgium to reach France quickly.',
      general: 'The Belgian army is small and only partly reformed. The forts at Liège and Namur guard the routes from Germany. Mobilizing now would put men in the forts in time. Waiting would leave them empty.',
    },
    6: {
      leader: 'If Germany demands to march through, you have 12 hours to answer. Refusing means war. Letting Germany through means Belgium’s neutrality is gone, and German troops might stay. Britain will probably fight only if Belgium resists.',
      general: 'The twelve forts around Liège could hold up the German army for days. That delay would give France and Britain time. Without mobilization, the forts cannot be fully manned.',
    },
  },
};
