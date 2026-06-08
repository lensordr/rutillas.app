export function detectLanguage(latitude, longitude) {
  if (latitude == null || longitude == null) return 'es'
  // Spain mainland + Balearic Islands
  const inSpain = latitude >= 36.0 && latitude <= 43.8 && longitude >= -9.3 && longitude <= 4.4
  // Canary Islands
  const inCanary = latitude >= 27.5 && latitude <= 29.5 && longitude >= -18.5 && longitude <= -13.3
  return (inSpain || inCanary) ? 'es' : 'en'
}
