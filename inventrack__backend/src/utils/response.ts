export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  status: number;
}

export function successResponse<T>(data: T, status = 200): ApiResponse<T> {
  return { success: true, data, status };
}

export function errorResponse(error: string, code: string, status: number): ApiResponse {
  return { success: false, error, code, status };
}
