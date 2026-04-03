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

    // Build a simple notification email body
    const timestamp = new Date().toISOString()
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#F03E1B">New Contact Message — Takhayal.ai</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:8px 0;color:#666;width:120px"><strong>Name</strong></td><td>${first_name}</td></tr>
          <tr><td style="padding:8px 0;color:#666"><strong>Email</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666"><strong>Language</strong></td><td>${language || 'en'}</td></tr>
          <tr><td style="padding:8px 0;color:#666"><strong>Logged In</strong></td><td>${is_logged_in ? 'Yes' : 'No'}</td></tr>
          <tr><td style="padding:8px 0;color:#666"><strong>Timestamp</strong></td><td>${timestamp}</td></tr>
        </table>
        <div style="margin-top:20px;padding:16px;background:#f9f9f9;border-radius:8px">
          <p style="margin:0;color:#333;white-space:pre-wrap">${message}</p>
        </div>
      </div>
    `

    // Use Lovable AI-powered function invocation to send email
    // For now, log the contact and return success — email delivery
    // can be connected once email infra is set up
    console.log('Contact notification:', { first_name, email, language, is_logged_in, timestamp })

    return new Response(
      JSON.stringify({ success: true }),
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
