"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ComposeNewForm } from "./ComposeNewForm";

export default function ComposeNewPage() {
  const [shake, setShake] = useState(false);

  function shakeForm() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  return (
    <div className="container mx-auto py-8">
      <Card className={`w-full max-w-6xl mx-auto ${shake ? 'animate-shake' : ''}`}>
        <CardHeader className="flex items-center justify-between">
          Compose New Email
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <ComposeNewForm />
        </CardContent>
      </Card>
    </div>
  )
}
