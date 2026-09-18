import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  message?: string
}

const Email = ({ name, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thank you for your message — Estela Currao</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>ESTELA CURRAO</Text>
        <Heading style={heading}>Thank you for your message</Heading>
        <Text style={body}>
          {name ? `Dear ${name},` : 'Hello,'}
        </Text>
        <Text style={body}>
          Your message has been received. I will get back to you as soon as
          possible.
        </Text>
        {message ? (
          <>
            <Hr style={rule} />
            <Text style={label}>Your message</Text>
            <Text style={quote}>{message}</Text>
          </>
        ) : null}
        <Hr style={rule} />
        <Text style={footer}>
          Your data is used only to respond to your inquiry. estelacurrao.com
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Thank you for your message — Estela Currao',
  displayName: 'Contact form receipt (visitor)',
  previewData: {
    name: 'Marie Dupont',
    message: 'Bonjour, je souhaite des informations sur vos oeuvres récentes.',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
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
const body = { fontSize: '15px', lineHeight: '24px', margin: '0 0 14px' }
const label = {
  fontSize: '10px',
  letterSpacing: '0.18em',
  color: '#8a8a8a',
  margin: '0 0 8px',
}
const quote = {
  fontSize: '14px',
  lineHeight: '23px',
  color: '#555555',
  whiteSpace: 'pre-line' as const,
  margin: 0,
}
const rule = { borderColor: '#e5e5e5', margin: '20px 0' }
const footer = { fontSize: '11px', color: '#8a8a8a', margin: 0 }
