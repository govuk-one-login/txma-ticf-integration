import { interpolateTemplate } from './interpolateTemplate'

interface TestMessage {
  name: string
  message: string
  replacements?: Record<string, string>
}

describe('interpolateTemplate', () => {
  const mockMessages: TestMessage[] = [
    {
      name: 'test-message',
      message: 'This is a {type} test with {value}',
      replacements: { type: 'default' }
    },
    {
      name: 'simple-message',
      message: 'Basic test message'
    },
    {
      name: 'message-with-multiple-replacements',
      message: 'Testing {category} with {method} and {result}',
      replacements: { category: 'unit', result: 'success' }
    }
  ]

  it('should interpolate template with additions overriding defaults', () => {
    const result = interpolateTemplate('test-message', mockMessages, {
      type: 'unit',
      value: '123'
    })
    expect(result).toBe('This is a unit test with 123')
  })

  it('should work with messages that have no replacements property', () => {
    const result = interpolateTemplate('simple-message', mockMessages)
    expect(result).toBe('Basic test message')
  })

  it('should work with empty additions object', () => {
    const messages = [
      {
        name: 'test-message',
        message: 'This is a {type} test with {value}',
        replacements: { type: 'default' }
      }
    ]
    const result = interpolateTemplate('test-message', messages, {})
    expect(result).toBe('This is a default test with {value}')
  })

  it('should work without additions parameter', () => {
    const messages = [
      {
        name: 'test-message',
        message: 'This is a {type} test with {value}',
        replacements: { type: 'default' }
      }
    ]
    const result = interpolateTemplate('test-message', messages)
    expect(result).toBe('This is a default test with {value}')
  })

  it('should merge default replacements with additions', () => {
    const result = interpolateTemplate(
      'message-with-multiple-replacements',
      mockMessages,
      {
        method: 'integration',
        result: 'passed'
      }
    )
    expect(result).toBe('Testing unit with integration and passed')
  })

  it('should throw error when messages is not provided', () => {
    expect(() => {
      interpolateTemplate('test-message', null as unknown as TestMessage[])
    }).toThrow('Messages data is not included')
  })

  it('should throw error when messages is undefined', () => {
    expect(() => {
      interpolateTemplate('test-message', undefined as unknown as TestMessage[])
    }).toThrow('Messages data is not included')
  })

  it('should throw error when message key is not found', () => {
    expect(() => {
      interpolateTemplate('non-existent-message', mockMessages)
    }).toThrow("No message object returned for 'non-existent-message'")
  })

  it('should only replace first occurrence of each placeholder', () => {
    const messages = [
      {
        name: 'multi-replace',
        message: '{greeting} {name}, {greeting} again {name}!'
      }
    ]
    const result = interpolateTemplate('multi-replace', messages, {
      greeting: 'Test',
      name: 'Case'
    })
    expect(result).toBe('Test Case, {greeting} again {name}!')
  })

  it('should handle messages with undefined replacements property', () => {
    const messages = [
      {
        name: 'no-replacements',
        message: 'Static message with {placeholder}',
        replacements: undefined
      }
    ]
    const result = interpolateTemplate('no-replacements', messages, {
      placeholder: 'value'
    })
    expect(result).toBe('Static message with value')
  })
})
