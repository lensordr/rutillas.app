import { describe, it, expect } from 'vitest'
import { detectLanguage } from './detectLanguage.js'

describe('detectLanguage', () => {
  describe('Spain mainland coordinates → es', () => {
    it('returns es for Madrid (40.4168, -3.7038)', () => {
      expect(detectLanguage(40.4168, -3.7038)).toBe('es')
    })

    it('returns es for Barcelona (41.3851, 2.1734)', () => {
      expect(detectLanguage(41.3851, 2.1734)).toBe('es')
    })
  })

  describe('Canary Islands coordinates → es', () => {
    it('returns es for Canary Islands (28.1, -15.4)', () => {
      expect(detectLanguage(28.1, -15.4)).toBe('es')
    })
  })

  describe('outside Spain coordinates → en', () => {
    it('returns en for Bucharest, Romania (44.4268, 26.1025)', () => {
      expect(detectLanguage(44.4268, 26.1025)).toBe('en')
    })

    it('returns en for London (51.5074, -0.1278)', () => {
      expect(detectLanguage(51.5074, -0.1278)).toBe('en')
    })

    it('returns en for New York (40.7128, -74.006)', () => {
      expect(detectLanguage(40.7128, -74.006)).toBe('en')
    })
  })

  describe('boundary coordinates (edges of Spain bounds)', () => {
    it('returns es for SW corner of Spain (36.0, -9.3)', () => {
      expect(detectLanguage(36.0, -9.3)).toBe('es')
    })

    it('returns es for NE corner of Spain (43.8, 4.4)', () => {
      expect(detectLanguage(43.8, 4.4)).toBe('es')
    })

    it('returns es for SW corner of Canary Islands (27.5, -18.5)', () => {
      expect(detectLanguage(27.5, -18.5)).toBe('es')
    })

    it('returns es for NE corner of Canary Islands (29.5, -13.3)', () => {
      expect(detectLanguage(29.5, -13.3)).toBe('es')
    })

    it('returns en just north of Spain mainland (43.81, 0.0)', () => {
      expect(detectLanguage(43.81, 0.0)).toBe('en')
    })

    it('returns en just south of Spain mainland (35.99, 0.0)', () => {
      expect(detectLanguage(35.99, 0.0)).toBe('en')
    })

    it('returns en just east of Spain mainland (40.0, 4.41)', () => {
      expect(detectLanguage(40.0, 4.41)).toBe('en')
    })

    it('returns en just west of Spain mainland (40.0, -9.31)', () => {
      expect(detectLanguage(40.0, -9.31)).toBe('en')
    })
  })

  describe('null/undefined coordinates → es (default)', () => {
    it('returns es when both coordinates are null', () => {
      expect(detectLanguage(null, null)).toBe('es')
    })

    it('returns es when latitude is null', () => {
      expect(detectLanguage(null, -3.7038)).toBe('es')
    })

    it('returns es when longitude is null', () => {
      expect(detectLanguage(40.4168, null)).toBe('es')
    })

    it('returns es when both coordinates are undefined', () => {
      expect(detectLanguage(undefined, undefined)).toBe('es')
    })
  })
})
