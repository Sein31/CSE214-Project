import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-corporate-customers',
  standalone: true,
  imports: [NgIf, NgFor, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <h2>👥 Müşteriler</h2>
        <p class="sub">Mağazanızdan alışveriş yapan tekil müşterilerin listesi.</p>
        
        <div class="card" *ngIf="customers().length > 0; else noCustomers">
          <table class="tbl">
            <thead>
              <tr><th>Müşteri ID</th><th>Ad Soyad</th><th>Email</th><th>Toplam Sipariş (Sizin Mağazada)</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of customers()">
                <td class="tid">#{{c.id}}</td>
                <td>{{c.name}} {{c.surname}}</td>
                <td>{{c.email}}</td>
                <td><span class="badge blue">{{c.orderCount}} Sipariş</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noCustomers><div class="card"><p>Henüz mağazanızdan alışveriş yapan bir müşteri bulunmuyor.</p></div></ng-template>
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
    .tid{color:#6366f1;font-weight:700}
    .badge{padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600}
    .badge.blue{background:rgba(96,165,250,.15);color:#60a5fa}
  `]
})
export class CorporateCustomersComponent implements OnInit {
  customers = signal<any[]>([]);
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

  ngOnInit() {
    this.api.myStore().subscribe((stores: any) => {
      if (stores?.length) {
        this.api.getStoreOrders(stores[0].id).subscribe((data: any) => {
          const orders = data.content || data;
          this.extractCustomers(orders);
        });
      }
    });
  }

  private extractCustomers(orders: any[]) {
    // Siparişlerden benzersiz kullanıcıları çıkar ve sipariş sayılarını hesapla
    const customerMap = new Map<number, any>();

    orders.forEach(order => {
      if (order.user) {
        if (customerMap.has(order.user.id)) {
          customerMap.get(order.user.id).orderCount += 1;
        } else {
          customerMap.set(order.user.id, {
            ...order.user,
            orderCount: 1
          });
        }
      }
    });

    this.customers.set(Array.from(customerMap.values()));
  }
}
