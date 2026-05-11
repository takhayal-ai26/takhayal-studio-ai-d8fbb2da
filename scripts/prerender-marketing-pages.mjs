import fs from "node:fs/promises";
import path from "node:path";
import { requirePrerenderRows } from "./prerender-data-guard.mjs";

const SITE_URL = "https://takhayal.ai";
const SITE_NAME = "Takhayal.ai";
const DEFAULT_IMAGE = `${SITE_URL}/og-cover.jpg`;
const LAST_MODIFIED = "2026-04-25";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.PUBLIC_SUPABASE_URL ||
  "https://junmnibsurnslpcqhjle.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase publishable key for prerendering. Set VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_PUBLISHABLE_KEY, or PUBLIC_SUPABASE_ANON_KEY."
  );
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  sameAs: [
    "https://instagram.com/takhayal.ai",
    "https://x.com/takhayal_ai",
    "https://linkedin.com/company/takhayal",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@takhayal.ai",
      availableLanguage: ["Arabic", "English"],
    },
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "ar",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const seoLandingDefinitions = [
  {
    slug: "ai-tools-for-arabic-brands",
    title: {
      ar: "أدوات ذكاء اصطناعي للعلامات العربية | Takhayal.ai",
      en: "AI tools for Arabic brands | Takhayal.ai",
    },
    description: {
      ar: "دليل عملي لإنتاج صور وحملات ومحتوى اجتماعي بالذكاء الاصطناعي للعلامات العربية في الكويت والخليج.",
      en: "A practical guide to using Takhayal for images, campaigns, and social content for Arabic brands in Kuwait and the GCC.",
    },
    h1: { ar: "أدوات ذكاء اصطناعي للعلامات العربية", en: "AI tools for Arabic brands" },
    answer: {
      ar: "تخيّل.ai استوديو ذكاء اصطناعي عربي أولاً، يساعد العلامات على إنشاء الصور، تعديل الأصول، اختيار النماذج، والانطلاق من قوالب جاهزة — كل ذلك بتجربة مهيّأة للكويت والخليج.",
      en: "Takhayal.ai is an Arabic-first AI creative studio that helps Arabic brands generate images, edit assets, compare models, and start from ready templates with workflows built for Kuwait and the GCC.",
    },
    rows: {
      ar: [["إنتاج حملات سريعة", "القوالب ومركز الإنشاء"], ["صور منتجات أو إعلانات", "أدوات الصور والنماذج"], ["تحسين أصول موجودة", "أدوات التعديل والترميم"]],
      en: [["Fast campaign production", "Templates and create hub"], ["Product or ad visuals", "Image tools and models"], ["Improve existing assets", "Editing and restoration tools"]],
    },
    faqs: {
      ar: [["هل تخيّل مناسب للعلامات العربية؟", "نعم. تخيّل تجربة عربية أولاً، مصمَّمة للفرق والمبدعين في الكويت والخليج."], ["هل يدعم العربية والإنجليزية؟", "يدعم تخيّل التجربتين العربية والإنجليزية عبر الصفحات وسير العمل."]],
      en: [["Is Takhayal suitable for Arabic brands?", "Yes. Takhayal is designed as an Arabic-first experience for teams and creators in Kuwait and the GCC."], ["Does it support Arabic and English?", "Takhayal supports Arabic and English experiences across pages and workflows."]],
    },
  },
  {
    slug: "ai-image-tools-kuwait",
    title: {
      ar: "أدوات صور بالذكاء الاصطناعي في الكويت | Takhayal.ai",
      en: "AI image tools for Kuwait businesses | Takhayal.ai",
    },
    description: {
      ar: "أنتج صور منتجات وحملات ومحتوى اجتماعي بالذكاء الاصطناعي — لشركات الكويت ومبدعيها.",
      en: "Use Takhayal to produce product images, campaign visuals, and social content for businesses and creators in Kuwait.",
    },
    h1: { ar: "أدوات صور بالذكاء الاصطناعي في الكويت", en: "AI image tools for Kuwait businesses" },
    answer: {
      ar: "يساعد تخيّل شركات الكويت ومبدعيها على إنشاء الصور وتعديلها بأدوات ذكاء اصطناعي واضحة، لأعمال يومية مثل المنتجات، الإعلانات، الخلفيات، والترميم.",
      en: "Takhayal helps Kuwait businesses and creators generate and edit images with AI tools for production tasks such as products, ads, backgrounds, and restoration.",
    },
    rows: {
      ar: [["متجر أو مطعم", "صور منتجات ومحتوى عروض"], ["وكالة تسويق", "تجارب بصرية متعددة بسرعة"], ["فريق علامة تجارية", "تحسين الأصول الحالية"]],
      en: [["Shop or restaurant", "Product visuals and offer content"], ["Marketing agency", "Multiple visual directions quickly"], ["Brand team", "Improve existing assets"]],
    },
    faqs: {
      ar: [["ما أفضل استخدام لتخيّل في الكويت؟", "إنتاج صور الحملات والمنتجات والمحتوى الاجتماعي بسرعة، بسياق عربي وخليجي واضح."], ["هل يناسب الفرق الصغيرة؟", "نعم. نظام الأرصدة والقوالب والأدوات المنفصلة مصمَّم للفرق الصغيرة."]],
      en: [["What is the best use in Kuwait?", "Producing campaign, product, and social visuals quickly with clear Arabic and GCC context."], ["Can small teams use it?", "Yes. Credits, templates, and focused tools make Takhayal suitable for small teams."]],
    },
  },
  {
    slug: "arabic-ai-design-tool",
    title: {
      ar: "أداة تصميم بالذكاء الاصطناعي عربية أولاً | Takhayal.ai",
      en: "Arabic-first AI design tool | Takhayal.ai",
    },
    description: {
      ar: "تخيّل استوديو إبداعي بالذكاء الاصطناعي، عربي أولاً للصور والقوالب والنماذج.",
      en: "Takhayal is an AI creative studio focused on an Arabic-first experience for images, templates, and model workflows.",
    },
    h1: { ar: "أداة تصميم بالذكاء الاصطناعي عربية أولاً", en: "Arabic-first AI design tool" },
    answer: {
      ar: "تخيّل ليس مجرد منشئ صور. إنه تجربة إبداعية عربية أولاً تجمع الأدوات والقوالب والنماذج وتسعيراً بالأرصدة، لتمنح الفرق إنتاجاً بصرياً أسرع.",
      en: "Takhayal is more than an image generator. It combines tools, templates, models, and credit-based pricing to help teams produce visual assets faster.",
    },
    rows: {
      ar: [["اللغة", "تجربة عربية وإنجليزية"], ["المهام", "إنشاء، تعديل، قوالب، نماذج"], ["التكلفة", "أرصدة معروضة قبل الاستخدام"]],
      en: [["Language", "Arabic and English experience"], ["Tasks", "Generation, editing, templates, and models"], ["Cost", "Credits shown before usage"]],
    },
    faqs: {
      ar: [["ما معنى عربي أولاً؟", "يعني أن تجربة المنتج وتموضعه ومحتواه موجَّهة منذ البداية للمستخدم العربي والخليجي."], ["هل تخيّل أداة تصميم كاملة؟", "يركز تخيّل على إنتاج الصور والأصول الإبداعية بالذكاء الاصطناعي."]],
      en: [["What does Arabic-first mean?", "The product experience, positioning, and content are designed from the start for Arabic and GCC users."], ["Is Takhayal a full design suite?", "Takhayal focuses on AI image and creative-asset production."]],
    },
  },
  {
    slug: "canva-ai-alternative-gcc",
    title: {
      ar: "بديل Canva AI للفرق في الخليج | Takhayal.ai",
      en: "Canva AI alternative for GCC teams | Takhayal.ai",
    },
    description: {
      ar: "مقارنة عملية بين Canva AI وتخيّل للفرق التي تحتاج إنتاج صور عربية وخليجية بسرعة.",
      en: "A practical comparison of Canva AI and Takhayal for teams that need Arabic and GCC-focused image production.",
    },
    h1: { ar: "بديل Canva AI للفرق في الخليج", en: "Canva AI alternative for GCC teams" },
    answer: {
      ar: "Canva منصة تصميم واسعة، بينما يركّز تخيّل على إنتاج الصور والأصول بالذكاء الاصطناعي لتجارب عربية وخليجية. الاختيار يعتمد إن كنت تحتاج محرر تصميم شامل، أم مسارات ذكاء اصطناعي مركّزة.",
      en: "Canva is a broad design platform, while Takhayal focuses on AI image and asset production for Arabic and GCC workflows.",
    },
    rows: {
      ar: [["الاستخدام الرئيسي", "Canva للتصميم العام، وتخيّل لصور الذكاء الاصطناعي العربية."], ["السياق الإقليمي", "تخيّل موجَّه للكويت والخليج"], ["أفضل للفرق التي تريد", "مسارات صور ونماذج وقوالب بالذكاء الاصطناعي، بسرعة"]],
      en: [["Primary use", "Canva for broad design, Takhayal for Arabic AI images"], ["Regional context", "Takhayal is focused on Kuwait and the GCC"], ["Best for teams that need", "Fast AI image, model, and template workflows"]],
    },
    faqs: {
      ar: [["هل تخيّل بديل مباشر لـ Canva؟", "ليس دائماً. تخيّل بديل أو مكمِّل حين تكون الأولوية لإنتاج صور عربية وخليجية بالذكاء الاصطناعي."], ["متى أختار تخيّل؟", "حين تحتاج أدوات صور ونماذج وقوالب موجَّهة للفرق العربية في الكويت والخليج."]],
      en: [["Is Takhayal a direct Canva replacement?", "Not always. Takhayal is an alternative or complement for Arabic and GCC AI image production."], ["When should I choose Takhayal?", "Choose it when you need image tools, models, and templates for Arabic teams in Kuwait and the GCC."]],
    },
  },
  {
    slug: "canva-ai-alternative",
    title: {
      ar: "بديل Canva AI للصور والقوالب العربية | Takhayal.ai",
      en: "Canva AI alternative for Arabic images and templates | Takhayal.ai",
    },
    description: {
      ar: "قارن بين Canva AI وتخيّل في الصور والقوالب وسير العمل للعلامات العربية.",
      en: "Compare Canva AI and Takhayal for image, template, and workflow needs for Arabic brands.",
    },
    h1: { ar: "بديل Canva AI للصور والقوالب العربية", en: "Canva AI alternative for Arabic images and templates" },
    answer: {
      ar: "إن كان هدفك تحرير تصميمات كثيرة، فقد يناسبك Canva. وإن كان هدفك إنتاج صور وأصول بالذكاء الاصطناعي عربية أولاً، مع أدوات ونماذج وقوالب مركّزة، فتخيّل مسار أكثر تخصصاً.",
      en: "If your goal is broad design editing, Canva may fit well. If your goal is Arabic-first AI image and asset production, Takhayal provides a more specialized path.",
    },
    rows: {
      ar: [["محرر تصميم عام", "Canva أقوى لهذا الاستخدام"], ["صور بالذكاء الاصطناعي، عربية أولاً", "تخيّل مجال التركيز"], ["مقارنة نماذج", "يتضمّن تخيّل دليل نماذج"]],
      en: [["General design editor", "Canva is stronger for this use"], ["Arabic-first AI images", "Takhayal focuses on this"], ["Model comparison", "Takhayal includes model guidance"]],
    },
    faqs: {
      ar: [["هل يمكن استخدام تخيّل مع Canva؟", "نعم. أنتج الصور في تخيّل، ثم استخدمها داخل Canva أو أي أداة تصميم."], ["ما الفرق الرئيسي؟", "Canva منصة تصميم عامة، بينما يركّز تخيّل على صور وقوالب ونماذج بالذكاء الاصطناعي، عربية أولاً."]],
      en: [["Can Takhayal be used with Canva?", "Yes. Produce images in Takhayal, then use them in Canva or another design tool."], ["What is the main difference?", "Canva is broad design software; Takhayal focuses on Arabic-first AI image, template, and model workflows."]],
    },
  },
  {
    slug: "midjourney-alternative-arabic-brands",
    title: {
      ar: "بديل Midjourney للعلامات العربية | Takhayal.ai",
      en: "Midjourney alternative for Arabic brands | Takhayal.ai",
    },
    description: {
      ar: "مقارنة عملية بين Midjourney وتخيّل للعلامات العربية التي تحتاج إنتاج صور وقوالب وسير عمل واضح.",
      en: "A practical comparison of Midjourney and Takhayal for Arabic brands that need image production, templates, and a clear workflow.",
    },
    h1: { ar: "بديل Midjourney للعلامات العربية", en: "Midjourney alternative for Arabic brands" },
    answer: {
      ar: "Midjourney منشئ صور قوي للاستكشاف البصري. أما تخيّل فيركّز على تسهيل إنتاج الصور للعلامات العربية عبر أدوات موجَّهة، قوالب، دليل نماذج، وتسعير بالأرصدة.",
      en: "Midjourney is a strong image generator for visual exploration. Takhayal focuses on guided tools, templates, model guidance, and credit-based pricing for Arabic brands.",
    },
    rows: {
      ar: [["نمط الاستخدام", "Midjourney للبرومبتات الحرة، وتخيّل لمسارات موجَّهة"], ["مناسب لـ", "تخيّل للحملات وصور المنتجات والمهام المتكررة"], ["اللغة والسياق", "تخيّل عربي أولاً للكويت والخليج"]],
      en: [["Usage style", "Midjourney for free-form prompting, Takhayal for guided workflows"], ["Best for", "Takhayal for campaigns, product visuals, and recurring tasks"], ["Language and context", "Takhayal is Arabic-first for Kuwait and the GCC"]],
    },
    faqs: {
      ar: [["هل تخيّل أفضل من Midjourney؟", "تعتمد الأفضلية على الاستخدام. Midjourney قوي للاستكشاف الفني، وتخيّل مناسب لسير عمل عربي منظَّم."], ["هل يمكن استخدام الاثنين معاً؟", "نعم. استخدم Midjourney للاستكشاف، وتخيّل للإنتاج المنظَّم."]],
      en: [["Is Takhayal better than Midjourney?", "It depends on the use case. Midjourney is strong for exploration; Takhayal fits structured Arabic workflows."], ["Can both tools be used together?", "Yes. Use Midjourney for exploration and Takhayal for more structured production paths."]],
    },
  },
];

