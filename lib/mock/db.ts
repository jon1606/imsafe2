/**
 * In-memory mock database for SafeCircle MVP demo.
 * Seeded with realistic data on cold start.
 * Mutations persist within a Lambda instance lifetime.
 * No DATABASE_URL or any external service required.
 */

import { randomUUID } from "crypto";
import type {
  User, UserSession, Group, GroupMember, ContactFollow,
  StatusUpdate, AlertEvent, AlertResponse, PushSubscription,
  SafetyStatus, FollowState, GroupRole, AlertState,
} from "@/types";

// ─── Seed data ────────────────────────────────────────────────────────────────

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);

const DB: {
  users: User[];
  userSessions: UserSession[];
  groups: Group[];
  groupMembers: GroupMember[];
  contactFollows: ContactFollow[];
  statusUpdates: StatusUpdate[];
  alertEvents: AlertEvent[];
  alertResponses: AlertResponse[];
  pushSubscriptions: PushSubscription[];
} = {
  users: [
    { id: "u1", phone: "+15550000001", displayName: "Alice Chen",  avatarUrl: null, createdAt: ago(120), updatedAt: ago(120) },
    { id: "u2", phone: "+15550000002", displayName: "Bob Smith",   avatarUrl: null, createdAt: ago(115), updatedAt: ago(115) },
    { id: "u3", phone: "+15550000003", displayName: "Carol Reyes", avatarUrl: null, createdAt: ago(110), updatedAt: ago(110) },
    { id: "u4", phone: "+15550000004", displayName: "Dave Kim",    avatarUrl: null, createdAt: ago(105), updatedAt: ago(105) },
  ],
  userSessions: [],
  groups: [
    { id: "g1", name: "Chen Family",    imageUrl: null, inviteCode: "family-chen-2024", createdById: "u1", createdAt: ago(100), updatedAt: ago(100) },
    { id: "g2", name: "Acme Corp Team", imageUrl: null, inviteCode: "acme-corp-team",   createdById: "u2", createdAt: ago(90),  updatedAt: ago(90)  },
  ],
  groupMembers: [
    { id: "gm1", groupId: "g1", userId: "u1", role: "ADMIN",  joinedAt: ago(100) },
    { id: "gm2", groupId: "g1", userId: "u2", role: "MEMBER", joinedAt: ago(95)  },
    { id: "gm3", groupId: "g1", userId: "u3", role: "MEMBER", joinedAt: ago(90)  },
    { id: "gm4", groupId: "g2", userId: "u2", role: "ADMIN",  joinedAt: ago(90)  },
    { id: "gm5", groupId: "g2", userId: "u1", role: "MEMBER", joinedAt: ago(85)  },
    { id: "gm6", groupId: "g2", userId: "u4", role: "MEMBER", joinedAt: ago(80)  },
  ],
  contactFollows: [
    { id: "cf1", followerId: "u1", followingId: "u2", state: "ACCEPTED", createdAt: ago(80), updatedAt: ago(80) },
    { id: "cf2", followerId: "u2", followingId: "u1", state: "ACCEPTED", createdAt: ago(80), updatedAt: ago(80) },
    { id: "cf3", followerId: "u1", followingId: "u3", state: "ACCEPTED", createdAt: ago(70), updatedAt: ago(70) },
    { id: "cf4", followerId: "u3", followingId: "u1", state: "ACCEPTED", createdAt: ago(70), updatedAt: ago(70) },
    { id: "cf5", followerId: "u1", followingId: "u4", state: "PENDING",  createdAt: ago(30), updatedAt: ago(30) },
  ],
  statusUpdates: [
    // Global
    { id: "su1",  userId: "u1", groupId: null, status: "SAFE",      note: "All good at home",         createdAt: ago(60) },
    { id: "su2",  userId: "u2", groupId: null, status: "SAFE",      note: "Just checked in",          createdAt: ago(55) },
    { id: "su3",  userId: "u3", groupId: null, status: "NO_UPDATE", note: null,                       createdAt: ago(50) },
    { id: "su4",  userId: "u4", groupId: null, status: "NEED_HELP", note: "Power is out",             createdAt: ago(45) },
    // Group g1
    { id: "su5",  userId: "u1", groupId: "g1", status: "SAFE",      note: "Home safe",                createdAt: ago(40) },
    { id: "su6",  userId: "u2", groupId: "g1", status: "SAFE",      note: null,                       createdAt: ago(38) },
    { id: "su7",  userId: "u3", groupId: "g1", status: "NO_UPDATE", note: null,                       createdAt: ago(35) },
    // Group g2
    { id: "su8",  userId: "u2", groupId: "g2", status: "SAFE",      note: "At the office",            createdAt: ago(30) },
    { id: "su9",  userId: "u1", groupId: "g2", status: "SAFE",      note: null,                       createdAt: ago(28) },
    { id: "su10", userId: "u4", groupId: "g2", status: "NEED_HELP", note: "Need evacuation help",     createdAt: ago(25) },
  ],
  alertEvents: [
    {
      id: "ae1",
      title: "Earthquake – Magnitude 5.8",
      description: "A 5.8 magnitude earthquake was detected. Please check on your contacts.",
      sourceType: "MANUAL",
      sourceRef: null,
      groupId: "g1",
      state: "ACTIVE",
      createdAt: ago(20),
      expiresAt: new Date(Date.now() + 4 * 60 * 60_000),
    },
  ],
  alertResponses: [
    { id: "ar1", alertEventId: "ae1", userId: "u1", status: "SAFE",      note: "I'm safe, no damage",         respondedAt: ago(18) },
    { id: "ar2", alertEventId: "ae1", userId: "u2", status: "NEED_HELP", note: "Some structural damage",      respondedAt: ago(15) },
  ],
  pushSubscriptions: [],
};

