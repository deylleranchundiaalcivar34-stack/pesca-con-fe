"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface MotionRevealProps {
  children: ReactNode;
  className?: string;
}

// Aplica una animacion suave de entrada a su contenido.
export function MotionReveal({ children, className }: MotionRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
