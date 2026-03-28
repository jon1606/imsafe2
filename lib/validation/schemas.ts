import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(7)
  .max(20)
  .regex(/^\+?[1-9]\d{6,18}$/, "Invalid phone number");

export const otpSchema = z
  .string()
  .length(6)
  .regex(/^\d{6}$/, "OTP must be 6 digits");

export const displayNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(60, "Name too long");

export const groupNameSchema = z
  .string()
  .min(1, "Group name required")
  .max(80, "Group name too long");

export const statusNoteSchema = z
  .string()
  .max(280, "Note too long")
  .optional()
  .nullable();

export const RequestOtpSchema = z.object({
  phone: phoneSchema,
});

export const VerifyOtpSchema = z.object({
  phone: phoneSchema,
  code: otpSchema,
  displayName: displayNameSchema.optional(),
});

export const CreateGroupSchema = z.object({
  name: groupNameSchema,
});

export const UpdateStatusSchema = z.object({
  status: z.enum(["SAFE", "NEED_HELP", "NO_UPDATE"]),
  note: statusNoteSchema,
  groupId: z.string().optional().nullable(),
});

export const FollowContactSchema = z.object({
  phone: phoneSchema,
});

export const IngestAlertSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sourceType: z.string().default("EXTERNAL"),
  sourceRef: z.string().optional(),
  groupId: z.string().optional(),
  expiresInMinutes: z.number().int().positive().optional(),
});
