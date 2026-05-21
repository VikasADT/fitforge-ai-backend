import prisma from '../prisma/client';

const toUtcDateString = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildLast7Days = () => {
  const dates: string[] = [];
  const todayUtc = new Date(Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate()
  ));

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(todayUtc);
    day.setUTCDate(day.getUTCDate() - offset);
    dates.push(toUtcDateString(day));
  }

  return dates;
};

type TrendRow = { date: string; count: bigint };

const zeroFillTrend = (rows: TrendRow[], dates: string[]) => {
  const dataMap = new Map(rows.map((row) => [row.date, Number(row.count)]));
  return dates.map((date) => ({ date, count: dataMap.get(date) ?? 0 }));
};

export const getBusinessDashboardAnalytics = async (businessId: string, userId: string) => {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId },
    select: {
      websiteViews: true,
      leadCount: true,
      ctaClicks: true,
      isPublished: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!business) {
    return null;
  }

  const [latestLead, latestActivity, totalMemberships, recentActivityCount, uniqueVisitorsResult] =
    await Promise.all([
      prisma.lead.findFirst({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      }),
      prisma.businessActivity.findFirst({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          message: true,
          metadata: true,
          createdAt: true
        }
      }),
      prisma.membershipPlan.count({ where: { businessId } }),
      prisma.businessActivity.count({
        where: {
          businessId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT (metadata->>'visitorId')) AS count
        FROM "BusinessActivity"
        WHERE "businessId" = ${businessId}
          AND "type" = 'WEBSITE_VIEWED'
          AND metadata ? 'visitorId'
      `
    ]);

  const uniqueVisitors = Number(uniqueVisitorsResult?.[0]?.count ?? 0);
  const conversionRate = business.websiteViews > 0 ? Number(((business.leadCount / business.websiteViews) * 100).toFixed(2)) : 0;
  const leadConversionStatus = business.websiteViews === 0
    ? 'none'
    : conversionRate >= 5
    ? 'strong'
    : conversionRate >= 1
    ? 'average'
    : 'weak';

  const engagementLevel = business.websiteViews >= 1000 || business.ctaClicks >= 100
    ? 'high'
    : business.websiteViews >= 100 || business.leadCount >= 10
    ? 'moderate'
    : 'low';

  const publishHealth = !business.isPublished
    ? 'unpublished'
    : business.websiteViews >= 50 && business.leadCount >= 1
    ? 'healthy'
    : 'needs_attention';

  const latestActivityDate = latestActivity?.createdAt ?? null;
  const inactiveWarning = !business.isPublished
    ? 'Website is not published yet.'
    : !latestActivityDate || latestActivityDate < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    ? 'No recent activity in the last 14 days.'
    : null;

  return {
    totalWebsiteViews: business.websiteViews,
    totalLeads: business.leadCount,
    totalCtaClicks: business.ctaClicks,
    totalMemberships,
    uniqueVisitors,
    isPublished: business.isPublished,
    createdAt: business.createdAt,
    publishedAt: business.publishedAt,
    latestLeadDate: latestLead?.createdAt ?? null,
    latestActivity: latestActivity ?? null,
    conversionRate,
    leadConversionStatus,
    engagementLevel,
    publishHealth,
    activityHealth: recentActivityCount >= 10 ? 'healthy' : recentActivityCount >= 3 ? 'warming_up' : 'low',
    inactiveWarning,
    conversionInsights: {
      leadConversionRate: conversionRate,
      recentActivityCount,
      latestActivityType: latestActivity?.type ?? null
    }
  };
};

export const getBusinessAnalyticsTrends = async (businessId: string, userId: string) => {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId },
    select: { id: true }
  });
  if (!business) {
    return null;
  }

  const dates = buildLast7Days();
  const startDate = dates[0];

  const [viewsRows, leadsRows] = await Promise.all([
    prisma.$queryRaw<Array<TrendRow>>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS date,
             COUNT(*) AS count
      FROM "BusinessActivity"
      WHERE "businessId" = ${businessId}
        AND "type" = 'WEBSITE_VIEWED'
        AND "createdAt" >= CAST(${startDate} AS date)
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<Array<TrendRow>>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS date,
             COUNT(*) AS count
      FROM "Lead"
      WHERE "businessId" = ${businessId}
        AND "createdAt" >= CAST(${startDate} AS date)
      GROUP BY 1
      ORDER BY 1
    `
  ]);

  return {
    views: zeroFillTrend(viewsRows, dates),
    leads: zeroFillTrend(leadsRows, dates)
  };
};
