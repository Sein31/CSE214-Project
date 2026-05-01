import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

declare var Stripe: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, FormsModule],
  template: `
    <div class="checkout-overlay" (click)="onCancel()">
      <div class="checkout-modal" (click)="$event.stopPropagation()">

        <div class="checkout-header">
          <h2>💳 Ödeme</h2>
          <button class="close-btn" (click)="onCancel()">✕</button>
        </div>

        <!-- Sipariş özeti -->
        <div class="order-summary">
          <div class="summary-row" *ngFor="let item of items">
            <span>{{item.name}} x{{item.qty}}</span>
            <span>{{item.price * item.qty | number:'1.2-2'}} ₺</span>
          </div>
          <div class="summary-total">
            <strong>Toplam</strong>
            <strong>{{total | number:'1.2-2'}} ₺</strong>
          </div>
        </div>

        <!-- Test kart bilgisi -->
        <div class="test-card-info">
          <div class="test-badge">🧪 Test Modu</div>
          <p>Test kartı: <code>4242 4242 4242 4242</code></p>
          <p>Son kullanma: Herhangi gelecek tarih | CVV: Herhangi 3 hane</p>
        </div>

        <!-- Stripe Elements -->
        <div class="card-form">
          <label>Kart Bilgileri</label>
          <div id="card-element" class="stripe-element"></div>
          <div id="card-errors" class="card-error" *ngIf="cardError()">{{cardError()}}</div>
        </div>

        <div class="cardholder">
          <label>Kart Sahibi</label>
          <input [(ngModel)]="cardholderName" placeholder="Ad Soyad" class="name-input" />
        </div>

        <!-- Ödeme butonu -->
        <button class="pay-btn"
                (click)="pay()"
                [disabled]="loading() || !cardholderName">
          <span *ngIf="!loading()">🔒 {{total | number:'1.2-2'}} ₺ Öde</span>
          <span *ngIf="loading()">⏳ İşleniyor...</span>
        </button>

        <!-- Başarı -->
        <div *ngIf="success()" class="success-msg">
          ✅ Ödeme başarılı! Siparişiniz oluşturuldu.
        </div>

        <div class="secure-badges">
          <span>🔒 SSL Güvenli</span>
          <span>💳 Stripe ile güvenli ödeme</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:500}
    .checkout-modal{background:#161b2e;border:1px solid #2d3748;border-radius:20px;padding:36px;width:480px;max-width:95vw}
    .checkout-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
    .checkout-header h2{color:#fff;font-size:22px;margin:0}
    .close-btn{background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer}
    .order-summary{background:#0f1117;border-radius:12px;padding:16px;margin-bottom:20px}
    .summary-row{display:flex;justify-content:space-between;color:#94a3b8;font-size:14px;padding:6px 0;border-bottom:1px solid #1e2535}
    .summary-row:last-of-type{border:none}
    .summary-total{display:flex;justify-content:space-between;color:#fff;font-size:16px;padding-top:12px;margin-top:8px;border-top:2px solid #2d3748}
    .test-card-info{background:#0d2e1a;border:1px solid #22c55e;border-radius:10px;padding:12px 16px;margin-bottom:20px}
    .test-badge{background:#22c55e;color:#0d2e1a;display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;margin-bottom:8px}
    .test-card-info p{margin:4px 0;color:#4ade80;font-size:13px}
    code{background:#1e2535;padding:2px 8px;border-radius:4px;color:#a78bfa;font-family:monospace}
    .card-form{margin-bottom:16px}
    label{display:block;color:#94a3b8;font-size:13px;font-weight:500;margin-bottom:8px}
    .stripe-element{background:#0f1117;border:1px solid #2d3748;border-radius:10px;padding:14px;min-height:20px;position:relative;cursor:text}
    .stripe-element iframe{pointer-events:auto}
    .card-error{color:#fc8181;font-size:13px;margin-top:8px}
    .cardholder{margin-bottom:20px}
    .name-input{width:100%;padding:12px 16px;background:#0f1117;border:1px solid #2d3748;border-radius:10px;color:#fff;font-size:14px;outline:none;box-sizing:border-box}
    .name-input:focus{border-color:#667eea}
    .pay-btn{width:100%;padding:16px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;transition:opacity .2s;margin-bottom:16px}
    .pay-btn:hover{opacity:.9}
    .pay-btn:disabled{opacity:.5;cursor:not-allowed}
    .success-msg{background:#0d2e1a;color:#4ade80;border:1px solid #22c55e;padding:14px;border-radius:10px;text-align:center;font-weight:600;margin-bottom:16px}
    .secure-badges{display:flex;justify-content:center;gap:20px;color:#4a5568;font-size:12px}
  `]
})
export class CheckoutComponent implements OnInit {
  @Input() items: Array<{id:number, name:string, price:number, qty:number, storeId:number}> = [];
  @Input() total = 0;
  @Output() cancelled  = new EventEmitter<void>();
  @Output() completed  = new EventEmitter<void>();

