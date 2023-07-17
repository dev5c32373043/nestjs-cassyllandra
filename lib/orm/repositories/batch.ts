import { transformQuery } from '../utils/transform-query.utils';
import { transformTo } from '../utils/transform-entity.utils';

import { BatchQuery } from '../interfaces';

export class Batch {
  private modelRef: any;
  private target: any;
  private ops: BatchQuery[];

  constructor(modelRef, target, ops: BatchQuery[] = []) {
    this.modelRef = modelRef;
    this.target = target;
    this.ops = ops;
  }

  insert(data, options = {}): this {
    this.ops.push(new this.modelRef(transformTo(this.target, data)).save({ ...options, return_query: true }));
    return this;
  }

  update(query, update, options = {}): this {
    this.ops.push(
      this.modelRef.update(transformQuery(this.target, query), transformQuery(this.target, update), {
        ...options,
        return_query: true,
      }),
    );
    return this;
  }

  delete(query, options = {}): this {
    this.ops.push(this.modelRef.delete(transformQuery(this.target, query), { ...options, return_query: true }));
    return this;
  }

  async execute(): Promise<void> {
    if (!this.ops.length) return;

    const queries = await Promise.all(this.ops);
    await this.modelRef.execute_batchAsync(queries);

    this.ops = [];
  }

  get size(): number {
    return this.ops.length;
  }
}
