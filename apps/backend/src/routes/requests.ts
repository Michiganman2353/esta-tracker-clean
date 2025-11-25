import { Router, Response } from 'express';
import {
  validateBody,
  validateParams,
  sickTimeRequestCreateSchema,
  sickTimeRequestStatusUpdateSchema,
  idParamSchema,
  ValidatedRequest,
  SickTimeRequestCreateInput,
  SickTimeRequestStatusUpdateInput,
  IdParamInput,
} from '../validation/index.js';

export const requestsRouter = Router();

requestsRouter.get('/', (_req, res) => {
  res.json({ requests: [] });
});

requestsRouter.post(
  '/',
  validateBody(sickTimeRequestCreateSchema),
  (req: ValidatedRequest<SickTimeRequestCreateInput>, res: Response) => {
    const validatedData = req.validated!.body;
    res.json({ success: true, request: { id: '1', ...validatedData } });
  }
);

requestsRouter.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(sickTimeRequestStatusUpdateSchema),
  (
    req: ValidatedRequest<SickTimeRequestStatusUpdateInput, IdParamInput>,
    res: Response
  ) => {
    const { status } = req.validated!.body;
    const { id } = req.validated!.params;
    res.json({ success: true, id, status });
  }
);
