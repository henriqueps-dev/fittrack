import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  {
    path: '',
    canMatch: [guestGuard],
    loadComponent: () => import('./features/auth/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      { path: 'entrar', title: 'Entrar · FITTRACK', loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent) },
      { path: 'cadastro', title: 'Criar conta · FITTRACK', loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent) },
      { path: 'recuperar-senha', title: 'Recuperar senha · FITTRACK', loadComponent: () => import('./features/auth/forgot-password.component').then((m) => m.ForgotPasswordComponent) },
      { path: 'redefinir-senha', title: 'Nova senha · FITTRACK', loadComponent: () => import('./features/auth/reset-password.component').then((m) => m.ResetPasswordComponent) },
    ],
  },
  {
    path: 'treino-ativo',
    title: 'Treino em andamento · FITTRACK',
    canActivate: [authGuard],
    loadComponent: () => import('./features/session/session-runner.component').then((m) => m.SessionRunnerComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', title: 'Início · FITTRACK', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'treinos', title: 'Treinos · FITTRACK', loadComponent: () => import('./features/workouts/workout-list.component').then((m) => m.WorkoutListComponent) },
      { path: 'treinos/novo', title: 'Montar treino · FITTRACK', loadComponent: () => import('./features/workouts/workout-builder.component').then((m) => m.WorkoutBuilderComponent) },
      { path: 'treinos/:id/editar', title: 'Editar treino · FITTRACK', loadComponent: () => import('./features/workouts/workout-builder.component').then((m) => m.WorkoutBuilderComponent) },
      { path: 'exercicios', title: 'Exercícios · FITTRACK', loadComponent: () => import('./features/exercises/exercise-library.component').then((m) => m.ExerciseLibraryComponent) },
      { path: 'exercicios/:id', title: 'Exercício · FITTRACK', loadComponent: () => import('./features/exercises/exercise-detail.component').then((m) => m.ExerciseDetailComponent) },
      { path: 'evolucao', title: 'Evolução · FITTRACK', loadComponent: () => import('./features/progress/progress.component').then((m) => m.ProgressComponent) },
      { path: 'historico', title: 'Histórico · FITTRACK', loadComponent: () => import('./features/history/history-list.component').then((m) => m.HistoryListComponent) },
      { path: 'historico/:id', title: 'Treino realizado · FITTRACK', loadComponent: () => import('./features/history/history-detail.component').then((m) => m.HistoryDetailComponent) },
      { path: 'perfil', title: 'Perfil · FITTRACK', loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
