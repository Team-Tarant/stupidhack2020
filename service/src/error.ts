export class ApiError extends Error {
  constructor(public status: number, public message: string) {
    super(message)
  }
}

export const checkError = (response: Response) => {
  if (response.ok) {
    return response.json()
  } else {
    throw new ApiError(response.status, response.statusText)
  }
}
