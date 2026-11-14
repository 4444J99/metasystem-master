/**
 * Validation Middleware for Omni-Dromenon-Engine
 */

import { type Request, type Response, type NextFunction } from 'express';
import { z, type ZodSchema, type ZodError } from 'zod';

export interface ValidationError {
  path: string;
  message: string;
}

/** Validate request body against a Zod schema. */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      response.status(400).json({
        error: 'Validation failed',
        details: formatZodErrors(result.error),
      });
      return;
    }

    request.body = result.data;
    next();
  };
}

/** Validate request query parameters against a Zod schema. */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.query);

    if (!result.success) {
      response.status(400).json({
        error: 'Validation failed',
        details: formatZodErrors(result.error),
      });
      return;
    }

    request.query = result.data as Request['query'];
    next();
  };
}

/** Validate request params against a Zod schema. */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.params);

    if (!result.success) {
      response.status(400).json({
        error: 'Validation failed',
        details: formatZodErrors(result.error),
      });
      return;
    }

    request.params = result.data as Request['params'];
    next();
  };
}

/** Format Zod 4 issues into the repository's public validation shape. */
function formatZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export const ParameterInputSchema = z.object({
  parameter: z.string().min(1).max(50),
  value: z.number().min(0).max(1),
});

export const LocationSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  zone: z.string().optional(),
});

export const OverrideSchema = z.object({
  parameter: z.string().min(1).max(50),
  value: z.number().min(0).max(1),
  mode: z.enum(['absolute', 'blend', 'lock']),
  blendFactor: z.number().min(0).max(1).optional(),
  durationMs: z.number().positive().optional(),
  reason: z.string().max(200).optional(),
});

export const SessionConfigSchema = z.object({
  allowAudienceInput: z.boolean().optional(),
  allowPerformerOverride: z.boolean().optional(),
  maxParticipants: z.number().positive().optional(),
  inputRateLimitMs: z.number().positive().optional(),
  consensusIntervalMs: z.number().positive().optional(),
});

/** Validate data against a schema without middleware. */
export function validate<T>(schema: ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

/** Assert that data matches a schema. */
export function assert<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
