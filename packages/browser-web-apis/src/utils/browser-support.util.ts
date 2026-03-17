import { inject } from '@angular/core';

export class BrowserSupportUtil {
  static isSupported(feature: string): boolean {
    switch (feature) {
      case 'permissions':
        return 'permissions' in navigator;
      case 'camera':
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      case 'microphone':
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      case 'geolocation':
        return 'geolocation' in navigator;
      case 'notifications':
        return 'Notification' in window;
      case 'clipboard':
        return 'clipboard' in navigator;
      case 'clipboard-read':
        return 'clipboard' in navigator && 'readText' in navigator.clipboard;
      case 'clipboard-write':
        return 'clipboard' in navigator && 'writeText' in navigator.clipboard;
      case 'persistent-storage':
        return 'storage' in navigator && 'persist' in navigator.storage;
      default:
        return false;
    }
  }

  static getUnsupportedFeatures(): string[] {
    const features = [
      'permissions',
      'camera',
      'microphone',
      'geolocation',
      'notifications',
      'clipboard',
      'clipboard-read',
      'clipboard-write',
      'persistent-storage'
    ];
    
    return features.filter(feature => !this.isSupported(feature));
  }

  static isSecureContext(): boolean {
    return window.isSecureContext;
  }

  static getUserAgent(): string {
    return navigator.userAgent;
  }

  static isMobile(): boolean {
    const userAgent = this.getUserAgent().toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  }

  static isDesktop(): boolean {
    return !this.isMobile();
  }

  static getBrowserInfo(): {
    name: string;
    version: string;
    isChrome: boolean;
    isFirefox: boolean;
    isSafari: boolean;
    isEdge: boolean;
  } {
    const userAgent = this.getUserAgent();
    
    return {
      name: this.getBrowserName(userAgent),
      version: this.getBrowserVersion(userAgent),
      isChrome: /chrome/.test(userAgent) && !/edge/.test(userAgent),
      isFirefox: /firefox/.test(userAgent),
      isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
      isEdge: /edge/.test(userAgent) || /edg/.test(userAgent)
    };
  }

  private static getBrowserName(userAgent: string): string {
    if (/chrome/.test(userAgent) && !/edge/.test(userAgent)) return 'Chrome';
    if (/firefox/.test(userAgent)) return 'Firefox';
    if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) return 'Safari';
    if (/edge/.test(userAgent) || /edg/.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  private static getBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(chrome|firefox|safari|edge|edg)\/(\d+)/i);
    return match ? match[2] : 'Unknown';
  }
}
