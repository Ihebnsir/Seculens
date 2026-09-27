// Formate la date d'un scan (champ createdAt), qui peut être absente ou invalide.
export function formatScanDate(dateValue) {
  if (!dateValue) {
    return 'Date indisponible';
  }

  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? 'Date indisponible' : date.toLocaleString();
}
