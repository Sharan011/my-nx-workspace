import { Route } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'tasks', component: TaskListComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];