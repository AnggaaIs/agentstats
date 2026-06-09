import { NextResponse } from "next/server";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null, status }, { status });
}

export function apiError(error: string, status: number): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ data: null, error, status }, { status });
}
