import type {
  User,
  Group,
  GroupMember,
  ContactFollow,
  StatusUpdate,
  AlertEvent,
  AlertResponse,
  PushSubscription,
  SafetyStatus,
  FollowState,
  GroupRole,
  AlertState,
} from "@prisma/client";

export type {
  User,
  Group,
  GroupMember,
  ContactFollow,
  StatusUpdate,
  AlertEvent,
  AlertResponse,
  PushSubscription,
  SafetyStatus,
  FollowState,
  GroupRole,
  AlertState,
};

// ── Session ──────────────────────────────────────────────────────────────────

export interface SessionData {
  userId: string;
  phone: string;
  displayName?: string | null;
}

// ── Enriched types for UI ────────────────────────────────────────────────────

export type UserWithStatus = User & {
  latestStatus: StatusUpdate | null;
};

export type GroupWithMemberCount = Group & {
  _count: { members: number };
};

export type GroupMemberWithUser = GroupMember & {
  user: UserWithStatus;
};

export type GroupWithMembers = Group & {
  members: GroupMemberWithUser[];
};

export type ContactFollowWithUser = ContactFollow & {
  following: UserWithStatus;
  follower: UserWithStatus;
};

export type AlertEventWithResponses = AlertEvent & {
  responses: (AlertResponse & { user: User })[];
  group: Group | null;
};

// ── Action results ───────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── Status helpers ───────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<SafetyStatus, string> = {
  SAFE: "Safe",
  NEED_HELP: "Need Help",
  NO_UPDATE: "No Update",
};

export const STATUS_COLOR: Record<SafetyStatus, string> = {
  SAFE: "bg-safe text-safe-foreground",
  NEED_HELP: "bg-danger text-danger-foreground",
  NO_UPDATE: "bg-noupdate text-noupdate-foreground",
};

export const STATUS_LIGHT: Record<SafetyStatus, string> = {
  SAFE: "bg-safe-light text-safe border border-safe/30",
  NEED_HELP: "bg-danger-light text-danger border border-danger/30",
  NO_UPDATE: "bg-noupdate-light text-slate-600 border border-slate-200",
};

export const STATUS_ICON: Record<SafetyStatus, string> = {
  SAFE: "✓",
  NEED_HELP: "!",
  NO_UPDATE: "–",
};
