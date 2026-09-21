import * as React from 'react'
import { render } from '@react-email/render'
import { TEMPLATES } from '@/lib/email-templates/registry'

/**
 * Server-only helper: renders a registered template and enqueues it for
 * delivery. Used by public triggers (e.g. the contact form) that have no
 * end-user session and therefore cannot call the authenticated send route.
 */
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function enqueueTemplateEmail(opts: {
  templateName: string
  recipientEmail?: string
  idempotencyKey?: string
  templateData?: Record<string, unknown>
}): Promise<{ ok: boolean; reason?: string }> {
  const SITE_NAME = 'Estela Currao'
  // Domain verified in Resend. Falls back to the root domain, which is the one
  // actually verified, so sending keeps working even without the env variable.
  const FROM_DOMAIN = process.env['EMAIL_FROM_DOMAIN'] ?? 'estelacurrao.com'

  const entry = TEMPLATES[opts.templateName]
  if (!entry) return { ok: false, reason: 'template_not_found' }

  const recipient = entry.to || opts.recipientEmail
  if (!recipient) return { ok: false, reason: 'no_recipient' }

  const { getSupabaseAdmin } = await import('@/lib/supabase-admin.server')
  const supabaseAdmin = getSupabaseAdmin()
  const messageId = crypto.randomUUID()
  const templateData = opts.templateData ?? {}

  const { data: suppressed } = await supabaseAdmin
    .from('suppressed_emails')
    .select('id')
    .eq('email', recipient.toLowerCase())
    .maybeSingle()

  if (suppressed) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: recipient,
      status: 'suppressed',
    })
    return { ok: false, reason: 'email_suppressed' }
  }

  // Get or create a one-click unsubscribe token for this recipient.
  const normalizedEmail = recipient.toLowerCase()
  let unsubscribeToken: string
  const { data: existingToken } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existingToken && !existingToken.used_at) {
    unsubscribeToken = existingToken.token
  } else if (!existingToken) {
    unsubscribeToken = generateToken()
    await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .upsert(
        { token: unsubscribeToken, email: normalizedEmail },
        { onConflict: 'email', ignoreDuplicates: true },
      )
    const { data: storedToken } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()
    if (!storedToken) return { ok: false, reason: 'token_failed' }
    unsubscribeToken = storedToken.token
  } else {
    return { ok: false, reason: 'email_suppressed' }
  }

  const element = React.createElement(entry.component, templateData)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject =
    typeof entry.subject === 'function' ? entry.subject(templateData) : entry.subject

  await supabaseAdmin.from('email_send_log').insert({
    message_id: messageId,
    template_name: opts.templateName,
    recipient_email: recipient,
    status: 'pending',
  })

  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: recipient,
      status: 'failed',
      error_message: 'RESEND_API_KEY is not configured',
    })
    return { ok: false, reason: 'missing_api_key' }
  }

  const unsubscribeUrl = `https://estelacurrao.com/email/unsubscribe?token=${unsubscribeToken}`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Idempotency-Key': opts.idempotencyKey ?? messageId,
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        to: [recipient],
        subject,
        html,
        text,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`Resend request failed [${response.status}]: ${errorBody}`)
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: opts.templateName,
        recipient_email: recipient,
        status: 'failed',
        error_message: `Resend ${response.status}: ${errorBody}`.slice(0, 500),
      })
      return { ok: false, reason: 'send_failed' }
    }

    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: recipient,
      status: 'sent',
    })
    return { ok: true }
  } catch (sendError) {
    console.error('Resend send threw', sendError)
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: recipient,
      status: 'failed',
      error_message: sendError instanceof Error ? sendError.message : 'unknown',
    })
    return { ok: false, reason: 'send_failed' }
  }
}