// ─── Where clause matcher ─────────────────────────────────────────────────────

function matches(item: Record<string, unknown>, where: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(where)) {
    if (key === "OR") {
      if (!Array.isArray(value) || !value.some((w) => matches(item, w as Record<string, unknown>)))
        return false;
      continue;
    }

    // Compound unique key: { groupId_userId: { groupId, userId } }
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !("in" in (value as object))
    ) {
      const valObj = value as Record<string, unknown>;
      const allKeysOnItem = Object.keys(valObj).every((k) => k in item);
      if (allKeysOnItem && key.includes("_")) {
        const ok = Object.entries(valObj).every(([k, v]) => item[k] === v);
        if (!ok) return false;
        continue;
      }
    }

    const itemVal = item[key];

    if (value === null || value === undefined) {
      if (itemVal !== null && itemVal !== undefined) return false;
    } else if (typeof value === "object" && "in" in (value as object)) {
      if (!(value as { in: unknown[] }).in.includes(itemVal)) return false;
    } else {
      if (itemVal !== value) return false;
    }
  }
  return true;
}

// ─── Relations ────────────────────────────────────────────────────────────────

interface Relation {
  type: "belongsTo" | "hasMany";
  collection: keyof typeof DB;
  foreignKey: string;
}

const RELATIONS: Record<string, Record<string, Relation>> = {
  groupMember: {
    group: { type: "belongsTo", collection: "groups",        foreignKey: "groupId"      },
    user:  { type: "belongsTo", collection: "users",         foreignKey: "userId"       },
  },
  group: {
    members:     { type: "hasMany",   collection: "groupMembers",   foreignKey: "groupId"  },
    creator:     { type: "belongsTo", collection: "users",          foreignKey: "createdById" },
    alertEvents: { type: "hasMany",   collection: "alertEvents",    foreignKey: "groupId"  },
  },
  user: {
    statusUpdates:     { type: "hasMany", collection: "statusUpdates",    foreignKey: "userId" },
    groupMembers:      { type: "hasMany", collection: "groupMembers",     foreignKey: "userId" },
    pushSubscriptions: { type: "hasMany", collection: "pushSubscriptions",foreignKey: "userId" },
    alertResponses:    { type: "hasMany", collection: "alertResponses",   foreignKey: "userId" },
  },
  contactFollow: {
    follower:  { type: "belongsTo", collection: "users", foreignKey: "followerId"  },
    following: { type: "belongsTo", collection: "users", foreignKey: "followingId" },
  },
  alertEvent: {
    group:     { type: "belongsTo", collection: "groups",         foreignKey: "groupId"     },
    responses: { type: "hasMany",   collection: "alertResponses", foreignKey: "alertEventId"},
  },
  alertResponse: {
    user:       { type: "belongsTo", collection: "users",       foreignKey: "userId"       },
    alertEvent: { type: "belongsTo", collection: "alertEvents", foreignKey: "alertEventId" },
  },
  pushSubscription: {
    user: { type: "belongsTo", collection: "users", foreignKey: "userId" },
  },
};

