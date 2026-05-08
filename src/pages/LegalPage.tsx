import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { LogoMark } from '@/components/Logo';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { PageSeo } from '@/components/seo/PageSeo';
import { stripLocalePrefix, localizePath } from '@/lib/localized-routes';
import { sanitizeLegalPolicyHtml } from '@/lib/cms';

const TITLES: Record<string, { en: string; ar: string }> = {
  terms: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
  privacy: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
  refund: { en: 'Refund Policy', ar: 'سياسة الاسترجاع' },
};

const PRIVACY_POLICY_CONTENT = {
  en: `
    <h2>Privacy Policy - Takhayal.ai</h2>
    <p><strong>Effective date:</strong> May 2026<br /><strong>Last updated:</strong> May 4, 2026<br /><strong>Platform name:</strong> Takhayal.ai<br /><strong>Website:</strong> <a href="https://takhayal.ai">https://takhayal.ai</a><br /><strong>Support email:</strong> <a href="mailto:support@takhayal.ai">support@takhayal.ai</a></p>

    <h2>1. Information We Collect</h2>
    <p>When you create an account or use Takhayal.ai, we may collect the following types of information:</p>
    <p><strong>Account information</strong></p>
    <ul>
      <li>Name</li>
      <li>Email address</li>
      <li>Login information when using Google sign-in</li>
    </ul>
    <p><strong>User content</strong></p>
    <ul>
      <li>Text prompts or instructions entered into AI tools</li>
      <li>Images uploaded by the user</li>
      <li>Images, videos, or creative content generated through the platform</li>
      <li>Templates, settings, ratios, model choices, and generation preferences used to process a request</li>
    </ul>
    <p><strong>Billing and subscription information</strong></p>
    <ul>
      <li>Plan, credit package, order, and payment status</li>
      <li>Billing country, city, and transaction references</li>
      <li>We do not collect or store card details inside the app. Card and wallet payments are handled by secure external payment gateways when checkout is available.</li>
    </ul>
    <p><strong>Technical and usage data</strong></p>
    <ul>
      <li>Device type</li>
      <li>Browser type</li>
      <li>IP address</li>
      <li>Session activity</li>
      <li>Platform usage logs and interactions</li>
    </ul>
    <p>This information is collected to operate the platform and provide AI creative services to users.</p>

    <h2>2. How We Use Your Data</h2>
    <p>We use the data we collect for the following purposes:</p>
    <ul>
      <li>Operating and managing Takhayal.ai</li>
      <li>Creating and securing user accounts</li>
      <li>Processing AI image, video, and creative generation requests</li>
      <li>Saving generated content, uploaded inputs, and generation history inside the user account</li>
      <li>Managing credits, plans, billing, and subscription access</li>
      <li>Responding to support requests</li>
      <li>Improving the user experience, product quality, and platform performance</li>
      <li>Monitoring security, preventing abuse, and enforcing platform rules</li>
      <li>Complying with legal, financial, accounting, and regulatory requirements</li>
    </ul>

    <h2>3. Sharing Data With Third Parties</h2>
    <p>Takhayal.ai relies on third-party service providers to operate parts of the platform. These may include:</p>
    <ul>
      <li>Cloud infrastructure, database, authentication, and storage providers</li>
      <li>AI model and AI infrastructure providers</li>
      <li>Payment processors and hosted checkout providers for subscriptions and credit purchases</li>
      <li>Analytics, performance monitoring, and tracking providers</li>
      <li>Support, communication, and operational service providers</li>
    </ul>
    <p>We do not sell user data to advertising companies. Service providers are expected to process data securely and use it only to provide the services requested by Takhayal.ai.</p>

    <h2>4. AI Service Data Processing</h2>
    <p>Takhayal.ai provides creative AI tools for generating and editing images, videos, and other visual content. These tools may rely on external AI infrastructure to process user requests.</p>
    <p>When you use AI tools on the platform, some user inputs may be sent to AI service providers to generate the requested output. This may include:</p>
    <ul>
      <li>Text prompts or instructions written by the user</li>
      <li>Images uploaded by the user</li>
      <li>Generation settings needed to process the request, such as model, quality, ratio, resolution, and tool options</li>
    </ul>
    <p>This data is sent only for the purpose of executing the user request and producing the requested result.</p>
    <p>AI infrastructure and model providers used or supported by Takhayal.ai may include:</p>
    <ul>
      <li>Fal.ai</li>
      <li>OpenAI image models and related API infrastructure</li>
      <li>Google Imagen and related AI infrastructure</li>
      <li>Replicate</li>
      <li>Stability AI</li>
      <li>Other model or infrastructure providers used to run specific image or video models, including models such as Flux, Ideogram, Recraft, Qwen, Seedream, Kling, and similar creative AI systems</li>
    </ul>
    <p>Takhayal.ai supports multiple AI tools and models. The available tools can be viewed at <a href="https://takhayal.ai/tools">https://takhayal.ai/tools</a>, and available models may be viewed at <a href="https://takhayal.ai/models">https://takhayal.ai/models</a>.</p>
    <p>By using the AI tools on the platform, the user acknowledges and agrees that this data may be processed to execute generation requests.</p>

    <h2>5. Analytics and Tracking Technologies</h2>
    <p>Takhayal.ai may use analytics and tracking tools to understand how the platform is used and improve its performance. These tools may collect technical information such as:</p>
    <ul>
      <li>Device type</li>
      <li>Browser information</li>
      <li>IP address</li>
      <li>Session activity</li>
      <li>User interactions with the platform</li>
    </ul>
    <p>Analytics and tracking services, when enabled, may include:</p>
    <ul>
      <li>Google Analytics</li>
      <li>Google Tag Manager</li>
      <li>Meta Platforms Pixel</li>
      <li>Microsoft Clarity</li>
      <li>Stape server-side tracking infrastructure</li>
    </ul>
    <p>These services may use cookies or similar technologies to analyze usage and improve platform performance. Data is processed according to each provider's privacy policy.</p>

    <h2>6. Google Sign-In</h2>
    <p>Takhayal.ai allows users to sign in securely using a Google account. When using Google sign-in, we may access:</p>
    <ul>
      <li>Name</li>
      <li>Email address</li>
    </ul>
    <p>We do not access:</p>
    <ul>
      <li>Gmail messages</li>
      <li>Google Drive files</li>
      <li>Google account activity</li>
    </ul>
    <p>Google sign-in is used only to simplify account creation and login.</p>

    <h2>7. Cookies</h2>
    <p>The platform uses cookies and similar technologies to:</p>
    <ul>
      <li>Keep users signed in</li>
      <li>Remember user preferences</li>
      <li>Analyze platform usage</li>
      <li>Improve technical performance</li>
      <li>Measure the effectiveness of marketing campaigns</li>
    </ul>
    <p>Users can control or disable cookies through browser settings.</p>

    <h2>8. Data Security</h2>
    <p>We follow industry-standard security practices to protect user data, including:</p>
    <ul>
      <li>SSL/TLS encryption during data transmission</li>
      <li>Secure authentication systems</li>
      <li>Restricted access to server and admin systems</li>
      <li>Ongoing infrastructure monitoring</li>
    </ul>

    <h2>9. Account and Data Deletion</h2>
    <p>Users may request deletion of their account and associated data by contacting <a href="mailto:support@takhayal.ai">support@takhayal.ai</a>.</p>
    <p>Verified deletion requests will be processed within 7 business days, unless certain data must be retained for legal, accounting, security, or regulatory reasons.</p>

    <h2>10. Data Breach Reporting</h2>
    <p>If a security incident affects user data, Takhayal.ai will:</p>
    <ul>
      <li>Notify affected users as soon as reasonably possible</li>
      <li>Investigate the incident and take appropriate action</li>
      <li>Strengthen security measures to help prevent recurrence</li>
    </ul>

    <h2>11. Children's Privacy</h2>
    <p>Takhayal.ai is not directed to individuals under 16 years old. We do not knowingly collect personal data from minors. If we become aware that a minor has used the platform, the related data will be deleted when reported.</p>

    <h2>12. International Data Transfers</h2>
    <p>Takhayal.ai relies on global cloud infrastructure. User data may be stored or processed in multiple countries depending on the infrastructure and service providers used. By using the platform, the user agrees to the transfer and storage of data according to this policy.</p>

    <h2>13. AI Transparency</h2>
    <p>Takhayal.ai provides AI-powered tools to create images, videos, and creative content. Users should understand that:</p>
    <ul>
      <li>Outputs are generated automatically by machine learning models</li>
      <li>Results may vary or contain unintended errors</li>
      <li>The user is responsible for reviewing generated content before using it</li>
    </ul>
    <p>Inputs such as prompts or images may be processed through AI infrastructure providers only to complete the requested generation. Takhayal.ai does not use user inputs for advertising purposes.</p>

    <h2>14. Contact Us</h2>
    <p>For privacy questions, access requests, or data deletion requests, contact us at <a href="mailto:support@takhayal.ai">support@takhayal.ai</a>.</p>
  `,
  ar: `
    <h2>سياسة الخصوصية – تخيّل</h2>
    <p><strong>تاريخ السريان:</strong> مايو 2026<br /><strong>آخر تحديث:</strong> 4 مايو 2026<br /><strong>اسم المنصة:</strong> تخيّل / Takhayal.ai<br /><strong>الموقع الإلكتروني:</strong> <a href="https://takhayal.ai">https://takhayal.ai</a><br /><strong>بريد الدعم:</strong> <a href="mailto:support@takhayal.ai">support@takhayal.ai</a></p>

    <h2>1. المعلومات التي نجمعها</h2>
    <p>عند إنشاء حساب أو استخدام منصة تخيّل، قد نقوم بجمع الأنواع التالية من المعلومات:</p>
    <p><strong>معلومات الحساب</strong></p>
    <ul>
      <li>الاسم</li>
      <li>البريد الإلكتروني</li>
      <li>معلومات تسجيل الدخول عند استخدام تسجيل الدخول عبر Google</li>
    </ul>
    <p><strong>محتوى المستخدم</strong></p>
    <ul>
      <li>النصوص أو الأوامر التي يدخلها المستخدم في أدوات الذكاء الاصطناعي</li>
      <li>الصور التي يقوم المستخدم برفعها</li>
      <li>الصور أو الفيديوهات أو المحتوى الإبداعي الذي يتم توليده عبر المنصة</li>
      <li>القوالب والإعدادات والنسب وخيارات النماذج وتفضيلات التوليد اللازمة لمعالجة الطلب</li>
    </ul>
    <p><strong>بيانات الفوترة والاشتراك</strong></p>
    <ul>
      <li>الخطة أو باقة الأرصدة وحالة الطلب أو الدفع</li>
      <li>الدولة والمدينة ومرجع المعاملة عند الحاجة للفوترة</li>
      <li>لا نقوم بجمع أو تخزين بيانات البطاقات داخل التطبيق. تتم معالجة بيانات البطاقات والمحافظ عبر بوابات دفع خارجية آمنة عند توفر الدفع.</li>
    </ul>
    <p><strong>المعلومات التقنية وبيانات الاستخدام</strong></p>
    <ul>
      <li>نوع الجهاز</li>
      <li>نوع المتصفح</li>
      <li>عنوان IP</li>
      <li>نشاط الجلسة</li>
      <li>سجلات استخدام المنصة والتفاعل معها</li>
    </ul>
    <p>يتم جمع هذه المعلومات من أجل تشغيل المنصة وتوفير خدمات الذكاء الاصطناعي الإبداعية للمستخدمين.</p>

    <h2>2. كيفية استخدام بياناتك</h2>
    <p>نستخدم البيانات التي نجمعها للأغراض التالية:</p>
    <ul>
      <li>تشغيل وإدارة منصة تخيّل</li>
      <li>إنشاء حسابات المستخدمين وحمايتها</li>
      <li>معالجة طلبات إنشاء الصور والفيديو والمحتوى الإبداعي باستخدام الذكاء الاصطناعي</li>
      <li>حفظ المحتوى المولد والمدخلات المرفوعة وسجل التوليد ضمن حساب المستخدم</li>
      <li>إدارة الأرصدة والخطط والفوترة والوصول إلى الاشتراكات</li>
      <li>الرد على استفسارات الدعم الفني</li>
      <li>تحسين تجربة المستخدم وجودة المنتج وأداء المنصة</li>
      <li>مراقبة الأمان ومنع إساءة الاستخدام وتطبيق قواعد المنصة</li>
      <li>الامتثال للمتطلبات القانونية والمالية والمحاسبية والتنظيمية</li>
    </ul>

    <h2>3. مشاركة البيانات مع أطراف ثالثة</h2>
    <p>تعتمد منصة تخيّل على مزودي خدمات من أطراف ثالثة لتشغيل بعض أجزاء المنصة. وقد يشمل ذلك:</p>
    <ul>
      <li>مزودي البنية التحتية السحابية وقواعد البيانات والمصادقة والتخزين</li>
      <li>مزودي نماذج الذكاء الاصطناعي والبنية التحتية للذكاء الاصطناعي</li>
      <li>معالجي الدفع وبوابات الدفع المستضافة لإدارة الاشتراكات وشراء الأرصدة</li>
      <li>مزودي التحليلات ومراقبة الأداء وتقنيات التتبع</li>
      <li>مزودي الدعم والتواصل والخدمات التشغيلية</li>
    </ul>
    <p>نحن لا نقوم ببيع بيانات المستخدمين لأي جهات إعلانية. ويلتزم مزودو الخدمات بمعالجة البيانات بشكل آمن واستخدامها فقط لتقديم الخدمات المطلوبة من تخيّل.</p>

    <h2>4. معالجة البيانات عبر خدمات الذكاء الاصطناعي</h2>
    <p>توفر منصة تخيّل أدوات إبداعية تعمل بالذكاء الاصطناعي لإنشاء الصور والفيديو وتعديل المحتوى البصري، وقد تعتمد هذه الأدوات على بنية تحتية خارجية لمعالجة الطلبات.</p>
    <p>عند استخدام أدوات الذكاء الاصطناعي في المنصة، قد يتم إرسال بعض مدخلات المستخدم إلى مزودي خدمات الذكاء الاصطناعي من أجل توليد النتائج المطلوبة. وقد تشمل هذه البيانات:</p>
    <ul>
      <li>النصوص أو الأوامر التي يكتبها المستخدم</li>
      <li>الصور التي يرفعها المستخدم</li>
      <li>إعدادات التوليد اللازمة لمعالجة الطلب، مثل النموذج والجودة والنسبة والدقة وخيارات الأداة</li>
    </ul>
    <p>يتم إرسال هذه البيانات فقط لغرض تنفيذ طلب المستخدم وتوليد النتيجة المطلوبة.</p>
    <p>قد تشمل مزودي البنية التحتية والنماذج المستخدمين أو المدعومين في تخيّل:</p>
    <ul>
      <li>Fal.ai</li>
      <li>نماذج الصور من OpenAI والبنية المرتبطة بها</li>
      <li>Google Imagen والبنية المرتبطة بخدمات الذكاء الاصطناعي</li>
      <li>Replicate</li>
      <li>Stability AI</li>
      <li>مزودي نماذج أو بنية تحتية آخرين لتشغيل نماذج صور أو فيديو محددة، بما في ذلك نماذج مثل Flux وIdeogram وRecraft وQwen وSeedream وKling وأنظمة ذكاء اصطناعي إبداعية مشابهة</li>
    </ul>
    <p>تدعم منصة تخيّل عدة أدوات ونماذج ذكاء اصطناعي. يمكن الاطلاع على الأدوات المتاحة هنا: <a href="https://takhayal.ai/tools">https://takhayal.ai/tools</a>، كما يمكن الاطلاع على النماذج المتاحة هنا: <a href="https://takhayal.ai/models">https://takhayal.ai/models</a>.</p>
    <p>وباستخدام أدوات الذكاء الاصطناعي في المنصة، فإن المستخدم يقر ويوافق على معالجة هذه البيانات لتنفيذ طلبات التوليد.</p>

    <h2>5. التحليلات وتقنيات التتبع</h2>
    <p>قد تستخدم منصة تخيّل أدوات تحليل وتتبع لفهم كيفية استخدام المنصة وتحسين أدائها. وقد تقوم هذه الأدوات بجمع معلومات تقنية مثل:</p>
    <ul>
      <li>نوع الجهاز</li>
      <li>معلومات المتصفح</li>
      <li>عنوان IP</li>
      <li>نشاط الجلسة</li>
      <li>تفاعلات المستخدم مع المنصة</li>
    </ul>
    <p>وقد تشمل خدمات التحليل والتتبع المستخدمة عند تفعيلها:</p>
    <ul>
      <li>Google Analytics</li>
      <li>Google Tag Manager</li>
      <li>Meta Platforms Pixel</li>
      <li>Microsoft Clarity</li>
      <li>Stape للبنية التحتية للتتبع من جهة الخادم</li>
    </ul>
    <p>قد تستخدم هذه الخدمات ملفات تعريف الارتباط أو تقنيات مشابهة لتحليل الاستخدام وتحسين أداء المنصة. ويتم معالجة البيانات وفق سياسات الخصوصية الخاصة بكل مزود خدمة.</p>

    <h2>6. تسجيل الدخول عبر Google</h2>
    <p>تتيح منصة تخيّل تسجيل الدخول باستخدام حساب Google بشكل آمن. عند استخدام تسجيل الدخول عبر Google، قد نقوم بالوصول إلى:</p>
    <ul>
      <li>الاسم</li>
      <li>البريد الإلكتروني</li>
    </ul>
    <p>ولا نقوم بالوصول إلى:</p>
    <ul>
      <li>رسائل Gmail</li>
      <li>ملفات Google Drive</li>
      <li>نشاط حساب Google</li>
    </ul>
    <p>ويتم استخدام تسجيل الدخول عبر Google فقط لتسهيل عملية إنشاء الحساب وتسجيل الدخول.</p>

    <h2>7. ملفات تعريف الارتباط (Cookies)</h2>
    <p>تستخدم المنصة ملفات تعريف الارتباط وتقنيات مشابهة من أجل:</p>
    <ul>
      <li>إبقاء المستخدم مسجلاً للدخول</li>
      <li>تذكر تفضيلات المستخدم</li>
      <li>تحليل كيفية استخدام المنصة</li>
      <li>تحسين الأداء التقني للنظام</li>
      <li>قياس فعالية الحملات التسويقية</li>
    </ul>
    <p>يمكن للمستخدم التحكم في ملفات تعريف الارتباط أو تعطيلها من خلال إعدادات المتصفح.</p>

    <h2>8. أمان البيانات</h2>
    <p>نتبع إجراءات أمنية قياسية في الصناعة لحماية بيانات المستخدمين، بما في ذلك:</p>
    <ul>
      <li>تشفير SSL/TLS أثناء نقل البيانات</li>
      <li>أنظمة مصادقة آمنة</li>
      <li>تقييد الوصول إلى أنظمة الخوادم ولوحات الإدارة</li>
      <li>مراقبة البنية التحتية بشكل مستمر</li>
    </ul>

    <h2>9. حذف الحساب والبيانات</h2>
    <p>يمكن للمستخدم طلب حذف حسابه وجميع بياناته المرتبطة به عبر التواصل مع <a href="mailto:support@takhayal.ai">support@takhayal.ai</a>.</p>
    <p>وسيتم معالجة طلبات الحذف الموثقة خلال 7 أيام عمل، ما لم يكن الاحتفاظ ببعض البيانات مطلوباً لأسباب قانونية أو محاسبية أو أمنية أو تنظيمية.</p>

    <h2>10. الإبلاغ عن اختراق البيانات</h2>
    <p>في حال حدوث حادث أمني يؤثر على بيانات المستخدمين، ستقوم تخيّل بما يلي:</p>
    <ul>
      <li>إخطار المستخدمين المتأثرين في أقرب وقت ممكن</li>
      <li>التحقيق في الحادث واتخاذ الإجراءات المناسبة</li>
      <li>تعزيز إجراءات الأمان للمساعدة في منع تكرار الحادث</li>
    </ul>

    <h2>11. خصوصية الأطفال</h2>
    <p>خدمات تخيّل غير موجهة للأفراد دون سن 16 عاماً. ولا نقوم عن قصد بجمع بيانات شخصية من القصر. وفي حال اكتشاف استخدام قاصر للمنصة، سيتم حذف البيانات المرتبطة عند الإبلاغ.</p>

    <h2>12. نقل البيانات دولياً</h2>
    <p>تعتمد منصة تخيّل على بنية تحتية سحابية عالمية. وقد يتم تخزين أو معالجة بيانات المستخدمين في عدة دول حسب مزودي البنية التحتية والخدمات. وباستخدام المنصة، يوافق المستخدم على نقل وتخزين بياناته وفق هذه السياسة.</p>

    <h2>13. الشفافية في استخدام الذكاء الاصطناعي (AI Transparency)</h2>
    <p>تقدم منصة تخيّل أدوات تعمل بالذكاء الاصطناعي لإنشاء الصور والفيديو والمحتوى الإبداعي. ومن المهم معرفة ما يلي:</p>
    <ul>
      <li>يتم إنشاء النتائج بواسطة نماذج تعلم آلي بشكل آلي</li>
      <li>قد تختلف النتائج أو تحتوي على أخطاء غير مقصودة</li>
      <li>يتحمل المستخدم مسؤولية مراجعة المحتوى قبل استخدامه</li>
    </ul>
    <p>وقد تتم معالجة المدخلات مثل النصوص أو الصور عبر مزودي بنية تحتية للذكاء الاصطناعي فقط لتنفيذ طلب التوليد. ولا تستخدم تخيّل مدخلات المستخدمين لأغراض إعلانية.</p>

    <h2>14. التواصل معنا</h2>
    <p>لأي استفسارات تتعلق بالخصوصية أو طلبات الوصول أو حذف البيانات، يمكن التواصل معنا عبر <a href="mailto:support@takhayal.ai">support@takhayal.ai</a>.</p>
  `,
};

