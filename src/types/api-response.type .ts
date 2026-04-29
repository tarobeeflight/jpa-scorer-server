export type ApiResponse<T> = {
  status: string;
  message: string;
  timestamp: string;
  data: T | undefined;
} 