// ─── Include resolver ─────────────────────────────────────────────────────────

type IncludeValue =
  | boolean
  | { where?: Record<string, unknown>; include?: Record<string, IncludeValue>; orderBy?: Record<string, string>; take?: number; select?: Record<string, boolean> };

function applySelect(item: Record<string, unknown>, select: Record<string, boolean>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(select).filter(([, v]) => v).map(([k]) => [k, item[k]])
  );
}

function sortItems(items: Record<string, unknown>[], orderBy: Record<string, string>): Record<string, unknown>[] {
  const [field, dir] = Object.entries(orderBy)[0] as [string, string];
  return [...items].sort((a, b) => {
    const av = a[field] instanceof Date ? (a[field] as Date).getTime() : (a[field] as number);
    const bv = b[field] instanceof Date ? (b[field] as Date).getTime() : (b[field] as number);
    return dir === "desc" ? bv - av : av - bv;
  });
}

function resolveIncludes(
  item: Record<string, unknown>,
  modelName: string,
  include: Record<string, IncludeValue>
): Record<string, unknown> {
  const result = { ...item };

  for (const [key, spec] of Object.entries(include)) {
    // _count: { select: { members: true } }
    if (key === "_count") {
      const countSpec = (spec as { select: Record<string, boolean> }).select;
      const counts: Record<string, number> = {};
      for (const [cKey, included] of Object.entries(countSpec)) {
        if (!included) continue;
        const rel = RELATIONS[modelName]?.[cKey];
        if (!rel) continue;
        counts[cKey] = getRelated(item, rel).length;
      }
      result._count = counts;
      continue;
    }

    const rel = RELATIONS[modelName]?.[key];
    if (!rel) continue;

    const subWhere   = typeof spec === "boolean" ? undefined : (spec as any).where;
    const subInclude = typeof spec === "boolean" ? undefined : (spec as any).include;
    const subOrderBy = typeof spec === "boolean" ? undefined : (spec as any).orderBy;
    const subTake    = typeof spec === "boolean" ? undefined : (spec as any).take;
    const subSelect  = typeof spec === "boolean" ? undefined : (spec as any).select;

    let related = getRelated(item, rel, subWhere);
    if (subOrderBy) related = sortItems(related, subOrderBy);
    if (subTake !== undefined) related = related.slice(0, subTake);
    if (subInclude) related = related.map((r) => resolveIncludes(r, rel.collection.replace(/s$/, "").replace(/ies$/, "y"), subInclude));
    if (subSelect)  related = related.map((r) => applySelect(r, subSelect));

    result[key] = rel.type === "belongsTo" ? (related[0] ?? null) : related;
  }

  return result;
}

function getRelated(
  item: Record<string, unknown>,
  rel: Relation,
  where?: Record<string, unknown>
): Record<string, unknown>[] {
  const col = DB[rel.collection] as Record<string, unknown>[];
  let items: Record<string, unknown>[];

  if (rel.type === "belongsTo") {
    const fkVal = item[rel.foreignKey];
    items = col.filter((r) => r.id === fkVal);
  } else {
    items = col.filter((r) => r[rel.foreignKey] === item.id);
  }

  if (where) items = items.filter((r) => matches(r, where));
  return items;
}

// ─── Generic model factory ────────────────────────────────────────────────────

