import { body, param } from 'express-validator';

export const toggleContractLinkValidator = [
  body('projectA').isMongoId().withMessage('A valid project id is required'),
  body('projectB').isMongoId().withMessage('A valid project id is required'),
];

export const contractLinkIdValidator = [param('id').isMongoId()];
