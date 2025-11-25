import { Router, Response } from 'express';
import {
  validateBody,
  validateParams,
  workLogCreateSchema,
  userIdParamSchema,
  ValidatedRequest,
  WorkLogCreateInput,
  UserIdParamInput,
} from '../validation/index.js';

export const accrualRouter = Router();

accrualRouter.get(
  '/balance/:userId',
  validateParams(userIdParamSchema),
  (req: ValidatedRequest<unknown, UserIdParamInput>, res: Response) => {
    const { userId } = req.validated!.params;
    res.json({ userId, balance: { availablePaidHours: 40, yearlyAccrued: 10 } });
  }
);

accrualRouter.get(
  '/work-logs/:userId',
  validateParams(userIdParamSchema),
  (req: ValidatedRequest<unknown, UserIdParamInput>, res: Response) => {
    const { userId } = req.validated!.params;
    res.json({ userId, logs: [] });
  }
);

accrualRouter.post(
  '/log-work',
  validateBody(workLogCreateSchema),
  (req: ValidatedRequest<WorkLogCreateInput>, res: Response) => {
    const validatedData = req.validated!.body;
    res.json({ success: true, workLog: validatedData });
  }
);
