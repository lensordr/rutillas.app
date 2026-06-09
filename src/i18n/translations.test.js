import { describe, it, expect } from 'vitest'
import es from './es.json'
import en from './en.json'

describe('Translation key completeness', () => {
  const esKeys = Object.keys(es)
  const enKeys = Object.keys(en)

  it('every key in es.json exists in en.json', () => {
    const missingInEn = esKeys.filter(key => !enKeys.includes(key))
    expect(missingInEn, `Keys in es.json missing from en.json: ${missingInEn.join(', ')}`).toEqual([])
  })

  it('every key in en.json exists in es.json', () => {
    const missingInEs = enKeys.filter(key => !esKeys.includes(key))
    expect(missingInEs, `Keys in en.json missing from es.json: ${missingInEs.join(', ')}`).toEqual([])
  })

  it('no key in es.json has an empty string value', () => {
    const emptyKeys = esKeys.filter(key => es[key] === '')
    expect(emptyKeys, `Keys with empty values in es.json: ${emptyKeys.join(', ')}`).toEqual([])
  })

  it('no key in en.json has an empty string value', () => {
    const emptyKeys = enKeys.filter(key => en[key] === '')
    expect(emptyKeys, `Keys with empty values in en.json: ${emptyKeys.join(', ')}`).toEqual([])
  })
})
