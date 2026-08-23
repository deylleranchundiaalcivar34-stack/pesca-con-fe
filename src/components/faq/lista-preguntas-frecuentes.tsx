"use client";

import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { frequentlyAskedQuestions } from "@/data/preguntas-frecuentes";

function revealHashQuestion() {
  const id = window.location.hash.slice(1);
  if (!id) return;

  const question = document.getElementById(id);
  if (!(question instanceof HTMLDetailsElement)) return;

  question.open = true;
  window.requestAnimationFrame(() => {
    question.scrollIntoView({ behavior: "smooth", block: "center" });
    question.querySelector("summary")?.focus({ preventScroll: true });
  });
}

export function FrequentlyAskedQuestionsList() {
  useEffect(() => {
    revealHashQuestion();
    window.addEventListener("hashchange", revealHashQuestion);
    return () => window.removeEventListener("hashchange", revealHashQuestion);
  }, []);

  return (
    <div className="space-y-3">
      {frequentlyAskedQuestions.map((item) => (
        <details
          id={"id" in item ? item.id : undefined}
          key={item.question}
          className="group scroll-mt-28 rounded-lg border border-border bg-white shadow-sm open:border-primary/30"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-dark-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              className="size-5 shrink-0 text-primary transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="border-t border-border px-5 py-4 text-sm leading-7 text-muted-foreground">
            <p>{item.answer}</p>
            {"details" in item ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-primary">
                {item.details.map((detail) => <li key={detail}>{detail}</li>)}
              </ul>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
