import { PrismaClient, SafetyStatus, GroupRole, FollowState } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SafeCircle demo data...");

  // Clean slate
  await prisma.alertResponse.deleteMany();
  await prisma.alertEvent.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.statusUpdate.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.contactFollow.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ─────────────────────────────────────
  const alice = await prisma.user.create({
    data: {
      phone: "+15550000001",
      displayName: "Alice Chen",
    },
  });

  const bob = await prisma.user.create({
    data: {
      phone: "+15550000002",
      displayName: "Bob Smith",
    },
  });

  const carol = await prisma.user.create({
    data: {
      phone: "+15550000003",
      displayName: "Carol Reyes",
    },
  });

  const dave = await prisma.user.create({
    data: {
      phone: "+15550000004",
      displayName: "Dave Kim",
    },
  });

  console.log("✅ Created 4 users");

  // ── Follow Relationships ───────────────────────
  await prisma.contactFollow.createMany({
    data: [
      { followerId: alice.id, followingId: bob.id,   state: FollowState.ACCEPTED },
      { followerId: bob.id,   followingId: alice.id, state: FollowState.ACCEPTED },
      { followerId: alice.id, followingId: carol.id, state: FollowState.ACCEPTED },
      { followerId: carol.id, followingId: alice.id, state: FollowState.ACCEPTED },
      { followerId: alice.id, followingId: dave.id,  state: FollowState.PENDING },
    ],
  });

  console.log("✅ Created follow relationships");

  // ── Groups ────────────────────────────────────
  const familyGroup = await prisma.group.create({
    data: {
      name: "Chen Family",
      inviteCode: "family-chen-2024",
      createdById: alice.id,
    },
  });

  const workGroup = await prisma.group.create({
    data: {
      name: "Acme Corp Team",
      inviteCode: "acme-corp-team",
      createdById: bob.id,
    },
  });

  console.log("✅ Created 2 groups");

  // ── Group Members ─────────────────────────────
  await prisma.groupMember.createMany({
    data: [
      { groupId: familyGroup.id, userId: alice.id, role: GroupRole.ADMIN },
      { groupId: familyGroup.id, userId: bob.id,   role: GroupRole.MEMBER },
      { groupId: familyGroup.id, userId: carol.id, role: GroupRole.MEMBER },
      { groupId: workGroup.id,   userId: bob.id,   role: GroupRole.ADMIN },
      { groupId: workGroup.id,   userId: alice.id, role: GroupRole.MEMBER },
      { groupId: workGroup.id,   userId: dave.id,  role: GroupRole.MEMBER },
    ],
  });

  console.log("✅ Created group memberships");

  // ── Status Updates ────────────────────────────
  await prisma.statusUpdate.createMany({
    data: [
      // Global statuses
      { userId: alice.id, status: SafetyStatus.SAFE,      note: "All good at home" },
      { userId: bob.id,   status: SafetyStatus.SAFE,      note: "Just checked in" },
      { userId: carol.id, status: SafetyStatus.NO_UPDATE, note: null },
      { userId: dave.id,  status: SafetyStatus.NEED_HELP, note: "Power is out at my place" },
      // Group-scoped statuses
      { userId: alice.id, groupId: familyGroup.id, status: SafetyStatus.SAFE,      note: "Home safe" },
      { userId: bob.id,   groupId: familyGroup.id, status: SafetyStatus.SAFE,      note: null },
      { userId: carol.id, groupId: familyGroup.id, status: SafetyStatus.NO_UPDATE, note: null },
      { userId: bob.id,   groupId: workGroup.id,   status: SafetyStatus.SAFE,      note: "At the office" },
      { userId: alice.id, groupId: workGroup.id,   status: SafetyStatus.SAFE,      note: null },
      { userId: dave.id,  groupId: workGroup.id,   status: SafetyStatus.NEED_HELP, note: "Need evacuation help" },
    ],
  });

  console.log("✅ Created status updates");

  // ── Alert Event ───────────────────────────────
  const alert = await prisma.alertEvent.create({
    data: {
      title: "Earthquake – Magnitude 5.8",
      description: "A 5.8 magnitude earthquake was detected. Please check on your contacts.",
      sourceType: "MANUAL",
      groupId: familyGroup.id,
      state: "ACTIVE",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 4), // 4 hours
    },
  });

  await prisma.alertResponse.createMany({
    data: [
      { alertEventId: alert.id, userId: alice.id, status: SafetyStatus.SAFE,      note: "I'm safe, no damage" },
      { alertEventId: alert.id, userId: bob.id,   status: SafetyStatus.NEED_HELP, note: "Some structural damage, need inspection" },
    ],
  });

  console.log("✅ Created alert event with responses");
  console.log("\n🎉 Seed complete!");
  console.log("\nDemo users:");
  console.log("  Alice:  +15550000001  (admin of Chen Family)");
  console.log("  Bob:    +15550000002  (admin of Acme Corp Team)");
  console.log("  Carol:  +15550000003");
  console.log("  Dave:   +15550000004  (status: NEED_HELP)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