function buildSeoLandingRoutes() {
  return seoLandingDefinitions.flatMap((page) => {
    return ["ar", "en"].map((lang) => {
      const isEn = lang === "en";
      const route = isEn ? `/en/${page.slug}` : `/${page.slug}`;
      const localizedLinks = [
        { href: isEn ? "/en/tools" : "/tools", label: isEn ? "Tools" : "الأدوات" },
        { href: isEn ? "/en/pricing" : "/pricing", label: isEn ? "Pricing" : "الأسعار" },
        { href: isEn ? "/en/templates" : "/templates", label: isEn ? "Templates" : "القوالب" },
        { href: isEn ? "/en/models" : "/models", label: isEn ? "Models" : "النماذج" },
      ];
      const faqs = page.faqs[lang].map(([question, answer]) => ({ question, answer }));

      return {
        route,
        title: page.title[lang],
        description: page.description[lang],
        pageType: "WebPage",
        priority: page.slug.includes("alternative") ? "0.65" : "0.7",
        changefreq: "monthly",
        schemas: [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: isEn ? "Home" : "الرئيسية",
                item: absoluteUrl(isEn ? "/en" : "/"),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: page.h1[lang],
                item: absoluteUrl(route),
              },
            ],
          },
        ],
        snapshot: buildSnapshot({
          dir: isEn ? "ltr" : "rtl",
          eyebrow: isEn ? "AI visibility landing page" : "صفحة مهيأة للاستشهاد",
          heroTitle: page.h1[lang],
          heroDescription: page.answer[lang],
          sections: [
            {
              title: isEn ? "Quick comparison" : "مقارنة سريعة",
              table: {
                columns: isEn ? ["Topic", "Summary"] : ["العنصر", "الخلاصة"],
                rows: page.rows[lang],
              },
            },
            {
              title: isEn ? "Common questions" : "أسئلة شائعة",
              faqs,
            },
          ],
          links: localizedLinks,
        }),
      };
    });
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function toText(value, fallback = "") {
  const clean = stripHtml(value);
  return clean || fallback;
}

