"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { LogIn, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  buildCustomerQuestionWhatsAppMessage,
  getWhatsAppPrefilledUrl,
} from "@/lib/whatsapp";
import type { PublicUserSummary } from "@/types/usuario";

const QUESTION_STORAGE_KEY = "pesca-con-fe:pregunta-pendiente";
const QUESTION_RETURN_PATH = "/preguntas-frecuentes#hacer-pregunta";

type SessionResponse = {
  user: PublicUserSummary | null;
};

// Formulario público que exige sesión solo al intentar enviar la consulta.
export function CustomerQuestionForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [user, setUser] = useState<PublicUserSummary | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initializeForm() {
      const pendingQuestion = window.sessionStorage.getItem(QUESTION_STORAGE_KEY);
      let sessionUser: PublicUserSummary | null = null;

      try {
        const response = await fetch("/api/sesion", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data: SessionResponse = response.ok
          ? await response.json()
          : { user: null };
        sessionUser = data.user;
      } catch {
        sessionUser = null;
      }

      if (isMounted) {
        if (pendingQuestion) setQuestion(pendingQuestion);
        setUser(sessionUser);
        setIsCheckingSession(false);
      }
    }

    void initializeForm();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuestion = question.trim();

    if (!normalizedQuestion) {
      toast.error("Escribe tu pregunta antes de continuar.");
      return;
    }

    if (!user) {
      window.sessionStorage.setItem(QUESTION_STORAGE_KEY, normalizedQuestion);
      router.push(`/login?redirect=${encodeURIComponent(QUESTION_RETURN_PATH)}`);
      return;
    }

    const message = buildCustomerQuestionWhatsAppMessage({
      question: normalizedQuestion,
      fullName: user.fullName,
    });
    const chatWindow = window.open(getWhatsAppPrefilledUrl(message), "_blank");

    if (!chatWindow) {
      toast.error("El navegador bloqueó WhatsApp. Permite las ventanas emergentes e intenta otra vez.");
      return;
    }

    chatWindow.opener = null;
    window.sessionStorage.removeItem(QUESTION_STORAGE_KEY);
    setQuestion("");
    toast.success("WhatsApp se abrió con tu pregunta preparada.");
  };

  return (
    <div id="hacer-pregunta" className="scroll-mt-24 rounded-lg border border-primary/15 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <h2 className="text-2xl font-bold text-dark-blue">¿No encontraste tu respuesta?</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Escríbenos tu consulta y prepararemos un mensaje para enviarla por WhatsApp.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="customer-question">Tu pregunta</Label>
          <Textarea
            id="customer-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="mt-2 min-h-32"
            placeholder="Ejemplo: ¿Qué caña me recomiendan para pescar en río?"
            maxLength={800}
            required
          />
          <p className="mt-2 text-right text-xs text-muted-foreground">
            {question.length}/800
          </p>
        </div>

        {user ? (
          <p className="rounded-md bg-secondary px-4 py-3 text-sm text-dark-blue">
            Enviarás esta pregunta como <strong>{user.fullName || user.email}</strong>.
          </p>
        ) : !isCheckingSession ? (
          <p className="flex items-center gap-2 rounded-md bg-secondary px-4 py-3 text-sm text-dark-blue">
            <LogIn className="size-4 shrink-0 text-primary" aria-hidden="true" />
            Te pediremos iniciar sesión antes de enviar la pregunta.
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={isCheckingSession}>
          <Send aria-hidden="true" />
          {isCheckingSession ? "Verificando sesión..." : "Enviar pregunta por WhatsApp"}
        </Button>
      </form>
    </div>
  );
}
