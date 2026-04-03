import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Mail, User, MessageSquare } from 'lucide-react';
import { z } from 'zod';

const contactSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(10).max(5000),
});

export default function Contact() {
  const { lang, isRTL } = useLanguage();
  const { isAuthenticated } = useApp();
  const { toast } = useToast();
  const isAr = lang === 'ar';

  const [form, setForm] = useState({ first_name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const t = {
    title: isAr ? 'تواصل معنا' : 'Contact Us',
    subtitle: isAr
      ? 'هل لديك سؤال أو ملاحظة أو استفسار عن شراكة؟ يسعدنا التواصل معك.'
      : 'Have a question, feedback, or partnership inquiry? We\'d love to hear from you.',
    support: isAr
      ? 'سيقوم فريقنا بمراجعة رسالتك والرد عليك في أقرب وقت ممكن.'
      : 'Our team will review your message and get back to you as soon as possible.',
    firstName: isAr ? 'الاسم الأول' : 'First Name',
    email: isAr ? 'البريد الإلكتروني' : 'Email',
    message: isAr ? 'الرسالة' : 'Message',
    send: isAr ? 'إرسال الرسالة' : 'Send Message',
    sending: isAr ? 'جاري الإرسال...' : 'Sending...',
    successMsg: isAr ? 'شكرًا لك — تم إرسال رسالتك بنجاح.' : 'Thank you — your message has been sent successfully.',
    errorMsg: isAr ? 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.',
    required: isAr ? 'هذا الحقل مطلوب' : 'This field is required',
    invalidEmail: isAr ? 'بريد إلكتروني غير صالح' : 'Invalid email address',
    msgTooShort: isAr ? 'الرسالة قصيرة جداً (10 أحرف على الأقل)' : 'Message too short (min 10 characters)',
    sendAnother: isAr ? 'إرسال رسالة أخرى' : 'Send another message',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      const flat = result.error.flatten().fieldErrors;
      if (flat.first_name) fieldErrors.first_name = t.required;
      if (flat.email) fieldErrors.email = t.invalidEmail;
      if (flat.message) fieldErrors.message = t.msgTooShort;
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('contact_messages').insert({
        first_name: result.data.first_name,
        email: result.data.email,
        message: result.data.message,
        language: lang,
        user_id: user?.id ?? null,
      });

      if (error) throw error;

      // Fire-and-forget email notification
      supabase.functions.invoke('notify-contact', {
        body: {
          first_name: result.data.first_name,
          email: result.data.email,
          message: result.data.message,
          language: lang,
          is_logged_in: !!user,
        },
      }).catch(() => {});

      setSuccess(true);
      setForm({ first_name: '', email: '', message: '' });
    } catch {
      toast({
        title: t.errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-[70vh] flex items-center justify-center px-5">
        <div className="text-center max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Send size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t.successMsg}</h2>
          <button
            onClick={() => setSuccess(false)}
            className="text-[14px] text-primary font-medium hover:underline"
          >
            {t.sendAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-[70vh] py-16 md:py-24 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: Copy */}
          <div className="space-y-6 lg:sticky lg:top-32">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              {t.title}
            </h1>
            <p className="text-[15px] md:text-[16px] text-muted-foreground leading-relaxed max-w-md">
              {t.subtitle}
            </p>
            <p className="text-[13px] text-muted-foreground/70 leading-relaxed max-w-sm">
              {t.support}
            </p>

            {/* Contact info hints */}
            <div className="hidden lg:flex flex-col gap-3 pt-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail size={16} className="text-primary" />
                </div>
                <span className="text-[13px]">support@takhayal.ai</span>
              </div>
            </div>
          </div>

          {/* Right: Form card */}
          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* First Name */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                  <User size={13} className="text-muted-foreground" />
                  {t.firstName}
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  className="w-full h-11 rounded-xl bg-muted/50 px-4 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder={isAr ? 'أدخل اسمك' : 'Enter your name'}
                />
                {errors.first_name && <p className="text-[12px] text-destructive">{errors.first_name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                  <Mail size={13} className="text-muted-foreground" />
                  {t.email}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full h-11 rounded-xl bg-muted/50 px-4 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder={isAr ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                />
                {errors.email && <p className="text-[12px] text-destructive">{errors.email}</p>}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-muted-foreground" />
                  {t.message}
                </label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={5}
                  className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                  placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                />
                {errors.message && <p className="text-[12px] text-destructive">{errors.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-pulse">{t.sending}</span>
                ) : (
                  <>
                    <Send size={16} />
                    {t.send}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
