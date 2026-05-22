import { Request, Response } from 'express';
import * as businessService from '../services/businessService';
import * as analyticsService from '../services/analyticsService';
import * as activityService from '../services/activityService';
import * as membershipService from '../services/membershipService';
import * as mediaService from '../services/mediaService';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const createBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payload = req.body;
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const userId = req.user.id;
    const business = await businessService.createBusiness({ ...payload, userId });
    if (!business) {
        return fail(res, 'Subdomain already in use', 400);
    }
    return success(res, 'Business created successfully', business, 201);
});

export const getBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    const business = await businessService.getBusinessByIdForUser(id, req.user.id);
    if (!business) return fail(res, 'Business not found', 404);
    return success(res, 'Business fetched', business);
});
export const getUserBusinesses = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return fail(res, 'Unauthorized', 401);
    }

    const businesses = await businessService.getUserBusinesses(req.user.id);

    return success(res, 'Businesses fetched successfully', {
        businesses
    });
});


export const getBusinessPreview = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return fail(res, 'Unauthorized', 401);
    }

    const { id } = req.params;

    const business = await businessService.getBusinessByIdForUser(id, req.user.id);
    if (!business) {
        return fail(res, 'Business not found', 404);
    }

    const [media, memberships, validation] = await Promise.all([
        mediaService.getBusinessMedia(business.id, req.user.id),
        membershipService.getMembershipsForBusiness(business.id, req.user.id),
        businessService.validateBusinessPublishState(business.id)
    ]);

    await activityService.recordBusinessActivity(business.id, 'WEBSITE_PREVIEWED', 'Website previewed');

    return success(res, 'Business preview fetched successfully', {
        website: {
            id: business.id,
            businessName: business.businessName,
            category: business.category ?? null,
            city: business.city ?? null,
            phone: business.phone ?? null,
            logoUrl: business.logoUrl ?? null,
            subdomain: business.subdomain ?? null,
            templateId: business.templateId ?? null,
            themeColor: business.themeColor ?? null,
            fontStyle: business.fontStyle ?? null,
            whatsapp: {
                enabled: business.whatsappEnabled ?? false,
                number: business.whatsappEnabled && business.whatsappNumber ? business.whatsappNumber : null
            },
            ctaLabels: business.ctaLabels ?? null,
            websiteContent: business.websiteContent ?? {
                heroTitle: business.heroTitle,
                heroSubtitle: business.heroSubtitle,
                aboutText: business.aboutText,
                services: business.services ?? [],
                features: business.features ?? [],
                testimonials: business.testimonials ?? []
            },
            media: media ?? [],
            memberships: memberships ?? [],
            seo: {
                title: business.seoTitle ?? null,
                description: business.seoDescription ?? null
            },
            publishState: business.publishState,
            isPublished: business.isPublished,
            publishedAt: business.publishedAt,
            updatedAt: business.updatedAt
        },
        validation
    });
});

export const updateBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    try {
        const updated = await businessService.updateBusiness(id, req.user.id, req.body);
        if (!updated) return fail(res, 'Business not found', 404);

        const meta: any = { fields: Object.keys(req.body) };
        await activityService.recordBusinessActivity(id, 'WEBSITE_UPDATED', 'Website updated', meta);

        if (req.body.logoUrl || req.body.themeColor || req.body.fontStyle) {
            await activityService.recordBusinessActivity(id, 'BRANDING_UPDATED', 'Branding updated', {
                logoUrl: req.body.logoUrl ?? null,
                themeColor: req.body.themeColor ?? null,
                fontStyle: req.body.fontStyle ?? null
            });
        }

        if (req.body.seoTitle || req.body.seoDescription) {
            await activityService.recordBusinessActivity(id, 'SEO_UPDATED', 'SEO metadata updated', {
                seoTitle: req.body.seoTitle ?? null,
                seoDescription: req.body.seoDescription ?? null
            });
        }

        return success(res, 'Business updated', updated);
    } catch (error: any) {
        return fail(res, error.message || 'Unable to update business', error.status || 400);
    }
});

export const publishBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    const result = await businessService.publishBusiness(id, req.user.id);
    if (!result) return fail(res, 'Business not found', 404);
    if ('error' in result) {
        return fail(res, result.error, 400, { validation: result.validation });
    }
    return success(res, 'Website published successfully', {
        published: true,
        url: result.url
    });
});

export const unpublishBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    const unpublished = await businessService.unpublishBusiness(id, req.user.id);
    if (!unpublished) return fail(res, 'Business not found', 404);
    return success(res, 'Business unpublished successfully', {
        published: false,
        publishState: unpublished.publishState
    });
});

export const getBusinessHealth = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    const health = await businessService.getBusinessHealth(id, req.user.id);
    if (!health) return fail(res, 'Business not found', 404);
    return success(res, 'Business health fetched successfully', health);
});

export const getBusinessAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    const analytics = await analyticsService.getBusinessDashboardAnalytics(id, req.user.id);
    if (!analytics) return fail(res, 'Business not found', 404);
    return success(res, 'Analytics fetched', analytics);
});

export const getBusinessAnalyticsTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    const trends = await analyticsService.getBusinessAnalyticsTrends(id, req.user.id);
    if (!trends) return fail(res, 'Business not found', 404);
    return success(res, 'Analytics trends fetched', trends);
});

export const getBusinessActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Math.min(100, Number(req.query.limit || 20));

    const activityFeed = await activityService.getActivityFeed(id, req.user.id, page, limit);
    if (!activityFeed) return fail(res, 'Business not found', 404);
    return success(res, 'Activity fetched', activityFeed);
});

export const deleteBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    const deleted = await businessService.deleteBusiness(id, req.user.id);
    if (!deleted) return fail(res, 'Business not found', 404);
    return success(res, 'Business deleted');
});
