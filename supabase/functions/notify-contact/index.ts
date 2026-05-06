const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const BodySchema = z.object({
  first_name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  message: z.string().min(1).max(5000),
  language: z.string().optional(),
  is_logged_in: z.boolean().optional(),
})

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const DEFAULT_SUPPORT_TO = 'hala@takhayal.ai'
const DEFAULT_SUPPORT_FROM = 'Takhayal Website <notifications@takhayal.ai>'

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { first_name, email, message, language, is_logged_in } = parsed.data

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('notify-contact missing RESEND_API_KEY')
      return new Response(
        JSON.stringify({ error: 'Email provider is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supportTo = Deno.env.get('SUPPORT_NOTIFICATION_EMAIL') || DEFAULT_SUPPORT_TO
    const supportFrom = Deno.env.get('SUPPORT_FROM_EMAIL') || DEFAULT_SUPPORT_FROM
    const timestamp = new Date().toISOString()
    const safeName = escapeHtml(first_name)
    const safeEmail = escapeHtml(email)
    const safeLanguage = escapeHtml(language || 'en')
    const safeMessage = escapeHtml(message)

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#F03E1B">New contact message - Takhayal.ai</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:8px 0;color:#666;width:120px"><strong>Name</strong></td><td>${safeName}</td></tr>
          <tr><td style="padding:8px 0;color:#666"><strong>Email</strong></td><td><a href="mailto:${encodeURIComponent(email)}">${safeEmail}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666"><strong>Language</strong></td><td>${safeLanguage}</td></tr>
          <tr><td style="padding:8px 0;color:#666"><strong>Logged In</strong></td><td>${is_logged_in ? 'Yes' : 'No'}</td></tr>
          <tr><td style="padding:8px 0;color:#666"><strong>Timestamp</strong></td><td>${timestamp}</td></tr>
        </table>
        <div style="margin-top:20px;padding:16px;background:#f9f9f9;border-radius:8px">
          <p style="margin:0;color:#333;white-space:pre-wrap">${safeMessage}</p>
        </div>
      </div>
    `
    const text = [
      'New contact message - Takhayal.ai',
      '',
      `Name: ${first_name}`,
      `Email: ${email}`,
      `Language: ${language || 'en'}`,
      `Logged In: ${is_logged_in ? 'Yes' : 'No'}`,
      `Timestamp: ${timestamp}`,
      '',
      message,
    ].join('\n')

    const resendResponse = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: supportFrom,
        to: [supportTo],
        reply_to: email,
        subject: `New Takhayal support message from ${first_name}`,
        html,
        text,
      }),
    })

    const resendResult = await resendResponse.json().catch(() => null)
    if (!resendResponse.ok) {
      console.error('notify-contact Resend error:', resendResult)
      return new Response(
        JSON.stringify({ error: 'Email notification failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Contact notification sent:', {
      email_id: resendResult?.id,
      recipient: supportTo,
      language,
      is_logged_in,
      timestamp,
    })

    return new Response(
      JSON.stringify({ success: true, id: resendResult?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('notify-contact error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