const FALLBACK_CONTENT: Record<string, { en: string; ar: string }> = {
  privacy: {
    en: PRIVACY_POLICY_CONTENT.en,
    ar: PRIVACY_POLICY_CONTENT.ar,
  },
  terms: {
    en: '<h2>Terms & Conditions</h2><p>By using Takhayal.ai, you agree to use the platform lawfully, respect third-party rights, and keep your account credentials secure.</p><h2>Generated Content</h2><p>You are responsible for prompts, uploaded assets, and how generated outputs are used. Availability, model behavior, and credit costs may vary by provider and feature.</p><h2>Payments</h2><p>Paid plans and credit purchases are handled through the checkout flow shown at purchase time.</p>',
    ar: '<h2>الشروط والأحكام</h2><p>باستخدام تخيّل، توافق على استخدام المنصة بشكل قانوني، واحترام حقوق الأطراف الأخرى، والحفاظ على بيانات حسابك آمنة.</p><h2>المحتوى المولّد</h2><p>أنت مسؤول عن التعليمات والأصول المرفوعة وكيفية استخدام النتائج المولدة. قد تختلف الإتاحة وسلوك النماذج وتكاليف الرصيد حسب المزود والميزة.</p><h2>المدفوعات</h2><p>تتم معالجة الخطط المدفوعة ومشتريات الرصيد من خلال مسار الدفع المعروض وقت الشراء.</p>',
  },
  refund: {
    en: '<h2>Refund Policy</h2><p>Refund eligibility depends on the purchase type, usage, and payment status. Contact support with your account email and payment reference for review.</p><h2>Credits</h2><p>Credits consumed by completed generation jobs are generally not refundable unless there is a verified platform or billing error.</p>',
    ar: '<h2>سياسة الاسترجاع</h2><p>تعتمد أهلية الاسترجاع على نوع الشراء والاستخدام وحالة الدفع. تواصل مع الدعم باستخدام بريد حسابك ومرجع الدفع للمراجعة.</p><h2>الأرصدة</h2><p>الأرصدة المستخدمة في مهام توليد مكتملة لا تكون قابلة للاسترجاع عادة إلا عند وجود خطأ مؤكد في المنصة أو الفوترة.</p>',
  },
};

