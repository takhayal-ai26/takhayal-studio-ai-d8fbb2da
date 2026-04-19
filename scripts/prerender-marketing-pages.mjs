import fs from "node:fs/promises";
import path from "node:path";

const SITE_URL = "https://takhayal.ai";
const SITE_NAME = "Takhayal.ai";
const DEFAULT_IMAGE = `${SITE_URL}/og-cover.jpg`;

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

const routeConfigs = [
  {
    route: "/",
    title: "تخيّل | استوديو ذكاء اصطناعي عربي أولاً",
    description:
      "صف طلبك بالعربي وخذ تصميماً جاهزاً للنشر خلال ثوانٍ. تخيّل هو استوديو ذكاء اصطناعي عربي أولاً للمشاريع الصغيرة والمبدعين في الكويت والخليج.",
    pageType: "CollectionPage",
  },
  {
    route: "/pricing",
    title: "الأسعار | Takhayal.ai",
    description:
      "خطط واضحة للمشاريع الصغيرة والمبدعين في الخليج، مع أرصدة شفافة وشحن إضافي وقت الحاجة بدون تعقيد.",
    pageType: "CollectionPage",
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "OfferCatalog",
        name: "باقات تخيّل",
        itemListElement: [
          { "@type": "ListItem", position: 1, item: { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", url: `${SITE_URL}/pricing` } },
          { "@type": "ListItem", position: 2, item: { "@type": "Offer", name: "Starter", priceCurrency: "USD", url: `${SITE_URL}/pricing` } },
          { "@type": "ListItem", position: 3, item: { "@type": "Offer", name: "Creator", priceCurrency: "USD", url: `${SITE_URL}/pricing` } },
          { "@type": "ListItem", position: 4, item: { "@type": "Offer", name: "Studio", priceCurrency: "USD", url: `${SITE_URL}/pricing` } },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "هل أقدر أبدأ بدون بطاقة؟",
            acceptedAnswer: { "@type": "Answer", text: "نعم، تبدأ برصيد مجاني لتجربة التوليد قبل أي ترقية." },
          },
          {
            "@type": "Question",
            name: "هل أقدر أشحن أرصدة إضافية؟",
            acceptedAnswer: { "@type": "Answer", text: "نعم، تقدر تشتري أرصدة إضافية وقت ما تحتاج." },
          },
        ],
      },
    ],
  },
  {
    route: "/about",
    title: "من نحن | تخيّل",
    description:
      "تعرّف على تخيّل، الاستوديو العربي أولاً المبني في الكويت لمساعدة أصحاب المشاريع والمبدعين على إنتاج مرئيات جاهزة للنشر بسرعة وثقة.",
    pageType: "AboutPage",
  },
  {
    route: "/contact",
    title: "تواصل معنا | تخيّل",
    description:
      "تواصل مع فريق تخيّل بخصوص الدعم أو الشراكات أو الاستفسارات العامة، وسنرد عليك في أقرب وقت.",
    pageType: "ContactPage",
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        url: `${SITE_URL}/contact`,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@takhayal.ai",
        },
      },
    ],
  },
  {
    route: "/templates",
    title: "القوالب | Takhayal.ai",
    description:
      "ابدأ من قوالب جاهزة تناسب حملات الخليج ومنشورات السوشال والعروض السريعة، بدون تعقيد أو أدوات مزدحمة.",
    pageType: "CollectionPage",
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "قوالب تخيّل",
        itemListElement: [{ "@type": "ListItem", position: 1, url: `${SITE_URL}/templates`, name: "قوالب تخيّل" }],
      },
    ],
  },
  {
    route: "/models",
    title: "جميع النماذج | Takhayal.ai",
    description:
      "اكتشف نماذج الصور والفيديو داخل تخيّل واختر المحرك المناسب لسرعة وجودة تناسب عملك في الكويت والخليج.",
    pageType: "CollectionPage",
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "نماذج تخيّل",
        itemListElement: [{ "@type": "ListItem", position: 1, url: `${SITE_URL}/models`, name: "دليل النماذج" }],
      },
    ],
  },
  {
    route: "/tools",
    title: "الأدوات | Takhayal.ai",
    description:
      "استكشف أدوات تخيّل للصور والفيديو والتحرير الذكي، بتجربة عربية أولاً ومسار واضح من الفكرة إلى التصميم.",
    pageType: "CollectionPage",
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "أدوات تخيّل",
        itemListElement: [{ "@type": "ListItem", position: 1, url: `${SITE_URL}/tools`, name: "دليل الأدوات" }],
      },
    ],
  },
  {
    route: "/create",
    title: "إنشاء | تخيّل",
    description:
      "ابدأ إنشاء صورة أو فيديو بالذكاء الاصطناعي فوراً من مركز إنشاء بسيط وواضح، بدون زحمة أدوات.",
    pageType: "CollectionPage",
  },
  {
    route: "/privacy",
    title: "سياسة الخصوصية | تخيّل",
    description:
      "اطلع على سياسة خصوصية تخيّل وكيفية التعامل مع بياناتك واستخدامك للمنصة.",
    pageType: "WebPage",
  },
  {
    route: "/terms",
    title: "الشروط والأحكام | تخيّل",
    description:
      "راجع شروط وأحكام استخدام تخيّل وخطط الاشتراك والالتزامات الأساسية للمنصة.",
    pageType: "WebPage",
  },
  {
    route: "/refund",
    title: "سياسة الاسترجاع | تخيّل",
    description:
      "اطلع على سياسة الاسترجاع في تخيّل للحزم والاشتراكات والأرصدة الإضافية.",
    pageType: "WebPage",
  },
];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function replaceTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function injectMeta(html, config) {
  const canonicalUrl = new URL(config.route, SITE_URL).toString();
  const imageUrl = config.image ?? DEFAULT_IMAGE;
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": config.pageType,
    name: config.title,
    description: config.description,
    url: canonicalUrl,
    inLanguage: "ar",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    primaryImageOfPage: { "@type": "ImageObject", url: imageUrl },
  };
  const schemaPayloads = [organizationSchema, websiteSchema, pageSchema, ...(config.schemas ?? [])];
  const schemaTags = schemaPayloads
    .map((schema) => `<script type="application/ld+json" data-seo-schema="true">${JSON.stringify(schema)}</script>`)
    .join("\n    ");

  let next = html;
  next = replaceTag(next, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(config.title)}</title>`);
  next = replaceTag(next, /<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(config.description)}">`);
  next = replaceTag(next, /<meta name="author" content="[^"]*"\s*\/?>/i, `<meta name="author" content="${SITE_NAME}">`);
  next = replaceTag(next, /<meta name="robots" content="[^"]*"\s*\/?>/i, '<meta name="robots" content="index, follow, max-image-preview:large">');
  next = replaceTag(next, /<meta property="og:type" content="[^"]*"\s*\/?>/i, '<meta property="og:type" content="website">');
  next = replaceTag(next, /<meta property="og:site_name" content="[^"]*"\s*\/?>/i, `<meta property="og:site_name" content="${SITE_NAME}">`);
  next = replaceTag(next, /<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${canonicalUrl}">`);
  next = replaceTag(next, /<meta property="og:image" content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${imageUrl}">`);
  next = replaceTag(next, /<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(config.title)}">`);
  next = replaceTag(next, /<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(config.description)}">`);
  next = replaceTag(next, /<meta name="twitter:card" content="[^"]*"\s*\/?>/i, '<meta name="twitter:card" content="summary_large_image">');
  next = replaceTag(next, /<meta name="twitter:site" content="[^"]*"\s*\/?>/i, '<meta name="twitter:site" content="@takhayal_ai">');
  next = replaceTag(next, /<meta name="twitter:image" content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${imageUrl}">`);
  next = replaceTag(next, /<meta name="twitter:title" content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(config.title)}">`);
  next = replaceTag(next, /<meta name="twitter:description" content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(config.description)}">`);
  next = replaceTag(next, /<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonicalUrl}">`);
  next = replaceTag(next, /<html lang="[^"]*" dir="[^"]*">/i, '<html lang="ar" dir="rtl">');
  next = next.replace(/<script type="application\/ld\+json" data-seo-schema="true">[\s\S]*?<\/script>\s*/gi, "");
  next = next.replace("</head>", `    ${schemaTags}\n  </head>`);

  return next;
}

async function main() {
  const rootDir = path.resolve(process.cwd(), "dist");
  const templatePath = path.join(rootDir, "index.html");
  const template = await fs.readFile(templatePath, "utf8");

  for (const config of routeConfigs) {
    const html = injectMeta(template, config);
    if (config.route === "/") {
      await fs.writeFile(templatePath, html, "utf8");
      continue;
    }

    const routeDir = path.join(rootDir, config.route.replace(/^\/+/, ""));
    await fs.mkdir(routeDir, { recursive: true });
    await fs.writeFile(path.join(routeDir, "index.html"), html, "utf8");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
