export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { default: cron } = await import('node-cron');
    const { prisma } = await import('@/lib/prisma');
    const { sendToUnorderedParents } = await import('@/lib/push');

    const DEADLINE_HOURS_BEFORE = 4;

    // 매 10분마다 마감 임박 메뉴 체크
    cron.schedule('*/10 * * * *', async () => {
      try {
        const now = new Date();
        const windowStart = new Date(now.getTime() + DEADLINE_HOURS_BEFORE * 60 * 60 * 1000);
        const windowEnd = new Date(windowStart.getTime() + 10 * 60 * 1000);

        const menus = await prisma.menu.findMany({
          where: {
            isPublished: true,
            deadline: { gte: windowStart, lt: windowEnd },
          },
        });

        for (const menu of menus) {
          const dateStr = new Date(menu.date).toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            timeZone: 'Pacific/Auckland',
          });
          await sendToUnorderedParents(menu.id, {
            title: '간식 신청 마감이 4시간 남았어요!',
            body: `${dateStr} 간식 신청을 아직 못 하셨나요? 서두르세요!`,
            url: '/parent/order',
          });
        }
      } catch (err) {
        console.error('[cron] 마감 임박 알림 오류:', err);
      }
    });
  }
}
