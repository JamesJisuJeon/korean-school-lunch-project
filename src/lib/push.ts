import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

async function sendOne(endpoint: string, p256dh: string, auth: string, payload: PushPayload) {
  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify(payload)
    );
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    }
  }
}

// TODO: 학부모 배포 시 'PA' → 'PARENT' 로 변경
const PUSH_TARGET_ROLE = 'PA';

export async function sendToAllParents(payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({
    where: { user: { roles: { has: PUSH_TARGET_ROLE } } },
  });
  await Promise.all(subs.map((s) => sendOne(s.endpoint, s.p256dh, s.auth, payload)));
}

export async function sendToUnorderedParents(menuId: string, payload: PushPayload) {
  const orderedStudentIds = await prisma.order.findMany({
    where: { menuId, status: { not: 'CANCELLED' } },
    select: { studentId: true },
  });
  const orderedIds = orderedStudentIds.map((o) => o.studentId).filter(Boolean) as string[];

  const subs = await prisma.pushSubscription.findMany({
    where: {
      user: {
        roles: { has: PUSH_TARGET_ROLE },
        ...(orderedIds.length > 0 && {
          students: { none: { id: { in: orderedIds } } },
        }),
      },
    },
  });
  await Promise.all(subs.map((s) => sendOne(s.endpoint, s.p256dh, s.auth, payload)));
}