function absoluteUrl(route) {
  return new URL(route, SITE_URL).toString();
}

function isEnglishRoute(route) {
  return route === "/en" || route.startsWith("/en/");
}

function isArabicRoute(route) {
  return route === "/ar" || route.startsWith("/ar/");
}

function stripLocalePrefix(route) {
  if (route === "/en") return "/";
  if (route.startsWith("/en/")) return route.slice(3) || "/";
  if (route === "/ar") return "/";
  if (route.startsWith("/ar/")) return route.slice(3) || "/";
  return route || "/";
}

function withEnPrefix(route) {
  const clean = stripLocalePrefix(route);
  return clean === "/" ? "/en" : `/en${clean}`;
}

function withArPrefix(route) {
  const clean = stripLocalePrefix(route);
  return clean === "/" ? "/ar" : `/ar${clean}`;
}

function canonicalRoute(route) {
  if (route === "/404") return "/404";
  if (isEnglishRoute(route) || isArabicRoute(route)) return route;
  return withArPrefix(route);
}

function slugifySegment(value = "") {
  const normalized = String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || "item";
}

function buildTemplatePath(template) {
  const title = toText(template.title_en, toText(template.title_ar, "template"));
  return `/templates/${template.id}-${slugifySegment(title)}`;
}

function replaceTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function renderList(items) {
  return `<ul>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function renderTable(table) {
  if (!table || !table.columns?.length || !table.rows?.length) return "";

  return `
    <div class="seo-table-wrap">
      <table class="seo-table">
        <thead>
          <tr>${table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${table.rows
            .map(
              (row) =>
                `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderLinks(links) {
  if (!links?.length) return "";
  return `<div class="seo-links">${links
    .map(
      (link) =>
        `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`
    )
    .join("")}</div>`;
}

function renderFaqs(items) {
  if (!items?.length) return "";
  return items
    .map(
      (item) => `
        <details class="seo-faq-item">
          <summary>${escapeHtml(item.question)}</summary>
          <p>${escapeHtml(item.answer)}</p>
        </details>
      `
    )
    .join("");
}

function buildSnapshot({ eyebrow, heroTitle, heroDescription, sections = [], links = [], dir = "rtl" }) {
  const content = sections
    .map((section) => {
      const intro = section.description
        ? `<p>${escapeHtml(section.description)}</p>`
        : "";
      const list = section.items?.length ? renderList(section.items) : "";
      const table = section.table ? renderTable(section.table) : "";
      const faqs = section.faqs?.length
        ? `<div class="seo-faqs">${renderFaqs(section.faqs)}</div>`
        : "";

      return `
        <section class="seo-section">
          <h2>${escapeHtml(section.title)}</h2>
          ${intro}
          ${table}
          ${list}
          ${faqs}
        </section>
      `;
    })
    .join("");

  return `
    <main id="seo-static-content" data-seo-static="true">
      <style>
        #seo-static-content {
          direction: ${dir};
          font-family: "IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif;
          color: #111827;
          background: linear-gradient(180deg, #fff8f6 0%, #ffffff 30%, #ffffff 100%);
          max-width: 1100px;
          margin: 0 auto;
          padding: 120px 24px 40px;
        }
        #seo-static-content .seo-shell {
          border: 1px solid rgba(240, 62, 27, 0.12);
          background: rgba(255, 255, 255, 0.96);
          border-radius: 28px;
          box-shadow: 0 30px 80px -50px rgba(17, 24, 39, 0.25);
          padding: 32px;
        }
        #seo-static-content .seo-eyebrow {
          display: inline-flex;
          font-size: 12px;
          font-weight: 700;
          color: #c2410c;
          background: rgba(240, 62, 27, 0.08);
          border-radius: 999px;
          padding: 8px 14px;
        }
        #seo-static-content h1 {
          font-size: clamp(32px, 5vw, 54px);
          line-height: 1.05;
          margin: 18px 0 12px;
        }
        #seo-static-content p,
        #seo-static-content li,
        #seo-static-content td,
        #seo-static-content th,
        #seo-static-content summary {
          font-size: 16px;
          line-height: 1.9;
        }
        #seo-static-content .seo-hero {
          margin-bottom: 28px;
        }
        #seo-static-content .seo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
        }
        #seo-static-content .seo-section {
          background: #fff;
          border: 1px solid rgba(229, 231, 235, 0.9);
          border-radius: 20px;
          padding: 20px;
        }
        #seo-static-content .seo-section h2 {
          margin: 0 0 12px;
          font-size: 22px;
          line-height: 1.3;
        }
        #seo-static-content ul {
          margin: 0;
          padding-right: 18px;
        }
        #seo-static-content .seo-table-wrap {
          overflow-x: auto;
        }
        #seo-static-content .seo-table {
          width: 100%;
          border-collapse: collapse;
        }
        #seo-static-content .seo-table th,
        #seo-static-content .seo-table td {
          border-bottom: 1px solid rgba(229, 231, 235, 1);
          padding: 10px 8px;
          text-align: right;
          vertical-align: top;
        }
        #seo-static-content .seo-links {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 24px;
        }
        #seo-static-content .seo-links a {
          display: inline-flex;
          align-items: center;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          color: #9a3412;
          background: rgba(255, 237, 213, 0.8);
          text-decoration: none;
          font-weight: 600;
        }
        #seo-static-content .seo-faqs {
          display: grid;
          gap: 12px;
        }
        #seo-static-content .seo-faq-item {
          border: 1px solid rgba(229, 231, 235, 0.95);
          border-radius: 14px;
          padding: 14px 16px;
          background: #fffdfd;
        }
        #seo-static-content .seo-faq-item summary {
          cursor: pointer;
          font-weight: 700;
        }
        @media (max-width: 720px) {
          #seo-static-content {
            padding: 110px 16px 24px;
          }
          #seo-static-content .seo-shell {
            padding: 20px;
            border-radius: 20px;
          }
        }
      </style>
      <div class="seo-shell">
        <div class="seo-hero">
          ${eyebrow ? `<div class="seo-eyebrow">${escapeHtml(eyebrow)}</div>` : ""}
          <h1>${escapeHtml(heroTitle)}</h1>
          <p>${escapeHtml(heroDescription)}</p>
        </div>
        <div class="seo-grid">${content}</div>
        ${renderLinks(links)}
      </div>
    </main>
  `;
}

async function fetchSupabaseRows(table, select) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("select", select);

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${table}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function staticRoutes() {
  const arabicRoutes = [
    {
      route: "/",
      title: "تخيّل | استوديو ذكاء اصطناعي عربي أولاً",
      description:
        "تخيّل استوديو ذكاء اصطناعي عربي أولاً، للمبدعين والعلامات التجارية في الكويت والخليج. يساعدك على إنشاء الصور، تعديل الأصول، اختيار النماذج، والبدء من قوالب جاهزة.",
      pageType: "CollectionPage",
      priority: "1.0",
      changefreq: "daily",
      snapshot: buildSnapshot({
        eyebrow: "Arabic-first AI studio",
        heroTitle: "تخيّل: إنتاج صور ومواد إبداعية أسرع لفرق الخليج",
        heroDescription:
          "بدلاً من التنقّل بين أدوات كثيرة، يجمع تخيّل الإنشاء والتعديل والقوالب ودليل النماذج في منصة واحدة، عربية أولاً.",
        sections: [
          {
            title: "ماذا يقدّم تخيّل؟",
            description:
              "تجمع المنصة أدوات الصور، ومركز إنشاء سريع، ودليل نماذج، وقوالب عملية — لتنتقل العلامة من الفكرة إلى أصول جاهزة للنشر.",
          },
          {
            title: "الأفضل لـ",
            items: [
              "الإعلانات والمحتوى العربي أولاً",
              "صور المنتجات والعطور والطعام والجمال",
              "الفرق الصغيرة التي تريد إنتاجاً أسرع وميزانية أوضح",
            ],
          },
        ],
        links: [
          { href: "/pricing", label: "استكشف الأسعار" },
          { href: "/tools", label: "استعرض الأدوات" },
          { href: "/models", label: "قارن النماذج" },
          { href: "/templates", label: "ابدأ من قالب" },
        ],
      }),
    },
    {
      route: "/pricing",
      title: "الأسعار | Takhayal.ai",
      description:
        "خطط واضحة، أرصدة شفافة، وشحن إضافي عند الحاجة. تشرح هذه الصفحة الفرق بين البداية المجانية والخطط المدفوعة، وكيفية تقدير حجم استخدامك.",
      pageType: "CollectionPage",
      priority: "0.9",
      changefreq: "weekly",
      snapshot: buildSnapshot({
        eyebrow: "Pricing and credits",
        heroTitle: "أسعار تخيّل مبنية على أرصدة واضحة",
        heroDescription:
          "ابدأ مجاناً ثم ارتقِ إلى خطة شهرية أو سنوية، مع معرفة تكلفة الإنشاء قبل التشغيل، وإمكانية شحن أرصدة إضافية متى احتجت.",
        sections: [
          {
            title: "كيف تختار الخطة المناسبة؟",
            table: {
              columns: ["ما تقارنه", "لماذا يهم"],
              rows: [
                ["الخطة المجانية مقابل المدفوعة", "لفهم الفرق بين التجربة الأولى والاستخدام الإنتاجي"],
                ["عدد الأرصدة", "لتقدير حجم العمل الشهري الذي تغطيه الباقة"],
                ["الشحن الإضافي", "لزيادة السعة بدون تغيير الخطة الأساسية"],
              ],
            },
          },
          {
            title: "أسئلة سريعة",
            faqs: [
              {
                question: "ما الرصيد في تخيّل؟",
                answer:
                  "الرصيد وحدة الاستخدام التي تُخصم عند تشغيل الأدوات أو النماذج. يختلف الاستهلاك حسب المهمة والجودة المطلوبة.",
              },
              {
                question: "هل يمكن البدء بدون بطاقة؟",
                answer:
                  "نعم. البداية المجانية تتيح تجربة المنصة قبل الانتقال إلى خطة مدفوعة.",
              },
              {
                question: "هل يمكن الترقية لاحقاً؟",
                answer:
                  "نعم. ابدأ بخطة صغيرة، ثم ارتقِ حين تحتاج إلى حجم عمل أكبر.",
              },
            ],
          },
        ],
        links: [
          { href: "/tools", label: "استكشف الأدوات" },
          { href: "/models", label: "راجع دليل النماذج" },
          { href: "/templates", label: "شاهد القوالب" },
        ],
      }),
    },
    {
      route: "/tools",
      title: "الأدوات | Takhayal.ai",
      description:
        "استكشف أدوات تخيّل للصور والتعديل والترميم وإنشاء الشعارات وإزالة الخلفية. كل أداة مصممة لمهمة إنتاجية واضحة.",
      pageType: "CollectionPage",
      priority: "0.8",
      changefreq: "weekly",
      snapshot: buildSnapshot({
        eyebrow: "AI tools directory",
        heroTitle: "دليل أدوات تخيّل للمهام الإبداعية المتكرِّرة",
        heroDescription:
          "سواء أكنت تحتاج إنشاء صورة جديدة، أو ترميم أصل قديم، أو إزالة خلفية منتج — يقدّم تخيّل أداة مخصَّصة لكل مهمة، بتكلفة واضحة قبل التنفيذ.",
        sections: [
          {
            title: "ما أنواع الأدوات المتاحة؟",
            table: {
              columns: ["نوع الأداة", "أفضل استخدام"],
              rows: [
                ["إنشاء الصور", "تحويل الفكرة أو البرومبت إلى صورة جديدة"],
                ["التعديل والتحسين", "رفع جودة الأصول الحالية أو إعادة صياغتها"],
                ["الترميم والتنظيف", "الصور القديمة أو الخلفيات أو التفاصيل المتضررة"],
              ],
            },
          },
          {
            title: "ما فائدة هذا الدليل؟",
            items: [
              "يساعدك على الوصول إلى الأداة المناسبة بسرعة",
              "يقلِّل التجربة والخطأ بتوضيح أفضل استخدام لكل مسار",
              "يبني صفحات قابلة للفهرسة حول مهام واضحة يبحث عنها المستخدمون",
            ],
          },
        ],
        links: [
          { href: "/pricing", label: "راجع الأسعار" },
          { href: "/models", label: "قارن النماذج" },
          { href: "/templates", label: "ابدأ من قالب" },
        ],
      }),
    },
    {
      route: "/models",
      title: "النماذج | Takhayal.ai",
      description:
        "يقارن دليل النماذج في تخيّل السرعة والجودة وأفضل استخدام لكل نموذج صور أو فيديو، لتختار المحرك الأنسب قبل الإنشاء.",
      pageType: "CollectionPage",
      priority: "0.8",
      changefreq: "weekly",
      snapshot: buildSnapshot({
        eyebrow: "Model directory",
        heroTitle: "قارن نماذج الصور والفيديو داخل تخيّل",
        heroDescription:
          "يوضّح الدليل الفروق في السرعة والجودة وأفضل استخدام لكل نموذج، ويساعد الفرق على اختيار المحرك المناسب للحملات والمنتجات والتجارب السريعة.",
        sections: [
          {
            title: "كيف تستخدم دليل النماذج؟",
            table: {
              columns: ["عنصر المقارنة", "كيف يفيدك"],
              rows: [
                ["السرعة", "للتجربة السريعة وتكرار الأفكار"],
                ["الجودة", "للمخرجات النهائية أو الأصول الموجهة للعملاء"],
                ["الأفضل لـ", "لمطابقة النموذج مع المنتجات أو الأشخاص أو المشاهد السينمائية"],
              ],
            },
          },
          {
            title: "لماذا هذا مهم؟",
            items: [
              "يمنع اختيار نموذج غير مناسب للمهمة",
              "يوضّح نقاط القوة قبل بدء الإنشاء",
              "يدعم استعلامات المقارنة والاختيار التي تبحث عنها فرق التسويق",
            ],
          },
        ],
        links: [
          { href: "/tools", label: "شاهد الأدوات" },
          { href: "/pricing", label: "راجع الأسعار" },
          { href: "/create", label: "ابدأ الإنشاء" },
        ],
      }),
    },
    {
      route: "/templates",
      title: "القوالب | Takhayal.ai",
      description:
        "ابدأ من قوالب جاهزة لحملات الخليج، وإعلانات المنتجات، والمحتوى الاجتماعي — بدلاً من صفحة فارغة.",
      pageType: "CollectionPage",
      priority: "0.8",
      changefreq: "weekly",
      snapshot: buildSnapshot({
        eyebrow: "Template library",
        heroTitle: "قوالب جاهزة لتسريع إنتاج المحتوى البصري",
        heroDescription:
          "تنطلق الفرق من اتجاه بصري واضح يناسب الحملات والمنتجات والمواسم، مع إمكانية الرفع والإنشاء مباشرة من الصفحة نفسها.",
        sections: [
          {
            title: "ما فائدة القوالب؟",
            items: [
              "تقليل وقت البدء من الصفر",
              "توجيه الفريق نحو نتيجة بصرية أوضح من أول محاولة",
              "الاستفادة من نسب وتجهيزات مناسبة للإعلانات والمنشورات",
            ],
          },
          {
            title: "أفضل استخدامات المكتبة",
            items: [
              "إعلانات المنتجات",
              "محتوى الجمال والطعام",
              "المحتوى الاجتماعي الموسمي وحملات الخليج",
            ],
          },
        ],
        links: [
          { href: "/create", label: "ابدأ الإنشاء" },
          { href: "/tools", label: "استكشف الأدوات" },
          { href: "/pricing", label: "راجع الأسعار" },
        ],
      }),
    },
    {
      route: "/create",
      title: "إنشاء | Takhayal.ai",
      description:
        "يوجّهك مركز الإنشاء في تخيّل إلى أسرع مسار: إنشاء صورة، أو فيديو، أو استخدام أداة، أو البدء من قالب.",
      pageType: "CollectionPage",
      priority: "0.7",
      changefreq: "weekly",
      snapshot: buildSnapshot({
        eyebrow: "Create hub",
        heroTitle: "مركز الإنشاء أسرع نقطة بداية داخل تخيّل",
        heroDescription:
          "يعرض لك المسار الأنسب لحاجتك: إنشاء جديد، تعديل أصل موجود، استخدام أداة مخصَّصة، أو بدء سريع من قالب.",
        sections: [
          {
            title: "متى تستخدم مركز الإنشاء؟",
            items: [
              "حين تريد الوصول السريع للمسار المناسب",
              "حين لا تزال تقارن بين الإنشاء والأدوات والقوالب",
              "حين تريد تقليل عدد الخطوات قبل بدء العمل",
            ],
          },
        ],
        links: [
          { href: "/tools", label: "أدوات الصور" },
          { href: "/models", label: "النماذج" },
          { href: "/templates", label: "القوالب" },
        ],
      }),
    },
    {
      route: "/about",
      title: "من نحن | تخيّل",
      description:
        "تخيّل استوديو ذكاء اصطناعي مبنيّ في الكويت، يساعد العلامات والمبدعين في الخليج على إنتاج أصول بصرية عربية أولاً، أسرع.",
      pageType: "AboutPage",
      priority: "0.7",
      changefreq: "monthly",
      snapshot: buildSnapshot({
        eyebrow: "About Takhayal",
        heroTitle: "تخيّل منصة كويتية تركّز على الإنتاج الإبداعي العربي أولاً",
        heroDescription:
          "نبني تجربة تساعد الشركات والمبدعين في الخليج على إنتاج الصور والقوالب والمواد التسويقية بسرعة — بأدوات أوضح ومسارات أسهل للاستخدام اليومي.",
        sections: [
          {
            title: "ما يميّز تخيّل؟",
            items: [
              "تموضع واضح للكويت والخليج",
              "دعم اللغة العربية داخل تجربة المستخدم",
              "جمع الأدوات والنماذج والقوالب ضمن منصة واحدة",
            ],
          },
        ],
        links: [
          { href: "/contact", label: "تواصل معنا" },
          { href: "/pricing", label: "الأسعار" },
        ],
      }),
    },
    {
      route: "/contact",
      title: "تواصل معنا | تخيّل",
      description:
        "تواصل مع فريق تخيّل لطلب الدعم، أو الشراكات، أو الاستفسارات العامة — بدعم واضح للفرق العربية والإنجليزية.",
      pageType: "ContactPage",
      priority: "0.6",
      changefreq: "monthly",
      snapshot: buildSnapshot({
        eyebrow: "Contact and support",
        heroTitle: "تواصل مع فريق تخيّل",
        heroDescription:
          "إن احتجت دعماً، أو كان لديك سؤال تجاري، أو رغبت في شراكة — تصل إلى الفريق عبر قنوات الدعم الرسمية داخل صفحة التواصل.",
        sections: [
          {
            title: "كيف يساعدك فريق الدعم؟",
            items: [
              "دعم الاستخدام والمشكلات الفنية",
              "استفسارات الشراكات والتجارب",
              "مساعدة الفرق العربية والإنجليزية",
            ],
          },
        ],
        links: [
          { href: "/about", label: "اعرف المزيد عنا" },
          { href: "/pricing", label: "راجع الأسعار" },
        ],
      }),
    },
    {
      route: "/privacy",
      title: "سياسة الخصوصية | تخيّل",
      description:
        "تشرح هذه الصفحة كيفية تعامل تخيّل مع البيانات والحسابات واستخدام المنصة.",
      pageType: "WebPage",
      priority: "0.3",
      changefreq: "yearly",
      snapshot: buildSnapshot({
        eyebrow: "Privacy policy",
        heroTitle: "سياسة الخصوصية في تخيّل",
        heroDescription:
          "توضّح هذه الصفحة المبادئ الأساسية لتعامل المنصة مع البيانات والحسابات واستخدام الخدمات.",
        sections: [
          {
            title: "لماذا هذه الصفحة مهمة؟",
            items: [
              "توضيح التعامل مع البيانات الشخصية",
              "شرح مسؤوليات المنصة والمستخدم",
              "دعم الشفافية والامتثال",
            ],
          },
        ],
      }),
    },
    {
      route: "/terms",
      title: "الشروط والأحكام | تخيّل",
      description:
        "تستعرض هذه الصفحة شروط استخدام تخيّل، والالتزامات الأساسية، وحدود الخدمة.",
      pageType: "WebPage",
      priority: "0.3",
      changefreq: "yearly",
      snapshot: buildSnapshot({
        eyebrow: "Terms and conditions",
        heroTitle: "الشروط والأحكام",
        heroDescription:
          "تشرح هذه الصفحة الشروط الأساسية لاستخدام تخيّل وما يتعلق بالاشتراكات والأرصدة وحدود الاستخدام.",
        sections: [
          {
            title: "ماذا تغطي الشروط؟",
            items: [
              "استخدام المنصة والحسابات",
              "الاشتراكات والأرصدة",
              "الالتزامات والمسؤوليات العامة",
            ],
          },
        ],
      }),
    },
    {
      route: "/refund",
      title: "سياسة الاسترجاع | تخيّل",
      description:
        "توضح هذه الصفحة سياسة الاسترجاع للاشتراكات والأرصدة الإضافية داخل تخيّل.",
      pageType: "WebPage",
      priority: "0.3",
      changefreq: "yearly",
      snapshot: buildSnapshot({
        eyebrow: "Refund policy",
        heroTitle: "سياسة الاسترجاع",
        heroDescription:
          "توضّح هذه الصفحة الحالات الأساسية لاسترداد الاشتراكات أو الأرصدة الإضافية، ضمن شروط الخدمة.",
        sections: [
          {
            title: "ماذا ستجد هنا؟",
            items: [
              "شروط الأهلية للاسترجاع",
              "حالات الاستثناء",
              "الرجوع إلى صفحة الشروط والسياسات ذات الصلة",
            ],
          },
        ],
      }),
    },
    {
      route: "/gallery",
      title: "المعرض | Takhayal.ai",
      description: "المعرض الشخصي لنتائج المستخدم داخل تخيّل.",
      pageType: "WebPage",
      priority: "0.1",
      changefreq: "weekly",
      noIndex: true,
      snapshot: buildSnapshot({
        eyebrow: "Personal gallery",
        heroTitle: "المعرض صفحة شخصية وليست صفحة فهرسة عامة",
        heroDescription:
          "يعرض المعرض نتائج المستخدم داخل حسابه؛ لذا لا يُقصد به الظهور في نتائج البحث أو الفهرسة العامة.",
        sections: [
          {
            title: "سبب عدم الفهرسة",
            items: [
              "المحتوى شخصي ومتغير حسب الحساب",
              "لا يقدم صفحة ثابتة مناسبة للفهرسة العامة",
              "يخدم تجربة المستخدم بعد تسجيل الدخول",
            ],
          },
        ],
      }),
    },
    {
      route: "/community",
      title: "المجتمع | Takhayal.ai",
      description: "إلهام المجتمع داخل تخيّل.",
      pageType: "CollectionPage",
      priority: "0.1",
      changefreq: "weekly",
      noIndex: true,
      snapshot: buildSnapshot({
        eyebrow: "Community inspiration",
        heroTitle: "صفحة المجتمع للاستلهام، وليست هدفاً أساسياً للفهرسة",
        heroDescription:
          "يعرض هذا المسار منشورات المجتمع والإلهام الداخلي، لكنه ليس ضمن الصفحات الأساسية المستهدَفة للفهرسة حالياً.",
        sections: [
          {
            title: "سبب عدم الفهرسة",
            items: [
              "الأولوية للصفحات التجارية والتعليمية الأساسية",
              "المحتوى متغير ويعتمد على المشاركات الحديثة",
              "أفضلية توجيه الزحف إلى الأدوات والنماذج والقوالب والأسعار",
            ],
          },
        ],
      }),
    },
  ];

  const englishRoutes = [
    {
      route: "/en",
      title: "Takhayal | Arabic-first AI creative studio",
      description:
        "Takhayal is an Arabic-first AI creative studio for creators and brands in Kuwait and the Gulf. Generate images, edit assets, compare models, and start from ready templates.",
      pageType: "CollectionPage",
      priority: "0.9",
      changefreq: "daily",
    },
    {
      route: "/en/pricing",
      title: "Pricing | Takhayal.ai",
      description:
        "Clear Takhayal pricing with transparent credits, free starting access, paid plans, and extra credit top-ups when your creative workload grows.",
      pageType: "CollectionPage",
      priority: "0.8",
      changefreq: "weekly",
    },
    {
      route: "/en/tools",
      title: "AI Tools | Takhayal.ai",
      description:
        "Explore Takhayal AI tools for image generation, background removal, logo creation, image enhancement, photo restoration, and image editing.",
      pageType: "CollectionPage",
      priority: "0.8",
      changefreq: "weekly",
    },
    {
      route: "/en/models",
      title: "AI Models | Takhayal.ai",
      description:
        "Compare the image and video models available in Takhayal and choose the right engine for product visuals, campaigns, social content, and creative workflows.",
      pageType: "CollectionPage",
      priority: "0.75",
      changefreq: "weekly",
    },
    {
      route: "/en/templates",
      title: "AI Templates | Takhayal.ai",
      description:
        "Browse ready-to-use Takhayal templates for ads, beauty campaigns, food content, social visuals, product images, and brand creative.",
      pageType: "CollectionPage",
      priority: "0.75",
      changefreq: "weekly",
    },
    {
      route: "/en/about",
      title: "About Takhayal.ai",
      description:
        "Learn about Takhayal.ai, an Arabic-first AI creative platform built for creators, teams, and brands in Kuwait and the GCC.",
      pageType: "AboutPage",
      priority: "0.6",
      changefreq: "monthly",
    },
    {
      route: "/en/contact",
      title: "Contact Takhayal.ai",
      description:
        "Contact the Takhayal.ai team for support, partnerships, billing questions, and creative AI platform enquiries.",
      pageType: "ContactPage",
      priority: "0.5",
      changefreq: "monthly",
    },
    {
      route: "/en/create",
      title: "Create with AI | Takhayal.ai",
      description:
        "Start creating with Takhayal using AI image tools, model workflows, and ready templates for faster creative production.",
      pageType: "CollectionPage",
      priority: "0.7",
      changefreq: "weekly",
    },
  ];

  return [...arabicRoutes, ...englishRoutes];
}

function buildToolRoutes(tools) {
  return tools.flatMap((tool) => {
    const title = toText(tool.title_ar, toText(tool.title_en, "أداة تخيّل"));
    const titleEn = toText(tool.title_en, title);
    const description = toText(tool.short_desc_ar, toText(tool.description_ar, toText(tool.short_desc_en, toText(tool.description_en))));
    const descriptionEn = toText(tool.short_desc_en, toText(tool.description_en, description));
    const useCase = toText(tool.description_ar, description);
    const image = tool.cover_image_url || DEFAULT_IMAGE;

    return [{
      route: `/tools/${tool.slug}`,
      title: `${title} | Takhayal.ai`,
      description,
      pageType: "WebPage",
      image,
      priority: "0.7",
      changefreq: "weekly",
      schemas: [
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: title,
          description,
          url: absoluteUrl(`/tools/${tool.slug}`),
          applicationCategory: "DesignApplication",
          operatingSystem: "Web",
        },
      ],
      snapshot: buildSnapshot({
        eyebrow: "AI tool page",
        heroTitle: title,
        heroDescription: description,
        sections: [
          {
            title: `ما أداة ${title}؟`,
            description: `${title} هي أداة داخل تخيّل تساعدك على ${useCase}.`,
          },
          {
            title: "أفضل استخدامات هذه الأداة",
            items: [
              "تنفيذ مهمة إبداعية واضحة داخل مسار واحد",
              "تجهيز أصول للحملات أو المنتجات أو السوشال",
              `معرفة تكلفة الاستخدام التي تبدأ من ${tool.default_credit_cost || 0} رصيد`,
            ],
          },
          {
            title: "لماذا تختارها",
            items: [
              "تجربة عربية أولاً",
              "واجهة مركَّزة على مهمة محدَّدة",
              "تكلفة معروضة قبل التنفيذ",
            ],
          },
        ],
        links: [
          { href: "/tools", label: "كل الأدوات" },
          { href: "/models", label: "قارن النماذج" },
          { href: "/pricing", label: "الأسعار والأرصدة" },
        ],
      }),
    },
    {
      route: `/en/tools/${tool.slug}`,
      title: `${titleEn} | Takhayal.ai`,
      description: descriptionEn,
      pageType: "WebPage",
      image,
      priority: "0.65",
      changefreq: "weekly",
      schemas: [
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: titleEn,
          description: descriptionEn,
          url: absoluteUrl(`/en/tools/${tool.slug}`),
          applicationCategory: "DesignApplication",
          operatingSystem: "Web",
        },
      ],
    }];
  });
}

function buildModelRoutes(guides) {
  return guides.flatMap((guide) => {
    const name = toText(guide.name_ar, toText(guide.name_en, "نموذج"));
    const nameEn = toText(guide.name_en, name);
    const description = toText(
      guide.short_description_ar,
      toText(guide.short_description_en, toText(guide.title_ar, toText(guide.title_en)))
    );
    const descriptionEn = toText(guide.short_description_en, toText(guide.title_en, description));
    const bestFor = toText(guide.best_for_line_ar, toText(guide.best_for_line_en, "أعمال إبداعية متنوعة"));
    const bestForEn = toText(guide.best_for_line_en, bestFor);
    const image = guide.main_image_url || guide.video_preview_url || DEFAULT_IMAGE;

    return [{
      route: `/models/${guide.slug}`,
      title: `${name} | Takhayal.ai`,
      description,
      pageType: "WebPage",
      image,
      priority: "0.7",
      changefreq: "weekly",
      snapshot: buildSnapshot({
        eyebrow: guide.type === "video" ? "Video model" : "Image model",
        heroTitle: name,
        heroDescription: `${description} الأفضل له: ${bestFor}.`,
        sections: [
          {
            title: `ما نموذج ${name}؟`,
            description: `${name} نموذج داخل تخيّل يركّز على ${bestFor}.`,
          },
          {
            title: "ملخص المقارنة",
            table: {
              columns: ["العامل", "القيمة"],
              rows: [
                ["السرعة", toText(guide.speed, "غير محدَّد")],
                ["الجودة", toText(guide.quality, "غير محدَّد")],
                ["الأفضل لـ", bestFor],
              ],
            },
          },
        ],
        links: [
          { href: "/models", label: "جميع النماذج" },
          { href: "/pricing", label: "الأسعار" },
          { href: "/tools", label: "الأدوات" },
        ],
      }),
    },
    {
      route: `/en/models/${guide.slug}`,
      title: `${nameEn} | Takhayal.ai`,
      description: `${descriptionEn} Best for ${bestForEn}.`,
      pageType: "WebPage",
      image,
      priority: "0.65",
      changefreq: "weekly",
    }];
  });
}

function buildTemplateRoutes(templates) {
  return templates.flatMap((template) => {
    const title = toText(template.title_ar, toText(template.title_en, "قالب"));
    const titleEn = toText(template.title_en, title);
    const category = toText(template.category, "creative");
    const ratio = toText(template.ratio, "1:1");
    const image = template.cover_image_url || DEFAULT_IMAGE;
    const route = buildTemplatePath(template);

    return [{
      route,
      title: `${title} | Takhayal.ai`,
      description: `${title} قالب جاهز داخل تخيّل لفئة ${category} وبنسبة ${ratio}.`,
      pageType: "WebPage",
      image,
      priority: "0.6",
      changefreq: "weekly",
      snapshot: buildSnapshot({
        eyebrow: "Creative template",
        heroTitle: title,
        heroDescription: `${title} قالب يساعدك على بدء إنتاج محتوى ${category} بسرعة مع نسبة ${ratio}.`,
        sections: [
          {
            title: `ما قالب ${title}؟`,
            description: `${title} قالب جاهز داخل تخيّل لتسريع الانطلاق في إنتاج المحتوى البصري.`,
          },
          {
            title: "لماذا يفيدك هذا القالب",
            items: [
              "يقلِّل وقت البدء من الصفر",
              "يعطيك اتجاهاً بصرياً أوضح للحملة أو المنتج",
              `يحافظ على نسبة مناسبة مثل ${ratio}`,
            ],
          },
        ],
        links: [
          { href: "/templates", label: "كل القوالب" },
          { href: "/tools", label: "الأدوات" },
          { href: "/pricing", label: "الأسعار" },
        ],
      }),
    },
    {
      route: withEnPrefix(route),
      title: `${titleEn} | Takhayal.ai`,
      description: `${titleEn} is a ready-to-use Takhayal template for ${category} creative work in ${ratio} format.`,
      pageType: "WebPage",
      image,
      priority: "0.55",
      changefreq: "weekly",
    }];
  });
}

function build404Route() {
  return {
    route: "/404",
    title: "404 | Takhayal.ai",
    description: "الصفحة المطلوبة غير موجودة.",
    pageType: "WebPage",
    noIndex: true,
    snapshot: buildSnapshot({
      eyebrow: "404",
      heroTitle: "الصفحة المطلوبة غير موجودة",
      heroDescription:
        "قد يكون الرابط غير صحيح، أو نُقلت الصفحة. يمكنك العودة إلى الصفحة الرئيسية، أو استكشاف الأدوات والنماذج.",
      sections: [
        {
          title: "روابط مفيدة",
          items: [
            "العودة إلى الصفحة الرئيسية",
            "استعراض الأدوات",
            "استكشاف القوالب أو دليل النماذج",
          ],
        },
      ],
      links: [
        { href: "/", label: "الصفحة الرئيسية" },
        { href: "/tools", label: "الأدوات" },
        { href: "/models", label: "النماذج" },
      ],
    }),
  };
}

function injectMeta(html, config) {
  const languageCode = isEnglishRoute(config.route) ? "en" : "ar";
  const baseRoute = stripLocalePrefix(config.route);
  const arabicUrl = absoluteUrl(withArPrefix(baseRoute));
  const englishUrl = absoluteUrl(withEnPrefix(baseRoute));
  const canonicalUrl =
    config.route === "/404" ? `${SITE_URL}/404` : absoluteUrl(canonicalRoute(config.route));
  const imageUrl = config.image || DEFAULT_IMAGE;
  const robotsValue = config.noIndex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large";
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": config.pageType || "WebPage",
    name: config.title,
    description: config.description,
    url: canonicalUrl,
    inLanguage: languageCode,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    primaryImageOfPage: { "@type": "ImageObject", url: imageUrl },
    dateModified: LAST_MODIFIED,
  };
  const schemaPayloads = [
    organizationSchema,
    websiteSchema,
    pageSchema,
    ...(config.schemas || []),
  ];

  const schemaTags = schemaPayloads
    .map(
      (schema) =>
        `<script type="application/ld+json" data-seo-schema="true">${JSON.stringify(schema)}</script>`
    )
    .join("\n    ");

  let next = html;
  next = replaceTag(next, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(config.title)}</title>`);
  next = replaceTag(
    next,
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(config.description)}">`
  );
  next = replaceTag(
    next,
    /<meta name="author" content="[^"]*"\s*\/?>/i,
    `<meta name="author" content="${SITE_NAME}">`
  );
  next = replaceTag(
    next,
    /<meta name="robots" content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${robotsValue}">`
  );
  next = replaceTag(
    next,
    /<meta property="og:type" content="[^"]*"\s*\/?>/i,
    '<meta property="og:type" content="website">'
  );
  next = replaceTag(
    next,
    /<meta property="og:site_name" content="[^"]*"\s*\/?>/i,
    `<meta property="og:site_name" content="${SITE_NAME}">`
  );
  next = replaceTag(
    next,
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonicalUrl}">`
  );
  next = replaceTag(
    next,
    /<meta property="og:image" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${imageUrl}">`
  );
  next = replaceTag(
    next,
    /<meta property="og:title" content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(config.title)}">`
  );
  next = replaceTag(
    next,
    /<meta property="og:description" content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(config.description)}">`
  );
  next = replaceTag(
    next,
    /<meta property="article:modified_time" content="[^"]*"\s*\/?>/i,
    `<meta property="article:modified_time" content="${LAST_MODIFIED}">`
  );
  next = replaceTag(
    next,
    /<meta name="twitter:card" content="[^"]*"\s*\/?>/i,
    '<meta name="twitter:card" content="summary_large_image">'
  );
  next = replaceTag(
    next,
    /<meta name="twitter:site" content="[^"]*"\s*\/?>/i,
    '<meta name="twitter:site" content="@takhayal_ai">'
  );
  next = replaceTag(
    next,
    /<meta name="twitter:image" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${imageUrl}">`
  );
  next = replaceTag(
    next,
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(config.title)}">`
  );
  next = replaceTag(
    next,
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(config.description)}">`
  );
  next = replaceTag(
    next,
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonicalUrl}">`
  );
  next = next.replace(/<link rel="alternate" hreflang="[^"]+" href="[^"]*"\s*\/?>\s*/gi, "");
  next = replaceTag(
    next,
    /<html lang="[^"]*" dir="[^"]*">/i,
    languageCode === "en" ? '<html lang="en" dir="ltr">' : '<html lang="ar" dir="rtl">'
  );
  next = next.replace(/<script type="application\/ld\+json" data-seo-schema="true">[\s\S]*?<\/script>\s*/gi, "");
  next = next.replace(/<main id="seo-static-content"[\s\S]*?<\/main>\s*/i, "");
  next = next.replace(
    "</head>",
    `    <link rel="alternate" hreflang="ar" href="${arabicUrl}">\n    <link rel="alternate" hreflang="en" href="${englishUrl}">\n    <link rel="alternate" hreflang="x-default" href="${arabicUrl}">\n    ${schemaTags}\n  </head>`
  );

  return next;
}

