"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameStore } from "@/state/gameStore";
import { CornerDownLeft, MessageSquare } from "lucide-react";
import { FormEvent, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { websocketService } from "@/services/websocketService";

export function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const { chatMessages } = useGameStore();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("message") as HTMLInputElement;
    const message = input.value.trim();

    if (message) {
      websocketService.send("send_chat_message", { message });
      input.value = "";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50"
        >
          <MessageSquare />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Chat de la Partida</SheetTitle>
        </SheetHeader>
        <div className="flex-grow bg-muted/40 rounded-lg my-4 p-4 overflow-y-auto">
          {chatMessages.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground">
              Aún no hay mensajes.
            </p>
          ) : (
            chatMessages.map((msg, index) => (
              <div key={index} className="mb-2 text-sm">
                <span className="font-bold">{msg.fromPlayer}:</span>{" "}
                {msg.message}
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            name="message"
            placeholder="Escribe un mensaje..."
            autoComplete="off"
          />
          <Button type="submit" size="icon">
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
