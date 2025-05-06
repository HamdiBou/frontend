import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('token');
    const isApiUrl = request.url.startsWith(environment.apiUrl);

    // Skip adding token for login and register endpoints
    const isAuthEndpoint =
      request.url.includes('/users/login') ||
      request.url.includes('/users/register');

    console.log('Request URL:', request.url);
    console.log('Is API URL:', isApiUrl);
    console.log('Is Auth Endpoint:', isAuthEndpoint);
    console.log('Token exists:', !!token);

    // Add token only for API requests that are not auth endpoints
    if (token && isApiUrl && !isAuthEndpoint) {
      const authHeader = `Bearer ${token}`;
      console.log('Adding auth header:', authHeader);

      request = request.clone({
        setHeaders: {
          Authorization: authHeader
        }
      });

      // Log the final headers for debugging
      console.log('Final request headers:', request.headers.keys().map(key => `${key}: ${request.headers.get(key)}`));
    }

    // Return the handle with error catching for all requests
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401) {
          console.log('401 Unauthorized error detected for URL:', request.url);
          console.log('Error details:', error);

          // Don't automatically logout during debugging
          // this.authService.logout();
          // this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
