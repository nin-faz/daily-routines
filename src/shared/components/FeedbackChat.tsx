import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { MessageCircle, Send, BotMessageSquare } from "lucide-react";
import { useToast } from "@/application/hooks/use-toast";
import { DialogTitle } from "@radix-ui/react-dialog";

type Message = {
  id: number;
  text: string;
  sender: "bot" | "user";
  timestamp: string;
};

type Step = "welcome" | "name" | "feedback" | "submitted";

const WELCOME_MESSAGE =
  "Salut ! 👋 C'est moi l'assistant IA de Daily Routine. J'aimerais bien connaître ton avis pour continuer à améliorer l'app.\n\nSpoïl : c'est le boss qui m'envoie 🙄";

const PSEUDO_QUESTION = "Avant tout, quel est ton pseudo ?";

// Helper pour initialiser la conversation
const initializeConversation = (
  callback: (message: string) => void,
  setTyping: (typing: boolean) => void,
  setCurrentStep: (step: Step) => void,
) => {
  setTyping(true);
  setTimeout(() => {
    callback(WELCOME_MESSAGE);
    setTyping(false);
  }, 800);

  setTimeout(() => {
    setTyping(true);
    setCurrentStep("name");
  }, 2000);

  setTimeout(() => {
    callback(PSEUDO_QUESTION);
    setTyping(false);
  }, 2800);
};

export default function FeedbackChat() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [formData, setFormData] = useState({ name: "", feedback: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (open && messages.length === 0) {
      initializeConversation(addBotMessage, setIsTyping, setStep);
    }
  }, [open]);

  const addBotMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now(),
      text,
      sender: "bot",
      timestamp: new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now(),
      text,
      sender: "user",
      timestamp: new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userInput = input.trim();
    addUserMessage(userInput);
    setInput("");
    setIsTyping(true);

    if (step === "name") {
      setFormData((prev) => ({ ...prev, name: userInput }));
      setTimeout(() => {
        addBotMessage(
          `Sympa ${userInput} ! 😄 Maintenant je suis curieux... qu'est-ce que tu penses de Daily Routine ? Les features que tu aimes ? Les choses à améliorer ? Va-y, sois honnête !`,
        );
        setIsTyping(false);
        setStep("feedback");
      }, 1000);
    } else if (step === "feedback") {
      setFormData((prev) => ({ ...prev, feedback: userInput }));

      // Soumission à Netlify Forms
      try {
        const formElement = document.createElement("form");
        formElement.setAttribute("name", "avis-utilisateurs");
        formElement.setAttribute("method", "POST");
        formElement.setAttribute("data-netlify", "true");
        formElement.style.display = "none";

        const formNameInput = document.createElement("input");
        formNameInput.setAttribute("type", "hidden");
        formNameInput.setAttribute("name", "form-name");
        formNameInput.value = "avis-utilisateurs";

        const nameInput = document.createElement("input");
        nameInput.setAttribute("type", "text");
        nameInput.setAttribute("name", "name");
        nameInput.value = formData.name;

        const feedbackInput = document.createElement("textarea");
        feedbackInput.setAttribute("name", "feedback");
        feedbackInput.value = userInput;

        formElement.appendChild(formNameInput);
        formElement.appendChild(nameInput);
        formElement.appendChild(feedbackInput);
        document.body.appendChild(formElement);

        // On récupère les données du formulaire de manière typée
        const formDataObj = Object.fromEntries(
          new FormData(formElement).entries(),
        );

        const response = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          // URLSearchParams accepte un objet simple sans broncher
          body: new URLSearchParams(
            formDataObj as Record<string, string>,
          ).toString(),
        });

        document.body.removeChild(formElement);

        if (response.ok) {
          setIsTyping(true);
          setTimeout(() => {
            addBotMessage(
              "Franchement, ton retour c'est de l'or ! 🔥 Ça va vraiment nous aider à faire mieux. Merci beaucoup d'avoir pris le temps. À bientôt !",
            );
            setStep("submitted");
            setIsSubmitting(false);
            setIsTyping(false);
          }, 1200);

          toast({
            title: "Merci ! 🚀",
            description: "Ton feedback a été reçu avec succès.",
          });
        } else {
          throw new Error("Erreur lors de l'envoi");
        }
      } catch (error) {
        setIsSubmitting(false);
        setIsTyping(true);
        setTimeout(() => {
          addBotMessage(
            "Oups ! 😅 Y'a eu un petit problème technique... tu peux réessayer ?",
          );
          setStep("feedback");
          setIsTyping(false);
        }, 800);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible d'envoyer votre feedback. Réessayez.",
        });
      }
    }
  };

  const handleReset = () => {
    setMessages([]);
    setStep("welcome");
    setFormData({ name: "", feedback: "" });
    setInput("");
    initializeConversation(addBotMessage, setIsTyping, setStep);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setMessages([]);
      setStep("welcome");
      setFormData({ name: "", feedback: "" });
      setInput("");
    }, 300);
  };

  return (
    <>
      {/* Bouton flottant */}
      <div className="fixed left-4 bottom-24 z-50 group">
        <Button
          size="icon"
          className="rounded-full h-12 w-12 shadow-xl bg-gradient-primary hover:opacity-90 transition-all hover:scale-105"
          onClick={() => setOpen(true)}
          aria-label="Feedback"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
        <span className="absolute -top-10 left-0 bg-popover text-popover-foreground px-3 py-1.5 rounded-lg text-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Feedbacks
        </span>
      </div>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg h-[600px] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogDescription className="sr-only">
            Chatbot pour recueillir vos avis sur Daily Routine
          </DialogDescription>
          <DialogHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-5 flex-row items-center justify-between space-y-0 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <BotMessageSquare className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-primary-foreground text-lg">
                  Assistant IA
                </DialogTitle>
                <p className="text-xs text-primary-foreground/80 mt-0.5">
                  Partagez votre avis
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Zone de messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] rounded-3xl px-4 py-3 ${
                    message.sender === "bot"
                      ? "bg-white dark:bg-gray-800 text-foreground shadow-md border border-border"
                      : "bg-primary text-primary-foreground shadow-lg"
                  }`}
                >
                  {message.sender === "bot" && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <BotMessageSquare className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      message.sender === "bot"
                        ? "text-muted-foreground"
                        : "text-primary-foreground/70"
                    }`}
                  >
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-3xl px-4 py-3 shadow-md border border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className="border-t border-border p-4 bg-background">
            {step === "submitted" ? (
              <div className="flex gap-2 flex-col">
                <Button
                  onClick={handleReset}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Donner un autre avis 💭
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Fermer
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                {step === "feedback" ? (
                  <Textarea
                    placeholder="Dis-moi tout... 👂"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={isSubmitting || isTyping}
                    className="min-h-[60px] resize-none"
                  />
                ) : (
                  <Input
                    placeholder="Ton pseudo..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={isSubmitting || isTyping}
                    className="flex-1"
                  />
                )}
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isSubmitting || isTyping}
                  size="icon"
                  className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
