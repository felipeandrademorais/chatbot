import { describe, it, expect } from 'vitest'
import { createToolName } from '../src/tool.js'
import { createWorkflowId, createTaskId } from '../src/workflow.js'

describe('Tool Contract', () => {
  describe('createToolName', () => {
    it('should create a branded ToolName from a valid string', () => {
      const name = createToolName('web-search')
      expect(name).toBe('web-search')
    })

    it('should throw when given an empty string', () => {
      expect(() => createToolName('')).toThrow('Tool name must not be empty')
    })

    it('should throw when given a whitespace-only string', () => {
      expect(() => createToolName('   ')).toThrow('Tool name must not be empty')
    })
  })
})

describe('Workflow Contract', () => {
  describe('createWorkflowId', () => {
    it('should create a branded WorkflowId from a valid string', () => {
      const id = createWorkflowId('wf-123')
      expect(id).toBe('wf-123')
    })

    it('should throw when given an empty string', () => {
      expect(() => createWorkflowId('')).toThrow('Workflow ID must not be empty')
    })

    it('should throw when given a whitespace-only string', () => {
      expect(() => createWorkflowId('   ')).toThrow('Workflow ID must not be empty')
    })
  })

  describe('createTaskId', () => {
    it('should create a branded TaskId from a valid string', () => {
      const id = createTaskId('TASK-01-001')
      expect(id).toBe('TASK-01-001')
    })

    it('should throw when given an empty string', () => {
      expect(() => createTaskId('')).toThrow('Task ID must not be empty')
    })

    it('should throw when given a whitespace-only string', () => {
      expect(() => createTaskId('   ')).toThrow('Task ID must not be empty')
    })
  })
})
