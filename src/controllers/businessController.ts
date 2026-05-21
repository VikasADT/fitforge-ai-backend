import { Request, Response } from 'express';
import * as businessService from '../services/businessService';
import * as analyticsService from '../services/analyticsService';
import * as activityService from '../services/activityService';
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

    const business = await businessService.getBusinessByIdForUser(
        id,
        req.user.id
    );

    if (!business) {
        return fail(res, 'Business not found', 404);
    }

    return success(res, 'Business preview fetched successfully', {
        website: business
    });
});

export const updateBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    try {
        const updated = await businessService.updateBusiness(id, req.user.id, req.body);
        if (!updated) return fail(res, 'Business not found', 404);
        return success(res, 'Business updated', updated);
    } catch (error: any) {
        return fail(res, error.message || 'Unable to update business', error.status || 400);
    }
});

export const publishBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    const published = await businessService.publishBusiness(id, req.user.id);
    if (!published) return fail(res, 'Business not found', 404);
    return success(res, 'Business published successfully', published);
});

export const unpublishBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    const unpublished = await businessService.unpublishBusiness(id, req.user.id);
    if (!unpublished) return fail(res, 'Business not found', 404);
    return success(res, 'Business unpublished successfully', unpublished);
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
