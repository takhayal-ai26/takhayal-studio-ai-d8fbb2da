import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Mail, User, MessageSquare } from 'lucide-react';
import { z } from 'zod';
import { PageSeo } from '@/components/seo/PageSeo';

const contactSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(10).max(5000),
});

export default function Contact() {
  const { lang, isRTL, t } = useLanguage();
  const { toast } = useToast();
  const copy = t.contact;

  const [form, setForm] = useState({ first_name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const firstNameFieldId = 'contact-first-name';
  const emailFieldId = 'contact-email';
  const messageFieldId = 'contact-message';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      const flat = result.error.flatten().fieldErrors;
      if (flat.first_name) fieldErrors.first_name = copy.required;
      if (flat.email) fieldErrors.email = copy.invalidEmail;
      if (flat.message) fieldErrors.message = copy.msgTooShort;
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
        title: copy.errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-[70vh] flex items-center justify-center px-5">
        <PageSeo
          title={copy.seoTitle}
          description={copy.seoDescription}
          canonicalPath="/contact"
          pageType="ContactPage"
        />
        <div className="text-center max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Send size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{copy.successMsg}</h2>
          <button
            onClick={() => setSuccess(false)}
            className="text-[14px] text-primary font-medium hover:underline"
          >
            {copy.sendAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-[70vh] py-16 md:py-24 px-5">
      <PageSeo
        title={copy.seoTitle}
        description={copy.seoDescription}
        canonicalPath="/contact"
        pageType="ContactPage"
        schemas={[
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: copy.supportEmail,
            availableLanguage: ['Arabic', 'English'],
          },
        ]}
      />
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: Copy */}
          <div className="space-y-6 lg:sticky lg:top-32">
            <h1 className="typo-heading-page">
              {copy.title}
            </h1>
            <p className="text-[15px] md:text-[16px] text-muted-foreground leading-relaxed max-w-md">
              {copy.subtitle}
            </p>
            <p className="text-[13px] text-muted-foreground/70 leading-relaxed max-w-sm">
              {copy.support}
            </p>

            {/* Contact info hints */}
            <div className="hidden lg:flex flex-col gap-3 pt-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail size={16} className="text-primary" />
                </div>
                <span className="text-[13px]">{copy.supportEmail}</span>
              </div>
            </div>
          </div>

          {/* Right: Form card */}
          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* First Name */}
              <div className="space-y-2">
                <label htmlFor={firstNameFieldId} className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                  <User size={13} className="text-muted-foreground" />
                  {copy.firstName}
                </label>
                <input
                  id={firstNameFieldId}
                  type="text"
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  aria-invalid={errors.first_name ? 'true' : 'false'}
                  aria-describedby={errors.first_name ? `${firstNameFieldId}-error` : undefined}
                  className="w-full h-11 rounded-xl bg-muted/50 px-4 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder={copy.namePlaceholder}
                />
                {errors.first_name && <p id={`${firstNameFieldId}-error`} className="text-[12px] text-destructive">{errors.first_name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor={emailFieldId} className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                  <Mail size={13} className="text-muted-foreground" />
                  {copy.email}
                </label>
                <input
                  id={emailFieldId}
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? `${emailFieldId}-error` : undefined}
                  className="w-full h-11 rounded-xl bg-muted/50 px-4 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder={copy.emailPlaceholder}
                />
                {errors.email && <p id={`${emailFieldId}-error`} className="text-[12px] text-destructive">{errors.email}</p>}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor={messageFieldId} className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-muted-foreground" />
                  {copy.message}
                </label>
                <textarea
                  id={messageFieldId}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={5}
                  aria-invalid={errors.message ? 'true' : 'false'}
                  aria-describedby={errors.message ? `${messageFieldId}-error` : undefined}
                  className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                  placeholder={copy.messagePlaceholder}
                />
                {errors.message && <p id={`${messageFieldId}-error`} className="text-[12px] text-destructive">{errors.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-pulse">{copy.sending}</span>
                ) : (
                  <>
                    <Send size={16} />
                    {copy.send}
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
