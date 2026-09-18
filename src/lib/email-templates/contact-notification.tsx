import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  email?: string
  message?: string
  receivedAt?: string
}

const Email = ({ name, email, message, receivedAt }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`New message from ${name || 'a visitor'}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>ESTELA CURRAO — CONTACT FORM</Text>
        <Heading style={heading}>New message</Heading>
        <Section style={meta}>
          <Text style={metaLine}>
            <strong>Name:</strong> {name || '—'}
          </Text>
          <Text style={metaLine}>
            <strong>Email:</strong> {email || '—'}
          </Text>
          {receivedAt ? (
            <Text style={metaLine}>
              <strong>Received:</strong> {receivedAt}
            </Text>
          ) : null}
        </Section>
        <Hr style={rule} />
        <Text style={body}>{message || '—'}</Text>
        <Hr style={rule} />
        <Text style={footer}>estelacurrao.com</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Contact form — ${data?.name || 'new message'}`,
  displayName: 'Contact form notification',
  to: 'contact@estelacurrao.com',
  previewData: {
    name: 'Marie Dupont',
    email: 'marie@example.com',
    message: 'Bonjour, je souhaite des informations sur vos oeuvres récentes.',
    receivedAt: '5 August 2026, 10:40',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    'Helvetica Neue, Helvetica, Arial, sans-serif',
  color: '#1a1a1a',
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const eyebrow = {
  fontSize: '10px',
  letterSpacing: '0.18em',
  color: '#8a8a8a',
  margin: '0 0 18px',
}
const heading = {
  fontSize: '20px',
  fontWeight: 400,
  letterSpacing: '0.02em',
  margin: '0 0 20px',
}
const meta = { margin: '0 0 4px' }
const metaLine = { fontSize: '14px', lineHeight: '22px', margin: '0 0 4px' }
const rule = { borderColor: '#e5e5e5', margin: '20px 0' }
const body = {
  fontSize: '15px',
  lineHeight: '24px',
  whiteSpace: 'pre-line' as const,
  margin: 0,
}
const footer = { fontSize: '11px', color: '#8a8a8a', margin: 0 }