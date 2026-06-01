import type { TaskId } from '@chatbot/contracts'

import { DomainError } from '../errors/domain-error.js'

export type WorkflowTaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface WorkflowTaskProps {
  readonly taskId: TaskId
  readonly taskType: string
  readonly status: WorkflowTaskStatus
  readonly failureReason?: string
}

export class WorkflowTask {
  readonly taskId: TaskId
  readonly taskType: string
  readonly status: WorkflowTaskStatus
  readonly failureReason: string | undefined

  private constructor(props: WorkflowTaskProps) {
    this.taskId = props.taskId
    this.taskType = props.taskType
    this.status = props.status
    this.failureReason = props.failureReason
  }

  static createPending(taskId: TaskId, taskType: string): WorkflowTask {
    const normalizedType = taskType.trim()
    if (normalizedType.length === 0) {
      throw new DomainError('INVALID_ARGUMENT', 'taskType must not be empty')
    }
    return new WorkflowTask({
      taskId,
      taskType: normalizedType,
      status: 'pending',
    })
  }

  markRunning(): WorkflowTask {
    if (this.status !== 'pending') {
      throw new DomainError('INVALID_STATE_TRANSITION', 'Only pending tasks can transition to running')
    }
    return new WorkflowTask({
      taskId: this.taskId,
      taskType: this.taskType,
      status: 'running',
    })
  }

  markCompleted(success: boolean, failureReason?: string): WorkflowTask {
    if (this.status !== 'running' && this.status !== 'pending') {
      throw new DomainError('INVALID_STATE_TRANSITION', 'Task is not active')
    }
    if (success) {
      return new WorkflowTask({
        taskId: this.taskId,
        taskType: this.taskType,
        status: 'completed',
      })
    }
    return new WorkflowTask({
      taskId: this.taskId,
      taskType: this.taskType,
      status: 'failed',
      ...(failureReason !== undefined ? { failureReason } : {}),
    })
  }
}
