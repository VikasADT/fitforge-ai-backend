import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';
import { WebsiteContent } from '../types/website';

export type CreateBusinessPayload = {
    userId: string;
    businessName: string;
    category?: string;
    city?: string;
    phone?: string;
    logoUrl?: string;
    subdomain?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    aboutText?: string;
    services?: Prisma.InputJsonValue;
    features?: Prisma.InputJsonValue;
    testimonials?: Prisma.InputJsonValue;
    websiteContent?: Prisma.InputJsonValue;
    seoTitle?: string;
    seoDescription?: string;
    templateId?: string;
    themeColor?: string;
    fontStyle?: string;
};

export const createBusiness = async (data: CreateBusinessPayload) => {
    if (data.subdomain) {
        const existing = await prisma.business.findUnique({
            where: { subdomain: data.subdomain }
        });

        if (existing) {
            return null;
        }
    }

    const created = await prisma.business.create({
        data: {
            userId: data.userId,
            businessName: data.businessName,
            category: data.category,
            city: data.city,
            phone: data.phone,
            logoUrl: data.logoUrl,
            subdomain: data.subdomain,
            heroTitle: data.heroTitle,
            heroSubtitle: data.heroSubtitle,
            aboutText: data.aboutText,
            services: data.services ? data.services : undefined,
            features: data.features ? data.features : undefined,
            testimonials: data.testimonials ? data.testimonials : undefined,
            websiteContent: data.websiteContent ? data.websiteContent : undefined,
            seoTitle: data.seoTitle,
            seoDescription: data.seoDescription,
            templateId: data.templateId,
            themeColor: data.themeColor,
            fontStyle: data.fontStyle
        }
    });
    return created;
};

export const getBusinessById = async (id: string) => prisma.business.findUnique({ where: { id } });

export const getBusinessByIdForUser = async (id: string, userId: string) =>
    prisma.business.findFirst({ where: { id, userId } });

export const getBusinessBySubdomain = async (subdomain: string) => prisma.business.findUnique({ where: { subdomain } });

export const updateBusiness = async (
    id: string,
    userId: string,
    data: Partial<Omit<CreateBusinessPayload, 'userId'>>
) => {
    const business = await prisma.business.findUnique({ where: { id } });
    if (!business || business.userId !== userId) {
        return null;
    }

    if (data.subdomain && data.subdomain !== business.subdomain) {
        const existing = await prisma.business.findUnique({ where: { subdomain: data.subdomain } });
        if (existing) {
            const error: any = new Error('Subdomain already in use');
            error.status = 400;
            throw error;
        }
    }

    return prisma.business.update({ where: { id }, data });
};

export const getBusinessesByUser = async (userId: string) => {
    return prisma.business.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

export const deleteBusiness = async (id: string, userId: string) => {
    const result = await prisma.business.deleteMany({ where: { id, userId } });
    return result.count > 0;
};
