import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, FormsModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <div class="header">
          <div>
            <h2>Ürün Kataloğu 📦</h2>
            <p class="subtitle">Mağazanızdaki ürünleri yönetin</p>
          </div>
          <button class="btn-primary" (click)="showForm=true">+ Yeni Ürün</button>
        </div>

        <!-- Add Product Form -->
        <div *ngIf="showForm" class="modal-overlay" (click)="showForm=false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Yeni Ürün Ekle</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Ürün Adı</label>
                <input [(ngModel)]="newProduct.name" placeholder="Ürün adı" />
              </div>
              <div class="form-group">
                <label>SKU</label>
                <input [(ngModel)]="newProduct.sku" placeholder="SKU-001" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Fiyat (₺)</label>
                <input type="number" [(ngModel)]="newProduct.unitPrice" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label>Stok</label>
                <input type="number" [(ngModel)]="newProduct.stockQuantity" placeholder="0" />
              </div>
            </div>
            <div class="form-group">
              <label>Açıklama</label>
              <textarea [(ngModel)]="newProduct.description" placeholder="Ürün açıklaması..."></textarea>
            </div>
            <div class="modal-actions">
              <button class="btn-secondary" (click)="showForm=false">İptal</button>
              <button class="btn-primary" (click)="createProduct()">Kaydet</button>
            </div>
          </div>
        </div>

        <!-- Products Table -->
        <div class="card">
          <div *ngIf="products()?.content?.length; else empty">
            <table class="table">
              <thead>
                <tr>
                  <th>SKU</th><th>Ürün Adı</th><th>Fiyat</th><th>Stok</th><th>Önem</th><th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of products().content">
                  <td class="sku">{{p.sku}}</td>
                  <td>{{p.name}}</td>
                  <td class="price">{{p.unitPrice | number:'1.2-2'}} ₺</td>
                  <td>
                    <span [class]="p.stockQuantity < 10 ? 'badge danger' : 'badge success'">
                      {{p.stockQuantity}}
                    </span>
                  </td>
                  <td><span class="badge">{{p.importance}}</span></td>
                  <td>
                    <button class="btn-sm danger" (click)="deleteProduct(p.id)">Sil</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination">
              <button (click)="prevPage()" [disabled]="page===0">‹ Önceki</button>
              <span>Sayfa {{page+1}}</span>
              <button (click)="nextPage()" [disabled]="!products()?.content?.length || products().content.length < 20">Sonraki ›</button>
            </div>
          </div>
          <ng-template #empty>
            <div class="empty-state">Henüz ürün yok</div>
          </ng-template>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#0f1117}
    .main{margin-left:240px;flex:1;padding:32px;color:#e2e8f0}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
    h2{font-size:28px;font-weight:700;color:#fff;margin:0 0 4px}
    .subtitle{color:#64748b;font-size:14px;margin:0}
    .card{background:#161b2e;border:1px solid #1e2535;border-radius:12px;padding:24px}
    .table{width:100%;border-collapse:collapse}
    .table th{text-align:left;padding:12px;color:#64748b;font-size:12px;font-weight:600;border-bottom:1px solid #1e2535}
    .table td{padding:12px;border-bottom:1px solid #1e2535;font-size:14px}
    .table tr:last-child td{border:none}
    .sku{color:#64748b;font-family:monospace;font-size:12px}
    .price{color:#4ade80;font-weight:600}
    .badge{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#1e2535;color:#94a3b8}
    .badge.success{background:#0d2e1a;color:#4ade80}
    .badge.danger{background:#2d1515;color:#fc8181}
    .btn-primary{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:600}
    .btn-secondary{background:#1e2535;color:#94a3b8;border:none;padding:10px 20px;border-radius:8px;cursor:pointer}
    .btn-sm{padding:4px 10px;border:none;border-radius:6px;cursor:pointer;font-size:12px}
    .btn-sm.danger{background:#2d1515;color:#fc8181}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:100}
    .modal{background:#161b2e;border:1px solid #1e2535;border-radius:16px;padding:32px;width:560px;max-width:90vw}
    .modal h3{color:#fff;font-size:20px;margin:0 0 24px}
    .form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .form-group{margin-bottom:16px}
    label{display:block;color:#94a3b8;font-size:13px;margin-bottom:6px}
    input,textarea{width:100%;padding:10px 14px;background:#0f1117;border:1px solid #1e2535;border-radius:8px;color:#fff;font-size:14px;outline:none;box-sizing:border-box}
    textarea{height:80px;resize:vertical}
    .modal-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:8px}
    .pagination{display:flex;justify-content:center;align-items:center;gap:16px;margin-top:20px}
    .pagination button{padding:8px 16px;background:#1e2535;color:#94a3b8;border:none;border-radius:8px;cursor:pointer}
    .pagination button:disabled{opacity:.4;cursor:not-allowed}
    .empty-state{text-align:center;color:#64748b;padding:48px}
  `]
})
export class ProductsComponent implements OnInit {
  products  = signal<any>(null);
  showForm  = false;
  page      = 0;
  storeId!: number;
  newProduct: any = { name:'', sku:'', unitPrice:0, stockQuantity:0, description:'', importance:'MEDIUM' };

  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: '🏠', path: '/corporate/dashboard' },
    { label: 'Ürünler',    icon: '📦', path: '/corporate/products' },
    { label: 'Siparişler', icon: '🛒', path: '/corporate/orders' },
    { label: 'AI Asistan', icon: '🤖', path: '/chat' },
  ];

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.api.myStore().subscribe(stores => {
      if (stores?.length) {
        this.storeId = stores[0].id;
        this.load();
      }
    });
  }

  load() {
    this.api.getStoreProducts(this.storeId, this.page).subscribe(data => this.products.set(data));
  }

  createProduct() {
    this.api.createProduct({ ...this.newProduct, storeId: this.storeId }).subscribe(() => {
      this.showForm = false;
      this.newProduct = { name:'', sku:'', unitPrice:0, stockQuantity:0, description:'', importance:'MEDIUM' };
      this.load();
    });
  }

  deleteProduct(id: number) {
    if (confirm('Ürünü silmek istiyor musunuz?')) {
      this.api.deleteProduct(id).subscribe(() => this.load());
    }
  }

  nextPage() { this.page++; this.load(); }
  prevPage() { if (this.page > 0) { this.page--; this.load(); } }
}
