import type { Request, Response } from 'express';
import type { ApiResponse } from '../types/api-response.type .js';

export class BaseController {

    createResponse<T>(status: string, message: string, data?: T): ApiResponse<T> {
        return {
            status,
            message,
            timestamp: new Date().toISOString(),
            data
        };
    }
}