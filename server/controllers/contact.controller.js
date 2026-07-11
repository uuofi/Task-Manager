import { contactService } from '../services/contact.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const submitContact = asyncHandler(async (req, res) => {
  // Honeypot field caught something — pretend success so bots don't adapt,
  // without actually sending the message.
  if (req.body.company) return ApiResponse.ok(res, { received: true }, 'Message sent');

  const result = await contactService.submit({
    name: req.body.name,
    email: req.body.email,
    subject: req.body.subject,
    message: req.body.message,
  });
  return ApiResponse.ok(res, result, 'Message sent');
});
