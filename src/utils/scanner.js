// Libellé de la version des règles ayant produit un scan.
// Deux scores ne sont comparables que s'ils affichent la même version.
// Les scans créés avant l'ajout de ce numéro n'en ont pas.
export function formatScannerVersion(version) {
  return version ? `Scanner v${version}` : 'Scanner version unknown';
}
