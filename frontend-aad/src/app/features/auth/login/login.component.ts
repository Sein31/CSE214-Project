import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  template: `
    <div class="login-wrap">
      <!-- Left panel -->
      <div class="left-panel">
        <div class="brand">
          <div class="brand-icon">DP</div>
          <span class="brand-name">DataPulse</span>
        </div>
        <h1>E-Commerce<br/><span class="gradient-text">Analytics Platform</span></h1>
        <p>Multi-Agent AI destekli e-ticaret analitik platformu. Verilerinizi doğal dilde sorgulayın.</p>

        <div class="features">
          <div class="feature-item">
            <div class="fi-icon">🤖</div>
            <div>
              <div class="fi-title">Multi-Agent AI</div>
              <div class="fi-desc">LangGraph ile 5 özelleşmiş ajan</div>
            </div>
          </div>
          <div class="feature-item">
            <div class="fi-icon">📊</div>
            <div>
              <div class="fi-title">Text2SQL Chatbot</div>
              <div class="fi-desc">Doğal dilde veritabanı sorguları</div>
            </div>
          </div>
          <div class="feature-item">
            <div class="fi-icon">🔒</div>
            <div>
              <div class="fi-title">Role-Based Access</div>
              <div class="fi-desc">Admin, Corporate, Individual</div>
            </div>
          </div>
        </div>

        <div class="tech-stack">
          <span class="tech-badge">Spring Boot</span>
          <span class="tech-badge">Angular</span>
          <span class="tech-badge">LangGraph</span>
          <span class="tech-badge">Gemini AI</span>
          <span class="tech-badge">MySQL</span>
        </div>
      </div>

      <!-- Right panel -->
      <div class="right-panel">
        <div class="login-card">
          <div class="card-header">
            <h2>Giriş Yap</h2>
            <p>DataPulse hesabınıza erişin</p>
          </div>

          <form (ngSubmit)="onLogin()" class="form">
            <div class="field">
              <label>E-posta</label>
              <div class="input-wrap">
                <span class="input-icon">✉️</span>
                <input type="email" [(ngModel)]="email" name="email"
                       placeholder="ornek@datapulse.com" required />
              </div>
            </div>
            <div class="field">
              <label>Şifre</label>
              <div class="input-wrap">
                <span class="input-icon">🔑</span>
                <input [type]="showPw?'text':'password'" [(ngModel)]="password" name="password"
                       placeholder="••••••••" required />
                <button type="button" (click)="showPw=!showPw" class="pw-toggle">
                  {{showPw?'🙈':'👁️'}}
                </button>
              </div>
            </div>

            <div *ngIf="error()" class="error-box">⚠️ {{error()}}</div>

            <button type="submit" class="login-btn" [disabled]="loading()">
              <span *ngIf="!loading()">Giriş Yap →</span>
              <span *ngIf="loading()" class="spinner">⟳</span>
            </button>
          </form>

          <!-- Demo accounts -->
          <div class="divider"><span>Demo Hesaplar</span></div>
          <div class="demo-btns">
            <button (click)="fillDemo('admin@datapulse.com','Admin')" class="demo-btn admin">
              👑 Admin
            </button>
            <button (click)="fillDemo('corp19@store19.com','Corporate')" class="demo-btn corp">
              🏢 Corporate
            </button>
            <button (click)="fillDemo('ali@gmail.com','Individual')" class="demo-btn ind">
              👤 Individual
            </button>
          </div>
          <p class="demo-note">Demo şifre: <code>Admin123!</code></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap { display:flex; min-height:100vh; }

    /* Left */
    .left-panel {
      flex:1; background:linear-gradient(135deg,#050a0e 0%,#0a1628 50%,#050a0e 100%);
      padding:48px; display:flex; flex-direction:column; justify-content:center;
      position:relative; overflow:hidden;
    }
    .left-panel::before {
      content:''; position:absolute; top:-100px; right:-100px;
      width:500px; height:500px;
      background:radial-gradient(circle,rgba(0,212,170,.1) 0%,transparent 70%);
    }
    .left-panel::after {
      content:''; position:absolute; bottom:-100px; left:-100px;
      width:400px; height:400px;
      background:radial-gradient(circle,rgba(0,150,255,.08) 0%,transparent 70%);
    }
    .brand { display:flex; align-items:center; gap:12px; margin-bottom:48px; }
    .brand-icon {
      width:44px; height:44px; border-radius:12px;
      background:linear-gradient(135deg,#00d4aa,#0096ff);
      display:flex; align-items:center; justify-content:center;
      font-weight:900; font-size:14px; color:#000;
    }
    .brand-name { font-size:20px; font-weight:700; color:#f0f6ff; }
    .left-panel h1 { font-size:44px; font-weight:800; color:#f0f6ff; line-height:1.15; margin-bottom:16px; }
    .gradient-text { background:linear-gradient(135deg,#00d4aa,#0096ff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .left-panel > p { color:#8ab4d4; font-size:16px; line-height:1.6; margin-bottom:40px; max-width:440px; }
    .features { display:flex; flex-direction:column; gap:16px; margin-bottom:36px; }
    .feature-item { display:flex; align-items:center; gap:14px; }
    .fi-icon { font-size:22px; width:44px; height:44px; background:rgba(0,212,170,.08); border:1px solid rgba(0,212,170,.15); border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .fi-title { font-size:14px; font-weight:600; color:#f0f6ff; }
    .fi-desc { font-size:12px; color:#4a6a8a; margin-top:2px; }
    .tech-stack { display:flex; flex-wrap:wrap; gap:8px; }
    .tech-badge { padding:5px 12px; background:rgba(0,150,255,.08); border:1px solid rgba(0,150,255,.2); border-radius:20px; font-size:12px; color:#8ab4d4; font-weight:500; }

    /* Right */
    .right-panel {
      width:480px; background:#050a0e; display:flex; align-items:center;
      justify-content:center; padding:40px; border-left:1px solid #1a3050;
    }
    .login-card { width:100%; }
    .card-header { margin-bottom:32px; }
    .card-header h2 { font-size:28px; font-weight:800; color:#f0f6ff; margin-bottom:6px; }
    .card-header p { color:#4a6a8a; font-size:14px; }
    .form { display:flex; flex-direction:column; gap:20px; margin-bottom:24px; }
    .field { display:flex; flex-direction:column; gap:8px; }
    label { font-size:13px; font-weight:600; color:#8ab4d4; }
    .input-wrap { position:relative; display:flex; align-items:center; background:#0a1628; border:1.5px solid #1a3050; border-radius:12px; overflow:hidden; transition:border-color .15s; }
    .input-wrap:focus-within { border-color:#00d4aa; }
    .input-icon { padding:0 14px; font-size:16px; flex-shrink:0; }
    .input-wrap input { flex:1; padding:14px 12px 14px 0; background:none; border:none; color:#f0f6ff; font-size:14px; outline:none; }
    .pw-toggle { padding:0 14px; background:none; border:none; cursor:pointer; font-size:16px; }
    .error-box { background:rgba(255,82,82,.1); border:1px solid rgba(255,82,82,.3); color:#ff5252; padding:12px 16px; border-radius:10px; font-size:13px; }
    .login-btn {
      padding:15px; background:linear-gradient(135deg,#00d4aa,#0096ff); color:#000;
      border:none; border-radius:12px; font-size:15px; font-weight:800;
      cursor:pointer; transition:opacity .15s; letter-spacing:.3px;
    }
    .login-btn:hover { opacity:.9; }
    .login-btn:disabled { opacity:.5; cursor:not-allowed; }
    .spinner { display:inline-block; animation:spin .6s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .divider { text-align:center; margin:20px 0; position:relative; }
    .divider::before { content:''; position:absolute; top:50%; left:0; right:0; height:1px; background:#1a3050; }
    .divider span { position:relative; background:#050a0e; padding:0 12px; color:#4a6a8a; font-size:12px; }
    .demo-btns { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:12px; }
    .demo-btn { padding:10px 8px; border-radius:10px; border:1.5px solid; cursor:pointer; font-size:12px; font-weight:700; transition:all .15s; }
    .demo-btn.admin { background:rgba(124,58,237,.1); border-color:rgba(124,58,237,.3); color:#a78bfa; }
    .demo-btn.corp  { background:rgba(0,150,255,.1);  border-color:rgba(0,150,255,.3);  color:#60a5fa; }
    .demo-btn.ind   { background:rgba(0,212,170,.1);  border-color:rgba(0,212,170,.3);  color:#00d4aa; }
    .demo-btn:hover { transform:translateY(-2px); }
    .demo-note { text-align:center; font-size:12px; color:#4a6a8a; }
    .demo-note code { color:#00d4aa; }
  `]
})
export class LoginComponent {
  email = ''; password = ''; showPw = false;
  loading = signal(false); error = signal('');

  constructor(private auth: AuthService) {}

  fillDemo(email: string, _role: string) {
    this.email = email;
    this.password = 'Admin123!';
  }

  onLogin() {
    this.loading.set(true); this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => { this.loading.set(false); this.auth.redirectByRole(); },
      error: (e) => { this.loading.set(false); this.error.set(e.error?.error || 'Giriş başarısız'); }
    });
  }
}
