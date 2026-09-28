import { Fragment } from 'react';

// Affiche une URL en autorisant le retour à la ligne uniquement après / . ? & = :
// "http://localhost:5000/api/health" se coupe avant "api/health", jamais au milieu d'un mot.
function BreakableUrl({ url }) {
  const parts = String(url || '').split(/([/.?&=])/);

  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {/^[/.?&=]$/.test(part) && <wbr />}
    </Fragment>
  ));
}

export default BreakableUrl;
