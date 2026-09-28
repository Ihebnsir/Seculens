import LensMark from './LensMark';

// Logo et nom de l'application, identiques dans le tableau de bord et sur les écrans de connexion.
function BrandLockup() {
  return (
    <div className="brand-lockup">
      <LensMark className="brand-mark" />
      <div>
        <h1>SecuLens</h1>
        <p>Web Security Assessment Platform</p>
      </div>
    </div>
  );
}

export default BrandLockup;
