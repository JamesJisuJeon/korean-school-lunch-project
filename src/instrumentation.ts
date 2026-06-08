export async function register() {
  console.log('[instrumentation] register() called, NEXT_RUNTIME:', process.env.NEXT_RUNTIME);
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { default: cron } = await import('node-cron');
    const { prisma } = await import('@/lib/prisma');
    const { sendToUnorderedParents } = await import('@/lib/push');

    const DEADLINE_HOURS_BEFORE = 4;

    console.log('[instrumentation] cron 등록 완료');
    // 매 10분마다 마감 임박 메뉴 체크
    cron.schedule('*/10 * * * *', async () => {
      console.log('[cron] 마감 임박 체크:', new Date().toISOString());
      try {
        // 10분 단위로 내림해서 경계값 누락 방지 (cron 지연 ms 때문에 gte 체크 실패)
        const now = new Date();
        const roundedNow = new Date(Math.floor(now.getTime() / (10 * 60 * 1000)) * (10 * 60 * 1000));
        const windowStart = new Date(roundedNow.getTime() + DEADLINE_HOURS_BEFORE * 60 * 60 * 1000);
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
