import type { TaskId, WorkflowId, WorkflowStatus } from '@chatbot/contracts'

import type { WorkflowTask } from '../entities/workflow-task.js'
import type { ConversationId } from '../value-objects/ids.js'
import { DomainError } from '../errors/domain-error.js'

const TERMINAL_STATUSES: readonly WorkflowStatus[] = ['completed', 'failed', 'cancelled']

export interface WorkflowExecutionProps {
  readonly workflowId: WorkflowId
  readonly conversationId: ConversationId
  readonly status: WorkflowStatus
  readonly tasks: readonly WorkflowTask[]
  readonly priority: number
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class WorkflowExecution {
  readonly workflowId: WorkflowId
  readonly conversationId: ConversationId
  readonly status: WorkflowStatus
  readonly tasks: readonly WorkflowTask[]
  readonly priority: number
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: WorkflowExecutionProps) {
    this.workflowId = props.workflowId
    this.conversationId = props.conversationId
    this.status = props.status
    this.tasks = [...props.tasks]
    this.priority = props.priority
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static start(params: {
    workflowId: WorkflowId
    conversationId: ConversationId
    task: WorkflowTask
    priority?: number
    now?: Date
  }): WorkflowExecution {
    const priority = params.priority ?? 0
    if (priority < 0 || priority > 100) {
      throw new DomainError('INVALID_ARGUMENT', 'Priority must be between 0 and 100', {
        priority,
      })
    }

    const now = params.now ?? new Date()
    return new WorkflowExecution({
      workflowId: params.workflowId,
      conversationId: params.conversationId,
      status: 'pending',
      tasks: [params.task],
      priority,
      createdAt: now,
      updatedAt: now,
    })
  }

  markRunning(now: Date = new Date()): WorkflowExecution {
    return this.transitionStatus('running', now)
  }

  completeTask(taskId: TaskId, success: boolean, failureReason?: string, now: Date = new Date()): WorkflowExecution {
    if (TERMINAL_STATUSES.includes(this.status)) {
      throw new DomainError('INVALID_STATE_TRANSITION', 'Workflow is already terminal', {
        status: this.status,
      })
    }

    const taskIndex = this.tasks.findIndex((task) => task.taskId === taskId)
    if (taskIndex === -1) {
      throw new DomainError('NOT_FOUND', 'Task not found in workflow', { taskId })
    }

    const currentTask = this.tasks[taskIndex]
    if (currentTask === undefined) {
      throw new DomainError('NOT_FOUND', 'Task not found in workflow', { taskId })
    }

    const updatedTask = currentTask.markCompleted(success, failureReason)
    const tasks = this.tasks.map((task, index) => (index === taskIndex ? updatedTask : task))

    const allTasksDone = tasks.every((task) => task.status === 'completed' || task.status === 'failed')
    const nextStatus: WorkflowStatus = allTasksDone
      ? tasks.some((task) => task.status === 'failed')
        ? 'failed'
        : 'completed'
      : this.status === 'pending'
        ? 'running'
        : this.status

    return new WorkflowExecution({
      workflowId: this.workflowId,
      conversationId: this.conversationId,
      status: nextStatus,
      tasks,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: now,
    })
  }

  cancel(reason?: string, now: Date = new Date()): WorkflowExecution {
    if (TERMINAL_STATUSES.includes(this.status)) {
      throw new DomainError('INVALID_STATE_TRANSITION', 'Workflow is already terminal', {
        status: this.status,
      })
    }

    if (reason?.trim().length === 0) {
      throw new DomainError('INVALID_ARGUMENT', 'Cancel reason must not be blank when provided')
    }

    return new WorkflowExecution({
      workflowId: this.workflowId,
      conversationId: this.conversationId,
      status: 'cancelled',
      tasks: this.tasks,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: now,
    })
  }

  private transitionStatus(next: WorkflowStatus, now: Date): WorkflowExecution {
    if (TERMINAL_STATUSES.includes(this.status)) {
      throw new DomainError('INVALID_STATE_TRANSITION', 'Workflow is already terminal', {
        status: this.status,
      })
    }

    if (this.status === 'pending' && next !== 'running') {
      throw new DomainError('INVALID_STATE_TRANSITION', 'Pending workflow can only move to running', {
        from: this.status,
        to: next,
      })
    }

    return new WorkflowExecution({
      workflowId: this.workflowId,
      conversationId: this.conversationId,
      status: next,
      tasks: this.tasks,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: now,
    })
  }
}
