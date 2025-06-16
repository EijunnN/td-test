"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameStore } from "@/state/gameStore";
import { Send, MessageCircle } from "lucide-react";
import { FormEvent, useState, useRef, useEffect } from "react";
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
  const playerNick = useGameStore(
    (s) => s.gameState?.players.find((p) => p.id === s.playerId)?.nick
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatMessages, isOpen]);

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
          variant="secondary"
          size="icon"
          className="fixed bottom-20 right-4 z-50 rounded-full h-14 w-14 bg-slate-800/80 backdrop-blur-sm border-2 border-slate-600 hover:bg-slate-700"
        >
          <MessageCircle className="h-7 w-7 text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col bg-slate-900/80 backdrop-blur-lg border-l-slate-700 text-white p-0"
      >
        <SheetHeader className="p-4 border-b border-slate-700">
          <SheetTitle>Chat de la Partida</SheetTitle>
        </SheetHeader>
        <div className="flex-grow p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {chatMessages.length === 0 ? (
            <p className="text-sm text-center text-slate-400">
              Aún no hay mensajes.
            </p>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((msg, index) => {
                const isMine = msg.fromPlayer === playerNick;
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      isMine ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 max-w-xs lg:max-w-sm ${
                        isMine
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {!isMine && (
                        <p className="text-xs font-bold text-blue-300 mb-1">
                          {msg.fromPlayer}
                        </p>
                      )}
                      <p className="text-base whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 p-4 border-t border-slate-700"
        >
          <Input
            name="message"
            placeholder="Escribe un mensaje..."
            autoComplete="off"
            className="bg-slate-800 border-slate-600 focus:ring-blue-500 text-base"
          />
          <Button
            type="submit"
            size="icon"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
