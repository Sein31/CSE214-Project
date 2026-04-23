import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },

  // Admin
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users',      loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'stores',     loadComponent: () => import('./features/admin/stores/admin-stores.component').then(m => m.AdminStoresComponent) },
      { path: 'categories', loadComponent: () => import('./features/admin/categories/admin-categories.component').then(m => m.AdminCategoriesComponent) },
      { path: 'logs',       loadComponent: () => import('./features/admin/categories/admin-categories.component').then(m => m.AdminLogsComponent) },
    ]
  },

  // Corporate
  {
    path: 'corporate',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CORPORATE', 'ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/corporate/dashboard/corporate-dashboard.component').then(m => m.CorporateDashboardComponent) },
      { path: 'products',  loadComponent: () => import('./features/corporate/products/products.component').then(m => m.ProductsComponent) },
      { path: 'orders',    loadComponent: () => import('./features/corporate/orders/orders.component').then(m => m.OrdersComponent) },
    ]
  },

  // Individual
  {
    path: 'shop',
    canActivate: [authGuard],
    children: [
      { path: '',          loadComponent: () => import('./features/individual/shop/shop.component').then(m => m.ShopComponent) },
      { path: 'orders',    loadComponent: () => import('./features/individual/my-orders/my-orders.component').then(m => m.MyOrdersComponent) },
      { path: 'dashboard', loadComponent: () => import('./features/individual/dashboard/individual-dashboard.component').then(m => m.IndividualDashboardComponent) },
    ]
  },

  // Chat
  { path: 'chat', canActivate: [authGuard], loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent) },
  { path: '**', redirectTo: '/login' }
];
