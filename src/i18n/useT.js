import es from './es.json'
import en from './en.json'
import useStore from '../store/useStore'

const locales = { es, en }

export function useT() {
  const locale = useStore((s) => s.locale || 'es')
  return (key, replacements) => {
    let str = locales[locale]?.[key] ?? locales.es[key] ?? key
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v)
      })
    }
    return str
  }
}
