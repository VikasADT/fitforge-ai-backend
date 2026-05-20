export type WebsiteServiceItem = {
  title: string;
  description: string;
};

export type WebsiteFeatureItem = {
  title: string;
  description: string;
};

export type WebsiteTestimonialItem = {
  name: string;
  quote: string;
  role?: string;
};

export interface WebsiteContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  services: WebsiteServiceItem[];
  features: WebsiteFeatureItem[];
  testimonials: WebsiteTestimonialItem[];
  seoTitle: string;
  seoDescription: string;
}