function model<T extends { id: string }>(collKey: keyof typeof DB, modelName: string) {
  const col = () => DB[collKey] as T[];

  return {
    async findUnique(args: { where: Record<string, unknown>; include?: Record<string, IncludeValue>; select?: Record<string, boolean> }): Promise<T | null> {
      const item = col().find((r) => matches(r as Record<string, unknown>, args.where));
      if (!item) return null;
      let res: Record<string, unknown> = { ...item };
      if (args.include) res = resolveIncludes(res, modelName, args.include);
      if (args.select)  res = applySelect(res, args.select);
      return res as T;
    },

    async findFirst(args?: { where?: Record<string, unknown>; include?: Record<string, IncludeValue>; orderBy?: Record<string, string>; take?: number }): Promise<T | null> {
      let items = args?.where ? col().filter((r) => matches(r as Record<string, unknown>, args.where!)) : [...col()];
      if (args?.orderBy) items = sortItems(items as Record<string, unknown>[], args.orderBy) as T[];
      const item = items[0] ?? null;
      if (!item) return null;
      let res: Record<string, unknown> = { ...item };
      if (args?.include) res = resolveIncludes(res, modelName, args.include!);
      return res as T;
    },

    async findMany(args?: { where?: Record<string, unknown>; include?: Record<string, IncludeValue>; select?: Record<string, boolean>; orderBy?: Record<string, string>; take?: number }): Promise<T[]> {
      let items = args?.where ? col().filter((r) => matches(r as Record<string, unknown>, args.where!)) : [...col()];
      if (args?.orderBy) items = sortItems(items as Record<string, unknown>[], args.orderBy) as T[];
      if (args?.take !== undefined) items = items.slice(0, args.take);
      if (args?.include) items = items.map((r) => resolveIncludes(r as Record<string, unknown>, modelName, args.include!) as T);
      if (args?.select)  items = items.map((r) => applySelect(r as Record<string, unknown>, args.select!) as T);
      return items;
    },

    async create(args: { data: Partial<T> & Record<string, unknown>; include?: Record<string, IncludeValue> }): Promise<T> {
      const newItem = { id: randomUUID(), createdAt: new Date(), updatedAt: new Date(), ...args.data } as T;
      col().push(newItem);
      let res: Record<string, unknown> = { ...newItem };
      if (args.include) res = resolveIncludes(res, modelName, args.include);
      return res as T;
    },

    async update(args: { where: Record<string, unknown>; data: Partial<T> & Record<string, unknown>; include?: Record<string, IncludeValue> }): Promise<T> {
      const idx = col().findIndex((r) => matches(r as Record<string, unknown>, args.where));
      if (idx === -1) throw new Error(`${modelName} not found`);
      col()[idx] = { ...col()[idx], ...args.data, updatedAt: new Date() } as T;
      let res: Record<string, unknown> = { ...col()[idx] };
      if (args.include) res = resolveIncludes(res, modelName, args.include);
      return res as T;
    },

    async upsert(args: { where: Record<string, unknown>; create: Partial<T> & Record<string, unknown>; update: Partial<T> & Record<string, unknown>; include?: Record<string, IncludeValue> }): Promise<T> {
      const idx = col().findIndex((r) => matches(r as Record<string, unknown>, args.where));
      if (idx === -1) {
        return this.create({ data: args.create, include: args.include });
      }
      col()[idx] = { ...col()[idx], ...args.update, updatedAt: new Date() } as T;
      let res: Record<string, unknown> = { ...col()[idx] };
      if (args.include) res = resolveIncludes(res, modelName, args.include);
      return res as T;
    },

    async delete(args: { where: Record<string, unknown> }): Promise<T> {
      const idx = col().findIndex((r) => matches(r as Record<string, unknown>, args.where));
      if (idx === -1) throw new Error(`${modelName} not found`);
      const [deleted] = col().splice(idx, 1);
      return deleted;
    },

    async deleteMany(args?: { where?: Record<string, unknown> }): Promise<{ count: number }> {
      const before = col().length;
      if (args?.where) {
        const toRemove = col().filter((r) => matches(r as Record<string, unknown>, args.where!));
        for (const item of toRemove) {
          const i = col().indexOf(item);
          if (i !== -1) col().splice(i, 1);
        }
      } else {
        col().length = 0;
      }
      return { count: before - col().length };
    },

    async count(args?: { where?: Record<string, unknown> }): Promise<number> {
      if (!args?.where) return col().length;
      return col().filter((r) => matches(r as Record<string, unknown>, args.where!)).length;
    },
  };
}

// ─── Export mock prisma client ────────────────────────────────────────────────

export const mockPrisma = {
  user:             model<User>            ("users",             "user"),
  userSession:      model<UserSession>     ("userSessions",      "userSession"),
  group:            model<Group>           ("groups",            "group"),
  groupMember:      model<GroupMember>     ("groupMembers",      "groupMember"),
  contactFollow:    model<ContactFollow>   ("contactFollows",    "contactFollow"),
  statusUpdate:     model<StatusUpdate>    ("statusUpdates",     "statusUpdate"),
  alertEvent:       model<AlertEvent>      ("alertEvents",       "alertEvent"),
  alertResponse:    model<AlertResponse>   ("alertResponses",    "alertResponse"),
  pushSubscription: model<PushSubscription>("pushSubscriptions", "pushSubscription"),
  $disconnect: async () => {},
  $connect:    async () => {},
};
