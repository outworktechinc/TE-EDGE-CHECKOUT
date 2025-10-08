/**
 * Angular Environment Adapter Service
 * Use this service in your Angular application
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvironmentAdapter, GatewayConfig } from '@your-org/payment-gateway';
import { environment } from '../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentAdapterService implements EnvironmentAdapter {
  private config: GatewayConfig = {
    stripePublishableKey: environment.stripePublishableKey,
    authorizeNetClientKey: environment.authorizeNetClientKey,
    authorizeNetApiLoginId: environment.authorizeNetApiLoginId,
    braintreeClientTokenUrl: '/api/braintree/token',
    apiBaseUrl: environment.apiBaseUrl
  };

  constructor(private http: HttpClient) {}

  getConfig(key: keyof GatewayConfig): string | undefined {
    return this.config[key];
  }

  isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    try {
      const method = (options?.method || 'GET').toUpperCase();
      const headers = new HttpHeaders(options?.headers as any);

      let body: any = undefined;
      if (options?.body) {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      }

      const response = await firstValueFrom(
        this.http.request(method, url, {
          body,
          headers,
          observe: 'response',
          responseType: 'json'
        })
      );

      // Convert Angular HttpResponse to standard Response
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(
          Array.from(response.headers.keys()).reduce((acc, key) => {
            acc[key] = response.headers.get(key) || '';
            return acc;
          }, {} as Record<string, string>)
        )
      });
    } catch (error: any) {
      // Convert Angular HttpError to Response
      const status = error.status || 500;
      const statusText = error.statusText || 'Internal Server Error';
      const body = error.error || { error: 'Request failed' };

      return new Response(JSON.stringify(body), {
        status,
        statusText,
        headers: new Headers()
      });
    }
  }
}
