// ─── Core enums (string literal unions) ──────────────────────────────────────

export type SafetyStatus = "SAFE" | "NEED_HELP" | "NO_UPDATE";
export type FollowState  = "PENDING" | "ACCEPTED";
export type GroupRole    = "ADMIN" | "MEMBER";
export type AlertState   = "ACTIVE" | "RESOLVED" | "EXPIRED";

// ─── Data models ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ContactFollow {
  id: string;
  followerId: string;
  followingId: string;
  state: FollowState;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  imageUrl: string | null;
  inviteCode: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: Date;
}

export interface StatusUpdate {
  id: string;
  userId: string;
  groupId: string | null;
  status: SafetyStatus;
  note: string | null;
  createdAt: Date;
}

export interface AlertEvent {
  id: string;
  title: string;
  description: string | null;
  sourceType: string;
  sourceRef: string | null;
  groupId: string | null;
  state: AlertState;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface AlertResponse {
  id: string;
  alertEventId: string;
  userId: string;
  status: SafetyStatus;
  note: string | null;
  respondedAt: Date;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface SessionData {
  userId: string;
  phone: string;
  displayName?: string | null;
}

// ─── Enriched UI types ────────────────────────────────────────────────────────

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

// ─── Action results ───────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Status display helpers ───────────────────────────────────────────────────

export const STATUS_LABEL: Record<SafetyStatus, string> = {
  SAFE:      "Safe",
  NEED_HELP: "Need Help",
  NO_UPDATE: "No Update",
};

export const STATUS_COLOR: Record<SafetyStatus, string> = {
  SAFE:      "bg-safe text-safe-foreground",
  NEED_HELP: "bg-danger text-danger-foreground",
  NO_UPDATE: "bg-noupdate text-noupdate-foreground",
};

export const STATUS_LIGHT: Record<SafetyStatus, string> = {
  SAFE:      "bg-safe-light text-safe border border-safe/30",
  NEED_HELP: "bg-danger-light text-danger border border-danger/30",
  NO_UPDATE: "bg-noupdate-light text-slate-600 border border-slate-200",
};

export const STATUS_ICON: Record<SafetyStatus, string> = {
  SAFE:      "✓",
  NEED_HELP: "!",
  NO_UPDATE: "–",
};
