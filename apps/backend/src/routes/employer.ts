import { Router, Response } from 'express';
import {
  validateBody,
  employerSettingsUpdateSchema,
  ValidatedRequest,
  EmployerSettingsUpdateInput,
} from '../validation/index.js';

export const employerRouter = Router();

employerRouter.get('/employees', (_req, res) => {
  res.json({ employees: [] });
});

employerRouter.patch(
  '/settings',
  validateBody(employerSettingsUpdateSchema),
  (req: ValidatedRequest<EmployerSettingsUpdateInput>, res: Response) => {
    const validatedData = req.validated!.body;
    res.json({ success: true, settings: validatedData });
  }
);
