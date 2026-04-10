import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-docs-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './docs-landing.component.html',
  styleUrls: ['./docs-landing.component.css'],
})
export class DocsLandingComponent {}
