import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ChatComponent } from './components/chat/chat.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [ChatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'Lingua Buddy';
  languages = ['Spanish', 'French', 'German', 'Japanese', 'Italian', 'Portuguese'];
  selectedLanguage = signal(this.languages[0]);

  onLanguageChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedLanguage.set(selectElement.value);
  }
}