function buildSitemap(routes) {
  const seen = new Set();
  const urls = routes
    .filter((route) => !route.noIndex && route.route !== "/404")
    .map((route) => ({ ...route, route: canonicalRoute(route.route) }))
    .filter((route) => {
      if (seen.has(route.route)) return false;
      seen.add(route.route);
      return true;
    })
    .map(
      (route) => `  <url>
    <loc>${absoluteUrl(route.route)}</loc>
    <lastmod>${route.lastmod || LAST_MODIFIED}</lastmod>
    <changefreq>${route.changefreq || "weekly"}</changefreq>
    <priority>${route.priority || "0.5"}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

async function main() {
  const rootDir = path.resolve(process.cwd(), "dist");
  const templatePath = path.join(rootDir, "index.html");
  const template = await fs.readFile(templatePath, "utf8");

  async function writeRouteHtml(route, html) {
    if (route === "/") {
      await fs.writeFile(templatePath, html, "utf8");
      return;
    }

    const routeDir = path.join(rootDir, route.replace(/^\/+/, ""));
    await fs.mkdir(routeDir, { recursive: true });
    await fs.writeFile(path.join(routeDir, "index.html"), html, "utf8");
  }

  const [toolsResult, guidesResult, templatesResult] = await Promise.allSettled([
    fetchSupabaseRows(
      "tools",
      "slug,active,title_en,title_ar,description_en,description_ar,short_desc_en,short_desc_ar,cover_image_url,default_credit_cost"
    ),
    fetchSupabaseRows(
      "model_guides",
      "slug,active,type,name_en,name_ar,title_en,title_ar,short_description_en,short_description_ar,best_for_line_en,best_for_line_ar,speed,quality,main_image_url,video_preview_url"
    ),
    fetchSupabaseRows(
      "templates",
      "id,active,title_en,title_ar,cover_image_url,ratio,category"
    ),
  ]);

  const tools = requirePrerenderRows(toolsResult, "tool detail");
  const guides = requirePrerenderRows(guidesResult, "model detail");
  const templates = requirePrerenderRows(templatesResult, "template detail");

  const routes = [
    ...staticRoutes(),
    ...buildSeoLandingRoutes(),
    ...buildToolRoutes(tools.filter((tool) => tool.active)),
    ...buildModelRoutes(guides.filter((guide) => guide.active)),
    ...buildTemplateRoutes(templates.filter((template) => template.active)),
  ];

  for (const config of routes) {
    const html = injectMeta(template, config);
    await writeRouteHtml(config.route, html);

    if (!config.noIndex && !isEnglishRoute(config.route) && config.route !== "/404") {
      const canonicalArabicRoute = withArPrefix(config.route);
      if (canonicalArabicRoute !== config.route) {
        await writeRouteHtml(canonicalArabicRoute, injectMeta(template, { ...config, route: canonicalArabicRoute }));
      }
    }
  }

  const notFoundRoute = build404Route();
  const notFoundHtml = injectMeta(template, notFoundRoute);
  await fs.writeFile(path.join(rootDir, "404.html"), notFoundHtml, "utf8");
  await fs.writeFile(path.join(rootDir, "sitemap.xml"), buildSitemap(routes), "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
