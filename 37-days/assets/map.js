// 37 Days — schematic war map (not to scale): who is at war with whom on 4 August.
'use strict';
window.D37Map = (() => {
  const POS = { GB: [210, 170], BE: [325, 262], FR: [250, 400], DE: [470, 250], AH: [560, 420], RS: [620, 560], RU: [800, 220], IT: [430, 562] };
  const NAME = { GB: 'Britain', BE: 'Belgium', FR: 'France', DE: 'Germany', AH: 'Austria-Hungary', RS: 'Serbia', RU: 'Russia', IT: 'Italy' };
  const R = { GB: 62, BE: 54, FR: 78, DE: 86, AH: 88, RS: 54, RU: 104, IT: 52 };
  function svg(war, { title = 'War map, 4 August 1914 (schematic)' } = {}) {
    const atWar = new Set((war || []).flatMap(x => x.split('-')));
    const lines = (war || []).map(x => { const [a, b] = x.split('-'); const [x1, y1] = POS[a], [x2, y2] = POS[b]; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9B2C2C" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 16"/>`; }).join('');
    const nodes = Object.keys(POS).map(k => {
      const [x, y] = POS[k], w = atWar.has(k);
      return `<g><circle cx="${x}" cy="${y}" r="${R[k]}" fill="${w ? '#F7E6E3' : '#FFFFFF'}" stroke="${w ? '#9B2C2C' : '#8A8475'}" stroke-width="${w ? 5 : 3}"/>
        <text x="${x}" y="${y + 2}" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="${k === 'AH' ? 21 : k === 'BE' || k === 'RS' || k === 'IT' ? 19 : 25}" font-weight="700" fill="#1F2421">${NAME[k]}</text>
        <text x="${x}" y="${y + 26}" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="16" fill="${w ? '#9B2C2C' : '#6B736C'}">${w ? 'at war' : k === 'IT' ? 'neutral' : 'at peace'}</text></g>`;
    }).join('');
    return `<svg viewBox="100 80 840 560" role="img" aria-label="${title}"><title>${title}</title>
      <rect x="100" y="80" width="840" height="560" fill="#EAF0F5"/>${lines}${nodes}
      <text x="700" y="628" font-family="IBM Plex Sans, sans-serif" font-size="16" fill="#6B736C">Schematic, not to scale. Red lines: at war.</text></svg>`;
  }
  return { svg };
})();
