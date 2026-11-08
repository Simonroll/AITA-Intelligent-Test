export interface IJobQueue {
  addJob(queueName: string, payload: any, options?: { jobId?: string }): Promise<void>;
  registerHandler(queueName: string, handler: (payload: any) => Promise<void>): void;
}
