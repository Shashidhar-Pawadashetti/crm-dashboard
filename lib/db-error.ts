type DatabaseErrorLike = {
  message?: string
  code?: string
  details?: string
}

function isDatabaseErrorLike(value: unknown): value is DatabaseErrorLike {
  return typeof value === 'object' && value !== null
}

export function formatDatabaseError(error: unknown, action: string): string {
  if (!isDatabaseErrorLike(error)) {
    return `Unable to ${action}. Please try again.`
  }

  const code = error.code

  if (code === '42P01') {
    return `Unable to ${action}. The contacts table is missing in Supabase.`
  }

  if (code === '42501') {
    return `Unable to ${action}. Database permissions are blocking this action.`
  }

  if (code === '23505') {
    return `Unable to ${action}. A contact with the same unique value already exists.`
  }

  const message = error.message?.trim()
  if (message) {
    return `Unable to ${action}. ${message}`
  }

  return `Unable to ${action}. Please try again.`
}