export default function LegalPage() {
  const location = useLocation();
  const type = stripLocalePrefix(location.pathname).replace('/', '') || 'terms';
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [lastUpdatedIso, setLastUpdatedIso] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!type) return;
    setLoading(true);
    supabase
      .from('legal_policies')
      .select('*')
      .eq('type', type)
      .single()
      .then(({ data }) => {
        if (data) {
          const text = isAr && data.content_ar ? data.content_ar : data.content_en;
          setContent(sanitizeLegalPolicyHtml(text || FALLBACK_CONTENT[type]?.[isAr ? 'ar' : 'en'] || ''));
          setLastUpdatedIso(data.last_updated || '');
          setLastUpdated(formatDate(data.last_updated, isAr));
        } else {
          setContent(sanitizeLegalPolicyHtml(FALLBACK_CONTENT[type]?.[isAr ? 'ar' : 'en'] || ''));
        }
        setLoading(false);
      });
  }, [type, isAr]);

  const title = TITLES[type || ''] || TITLES.terms;
  const seoTitle = `${isAr ? title.ar : title.en} | Takhayal.ai`;
  const seoDescription = isAr
    ? `اقرأ ${title.ar} الخاصة بمنصة تخيّل.`
    : `Read the Takhayal.ai ${title.en.toLowerCase()}.`;

  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={`/${type || 'terms'}`}
        pageType="WebPage"
        schemas={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: seoTitle,
            url: `https://takhayal.ai/${type || 'terms'}`,
            dateModified: lastUpdatedIso || undefined,
          },
        ]}
      />
      {/* Simple nav */}
      <nav className="h-14 border-b border-border flex items-center px-6 sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <Link to={localizePath('/', lang)} className="flex items-center gap-2">
          <LogoMark size={22} />
        </Link>
        <Link to={localizePath('/', lang)} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-muted/40 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
          <ArrowLeft size={14} className={isAr ? 'rotate-180' : ''} />
          {isAr ? 'العودة' : 'Back'}
        </Link>
      </nav>

      <main className="max-w-[720px] mx-auto px-6 py-12 pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isAr ? title.ar : title.en}
        </h1>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground mb-8">
            {isAr ? `آخر تحديث: ${lastUpdated}` : `Last updated: ${lastUpdated}`}
          </p>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-muted/30 rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
        ) : (
          <div
            className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:text-foreground prose-headings:font-semibold
              prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-[14px]
              prose-li:text-muted-foreground prose-li:text-[14px]
              prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </main>
    </div>
  );
}
