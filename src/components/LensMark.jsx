// Logo SecuLens : réticule de viseur (bague de l'objectif, iris, croix de visée et point central).
// Le même dessin sert de favicon (public/favicon.svg), d'illustration des états vides et d'animation de scan.
// Les couleurs viennent du CSS (classes lens-*), donc le logo suit le thème sombre ou clair.
// scanning : ajoute un faisceau qui balaie le réticule (figé si l'utilisateur demande moins de mouvement).
function LensMark({ className = '', scanning = false, muted = false }) {
  const classes = ['lens-mark', scanning && 'is-scanning', muted && 'is-muted', className].filter(Boolean).join(' ');

  return (
    <svg className={classes} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      {scanning && (
        // Secteur de 60° partant du haut ; il tourne autour du centre (24, 24).
        <g className="lens-sweep">
          <path className="lens-sweep-beam" d="M24 24 24 4A20 20 0 0 1 41.32 14Z" />
          <path className="lens-sweep-edge" d="M24 24 41.32 14" />
        </g>
      )}
      <circle className="lens-ring" cx="24" cy="24" r="20" />
      <circle className="lens-iris" cx="24" cy="24" r="9" />
      <path className="lens-cross" d="M24 1.5v8M24 38.5v8M1.5 24h8M38.5 24h8" />
      <circle className="lens-core" cx="24" cy="24" r="2.25" />
    </svg>
  );
}

export default LensMark;
