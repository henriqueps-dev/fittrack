import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Achievement, Calendar, Dashboard, Equipment, Exercise, ExerciseProgress, FinishResponse, MuscleGroup, Overview, Page,
  RangeCode, RecordDto, Session, SessionPayload, SessionSummary, TrainedExercise, User, Workout, WorkoutRequest,
} from '../models/api.models';
import { storage } from '../utils/storage';
import { isNetworkError } from './toast.service';

const API = environment.apiUrl;

/** Executa a chamada e, sem conexao, devolve o ultimo resultado salvo localmente. */
async function withOfflineCache<T>(key: string, call: () => Promise<T>): Promise<T> {
  try {
    const result = await call();
    storage.set(key, result);
    return result;
  } catch (err) {
    const cached = storage.get<T | null>(key, null);
    if (cached != null && isNetworkError(err)) return cached;
    throw err;
  }
}

@Injectable({ providedIn: 'root' })
export class ExerciseApi {
  private readonly http = inject(HttpClient);

  muscleGroups(): Promise<MuscleGroup[]> {
    return withOfflineCache('ft.muscles', () => firstValueFrom(this.http.get<MuscleGroup[]>(`${API}/muscle-groups`)));
  }

  /** Biblioteca completa (filtrada no cliente para resposta instantanea e uso offline). */
  all(): Promise<Exercise[]> {
    return withOfflineCache('ft.exercises', () => firstValueFrom(this.http.get<Exercise[]>(`${API}/exercises`)));
  }

  search(filters: { muscle?: string; equipment?: Equipment; q?: string; favorites?: boolean }): Promise<Exercise[]> {
    let params = new HttpParams();
    if (filters.muscle) params = params.set('muscle', filters.muscle);
    if (filters.equipment) params = params.set('equipment', filters.equipment);
    if (filters.q) params = params.set('q', filters.q);
    if (filters.favorites) params = params.set('favorites', 'true');
    return firstValueFrom(this.http.get<Exercise[]>(`${API}/exercises`, { params }));
  }

  get(id: number): Promise<Exercise> {
    return firstValueFrom(this.http.get<Exercise>(`${API}/exercises/${id}`));
  }

  setFavorite(id: number, favorite: boolean): Promise<{ favorite: boolean }> {
    const url = `${API}/exercises/${id}/favorite`;
    return firstValueFrom(favorite ? this.http.put<{ favorite: boolean }>(url, {}) : this.http.delete<{ favorite: boolean }>(url));
  }
}

@Injectable({ providedIn: 'root' })
export class WorkoutApi {
  private readonly http = inject(HttpClient);

  list(): Promise<Workout[]> {
    return withOfflineCache('ft.workouts', () => firstValueFrom(this.http.get<Workout[]>(`${API}/workouts`)));
  }

  get(id: number): Promise<Workout> {
    return firstValueFrom(this.http.get<Workout>(`${API}/workouts/${id}`));
  }

  create(req: WorkoutRequest): Promise<Workout> {
    return firstValueFrom(this.http.post<Workout>(`${API}/workouts`, req));
  }

  update(id: number, req: WorkoutRequest): Promise<Workout> {
    return firstValueFrom(this.http.put<Workout>(`${API}/workouts/${id}`, req));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API}/workouts/${id}`));
  }

  duplicate(id: number): Promise<Workout> {
    return firstValueFrom(this.http.post<Workout>(`${API}/workouts/${id}/duplicate`, {}));
  }

  reorder(workoutIds: number[]): Promise<Workout[]> {
    return firstValueFrom(this.http.put<Workout[]>(`${API}/workouts/order`, { workoutIds }));
  }

  createSplit(type: 'ABC' | 'ABCD' | 'ABCDE'): Promise<Workout[]> {
    return firstValueFrom(this.http.post<Workout[]>(`${API}/workouts/splits`, { type }));
  }
}

@Injectable({ providedIn: 'root' })
export class SessionApi {
  private readonly http = inject(HttpClient);

  start(workoutId: number, clientId: string): Promise<Session> {
    return firstValueFrom(this.http.post<Session>(`${API}/sessions/start`, { workoutId, clientId }));
  }

  async active(): Promise<Session | null> {
    return (await firstValueFrom(this.http.get<Session | null>(`${API}/sessions/active`))) ?? null;
  }

  progress(payload: SessionPayload): Promise<Session> {
    return firstValueFrom(this.http.put<Session>(`${API}/sessions/progress`, payload));
  }

  finish(payload: SessionPayload): Promise<FinishResponse> {
    return firstValueFrom(this.http.post<FinishResponse>(`${API}/sessions/finish`, payload));
  }

  history(page = 0, size = 20): Promise<Page<SessionSummary>> {
    return firstValueFrom(this.http.get<Page<SessionSummary>>(`${API}/sessions`, { params: { page, size } }));
  }

  get(id: number): Promise<Session> {
    return firstValueFrom(this.http.get<Session>(`${API}/sessions/${id}`));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API}/sessions/${id}`));
  }
}

@Injectable({ providedIn: 'root' })
export class StatsApi {
  private readonly http = inject(HttpClient);

  dashboard(): Promise<Dashboard> {
    return withOfflineCache('ft.dashboard', () => firstValueFrom(this.http.get<Dashboard>(`${API}/dashboard`)));
  }

  overview(range: RangeCode): Promise<Overview> {
    return firstValueFrom(this.http.get<Overview>(`${API}/stats/overview`, { params: { range } }));
  }

  trainedExercises(): Promise<TrainedExercise[]> {
    return firstValueFrom(this.http.get<TrainedExercise[]>(`${API}/stats/exercises`));
  }

  exerciseProgress(id: number, range: RangeCode): Promise<ExerciseProgress> {
    return firstValueFrom(this.http.get<ExerciseProgress>(`${API}/stats/exercises/${id}`, { params: { range } }));
  }

  records(): Promise<RecordDto[]> {
    return firstValueFrom(this.http.get<RecordDto[]>(`${API}/stats/records`));
  }

  calendar(days = 182): Promise<Calendar> {
    return firstValueFrom(this.http.get<Calendar>(`${API}/stats/calendar`, { params: { days } }));
  }

  achievements(): Promise<Achievement[]> {
    return firstValueFrom(this.http.get<Achievement[]>(`${API}/achievements`));
  }
}

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);

  me(): Promise<User> {
    return firstValueFrom(this.http.get<User>(`${API}/users/me`));
  }

  update(body: Partial<User>): Promise<User> {
    return firstValueFrom(this.http.put<User>(`${API}/users/me`, body));
  }

  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${API}/users/me/password`, { currentPassword, newPassword }));
  }

  avatar(dataUrl: string): Promise<User> {
    return firstValueFrom(this.http.put<User>(`${API}/users/me/avatar`, { dataUrl }));
  }

  removeAvatar(): Promise<User> {
    return firstValueFrom(this.http.delete<User>(`${API}/users/me/avatar`));
  }
}
