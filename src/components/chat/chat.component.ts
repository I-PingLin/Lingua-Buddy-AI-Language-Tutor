import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, input, signal, ViewChild, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { Chat } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  content: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  language = input.required<string>();
  
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  private geminiService = inject(GeminiService);

  messages: WritableSignal<Message[]> = signal([]);
  userInput = signal('');
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  private chat: WritableSignal<Chat | null> = signal(null);

  constructor() {
    effect(() => {
      const lang = this.language();
      this.initializeChat(lang);
    }, { allowSignalWrites: true });

    effect(() => {
      if (this.messages().length > 0) {
        this.scrollToBottom();
      }
    });
  }

  private initializeChat(language: string) {
    this.isLoading.set(true);
    this.error.set(null);
    this.messages.set([]);
    try {
      this.chat.set(this.geminiService.startChat(language));
      this.startConversation();
    } catch (e) {
      console.error("Failed to initialize chat", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      this.error.set(`Failed to initialize AI Tutor. Please check your API key and refresh. Error: ${errorMessage}`);
      this.isLoading.set(false);
    }
  }

  private async startConversation() {
    const chatInstance = this.chat();
    if (!chatInstance) return;

    try {
      const result = await chatInstance.sendMessageStream({ message: "Hello!" });
      this.messages.update(m => [...m, { role: 'model', content: '' }]);
      
      for await (const chunk of result) {
        const chunkText = chunk.text;
        this.messages.update(currentMessages => {
          const lastMessage = currentMessages[currentMessages.length - 1];
          lastMessage.content += chunkText;
          return [...currentMessages];
        });
      }
    } catch (e) {
      console.error("Failed to start conversation", e);
      this.error.set('An error occurred while communicating with the AI. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onInputChange(event: Event) {
    const inputElement = event.target as HTMLTextAreaElement;
    this.userInput.set(inputElement.value);
  }

  async sendMessage() {
    const currentInput = this.userInput().trim();
    if (!currentInput || this.isLoading()) return;

    const chatInstance = this.chat();
    if (!chatInstance) {
      this.error.set("Chat is not initialized.");
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.messages.update(m => [...m, { role: 'user', content: currentInput }]);
    this.userInput.set('');

    try {
      const result = await chatInstance.sendMessageStream({ message: currentInput });
      this.messages.update(m => [...m, { role: 'model', content: '' }]);

      for await (const chunk of result) {
        const chunkText = chunk.text;
        this.messages.update(currentMessages => {
          const lastMessage = currentMessages[currentMessages.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.content += chunkText;
          }
          return [...currentMessages];
        });
      }
    } catch (e) {
      console.error("Failed to send message", e);
      this.error.set('An error occurred. Please try sending your message again.');
      this.messages.update(currentMessages => {
        if(currentMessages.length > 0 && currentMessages[currentMessages.length-1].role === 'model' && currentMessages[currentMessages.length-1].content === ''){
          return currentMessages.slice(0, -1);
        }
        return currentMessages;
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
        try {
            if (this.chatContainer?.nativeElement) {
                this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
            }
        } catch (err) { 
            console.error('Could not scroll to bottom:', err);
        }
    }, 0);
  }
}
