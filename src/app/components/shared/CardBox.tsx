"use client";
import { Card } from "@/components/ui/card";

interface MyAppProps {
  children: React.ReactNode;
  className?: string;
  /** Desactiva la elevación al pasar el cursor (para tarjetas no accionables). */
  static?: boolean;
}
const CardBox: React.FC<MyAppProps> = ({ children, className, static: isStatic }) => {
  return (
    <Card
      className={`card border border-border rounded-tw ${
        isStatic ? "" : "card-lift"
      } ${className ?? ""}`}
    >
      {children}
    </Card>
  );

};

export default CardBox;
