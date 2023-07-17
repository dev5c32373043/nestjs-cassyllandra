export async function to<T>(promise: Promise<T>): Promise<[null, T] | [Error]> {
  return promise.then<[null, T]>((data: T) => [null, data]).catch<[Error]>((err: Error) => [err]);
}
