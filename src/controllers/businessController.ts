import { Request, Response } from 'express';
import * as businessService from '../services/businessService';
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

export const deleteBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return fail(res, 'Unauthorized', 401);
    const { id } = req.params;
    const deleted = await businessService.deleteBusiness(id, req.user.id);
    if (!deleted) return fail(res, 'Business not found', 404);
    return success(res, 'Business deleted');
});
