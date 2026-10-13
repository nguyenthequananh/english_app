export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public errors: string[] = []) {
    super(message);
    this.name = 'ApiError';
  }
}
