import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-corporate-shipments',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, DatePipe, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <h2>🚚 Kargo Yönetimi</h2>
        <p class="sub">Siparişlerinizin kargo durumlarını takip edin ve güncelleyin.</p>
        
        <div class="card" *ngIf="orders().length > 0; else noOrders">
          <table class="tbl">
            <thead>
              <tr><th>Sipariş ID</th><th>Durum</th><th>Toplam</th><th>Kargo No (Varsayılan)</th><th>İşlem</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let o of orders()">
                <td class="tid">#{{o.id}}</td>
                <td><span class="badge" [class]="o.status">{{o.status}}</span></td>
                <td>{{o.grandTotal | number:'1.2-2'}} ₺</td>
                <td>TRK-{{o.id}}-{{o.id*7}}</td>
                <td>
                  <button class="btn" *ngIf="o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PROCESSING'" (click)="ship(o.id)">Kargoya Ver</button>
                  <button class="btn green" *ngIf="o.status === 'SHIPPED'" (click)="deliver(o.id)">Teslim Edildi İşaretle</button>
                  <span *ngIf="o.status === 'DELIVERED'">Tamamlandı</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noOrders><div class="card"><p>Henüz kargo bekleyen siparişiniz yok.</p></div></ng-template>
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#0f1117}
    .main{margin-left:240px;flex:1;padding:32px;color:#e2e8f0}
    h2{font-size:28px;font-weight:700;color:#fff;margin:0 0 4px}
    .sub{color:#64748b;font-size:14px;margin:0 0 24px}
    .card{background:#161b2e;border:1px solid #1e2535;border-radius:12px;padding:24px}
    .tbl{width:100%;border-collapse:collapse;margin-top:16px}
    .tbl th{text-align:left;padding:12px;color:#64748b;border-bottom:1px solid #1e2535;font-size:13px}
    .tbl td{padding:16px 12px;border-bottom:1px solid #1e2535;font-size:14px}
    .tid{color:#6366f1;font-family:monospace;font-weight:700}
    .badge{padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600}
    .PENDING{background:rgba(251,191,36,.15);color:#fbbf24}
    .SHIPPED{background:rgba(96,165,250,.15);color:#60a5fa}
    .DELIVERED{background:rgba(34,197,94,.15);color:#4ade80}
    .btn{padding:6px 12px;background:#6366f1;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px}
    .btn.green{background:#22c55e}
  `]
})
export class CorporateShipmentsComponent implements OnInit {
  orders = signal<any[]>([]);
  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: '🏠', path: '/corporate/dashboard' },
    { label: 'AI Asistan', icon: '🤖', path: '/chat' },
    { label: 'Analitik',   icon: '📈', path: '/corporate/analytics' },
    { label: 'Siparişler', icon: '🛒', path: '/corporate/orders' },
    { label: 'Ürünler',    icon: '📦', path: '/corporate/products' },
    { label: 'Müşteriler', icon: '👥', path: '/corporate/customers' },
    { label: 'Kargo',      icon: '🚚', path: '/corporate/shipments' },
    { label: 'Yorumlar',   icon: '⭐', path: '/corporate/reviews' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.myStore().subscribe((stores: any) => {
      if (stores?.length) {
        this.api.getStoreOrders(stores[0].id).subscribe((data: any) => {
          this.orders.set(data.content || data);
        });
      }
    });
  }

  ship(orderId: number) {
    this.api.updateOrderStatus(orderId, 'SHIPPED').subscribe(() => this.load());
  }

  deliver(orderId: number) {
    this.api.updateOrderStatus(orderId, 'DELIVERED').subscribe(() => this.load());
  }
}
