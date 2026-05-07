export const SEO_LAST_UPDATED = '2026-04-24';

export interface SeoFaqItem {
  question: string;
  answer: string;
}

export interface SeoTableData {
  columns: string[];
  rows: string[][];
}

export const HOME_SEO_CONTENT = {
  en: {
    answerTitle: 'What is Takhayal.ai?',
    answer:
      'Takhayal.ai is an Arabic-first AI creative studio for Kuwait and the Gulf. It helps brands and creators generate images, edit product shots, explore templates, and compare creative models in one workflow.',
    sections: [
      {
        title: 'Why Gulf creators use Takhayal',
        items: [
          'Arabic-first prompts and creative workflows',
          'Templates built for ads, products, food, beauty, and seasonal campaigns',
          'Image tools, model discovery, and production-ready outputs in one platform',
        ],
      },
      {
        title: 'Best for',
        items: [
          'Arabic-first social and ad creative',
          'Product, skincare, perfume, and food campaigns',
          'Fast visual ideation for Kuwait and GCC businesses',
        ],
      },
    ],
  },
  ar: {
    answerTitle: 'ما تخيّل؟',
    answer:
      'تخيّل استوديو ذكاء اصطناعي عربي أولاً، مخصَّص للكويت والخليج. يساعد العلامات والمبدعين على إنشاء الصور، تعديل صور المنتجات، استكشاف القوالب، ومقارنة النماذج الإبداعية — في منصة واحدة.',
    sections: [
      {
        title: 'لماذا يستخدم مبدعو الخليج تخيّل',
        items: [
          'برومبتات وسير عمل عربي أولاً',
          'قوالب جاهزة للإعلانات والمنتجات والطعام والجمال والمواسم',
          'أدوات الصور ودليل النماذج ونتائج جاهزة للنشر في مكان واحد',
        ],
      },
      {
        title: 'الأفضل لـ',
        items: [
          'الإعلانات والمحتوى العربي أولاً',
          'حملات المنتجات والعطور والعناية والطعام',
          'تجهيز أفكار بصرية سريعة للشركات في الكويت والخليج',
        ],
      },
    ],
  },
};

export const PRICING_SEO_CONTENT = {
  en: {
    answerTitle: 'How much does Takhayal cost?',
    answer:
      'Takhayal uses transparent credits for AI image and creative workflows. You can start free, upgrade to monthly or annual plans, and see the generation cost before you run a model or tool.',
    comparison: {
      columns: ['What you compare', 'Why it matters'],
      rows: [
        ['Free vs paid plans', 'Helps teams choose between trial usage and production workflows'],
        ['Credits per plan', 'Shows how far each plan goes for ongoing campaign work'],
        ['Top-up flexibility', 'Lets brands add capacity without changing the full plan'],
      ],
    },
    faqs: [
      {
        question: 'What is a Takhayal credit?',
        answer:
          'A credit is the unit used to pay for image generation and related AI creative actions. Different tools and models consume different amounts.',
      },
      {
        question: 'Can I start without a credit card?',
        answer:
          'Yes. The free starting tier is designed to help new users try the platform before committing to a paid workflow.',
      },
      {
        question: 'Can I upgrade later?',
        answer:
          'Yes. The pricing flow is built so creators and teams can start small, then move to a higher plan when they need more volume.',
      },
    ],
  },
  ar: {
    answerTitle: 'كم تكلفة تخيّل؟',
    answer:
      'يعمل تخيّل بنظام أرصدة واضح لاستخدام أدوات الصور والمهام الإبداعية بالذكاء الاصطناعي. ابدأ مجاناً، ثم ارتقِ إلى خطة شهرية أو سنوية، مع معرفة تكلفة الإنشاء قبل التنفيذ.',
    comparison: {
      columns: ['ما تقارنه', 'لماذا يهم'],
      rows: [
        ['الخطة المجانية مقابل المدفوعة', 'لمعرفة الفرق بين التجربة الأولى والاستخدام الإنتاجي'],
        ['عدد الأرصدة في كل خطة', 'لفهم حجم العمل الذي تغطيه كل باقة'],
        ['مرونة شحن الأرصدة', 'لزيادة السعة عند الحاجة، بدون تغيير الخطة'],
      ],
    },
    faqs: [
      {
        question: 'ما الرصيد في تخيّل؟',
        answer:
          'الرصيد وحدة الاستخدام التي تُخصم عند تشغيل أدوات الصور أو تنفيذ المهام الإبداعية. يختلف الاستهلاك حسب الأداة أو النموذج.',
      },
      {
        question: 'هل يمكن البدء بدون بطاقة؟',
        answer:
          'نعم. البداية المجانية مصمَّمة لتجربة المنصة قبل الانتقال إلى باقة مدفوعة.',
      },
      {
        question: 'هل يمكنني الترقية لاحقاً؟',
        answer:
          'نعم. ابدأ بخطة صغيرة، ثم انتقل إلى خطة أعلى حين تحتاج إلى حجم استخدام أكبر.',
      },
    ],
  },
};

