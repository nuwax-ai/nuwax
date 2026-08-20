export class ValidationError extends Error {
  field: string

  constructor(field: string, message: string) {
    super(`${field} ${message}`)
    this.field = field
  }
}
