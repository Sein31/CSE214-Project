import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

const BASE = 'http://localhost:8081/api/auth';

export interface CurrentUser {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  currentUser = signal<CurrentUser | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    // Sayfa yenilenince token'dan user restore et
    const token = localStorage.getItem('token');
    const user  = localStorage.getItem('user');
    if (token && user) {
      try { this.currentUser.set(JSON.parse(user)); } catch {}
    }
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${BASE}/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken || '');
        const user: CurrentUser = {
          userId:    res.userId,
          email:     res.email,
          firstName: res.firstName,
          lastName:  res.lastName,
          role:      res.role,
        };
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string {
    return this.currentUser()?.role || '';
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUser();
  }

  redirectByRole() {
    const role = this.getRole();
    if (role === 'ADMIN')      this.router.navigate(['/admin']);
    else if (role === 'CORPORATE') this.router.navigate(['/corporate/dashboard']);
    else                           this.router.navigate(['/shop']);
  }
}
