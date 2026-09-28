import LensMark from './LensMark';

// Chargement d'un scan : le réticule balaie la cible. Le texte reste lu par les lecteurs d'écran ;
// il n'apparaît à l'écran que si l'animation est désactivée (mouvement réduit), pour ne pas laisser un logo figé sans explication.
function ScanLoader() {
  return (
    <div className="scan-loader" role="status">
      <LensMark className="scan-loader-mark" scanning />
      <span className="scan-loader-label">Loading scan...</span>
    </div>
  );
}

export default ScanLoader;
