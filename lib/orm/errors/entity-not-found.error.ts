export class EntityNotFound extends Error {
  public readonly name = 'apollo.model.find.entitynotfound';
  public readonly message: any;

  constructor(entityClass: any | string, query: any) {
    super();
    Object.setPrototypeOf(this, EntityNotFound.prototype);
    this.message = `Could not find any entity of type "${
      typeof entityClass === 'function' ? entityClass.name : entityClass
    }" matching: ${EntityNotFound.stringifyQuery(query)}`;
  }

  private static stringifyQuery(query: any): string {
    try {
      return JSON.stringify(query, null, 4);
    } catch (e) {
      // skip error
    }

    return `${query}`;
  }
}
