import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User, LoginDTO, UserDTO } from '../models/user.model';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<UserDTO | null>;
  public currentUser$: Observable<UserDTO | null>;
  private apiUrl = environment.apiUrl;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
  };

  constructor(private http: HttpClient, private router: Router) {
    this.currentUserSubject = new BehaviorSubject<UserDTO | null>(this.getUserFromStorage());
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): UserDTO | null {
    return this.currentUserSubject.value;
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    return this.http.post<{ token: string }>(`${this.apiUrl}/users/login`, credentials, { headers })
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('token', response.token);
          }
        }),
        catchError(error => {
          console.error('Login error details:', error);
          return throwError(() => error);
        })
      );
  }

  register(user: User): Observable<UserDTO> {
    return this.http.post<UserDTO>(`${this.apiUrl}/users/register`, user, this.httpOptions)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getCurrentUser(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiUrl}/users/me`, this.httpOptions)
      .pipe(
        tap(user => {
          localStorage.setItem('current_user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  setCurrentUser(user: UserDTO): void {
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  updateUser(user: User): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.apiUrl}/users/me`, user, this.httpOptions)
      .pipe(
        tap(updatedUser => {
          localStorage.setItem('current_user', JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  private getUserFromStorage(): UserDTO | null {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        localStorage.removeItem('current_user');
        return null;
      }
    }
    return null;
  }
}
