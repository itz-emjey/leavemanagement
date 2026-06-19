import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

type ValidationSchemas = {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
};

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          const fieldErrors = formatZodErrors(result.error);
          throw AppError.badRequest('Validation failed.', fieldErrors);
        }
        req.body = result.data;
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          const fieldErrors = formatZodErrors(result.error);
          throw AppError.badRequest('Invalid query parameters.', fieldErrors);
        }
        req.query = result.data as typeof req.query;
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          const fieldErrors = formatZodErrors(result.error);
          throw AppError.badRequest('Invalid path parameters.', fieldErrors);
        }
        req.params = result.data as typeof req.params;
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
};

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }
  return fieldErrors;
}

// Common validation schemas
export const schemas = {
  pagination: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
  }),

  id: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),

  leaveRequest: z.object({
    leaveTypeId: z.union([z.string(), z.number()]).transform(Number),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    duration: z.union([z.string(), z.number()]).transform(Number),
    durationType: z.enum(['full', 'half', 'hourly']).optional().default('full'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    reason: z.string().min(10, 'Reason must be at least 10 characters').optional(),
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  createEmployee: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    position: z.string().min(1, 'Position is required'),
    departmentId: z.union([z.string(), z.number()]).transform(Number),
    phone: z.string().optional(),
    hireDate: z.string().min(1, 'Hire date is required'),
    managerId: z.union([z.string(), z.number()]).optional().transform((v: any) => v ? Number(v) : undefined),
  }),

  updateEmployee: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    position: z.string().optional(),
    departmentId: z.union([z.string(), z.number()]).transform(Number).optional(),
    phone: z.string().optional(),
    hireDate: z.string().optional(),
    managerId: z.union([z.string(), z.number()]).optional().transform((v: any) => v ? Number(v) : undefined),
  }),

  forgotPassword: z.object({
    email: z.string().email('Invalid email address'),
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),

  createDepartment: z.object({
    name: z.string().min(1, 'Department name is required'),
    description: z.string().optional().default(''),
  }),

  updateDepartment: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),

  createLeaveType: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().default(''),
    defaultDays: z.union([z.string(), z.number()]).transform(Number),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex code (e.g. #5B5FEF)').optional().default('#5B5FEF'),
  }),

  updateLeaveType: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    defaultDays: z.union([z.string(), z.number()]).transform(Number).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex code').optional(),
  }),

  createHoliday: z.object({
    name: z.string().min(1, 'Holiday name is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    isRecurring: z.boolean().optional().default(false),
    type: z.enum(['public', 'company', 'optional']).optional().default('public'),
  }),

  updateHoliday: z.object({
    name: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    isRecurring: z.boolean().optional(),
    type: z.enum(['public', 'company', 'optional']).optional(),
  }),

  updatePermission: z.object({
    roleId: z.union([z.string(), z.number()]).transform(Number),
    resource: z.string().min(1, 'Resource is required'),
    action: z.string().min(1, 'Action is required'),
    allowed: z.boolean(),
  }),

  updateSystemConfig: z.object({
    configs: z.record(z.string(), z.string()),
  }),
};
