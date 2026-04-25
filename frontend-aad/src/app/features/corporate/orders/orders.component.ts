import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, DatePipe, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <h2>Sipariş Yönetimi 🛒</h2>
        <div class="card">
          <table class="table" *ngIf="orders()?.content?.length; else empty">
            <thead>
              <tr><th>Sipariş ID</th><th>Müşteri</th><th>Tutar</th><th>Durum</th><th>Tarih</th><th>İşlem</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let o of orders().content">
                <td class="id">#{{o.id}}</td>
                <td>Kullanıcı {{o.user?.id}}</td>
                <td class="price">{{o.grandTotal | number:'1.2-2'}} ₺</td>
                <td><span [class]="'badge '+statusClass(o.status)">{{o.status}}</span></td>
                <td class="date">{{o.orderedAt | date:'dd.MM.yyyy'}}</td>
                <td>
                  <select (change)="updateStatus(o.id, $any($event.target).value)" class="status-select">
                    <option value="">Durum Güncelle</option>
                    <option *ngFor="let s of statuses" [value]="s">{{s}}</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
          <ng-template #empty><div class="empty">Sipariş bulunamadı</div></ng-template>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#0f1117}
    .main{margin-left:240px;flex:1;padding:32px;color:#e2e8f0}
    h2{font-size:28px;font-weight:700;color:#fff;margin:0 0 24px}
    .card{background:#161b2e;border:1px solid #1e2535;border-radius:12px;padding:24px}
    .table{width:100%;border-collapse:collapse}
    .table th{text-align:left;padding:12px;color:#64748b;font-size:12px;font-weight:600;border-bottom:1px solid #1e2535}
    .table td{padding:12px;border-bottom:1px solid #1e2535;font-size:14px}
    .id{color:#64748b;font-family:monospace}
    .price{color:#4ade80;font-weight:600}
    .date{color:#64748b;font-size:12px}
    .badge{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
    .delivered{background:#0d2e1a;color:#4ade80}
    .pending{background:#3d2000;color:#fbbf24}
    .cancelled{background:#2d1515;color:#fc8181}
    .other{background:#1e2535;color:#94a3b8}
    .status-select{background:#1e2535;color:#94a3b8;border:1px solid #2d3748;border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer}
    .empty{text-align:center;color:#64748b;padding:48px}
  `]
})
export class OrdersComponent implements OnInit {
  orders = signal<any>(null);
  statuses = ['CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'];
  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: '🏠', path: '/corporate/dashboard' },
    { label: 'Ürünler',    icon: '📦', path: '/corporate/products' },
    { label: 'Siparişler', icon: '🛒', path: '/corporate/orders' },
    { label: 'AI Asistan', icon: '🤖', path: '/chat' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.myStore().subscribe(stores => {
      if (stores?.length) {
        this.api.getStoreOrders(stores[0].id).subscribe(data => this.orders.set(data));
      }
    });
  }

  statusClass(s: string) {
    if (s === 'DELIVERED') return 'delivered';
    if (s === 'PENDING' || s === 'CONFIRMED') return 'pending';
    if (s === 'CANCELLED') return 'cancelled';
    return 'other';
  }

  updateStatus(id: number, status: string) {
    if (!status) return;
    this.api.updateOrderStatus(id, status).subscribe(() => {
      if (status === 'SHIPPED') {
        this.api.createShipment(id, { carrier: 'Yurtiçi Kargo', mode: 'ROAD', level: 'STANDARD' }).subscribe({
          next: () => this.ngOnInit(),
          error: () => this.ngOnInit() // Zaten varsa yoksay
        });
      } else {
        this.ngOnInit();
      }
    });
  }
}
