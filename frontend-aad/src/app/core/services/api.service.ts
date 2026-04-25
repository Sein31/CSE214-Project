import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE = 'http://localhost:8081/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ── Auth ──────────────────────────────────────────────────────────────────
  me(): Observable<any> {
    return this.http.get(`${BASE}/auth/me`);
  }

  // ── Products ──────────────────────────────────────────────────────────────
  searchProducts(q: string, page = 0, size = 100): Observable<any> {
    const params = new HttpParams().set('q', q).set('page', page).set('size', size);
    return this.http.get(`${BASE}/products/search`, { params });
  }

  getProduct(id: number): Observable<any> {
    return this.http.get(`${BASE}/products/${id}`);
  }

  getStoreProducts(storeId: number, page = 0, size = 20): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get(`${BASE}/products/store/${storeId}`, { params });
  }

  createProduct(body: any): Observable<any> {
    return this.http.post(`${BASE}/products`, body);
  }

  updateProduct(id: number, body: any): Observable<any> {
    return this.http.put(`${BASE}/products/${id}`, body);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${BASE}/products/${id}`);
  }

  getLowStockProducts(storeId: number, threshold = 10): Observable<any> {
    return this.http.get(`${BASE}/products/store/${storeId}/low-stock?threshold=${threshold}`);
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  myOrders(page = 0, size = 20): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get(`${BASE}/orders/my`, { params });
  }

  getOrder(id: number): Observable<any> {
    return this.http.get(`${BASE}/orders/${id}`);
  }

  createOrder(body: any): Observable<any> {
    return this.http.post(`${BASE}/orders`, body);
  }

  getStoreOrders(storeId: number, page = 0, size = 20): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get(`${BASE}/orders/store/${storeId}`, { params });
  }

  updateOrderStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${BASE}/orders/${id}/status`, { status });
  }

  returnOrder(orderId: number): Observable<any> {
    return this.http.post(`${BASE}/orders/${orderId}/return`, {});
  }

  // ── Stores ────────────────────────────────────────────────────────────────
  myStore(): Observable<any> {
    return this.http.get(`${BASE}/stores/my`);
  }

  getStore(id: number): Observable<any> {
    return this.http.get(`${BASE}/stores/${id}`);
  }

  allStores(page = 0, size = 20): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get(`${BASE}/stores`, { params });
  }

  updateStoreStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${BASE}/stores/${id}/status`, { status });
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  adminDashboard(): Observable<any> {
    return this.http.get(`${BASE}/dashboard/admin`);
  }

  corporateDashboard(storeId: number): Observable<any> {
    return this.http.get(`${BASE}/dashboard/corporate/${storeId}`);
  }

  individualDashboard(): Observable<any> {
    return this.http.get(`${BASE}/dashboard/individual`);
  }

  // ── Users (Admin) ─────────────────────────────────────────────────────────
  allUsers(page = 0, size = 20): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get(`${BASE}/users`, { params });
  }

  getUser(id: number): Observable<any> {
    return this.http.get(`${BASE}/users/${id}`);
  }

  toggleUserStatus(id: number, isActive: boolean): Observable<any> {
    return this.http.patch(`${BASE}/users/${id}/status`, { isActive });
  }

  // ── Analytics ─────────────────────────────────────────────────────────────
  dailyRevenue(storeId: number, days = 30): Observable<any> {
    return this.http.get(`${BASE}/orders/store/${storeId}/analytics/daily?days=${days}`);
  }

  salesByCategory(storeId: number): Observable<any> {
    return this.http.get(`${BASE}/orders/store/${storeId}/analytics/categories`);
  }

  // ── Reviews ───────────────────────────────────────────────────────────────
  submitReview(body: any): Observable<any> {
    return this.http.post(`${BASE}/reviews`, body);
  }

  getAllReviews(): Observable<any> {
    return this.http.get(`${BASE}/reviews`);
  }

  // ── Shipments ─────────────────────────────────────────────────────────────
  getShipment(orderId: number): Observable<any> {
    return this.http.get(`${BASE}/shipments/order/${orderId}`);
  }

  createShipment(orderId: number, body: any): Observable<any> {
    return this.http.post(`${BASE}/shipments/order/${orderId}`, body);
  }

  updateShipmentStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${BASE}/shipments/${id}/status`, { status });
  }
}
