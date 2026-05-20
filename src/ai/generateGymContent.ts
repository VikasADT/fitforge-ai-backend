import { OpenAI } from 'openai';
import { config } from '../config';
import { WebsiteContent } from '../types/website';

const client = new OpenAI({ apiKey: config.openAiKey });

type Input = {
  businessName: string;
  city?: string;
  services: string[];
  templateId?: string;
  themeColor?: string;
  fontStyle?: string;
};

const stripJson = (content: string) => {
  const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) return match[1].trim();
  return content.trim();
};

const safeParseJson = (text: string) => {
  const cleaned = stripJson(text);
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace >= 0) {
    try {
      return JSON.parse(cleaned.slice(firstBrace));
    } catch (_err) {
      // Continue to fallback
    }
  }
  return null;
};

export const generateGymContent = async (input: Input): Promise<WebsiteContent> => {
  const prompt = `You are an expert website copywriter for premium gyms. Generate only valid JSON without markdown or explanation. The JSON structure must include: heroTitle, heroSubtitle, aboutText, services, features, testimonials, seoTitle, seoDescription. ` +
    `The tone should be professional, conversion-focused, modern gym branding, and SEO optimized for fitness businesses. ` +
    `Use services as a list of items with title and description. Use features as a list of gym advantages. Use testimonials as a list of customer quotes. ` +
    `Business name: "${input.businessName}". Location: ${input.city || 'a major city'}. Services: ${input.services.join(', ')}.` +
    (input.templateId ? ` Template id: ${input.templateId}.` : '') +
    (input.themeColor ? ` Theme color: ${input.themeColor}.` : '') +
    (input.fontStyle ? ` Font style: ${input.fontStyle}.` : '');

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500
  });

  const text = response.choices?.[0]?.message?.content || '';
  const parsed = safeParseJson(text);

  if (!parsed) {
    return {
      heroTitle: `${input.businessName} Fitness Studio`,
      heroSubtitle: 'Premium gym experiences built for results',
      aboutText: `Discover ${input.businessName}, a modern gym delivering expert training, flexible classes, and results-driven coaching.`,
      services: input.services.map((service) => ({ title: service, description: `Expert ${service} programming for your fitness goals.` })),
      features: [
        { title: 'Certified Trainers', description: 'Experienced coaches delivering expert guidance.' },
        { title: 'Flexible Classes', description: 'A variety of classes to fit every schedule.' },
        { title: 'Personalized Plans', description: 'Custom fitness plans for every member.' }
      ],
      testimonials: [
        { name: 'Jane', quote: 'This gym transformed my fitness journey.', role: 'Member' }
      ],
      seoTitle: `${input.businessName} Gym | Fitness Studio`,
      seoDescription: `Join ${input.businessName} for modern gym training, personalized coaching, and premium wellness services in ${input.city || 'your area'}.`
    };
  }

  return {
    heroTitle: parsed.heroTitle || '',
    heroSubtitle: parsed.heroSubtitle || '',
    aboutText: parsed.aboutText || '',
    services: Array.isArray(parsed.services) ? parsed.services : [],
    features: Array.isArray(parsed.features) ? parsed.features : [],
    testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : [],
    seoTitle: parsed.seoTitle || '',
    seoDescription: parsed.seoDescription || ''
  };
};

export default generateGymContent;
