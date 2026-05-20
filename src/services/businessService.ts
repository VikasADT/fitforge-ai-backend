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

export const getBusinessBySubdomain = async (subdomain: string) => prisma.business.findUnique({ where: { subdomain } });

export const updateBusiness = async (id: string, data: Partial<Omit<CreateBusinessPayload, 'userId'>>) => {
    try {
        const updated = await prisma.business.update({ where: { id }, data });
        return updated;
    } catch (err) {
        return null;
    }
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
export const deleteBusiness = async (id: string) => prisma.business.delete({ where: { id } });