  private stripe: any;
  private cardElement: any;
  cardholderName = '';
  loading = signal(false);
  success = signal(false);
  cardError = signal('');

  private readonly PUBLISHABLE_KEY = 'pk_test_51TL5pPFfeQKivCCuxxmZG2VCeucgc4t1vk6jYD7wDv7gF5mhxWiQHT2YnvLIXOaaADmK6PXjCrPZO4G7bboVi73h00GkdZXPxF';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadStripe();
  }

  loadStripe() {
    const existingScript = document.querySelector('script[src*="js.stripe.com"]');
    if (existingScript) {
      if ((window as any).Stripe) {
        this.initStripe();
      } else {
        existingScript.addEventListener('load', () => this.initStripe());
      }
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/?advancedFraudSignals=false';
    script.onload = () => this.initStripe();
    document.head.appendChild(script);
  }

  initStripe() {
    this.stripe = Stripe(this.PUBLISHABLE_KEY, {
      locale: 'tr',
    });
    const elements = this.stripe.elements({
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#667eea',
          colorBackground: '#0f1117',
          colorText: '#e2e8f0',
          colorDanger: '#fc8181',
          borderRadius: '10px',
        }
      }
    });
    this.cardElement = elements.create('card', {
      disableLink: true,
      style: {
        base: {
          color: '#e2e8f0',
          fontSize: '15px',
          fontSmoothing: 'antialiased',
          '::placeholder': { color: '#4a5568' },
        },
        invalid: {
          color: '#fc8181',
          iconColor: '#fc8181',
        },
      },
    });
    setTimeout(() => {
      this.cardElement.mount('#card-element');
    });
    this.cardElement.on('change', (event: any) => {
      this.cardError.set(event.error ? event.error.message : '');
    });
  }

  pay() {
    if (this.loading()) return;
    this.loading.set(true);
    this.cardError.set('');

    // 1. Backend'den PaymentIntent al
    this.http.post<any>('http://localhost:8081/api/payment/create-intent', {
      amount: this.total,
      currency: 'try'
    }).subscribe({
      next: (res) => this.confirmPayment(res.clientSecret, res.paymentIntentId),
      error: (e) => {
        this.cardError.set(e.error?.error || 'Ödeme başlatılamadı');
        this.loading.set(false);
      }
    });
  }

  private confirmPayment(clientSecret: string, paymentIntentId: string) {
    // 2. Stripe ile kartı onayla
    this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: this.cardElement,
        billing_details: { name: this.cardholderName }
      }
    }).then((result: any) => {
      if (result.error) {
        this.cardError.set(result.error.message);
        this.loading.set(false);
        return;
      }

      // 3. Sipariş oluştur
      this.http.post<any>('http://localhost:8081/api/payment/confirm-and-order', {
        paymentIntentId,
        storeId: this.items[0]?.storeId,
        items: this.items.map(i => ({ productId: i.id, quantity: i.qty }))
      }).subscribe({
        next: () => {
          this.success.set(true);
          this.loading.set(false);
          setTimeout(() => this.completed.emit(), 2000);
        },
        error: () => {
          this.cardError.set('Ödeme alındı fakat sipariş oluşturulamadı.');
          this.loading.set(false);
        }
      });
    });
  }

  onCancel() { this.cancelled.emit(); }
}
