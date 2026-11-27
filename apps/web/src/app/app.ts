import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNavComponent } from './shared/nav/app-nav.component';
import { SearchModalComponent } from './shared/components/search-modal/search-modal.component';
import { SearchService } from './core/services/search.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNavComponent, SearchModalComponent],
  host: {
    '(window:keydown)': 'onWindowKeydown($event)',
  },
  templateUrl: './app.html',
})
export class App {
  protected readonly search = inject(SearchService);

  onWindowKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.search.toggle();
    }
  }
}
