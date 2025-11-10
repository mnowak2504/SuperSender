// ISO-3166-1 alpha-2 country codes - Only countries we accept clients from
export const countries = [
  { code: 'IE', name: 'Ireland' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'DE', name: 'Germany' },
  { code: 'BE', name: 'Belgium' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'AT', name: 'Austria' },
]

export function getCountryName(code: string): string {
  return countries.find(c => c.code === code)?.name || code
}

