export type SeoLandingPageKey =
  | 'ai-tools-for-arabic-brands'
  | 'ai-image-tools-kuwait'
  | 'arabic-ai-design-tool'
  | 'canva-ai-alternative-gcc'
  | 'canva-ai-alternative'
  | 'midjourney-alternative-arabic-brands';

type LocalizedText = {
  ar: string;
  en: string;
};

type LocalizedList = {
  ar: string[];
  en: string[];
};

export type SeoLandingPageConfig = {
  slug: SeoLandingPageKey;
  title: LocalizedText;
  description: LocalizedText;
  eyebrow: LocalizedText;
  h1: LocalizedText;
  directAnswer: LocalizedText;
  tableHeadings: LocalizedList;
  tableRows: {
    ar: string[];
    en: string[];
  }[];
  useCases: LocalizedList;
  limitations: LocalizedList;
  faqs: {
    question: LocalizedText;
    answer: LocalizedText;
  }[];
};

export const SEO_LANDING_LAST_UPDATED = '2026-04-25';

export const seoLandingPages: Record<SeoLandingPageKey, SeoLandingPageConfig> = {
  'ai-tools-for-arabic-brands': {
    slug: 'ai-tools-for-arabic-brands',
    title: {
      ar: 'أدوات ذكاء اصطناعي للعلامات العربية | Takhayal.ai',
      en: 'AI tools for Arabic brands | Takhayal.ai',
    },
    description: {
      ar: 'دليل عملي لاستخدام تخيّل لإنتاج صور وحملات ومحتوى اجتماعي للعلامات العربية في الكويت والخليج.',
      en: 'A practical guide to using Takhayal for images, campaigns, and social content for Arabic brands in Kuwait and the GCC.',
    },
    eyebrow: { ar: 'دليل للعلامات العربية', en: 'Guide for Arabic brands' },
    h1: { ar: 'أدوات ذكاء اصطناعي للعلامات العربية', en: 'AI tools for Arabic brands' },
    directAnswer: {
      ar: 'تخيّل.ai هو استوديو ذكاء اصطناعي عربي أولاً يساعد العلامات العربية على إنشاء الصور، تعديل الأصول، اختيار النماذج، والانطلاق من قوالب جاهزة مع تجربة مهيأة للكويت والخليج.',
      en: 'Takhayal.ai is an Arabic-first AI creative studio that helps Arabic brands generate images, edit assets, compare models, and start from ready templates with workflows built for Kuwait and the GCC.',
    },
    tableHeadings: {
      ar: ['الحاجة', 'مسار تخيّل المناسب', 'لماذا يفيد العلامة'],
      en: ['Need', 'Best Takhayal path', 'Why it helps the brand'],
    },
    tableRows: [
      {
        ar: ['إنتاج حملات سريعة', 'القوالب ومركز الإنشاء', 'يوفر نقطة بداية واضحة بدلاً من صفحة فارغة'],
        en: ['Fast campaign production', 'Templates and create hub', 'Provides a clear starting point instead of a blank canvas'],
      },
      {
        ar: ['صور منتجات أو إعلانات', 'أدوات الصور والنماذج', 'يساعد على مطابقة المهمة مع النموذج أو الأداة المناسبة'],
        en: ['Product or ad visuals', 'Image tools and models', 'Helps match the task to the right tool or model'],
      },
      {
        ar: ['تحسين أصول موجودة', 'أدوات التعديل والترميم', 'يدعم تحسين الجودة وإزالة الخلفيات وتنظيف الصور'],
        en: ['Improve existing assets', 'Editing and restoration tools', 'Supports enhancement, background removal, and cleanup work'],
      },
    ],
    useCases: {
      ar: ['حملات رمضان والمواسم الخليجية', 'صور المنتجات والعطور والطعام والجمال', 'محتوى اجتماعي عربي وإنجليزي', 'استكشاف اتجاهات بصرية قبل الإنتاج النهائي'],
      en: ['Ramadan and GCC seasonal campaigns', 'Product, perfume, food, and beauty visuals', 'Arabic and English social content', 'Exploring visual directions before final production'],
    },
    limitations: {
      ar: ['لا يغني عن مراجعة الهوية البصرية قبل النشر', 'نتائج الذكاء الاصطناعي تحتاج تدقيقاً بشرياً للعلامات الحساسة', 'استهلاك الأرصدة يختلف حسب النموذج والدقة والمهمة'],
      en: ['Does not replace brand-review before publishing', 'AI outputs still need human review for sensitive brand work', 'Credit usage varies by model, resolution, and task'],
    },
    faqs: [
      {
        question: { ar: 'هل تخيّل مناسب للعلامات العربية؟', en: 'Is Takhayal suitable for Arabic brands?' },
        answer: {
          ar: 'نعم. تخيّل مصمم كتجربة عربية أولاً للفرق والمبدعين الذين يعملون على حملات وصور ومحتوى اجتماعي في الكويت والخليج.',
          en: 'Yes. Takhayal is designed as an Arabic-first experience for teams and creators producing campaigns, images, and social content in Kuwait and the GCC.',
        },
      },
      {
        question: { ar: 'هل يدعم تخيّل العربية والإنجليزية؟', en: 'Does Takhayal support Arabic and English?' },
        answer: {
          ar: 'يدعم تخيّل تجربة عربية وإنجليزية عبر صفحات وأدوات موجهة للمستخدمين في المنطقة.',
          en: 'Takhayal supports Arabic and English experiences across pages and workflows for regional users.',
        },
      },
    ],
  },
  'ai-image-tools-kuwait': {
    slug: 'ai-image-tools-kuwait',
    title: {
      ar: 'أدوات صور بالذكاء الاصطناعي في الكويت | Takhayal.ai',
      en: 'AI image tools for Kuwait businesses | Takhayal.ai',
    },
    description: {
      ar: 'استخدم تخيّل لإنتاج صور منتجات وحملات ومحتوى اجتماعي للشركات والمبدعين في الكويت.',
      en: 'Use Takhayal to produce product images, campaign visuals, and social content for businesses and creators in Kuwait.',
    },
    eyebrow: { ar: 'للشركات في الكويت', en: 'For Kuwait businesses' },
    h1: { ar: 'أدوات صور بالذكاء الاصطناعي في الكويت', en: 'AI image tools for Kuwait businesses' },
    directAnswer: {
      ar: 'تخيّل يساعد الشركات والمبدعين في الكويت على إنشاء صور وتعديلها باستخدام أدوات ذكاء اصطناعي واضحة للأعمال اليومية مثل المنتجات، الإعلانات، الخلفيات، والترميم.',
      en: 'Takhayal helps Kuwait businesses and creators generate and edit images with AI tools for everyday production tasks such as products, ads, backgrounds, and restoration.',
    },
    tableHeadings: {
      ar: ['الفريق', 'الاحتياج', 'المسار المقترح'],
      en: ['Team', 'Need', 'Suggested path'],
    },
    tableRows: [
      {
        ar: ['متجر أو مطعم', 'صور منتجات ومحتوى عروض', 'القوالب وأدوات التوليد'],
        en: ['Shop or restaurant', 'Product visuals and offer content', 'Templates and generation tools'],
      },
      {
        ar: ['وكالة تسويق', 'تجارب بصرية متعددة بسرعة', 'دليل النماذج ومركز الإنشاء'],
        en: ['Marketing agency', 'Multiple visual directions quickly', 'Model directory and create hub'],
      },
      {
        ar: ['فريق علامة تجارية', 'تحسين الأصول الحالية', 'أدوات التحسين وإزالة الخلفية'],
        en: ['Brand team', 'Improve existing assets', 'Enhancement and background removal tools'],
      },
    ],
    useCases: {
      ar: ['إعلانات محلية', 'منشورات إنستغرام وتيك توك', 'صور منتجات للمتاجر', 'تحسين صور قديمة أو منخفضة الجودة'],
      en: ['Local ads', 'Instagram and TikTok visuals', 'Product images for stores', 'Improving old or low-quality images'],
    },
    limitations: {
      ar: ['قد تحتاج الصور التجارية لمراجعة قانونية أو حقوقية قبل النشر', 'الصور الناتجة يجب تدقيقها عند استخدام شعارات أو منتجات حساسة', 'المنصة لا تستبدل التصوير الاحترافي في كل الحالات'],
      en: ['Commercial visuals may need legal or rights review before publishing', 'Generated images should be checked when logos or sensitive products are involved', 'The platform does not replace professional photography in every case'],
    },
    faqs: [
      {
        question: { ar: 'ما أفضل استخدام لتخيّل في الكويت؟', en: 'What is the best use of Takhayal in Kuwait?' },
        answer: {
          ar: 'أفضل استخدام هو إنتاج صور حملات ومنتجات ومحتوى اجتماعي بسرعة مع الحفاظ على سياق عربي وخليجي واضح.',
          en: 'The best use is producing campaign, product, and social visuals quickly while keeping a clear Arabic and GCC context.',
        },
      },
      {
        question: { ar: 'هل يمكن استخدامه للفرق الصغيرة؟', en: 'Can small teams use it?' },
        answer: {
          ar: 'نعم. نظام الأرصدة والقوالب والأدوات المنفصلة يجعل تخيّل مناسباً للتجربة التدريجية والفرق الصغيرة.',
          en: 'Yes. Credits, templates, and focused tools make Takhayal suitable for gradual adoption and small teams.',
        },
      },
    ],
  },
  'arabic-ai-design-tool': {
    slug: 'arabic-ai-design-tool',
    title: {
      ar: 'أداة تصميم بالذكاء الاصطناعي عربية أولاً | Takhayal.ai',
      en: 'Arabic-first AI design tool | Takhayal.ai',
    },
    description: {
      ar: 'تخيّل هو استوديو إبداعي بالذكاء الاصطناعي يركز على تجربة عربية أولاً للصور والقوالب والنماذج.',
      en: 'Takhayal is an AI creative studio focused on an Arabic-first experience for images, templates, and model workflows.',
    },
    eyebrow: { ar: 'عربي أولاً', en: 'Arabic-first' },
    h1: { ar: 'أداة تصميم بالذكاء الاصطناعي عربية أولاً', en: 'Arabic-first AI design tool' },
    directAnswer: {
      ar: 'تخيّل ليس مجرد مولد صور. هو تجربة إبداعية عربية أولاً تجمع بين الأدوات، القوالب، النماذج، والأسعار المعتمدة على الأرصدة لمساعدة الفرق على إنتاج أصول بصرية أسرع.',
      en: 'Takhayal is more than an image generator. It is an Arabic-first creative experience combining tools, templates, models, and credit-based pricing to help teams produce visual assets faster.',
    },
    tableHeadings: {
      ar: ['العنصر', 'كيف يظهر في تخيّل', 'الأثر'],
      en: ['Element', 'How it appears in Takhayal', 'Effect'],
    },
    tableRows: [
      {
        ar: ['اللغة', 'تجربة عربية وإنجليزية', 'تسهيل الاستخدام للفرق المحلية'],
        en: ['Language', 'Arabic and English experience', 'Easier use for regional teams'],
      },
      {
        ar: ['المهام', 'توليد، تعديل، قوالب، نماذج', 'اختيار مسار واضح بدلاً من أداة واحدة عامة'],
        en: ['Tasks', 'Generation, editing, templates, models', 'A clear workflow instead of one generic tool'],
      },
      {
        ar: ['التكلفة', 'أرصدة معروضة قبل الاستخدام', 'توقع أفضل للاستهلاك'],
        en: ['Cost', 'Credits shown before usage', 'Better workload planning'],
      },
    ],
    useCases: {
      ar: ['إنتاج أصول حملات عربية', 'اختبار أفكار قبل التصميم النهائي', 'تحسين صور المنتجات', 'استخدام قوالب موسمية أو تجارية'],
      en: ['Producing Arabic campaign assets', 'Testing ideas before final design', 'Improving product images', 'Using seasonal or commercial templates'],
    },
    limitations: {
      ar: ['لا يستبدل مدير الهوية أو المصمم في القرارات النهائية', 'النتائج تختلف حسب جودة الطلب والصورة المرجعية', 'تحتاج المشاريع الكبيرة إلى مراجعة داخلية قبل الإطلاق'],
      en: ['Does not replace brand managers or designers for final decisions', 'Results vary by prompt and reference quality', 'Large projects still need internal review before launch'],
    },
    faqs: [
      {
        question: { ar: 'ما معنى عربي أولاً؟', en: 'What does Arabic-first mean?' },
        answer: {
          ar: 'يعني أن تجربة المنتج والتموضع والمحتوى موجهة منذ البداية للمستخدم العربي والخليجي، وليست ترجمة لاحقة لتجربة أجنبية.',
          en: 'It means the product experience, positioning, and content are designed from the start for Arabic and GCC users, not added later as a translation.',
        },
      },
      {
        question: { ar: 'هل تخيّل أداة تصميم كاملة؟', en: 'Is Takhayal a full design suite?' },
        answer: {
          ar: 'تخيّل يركز على إنتاج الصور والأصول الإبداعية بالذكاء الاصطناعي، وليس بديلاً كاملاً لكل أدوات التصميم التقليدية.',
          en: 'Takhayal focuses on AI image and creative-asset production, not replacing every traditional design tool.',
        },
      },
    ],
  },
  'canva-ai-alternative-gcc': {
    slug: 'canva-ai-alternative-gcc',
    title: {
      ar: 'بديل Canva AI للفرق في الخليج | Takhayal.ai',
      en: 'Canva AI alternative for GCC teams | Takhayal.ai',
    },
    description: {
      ar: 'مقارنة عملية بين استخدام Canva AI وتخيّل للفرق التي تحتاج إنتاج صور عربية وخليجية بسرعة.',
      en: 'A practical comparison of Canva AI and Takhayal for teams that need Arabic and GCC-focused image production.',
    },
    eyebrow: { ar: 'مقارنة للفرق الخليجية', en: 'GCC team comparison' },
    h1: { ar: 'بديل Canva AI للفرق في الخليج', en: 'Canva AI alternative for GCC teams' },
    directAnswer: {
      ar: 'Canva منصة تصميم واسعة، بينما يركز تخيّل على إنتاج الصور والأصول بالذكاء الاصطناعي لتجارب عربية وخليجية. الاختيار يعتمد على ما إذا كنت تحتاج محرر تصميم شامل أو مسارات AI مركزة للصور والقوالب والنماذج.',
      en: 'Canva is a broad design platform, while Takhayal focuses on AI image and asset production for Arabic and GCC creative workflows. The right choice depends on whether you need a full design editor or focused AI paths for images, templates, and models.',
    },
    tableHeadings: {
      ar: ['عامل المقارنة', 'Canva AI', 'تخيّل'],
      en: ['Comparison factor', 'Canva AI', 'Takhayal'],
    },
    tableRows: [
      {
        ar: ['الاستخدام الرئيسي', 'تصميم شامل وقوالب عالمية', 'إنتاج صور وأصول AI عربية أولاً'],
        en: ['Primary use', 'Broad design and global templates', 'Arabic-first AI image and asset production'],
      },
      {
        ar: ['السياق الإقليمي', 'عام وعالمي', 'موجه للكويت والخليج'],
        en: ['Regional context', 'General and global', 'Focused on Kuwait and the GCC'],
      },
      {
        ar: ['أفضل للفرق التي تريد', 'تحرير تصاميم كثيرة في مساحة واحدة', 'تجربة صور ونماذج وقوالب AI بسرعة'],
        en: ['Best for teams that need', 'Editing many design types in one workspace', 'Fast AI image, model, and template workflows'],
      },
    ],
    useCases: {
      ar: ['فرق خليجية تحتاج صور حملات بسرعة', 'علامات تريد تجربة أفكار عربية قبل التصميم النهائي', 'فرق تستخدم Canva للتصميم وتحتاج مسار AI متخصص للصور'],
      en: ['GCC teams that need campaign visuals quickly', 'Brands testing Arabic concepts before final design', 'Teams using Canva for layout but needing a focused AI image workflow'],
    },
    limitations: {
      ar: ['تخيّل ليس محرر عروض أو مستندات شاملاً', 'Canva قد يكون أنسب لتصميمات متعددة الصفحات', 'المقارنة تعتمد على سير عمل الفريق وليس على تفوق مطلق'],
      en: ['Takhayal is not a full presentation or document editor', 'Canva may be better for multi-page layout design', 'The comparison depends on workflow needs, not absolute superiority'],
    },
    faqs: [
      {
        question: { ar: 'هل تخيّل بديل مباشر لـ Canva؟', en: 'Is Takhayal a direct Canva replacement?' },
        answer: {
          ar: 'ليس دائماً. تخيّل بديل أو مكمل عندما تكون الأولوية لإنتاج صور وأصول AI عربية وخليجية، بينما Canva أوسع كمنصة تصميم عامة.',
          en: 'Not always. Takhayal is an alternative or complement when the priority is Arabic and GCC AI image production, while Canva is broader as a general design platform.',
        },
      },
      {
        question: { ar: 'متى أختار تخيّل؟', en: 'When should I choose Takhayal?' },
        answer: {
          ar: 'اختر تخيّل عندما تحتاج أدوات صور ونماذج وقوالب موجهة للفرق العربية في الكويت والخليج.',
          en: 'Choose Takhayal when you need image tools, models, and templates built for Arabic teams in Kuwait and the GCC.',
        },
      },
    ],
  },
  'canva-ai-alternative': {
    slug: 'canva-ai-alternative',
    title: {
      ar: 'بديل Canva AI للصور والقوالب العربية | Takhayal.ai',
      en: 'Canva AI alternative for Arabic images and templates | Takhayal.ai',
    },
    description: {
      ar: 'قارن بين Canva AI وتخيّل من حيث استخدام الصور والقوالب وسير العمل للعلامات العربية.',
      en: 'Compare Canva AI and Takhayal for image, template, and workflow needs for Arabic brands.',
    },
    eyebrow: { ar: 'بدائل ومقارنات', en: 'Alternatives and comparisons' },
    h1: { ar: 'بديل Canva AI للصور والقوالب العربية', en: 'Canva AI alternative for Arabic images and templates' },
    directAnswer: {
      ar: 'إذا كان هدفك تحرير تصميمات كثيرة، قد يكون Canva مناسباً. إذا كان هدفك إنتاج صور وأصول AI عربية أولاً مع أدوات ونماذج وقوالب مركزة، فإن تخيّل يوفر مساراً أكثر تخصصاً لهذا النوع من العمل.',
      en: 'If your goal is broad design editing, Canva may fit well. If your goal is Arabic-first AI image and asset production with focused tools, models, and templates, Takhayal provides a more specialized path.',
    },
    tableHeadings: {
      ar: ['السؤال', 'Canva AI', 'تخيّل'],
      en: ['Question', 'Canva AI', 'Takhayal'],
    },
    tableRows: [
      {
        ar: ['هل أحتاج محرر تصميم عام؟', 'نعم، قوي لهذا الاستخدام', 'ليس التركيز الأساسي'],
        en: ['Do I need a general design editor?', 'Yes, strong for this use', 'Not the primary focus'],
      },
      {
        ar: ['هل أحتاج صور AI عربية أولاً؟', 'قد يعمل حسب الاستخدام', 'هذا هو مجال التركيز'],
        en: ['Do I need Arabic-first AI images?', 'May work depending on use', 'This is the focus area'],
      },
      {
        ar: ['هل أحتاج مقارنة نماذج؟', 'ليست نقطة التركيز الأساسية', 'دليل النماذج جزء من التجربة'],
        en: ['Do I need model comparison?', 'Not the main focus', 'Model guidance is part of the experience'],
      },
    ],
    useCases: {
      ar: ['فرق تستخدم Canva وتريد مسار صور AI متخصص', 'علامات عربية تحتاج قوالب وصور لحملات سريعة', 'مسوقون يريدون مقارنة الأدوات قبل الاشتراك'],
      en: ['Teams using Canva that need a focused AI image path', 'Arabic brands needing templates and visuals for fast campaigns', 'Marketers comparing tools before subscribing'],
    },
    limitations: {
      ar: ['لا يقدم تخيّل نفس نطاق أدوات التصميم العامة في Canva', 'ليست كل مهام التصميم مناسبة لأداة AI واحدة', 'يجب مراجعة النتائج قبل استخدامها تجارياً'],
      en: ['Takhayal does not offer the same breadth of general design tools as Canva', 'Not every design task belongs in one AI tool', 'Outputs should be reviewed before commercial use'],
    },
    faqs: [
      {
        question: { ar: 'هل يمكن استخدام تخيّل مع Canva؟', en: 'Can Takhayal be used with Canva?' },
        answer: {
          ar: 'نعم. يمكن استخدام تخيّل لإنتاج الصور والأصول ثم استخدامها داخل Canva أو أي أداة تصميم أخرى.',
          en: 'Yes. You can use Takhayal to produce images and assets, then use them in Canva or another design tool.',
        },
      },
      {
        question: { ar: 'ما الفرق الرئيسي؟', en: 'What is the main difference?' },
        answer: {
          ar: 'الفرق الرئيسي أن Canva منصة تصميم عامة، بينما تخيّل يركز على مسارات صور وقوالب ونماذج AI عربية أولاً.',
          en: 'The main difference is that Canva is a broad design platform, while Takhayal focuses on Arabic-first AI image, template, and model workflows.',
        },
      },
    ],
  },
  'midjourney-alternative-arabic-brands': {
    slug: 'midjourney-alternative-arabic-brands',
    title: {
      ar: 'بديل Midjourney للعلامات العربية | Takhayal.ai',
      en: 'Midjourney alternative for Arabic brands | Takhayal.ai',
    },
    description: {
      ar: 'مقارنة عملية بين Midjourney وتخيّل للعلامات العربية التي تحتاج إنتاج صور وقوالب وسير عمل واضح.',
      en: 'A practical comparison of Midjourney and Takhayal for Arabic brands that need image production, templates, and a clear workflow.',
    },
    eyebrow: { ar: 'مقارنة مولدات الصور', en: 'Image generator comparison' },
    h1: { ar: 'بديل Midjourney للعلامات العربية', en: 'Midjourney alternative for Arabic brands' },
    directAnswer: {
      ar: 'Midjourney مولد صور قوي ومناسب للاستكشاف البصري. تخيّل يركز على جعل إنتاج الصور أسهل للعلامات العربية عبر أدوات موجهة، قوالب، دليل نماذج، وتسعير بالأرصدة داخل تجربة عربية وإنجليزية.',
      en: 'Midjourney is a strong image generator for visual exploration. Takhayal focuses on making image production easier for Arabic brands through guided tools, templates, model guidance, and credit-based pricing in Arabic and English.',
    },
    tableHeadings: {
      ar: ['عامل المقارنة', 'Midjourney', 'تخيّل'],
      en: ['Comparison factor', 'Midjourney', 'Takhayal'],
    },
    tableRows: [
      {
        ar: ['نمط الاستخدام', 'استكشاف وتوليد بالطلبات', 'أدوات وقوالب ونماذج ضمن واجهة واحدة'],
        en: ['Usage style', 'Prompt-based exploration and generation', 'Tools, templates, and models in one interface'],
      },
      {
        ar: ['مناسب لـ', 'اتجاهات بصرية وتجارب فنية', 'حملات وصور منتجات ومهام إبداعية متكررة'],
        en: ['Best for', 'Visual directions and artistic exploration', 'Campaigns, product visuals, and recurring creative tasks'],
      },
      {
        ar: ['اللغة والسياق', 'عام وعالمي', 'عربي أولاً للكويت والخليج'],
        en: ['Language and context', 'General and global', 'Arabic-first for Kuwait and the GCC'],
      },
    ],
    useCases: {
      ar: ['فرق تبحث عن بديل أكثر توجيهاً من الطلب الحر', 'علامات تحتاج قوالب وأدوات بجانب التوليد', 'مقارنة نماذج قبل اختيار مسار الإنتاج'],
      en: ['Teams looking for a more guided alternative to free-form prompting', 'Brands needing templates and tools alongside generation', 'Comparing models before choosing a production path'],
    },
    limitations: {
      ar: ['Midjourney قد يكون أفضل لبعض التجارب الفنية الحرة', 'تخيّل يركز أكثر على سير العمل والإنتاج العملي', 'لا توجد أداة واحدة مثالية لكل أنواع الصور'],
      en: ['Midjourney may be better for some open-ended artistic exploration', 'Takhayal focuses more on workflow and practical production', 'No single tool is best for every image type'],
    },
    faqs: [
      {
        question: { ar: 'هل تخيّل أفضل من Midjourney؟', en: 'Is Takhayal better than Midjourney?' },
        answer: {
          ar: 'الأفضلية تعتمد على الاستخدام. Midjourney قوي للاستكشاف الفني، بينما تخيّل مناسب عندما تحتاج علامة عربية إلى أدوات وقوالب وسير عمل واضح.',
          en: 'It depends on the use case. Midjourney is strong for artistic exploration, while Takhayal fits Arabic brands that need tools, templates, and a clearer workflow.',
        },
      },
      {
        question: { ar: 'هل يمكن استخدام الاثنين معاً؟', en: 'Can both tools be used together?' },
        answer: {
          ar: 'نعم. قد تستخدم Midjourney للاستكشاف، وتستخدم تخيّل لمسارات إنتاج أكثر تنظيماً داخل تجربة عربية أولاً.',
          en: 'Yes. You may use Midjourney for exploration and Takhayal for more structured production paths in an Arabic-first experience.',
        },
      },
    ],
  },
};

export const seoLandingPageSlugs = Object.keys(seoLandingPages) as SeoLandingPageKey[];