export const TOOLS_DIRECTORY_SEO_CONTENT = {
  en: {
    answerTitle: 'What tools does Takhayal offer?',
    answer:
      'Takhayal offers Arabic-first AI image tools for generation, upscaling, logo creation, background removal, image editing, and photo restoration. Each tool is designed to solve a specific creative production task.',
    comparison: {
      columns: ['Tool type', 'Best used for'],
      rows: [
        ['Generate Image', 'Turning prompts into campaign-ready visuals'],
        ['Edit and enhance tools', 'Improving existing product, portrait, and marketing assets'],
        ['Restoration and cleanup tools', 'Old photos, transparent backgrounds, and quality recovery'],
      ],
    },
  },
  ar: {
    answerTitle: 'ما أدوات تخيّل؟',
    answer:
      'يوفر تخيّل أدوات صور بالذكاء الاصطناعي، عربية أولاً: إنشاء الصور، تحسين الدقة، إنشاء الشعارات، إزالة الخلفية، تعديل الصور، وترميم الصور القديمة. كل أداة مصمَّمة لحل مهمة إنتاجية محدَّدة.',
    comparison: {
      columns: ['نوع الأداة', 'أفضل استخدام لها'],
      rows: [
        ['إنشاء الصور', 'تحويل البرومبتات إلى صور جاهزة للحملات'],
        ['أدوات التعديل والتحسين', 'رفع جودة صور المنتجات والبورتريه والمواد التسويقية'],
        ['أدوات الترميم والتنظيف', 'الصور القديمة والخلفيات الشفافة واستعادة الجودة'],
      ],
    },
  },
};

export const MODELS_DIRECTORY_SEO_CONTENT = {
  en: {
    answerTitle: 'How do Takhayal models differ?',
    answer:
      'The Takhayal model directory helps users compare image and video engines by speed, quality, best use case, and creative style. It is designed to help brands choose the right model before they start generating.',
    comparison: {
      columns: ['Comparison point', 'How to use it'],
      rows: [
        ['Speed', 'Choose faster models for iteration and testing'],
        ['Quality', 'Choose premium models for polished client-facing assets'],
        ['Best for', 'Match the model to portraits, products, typography, or cinematic scenes'],
      ],
    },
  },
  ar: {
    answerTitle: 'كيف تختلف نماذج تخيّل؟',
    answer:
      'يساعد دليل النماذج في تخيّل على مقارنة محركات الصور والفيديو حسب السرعة، والجودة، وأفضل استخدام، والأسلوب الإبداعي. الهدف: اختيار النموذج الأنسب قبل بدء الإنشاء.',
    comparison: {
      columns: ['عنصر المقارنة', 'كيف تستخدمه'],
      rows: [
        ['السرعة', 'اختر النماذج الأسرع للتجربة والتكرار السريع'],
        ['الجودة', 'اختر النماذج الاحترافية للأعمال النهائية والعملاء'],
        ['الأفضل لـ', 'طابق النموذج مع المنتجات أو الأشخاص أو النصوص أو المشاهد السينمائية'],
      ],
    },
  },
};

export const TEMPLATES_SEO_CONTENT = {
  en: {
    answerTitle: 'What are Takhayal templates used for?',
    answer:
      'Takhayal templates are reusable creative starting points for product ads, beauty campaigns, food visuals, and branded social content. They help teams move from reference image to polished output faster.',
  },
  ar: {
    answerTitle: 'ما استخدام قوالب تخيّل؟',
    answer:
      'قوالب تخيّل نقاط انطلاق جاهزة للإعلانات، وحملات الجمال، ومحتوى الطعام، والمواد الاجتماعية للعلامات التجارية. تساعد الفرق على الانتقال من الصورة المرجعية إلى نتيجة قوية، أسرع.',
  },
};

export const CREATE_SEO_CONTENT = {
  en: {
    answerTitle: 'How does the Takhayal create hub work?',
    answer:
      'The create hub is the fastest way to start AI image or video production inside Takhayal. It routes users into the right generation flow based on whether they need a fresh image, a specific tool, or a video model.',
  },
  ar: {
    answerTitle: 'كيف يعمل مركز الإنشاء في تخيّل؟',
    answer:
      'مركز الإنشاء أسرع طريقة لبدء إنتاج الصور أو الفيديو بالذكاء الاصطناعي داخل تخيّل. يوجّه المستخدم إلى المسار المناسب، سواء أراد إنشاء صورة جديدة، أو استخدام أداة معيَّنة، أو إنشاء فيديو.',
  },
};

