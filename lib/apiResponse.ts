import { NextResponse } from "next/server"

interface SuccessResponseOptions<T> {
  statusCode?: number
  message   : string
  data?     : T
  metadata? : Record<string, unknown>
}

interface ErrorResponseOptions {
  statusCode?: number
  message   : string
  data?     : unknown
  metadata? : Record<string, unknown>
}

export function successResponse<T>({
  statusCode = 200,
  message,
  data,
  metadata,
}: SuccessResponseOptions<T>) {
  return NextResponse.json(
    {
      success   : true,
      statusCode,
      message,
      data,
      metadata,
    },
    { status: statusCode }
  )
}

export function errorResponse({
  statusCode = 500,
  message,
  data,
  metadata,
}: ErrorResponseOptions) {
  return NextResponse.json(
    {
      success   : false,
      statusCode,
      message,
      data,
      metadata,
    },
    { status: statusCode }
  )
}
