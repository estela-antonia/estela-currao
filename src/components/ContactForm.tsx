import { useEffect, useId, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getContactCsrfToken, submitContactMessage } from "@/lib/contact.functions";
import type { Locale } from "@/lib/site-content.types";

type Field = "name" | "email" | "message";

const COPY = {
  es: {
    heading: "Escribir",
    name: "Nombre",
    email: "Email",
    message: "Mensaje",
    send: "Enviar",
    sending: "Enviando…",
    sent: "Gracias. Tu mensaje fue enviado.",
    errName: "Ingresa tu nombre.",
    errEmail: "Ingresa un email válido.",
    errMessage: "Escribe un mensaje.",
    errGeneric: "No pudimos enviar el mensaje. Intenta de nuevo.",
    summary: "Resumen del envío",
    again: "Enviar otro mensaje",
    required: "obligatorio",
    errSummary: "Revisa los campos marcados:",
    hintMessage: "Máximo 2000 caracteres.",
    errTooFast: "Espera un instante y vuelve a enviar.",
    errSession: "Tu sesión expiró. Recarga la página y vuelve a enviar.",
    errRateHour: "Ya enviaste varios mensajes. Intenta de nuevo en una hora.",
    errRateDay: "Alcanzaste el límite de mensajes de hoy. Intenta mañana.",
    privacy: "Tus datos solo se usarán para responder a tu consulta.",
  },
  fr: {
    heading: "Écrire",
    name: "Nom",
    email: "Email",
    message: "Message",
    send: "Envoyer",
    sending: "Envoi…",
    sent: "Merci. Votre message a été envoyé.",
    errName: "Indiquez votre nom.",
    errEmail: "Indiquez un email valide.",
    errMessage: "Écrivez un message.",
    errGeneric: "Envoi impossible. Veuillez réessayer.",
    summary: "Récapitulatif de l'envoi",
    again: "Envoyer un autre message",
    required: "obligatoire",
    errSummary: "Vérifiez les champs indiqués :",
    hintMessage: "2000 caractères maximum.",
    errTooFast: "Patientez un instant puis renvoyez.",
    errSession: "Session expirée. Rechargez la page puis renvoyez.",
    errRateHour: "Vous avez déjà envoyé plusieurs messages. Réessayez dans une heure.",
    errRateDay: "Limite de messages atteinte pour aujourd'hui. Réessayez demain.",
    privacy: "Vos données servent uniquement à répondre à votre demande.",
  },
  en: {
    heading: "Write",
    name: "Name",
    email: "Email",
    message: "Message",
    send: "Send",
    sending: "Sending…",
    sent: "Thank you. Your message has been sent.",
    errName: "Please enter your name.",
    errEmail: "Please enter a valid email.",
    errMessage: "Please write a message.",
    errGeneric: "We couldn't send your message. Please try again.",
    summary: "Summary of your message",
    again: "Send another message",
    required: "required",
    errSummary: "Please review the highlighted fields:",
    hintMessage: "2000 characters maximum.",
    errTooFast: "Please wait a moment and send again.",
    errSession: "Your session expired. Please reload the page and send again.",
    errRateHour: "You've already sent several messages. Please try again in an hour.",
    errRateDay: "You've reached today's message limit. Please try again tomorrow.",
    privacy: "Your data will only be used to respond to your inquiry.",
  },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Submissions faster than this are almost certainly automated.
const MIN_FILL_MS = 2500;

export function ContactForm({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.en;
  const send = useServerFn(submitContactMessage);
  const requestCsrfToken = useServerFn(getContactCsrfToken);
  const uid = useId();
  const fid = (n: string) => `cf-${n}-${uid}`;

  const [values, setValues] = useState({ name: "", email: "", message: "", website: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sentValues, setSentValues] = useState({ name: "", email: "", message: "" });
  const [tooFast, setTooFast] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [rateError, setRateError] = useState<"hour" | "day" | null>(null);
  const csrfToken = useRef<string>("");
  const formRef = useRef<HTMLFormElement>(null);
  const mountedAt = useRef<number>(Date.now());

  useEffect(() => {
    mountedAt.current = Date.now();
    let cancelled = false;
    (async () => {
      try {
        const res = await requestCsrfToken();
        if (!cancelled) csrfToken.current = res.token;
      } catch {
        /* token is re-requested on submit if missing */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (field: keyof typeof values) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (field !== "website") setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const errorFor = (field: Field, v = values): string | undefined => {
    if (field === "name") return v.name.trim() ? undefined : t.errName;
    if (field === "email") return EMAIL_RE.test(v.email.trim()) ? undefined : t.errEmail;
    return v.message.trim() ? undefined : t.errMessage;
  };

  const validateField = (field: Field) => () => {
    setErrors((prev) => ({ ...prev, [field]: errorFor(field) }));
  };

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    (["name", "email", "message"] as Field[]).forEach((f) => {
      const msg = errorFor(f);
      if (msg) next[f] = msg;
    });
    setErrors(next);
    const first = (["name", "email", "message"] as Field[]).find((f) => next[f]);
    if (first) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${first}"]`)
        ?.focus();
    }
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setTooFast(false);
    setSessionError(false);
    setRateError(null);
    if (!validate()) return;
    const elapsedMs = Date.now() - mountedAt.current;
    if (elapsedMs < MIN_FILL_MS) {
      setTooFast(true);
      return;
    }
    setStatus("sending");
    try {
      if (!csrfToken.current) {
        csrfToken.current = (await requestCsrfToken()).token;
      }
      await send({ data: { ...values, elapsedMs, csrfToken: csrfToken.current } });
      setSentValues({
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
      });
      setStatus("sent");
      setValues({ name: "", email: "", message: "", website: "" });
      csrfToken.current = "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("RATE_LIMIT_HOUR") || msg.includes("RATE_LIMIT_DAY")) {
        setRateError(msg.includes("RATE_LIMIT_HOUR") ? "hour" : "day");
        setStatus("idle");
        return;
      }
      if (err instanceof Error && err.message.includes("CSRF_INVALID")) {
        csrfToken.current = "";
        setSessionError(true);
        setStatus("idle");
        return;
      }
      setStatus("error");
    }
  };

  const fieldClass =
    "w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-2 text-[15px] font-light text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-0 transition-colors";

  if (status === "sent") {
    return (
      <div className="max-w-[420px] md:max-w-none" role="status" aria-live="polite" tabIndex={-1}>
        <p className="text-[15px] font-light leading-relaxed text-neutral-900">
          {t.sent}
        </p>

        <p className="mt-10 text-[11px] font-light uppercase tracking-[0.25em] text-neutral-400">
          {t.summary}
        </p>
        <dl className="mt-4 space-y-4 border-t border-neutral-200 pt-4">
          <div>
            <dt className="text-[11px] font-light uppercase tracking-[0.2em] text-neutral-400">
              {t.name}
            </dt>
            <dd className="mt-1 text-[14px] font-light text-neutral-900">{sentValues.name}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-light uppercase tracking-[0.2em] text-neutral-400">
              {t.email}
            </dt>
            <dd className="mt-1 break-words text-[14px] font-light text-neutral-900">
              {sentValues.email}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-light uppercase tracking-[0.2em] text-neutral-400">
              {t.message}
            </dt>
            <dd className="mt-1 whitespace-pre-line text-[14px] font-light leading-relaxed text-neutral-900">
              {sentValues.message}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setErrors({});
            setTooFast(false);
            setSessionError(false);
            setRateError(null);
            mountedAt.current = Date.now();
            requestCsrfToken()
              .then((res) => {
                csrfToken.current = res.token;
              })
              .catch(() => {});
          }}
          className="mt-10 text-[13px] font-light uppercase tracking-[0.3em] text-neutral-900 underline decoration-neutral-300 underline-offset-[6px] transition-colors hover:text-neutral-500"
        >
          {t.again}
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      aria-labelledby={fid("heading")}
      className="max-w-[420px] space-y-6 md:max-w-none md:space-y-5"
    >
      <p id={fid("heading")} className="sr-only">
        {t.heading}
      </p>

      <div aria-live="polite">
        {Object.values(errors).some(Boolean) ? (
          <p className="text-[12px] font-light text-neutral-600">{t.errSummary}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={fid("name")}
          className="block text-[11px] font-light uppercase tracking-[0.2em] text-neutral-500"
        >
          {t.name} <span className="text-neutral-400">({t.required})</span>
        </label>
        <input
          id={fid("name")}
          name="name"
          type="text"
          autoComplete="name"
          required
          aria-required="true"
          maxLength={100}
          value={values.name}
          onChange={set("name")}
          onBlur={validateField("name")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? fid("name-error") : undefined}
          className={fieldClass}
        />
        {errors.name ? (
          <p
            id={fid("name-error")}
            role="alert"
            className="mt-2 text-[12px] font-light text-neutral-600"
          >
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={fid("email")}
          className="block text-[11px] font-light uppercase tracking-[0.2em] text-neutral-500"
        >
          {t.email} <span className="text-neutral-400">({t.required})</span>
        </label>
        <input
          id={fid("email")}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          aria-required="true"
          maxLength={255}
          value={values.email}
          onChange={set("email")}
          onBlur={validateField("email")}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? fid("email-error") : undefined}
          className={fieldClass}
        />
        {errors.email ? (
          <p
            id={fid("email-error")}
            role="alert"
            className="mt-2 text-[12px] font-light text-neutral-600"
          >
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={fid("message")}
          className="block text-[11px] font-light uppercase tracking-[0.2em] text-neutral-500"
        >
          {t.message} <span className="text-neutral-400">({t.required})</span>
        </label>
        <textarea
          id={fid("message")}
          name="message"
          rows={3}
          required
          aria-required="true"
          maxLength={2000}
          value={values.message}
          onChange={set("message")}
          onBlur={validateField("message")}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={`${fid("message-hint")}${errors.message ? ` ${fid("message-error")}` : ""}`}
          className={`${fieldClass} resize-none`}
        />
        <p id={fid("message-hint")} className="mt-1 text-[11px] font-light text-neutral-400">
          {t.hintMessage}
        </p>
        {errors.message ? (
          <p
            id={fid("message-error")}
            role="alert"
            className="mt-2 text-[12px] font-light text-neutral-600"
          >
            {errors.message}
          </p>
        ) : null}
      </div>

      {/* Honeypot — hidden from users and assistive tech, irresistible to bots */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={fid("website")}>Website</label>
        <input
          id={fid("website")}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={set("website")}
        />
      </div>

      {status === "error" ? (
        <p role="alert" className="text-[12px] font-light text-neutral-600">
          {t.errGeneric}
        </p>
      ) : null}

      {tooFast ? (
        <p role="alert" className="text-[12px] font-light text-neutral-600">
          {t.errTooFast}
        </p>
      ) : null}

      {sessionError ? (
        <p role="alert" className="text-[12px] font-light text-neutral-600">
          {t.errSession}
        </p>
      ) : null}

      {rateError ? (
        <p role="alert" className="text-[12px] font-light text-neutral-600">
          {rateError === "hour" ? t.errRateHour : t.errRateDay}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        aria-busy={status === "sending"}
        className="text-[13px] font-light uppercase tracking-[0.3em] text-neutral-900 underline decoration-neutral-300 underline-offset-[6px] transition-colors hover:text-neutral-500 disabled:opacity-50"
      >
        {status === "sending" ? t.sending : t.send}
      </button>

      <p className="mt-3 text-[10px] font-light leading-relaxed text-neutral-400">
        {t.privacy}
      </p>
    </form>
  );
}
