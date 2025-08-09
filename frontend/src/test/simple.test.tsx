import { describe, it, expect } from 'vitest'

describe('Simple Test', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should work with strings', () => {
    const greeting = 'Hello World'
    expect(greeting).toContain('World')
  })

  it('should work with arrays', () => {
    const fruits = ['apple', 'banana', 'cherry']
    expect(fruits).toHaveLength(3)
    expect(fruits).toContain('banana')
  })

  it('should work with objects', () => {
    const user = {
      name: 'Test User',
      age: 25,
      active: true
    }
    expect(user.name).toBe('Test User')
    expect(user.age).toBeGreaterThan(18)
    expect(user.active).toBe(true)
  })
})