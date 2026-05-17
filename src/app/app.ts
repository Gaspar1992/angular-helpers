import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNavComponent } from './shared/nav/app-nav.component';
import { SearchModalComponent } from './shared/components/search-modal/search-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNavComponent, SearchModalComponent],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('angular-helpers');
}
