import { Request, Response } from 'express';
import { MembershipPaymentMode } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import * as businessService from '../services/businessService';
import * as mediaService from '../services/mediaService';
import { config } from '../config';

const normalizeText = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizePhone = (value?: string | null) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  return normalized.replace(/[^0-9+]/g, '');
};

const buildWhatsappUrl = (whatsappNumber?: string | null) => {
  const normalized = normalizePhone(whatsappNumber);
  if (!normalized) {
    return null;
  }

  const digits = normalized.replace(/[^0-9]/g, '');
  if (!digits) {
    return null;
  }

  return `https://wa.me/${digits}`;
};

const buildDefaultPaymentModes = (business: any): MembershipPaymentMode[] => {
  const modes: MembershipPaymentMode[] = [];

  if (business.acceptsUpiPayments) {
    modes.push('UPI');
  }

  if (business.acceptsCashPayments) {
    modes.push('CASH');
  }

  return modes;
};

const buildPaymentModes = (business: any, membershipModes?: MembershipPaymentMode[]) => {
  const modes = Array.isArray(membershipModes) && membershipModes.length > 0
    ? membershipModes
    : buildDefaultPaymentModes(business);

  return Array.from(new Set(modes)) as MembershipPaymentMode[];
};

const buildCtaLabels = (business: any) => {
  const labels = business.ctaLabels && typeof business.ctaLabels === 'object' ? business.ctaLabels as Record<string, string> : {};

  return {
    whatsapp: labels.whatsapp ?? 'Chat on WhatsApp',
    call: labels.call ?? 'Call now',
    payment: labels.payment ?? 'View payment options',
    inquiry: labels.inquiry ?? 'Enquire now'
  };
};

const buildPublicCtas = (business: any, subdomain: string) => {
  const labels = buildCtaLabels(business);
  const phone = normalizePhone(business.phone);
  const whatsappUrl = buildWhatsappUrl(business.whatsappNumber);
  const endpoint = `/api/public/${subdomain}/cta`;

  return {
    whatsappMembership: {
      enabled: Boolean(business.whatsappEnabled && whatsappUrl),
      label: labels.whatsapp,
      url: whatsappUrl,
      ctaType: 'WHATSAPP_MEMBERSHIP_CLICK',
      endpoint
    },
    call: {
      enabled: Boolean(phone),
      label: labels.call,
      url: phone ? `tel:${phone}` : null,
      ctaType: 'CONTACT_CLICK',
      endpoint
    },
    payment: {
      label: labels.payment,
      ctaType: 'PAYMENT_CTA_CLICK',
      endpoint,
      description: normalizeText(business.paymentInstructions)
    },
    joinInquiry: {
      label: labels.inquiry,
      action: 'membership-inquiry',
      endpoint: `/api/public/${subdomain}/membership-inquiry`
    }
  };
};

export const getPublicWebsite = asyncHandler(async (req: Request, res: Response) => {
  const { subdomain } = req.params;
  const business = await businessService.getPublishedBusinessBySubdomain(subdomain);
  if (!business || !business.isActive || !business.isPublished) {
    return fail(res, 'Website not found', 404);
  }

  const websiteContent = business.websiteContent && typeof business.websiteContent === 'object'
    ? (business.websiteContent as {
        heroTitle?: string;
        heroSubtitle?: string;
        aboutText?: string;
        services?: any[];
        features?: any[];
        testimonials?: any[];
        seoTitle?: string;
        seoDescription?: string;
      })
    : {
        heroTitle: business.heroTitle,
        heroSubtitle: business.heroSubtitle,
        aboutText: business.aboutText,
        services: business.services ?? [],
        features: business.features ?? [],
        testimonials: business.testimonials ?? [],
        seoTitle: business.seoTitle ?? null,
        seoDescription: business.seoDescription ?? null
      };

  if (!websiteContent || !(websiteContent.heroTitle || business.heroTitle)) {
    return fail(res, 'Website content not available', 404);
  }

  const visitorId = req.headers['x-visitor-id'] as string | undefined;
  await businessService.incrementWebsiteViews(business.id, visitorId);

  const media = await mediaService.getBusinessMedia(business.id);
  const heroImage = media?.find((item: any) => item.type === 'HERO')?.url ?? null;
  const galleryImages = media
    ? media.filter((item: any) => item.type === 'GALLERY').map((item: any) => ({ url: item.url, altText: item.altText ?? null }))
    : [];

  const seoTitle = business.seoTitle ?? websiteContent.seoTitle ?? null;
  const seoDescription = business.seoDescription ?? websiteContent.seoDescription ?? null;
  const canonicalUrl = business.customDomain
    ? `https://${business.customDomain}`
    : `https://${business.subdomain}.${config.publicWebsiteDomain}`;

  const paymentSettings = {
    upiId: normalizeText(business.upiId),
    paymentInstructions: normalizeText(business.paymentInstructions),
    acceptsCashPayments: Boolean(business.acceptsCashPayments),
    acceptsUpiPayments: Boolean(business.acceptsUpiPayments),
    acceptedPaymentMethods: buildPaymentModes(business)
  };

  const ctas = buildPublicCtas(business, subdomain);

  const websitePayload = {
    businessName: business.businessName,
    category: business.category ?? null,
    city: business.city ?? null,
    phone: normalizePhone(business.phone),
    logoUrl: business.logoUrl ?? null,
    subdomain: business.subdomain,
    customDomain: business.customDomain ?? null,
    url: canonicalUrl,
    templateId: business.templateId,
    themeColor: business.themeColor ?? null,
    fontStyle: business.fontStyle ?? null,
    whatsapp: {
      enabled: business.whatsappEnabled ?? false,
      number: business.whatsappEnabled && business.whatsappNumber ? business.whatsappNumber : null
    },
    ctaLabels: business.ctaLabels ?? null,
    paymentSettings,
    ctas,
    websiteContent: {
      heroTitle: websiteContent.heroTitle ?? business.heroTitle ?? null,
      heroSubtitle: websiteContent.heroSubtitle ?? business.heroSubtitle ?? null,
      aboutText: websiteContent.aboutText ?? business.aboutText ?? null,
      services: websiteContent.services ?? business.services ?? [],
      features: websiteContent.features ?? business.features ?? [],
      testimonials: websiteContent.testimonials ?? business.testimonials ?? []
    },
    heroImage,
    galleryImages,
    memberships: business.membershipPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      description: plan.description,
      features: plan.features ?? [],
      isPopular: plan.isPopular,
      paymentModes: buildPaymentModes(business, plan.paymentModes as MembershipPaymentMode[] | undefined),
      paymentMethods: buildPaymentModes(business, plan.paymentModes as MembershipPaymentMode[] | undefined)
    })),
    seo: {
      title: seoTitle,
      description: seoDescription,
      openGraphImage: heroImage || business.logoUrl || (galleryImages[0]?.url ?? null),
      canonicalUrl,
      publishedAt: business.publishedAt ?? null
    },
    publishedAt: business.publishedAt,
    createdAt: business.createdAt
  };

  return success(res, 'Public website data fetched', { website: websitePayload });
});
