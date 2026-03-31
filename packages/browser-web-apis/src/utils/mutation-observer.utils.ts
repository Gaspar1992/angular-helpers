import { Observable } from 'rxjs';

export interface MutationObserverOptions {
  childList?: boolean;
  attributes?: boolean;
  characterData?: boolean;
  subtree?: boolean;
  attributeOldValue?: boolean;
  characterDataOldValue?: boolean;
  attributeFilter?: string[];
}

const DEFAULT_OPTIONS: MutationObserverOptions = {
  childList: true,
  attributes: true,
  characterData: false,
  subtree: true,
};

export function isMutationObserverSupported(): boolean {
  return typeof MutationObserver !== 'undefined';
}

export function mutationObserverStream(
  element: Node,
  options: MutationObserverOptions = DEFAULT_OPTIONS,
): Observable<MutationRecord[]> {
  return new Observable<MutationRecord[]>((subscriber) => {
    const observer = new MutationObserver((mutations) => {
      subscriber.next(mutations);
    });

    observer.observe(element, options);

    return () => observer.disconnect();
  });
}