export function buildToolSeoContent(tool: {
  name: string;
  description: string;
  shortDesc: string;
  creditCost: number;
}, isAr: boolean) {
  if (isAr) {
    return {
      answerTitle: `ما أداة ${tool.name}؟`,
      answer: `${tool.name} أداة داخل تخيّل تساعدك على ${tool.shortDesc || tool.description}. مصمَّمة للمبدعين والعلامات التي تحتاج نتائج أسرع وأكثر وضوحاً في سير العمل الإبداعي.`,
      useCasesTitle: 'أفضل استخدامات هذه الأداة',
      useCases: [
        `إنجاز مهام ${tool.name} بسرعة داخل المنصة نفسها`,
        'تجهيز مواد تسويقية أو صور منتجات أو أصول اجتماعية',
        `تشغيل المهمة مع معرفة تكلفة الاستخدام التي تبدأ من ${tool.creditCost} رصيد`,
      ],
      factsTitle: 'لماذا تختارها',
      facts: [
        'تجربة عربية أولاً',
        'مسار واضح من الإدخال إلى النتيجة',
        'تكلفة استخدام معروضة قبل التنفيذ',
      ],
    };
  }

  return {
    answerTitle: `What is the ${tool.name} tool?`,
    answer: `${tool.name} is a focused Takhayal workflow for ${tool.shortDesc || tool.description}. It is built for brands and creators who want a faster way to complete a specific creative task without switching platforms.`,
    useCasesTitle: 'Best use cases',
    useCases: [
      `Running ${tool.name} tasks inside one creative workflow`,
      'Preparing campaign, product, and social-ready visual assets',
      `Using a transparent cost model starting from ${tool.creditCost} credits`,
    ],
    factsTitle: 'Why teams choose it',
    facts: [
      'Arabic-first workflow design',
      'Clear task-specific interface',
      'Known credit cost before execution',
    ],
  };
}

export function buildModelSeoContent(guide: {
  name_en: string;
  name_ar: string;
  short_description_en: string;
  short_description_ar: string;
  best_for_line_en: string;
  best_for_line_ar: string;
  speed: string;
  quality: string;
}, isAr: boolean) {
  const name = isAr ? guide.name_ar || guide.name_en : guide.name_en;
  const description = isAr ? guide.short_description_ar || guide.short_description_en : guide.short_description_en;
  const bestFor = isAr ? guide.best_for_line_ar || guide.best_for_line_en : guide.best_for_line_en;

  if (isAr) {
    return {
      answerTitle: `ما نموذج ${name}؟`,
      answer: `${name} نموذج داخل تخيّل يركّز على ${bestFor}. ${description}`,
      comparison: {
        columns: ['العامل', 'القيمة'],
        rows: [
          ['السرعة', guide.speed],
          ['الجودة', guide.quality],
          ['الأفضل لـ', bestFor],
        ],
      },
    };
  }

  return {
    answerTitle: `What is ${name}?`,
    answer: `${name} is a Takhayal model focused on ${bestFor}. ${description}`,
    comparison: {
      columns: ['Factor', 'Value'],
      rows: [
        ['Speed', guide.speed],
        ['Quality', guide.quality],
        ['Best for', bestFor],
      ],
    },
  };
}

export function buildTemplateSeoContent(template: {
  title_en: string;
  title_ar: string;
  category: string;
  ratio: string;
}, isAr: boolean) {
  const title = isAr ? template.title_ar || template.title_en : template.title_en;
  if (isAr) {
    return {
      answerTitle: `ما قالب ${title}؟`,
      answer: `${title} قالب جاهز داخل تخيّل لمساعدتك على إنتاج محتوى بصري أسرع، ضمن فئة ${template.category} وبنسبة ${template.ratio}.`,
      checklistTitle: 'لماذا يفيدك هذا القالب',
      checklist: [
        'يقلِّل وقت البدء من الصفر',
        'يعطيك اتجاهاً بصرياً واضحاً للحملة أو المنتج',
        `يحافظ على نسبة مناسبة مثل ${template.ratio}`,
      ],
    };
  }

  return {
    answerTitle: `What is the ${title} template?`,
    answer: `${title} is a reusable Takhayal template for faster ${template.category.toLowerCase()} creative production with a ${template.ratio} composition.`,
    checklistTitle: 'Why this template helps',
    checklist: [
      'Reduces blank-page starting time',
      'Gives teams a clear visual direction',
      `Keeps the output aligned to a ${template.ratio} ratio`,
    ],
  };
}
