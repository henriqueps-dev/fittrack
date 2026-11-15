// Tipos espelhando os DTOs da API Spring Boot.

export type Equipment = 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'CABLE' | 'BODYWEIGHT' | 'KETTLEBELL' | 'SMITH';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type TrainingGoal = 'HYPERTROPHY' | 'STRENGTH' | 'FAT_LOSS' | 'ENDURANCE' | 'HEALTH';
export type RecordType = 'MAX_WEIGHT' | 'EST_1RM' | 'MAX_REPS';
export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED';
export type MuscleSlug =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms'
  | 'abs' | 'quads' | 'hamstrings' | 'glutes' | 'calves';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  goal?: TrainingGoal;
  experienceLevel: Difficulty;
  weeklyGoal: number;
  defaultRestSeconds: number;
  createdAt: string;
}

export interface AuthResponse { token: string; expiresIn: number; user: User; }
export interface ForgotPasswordResponse { message: string; resetToken?: string; }

export interface MuscleRef { slug: MuscleSlug; name: string; }
export interface MuscleGroup { id: number; slug: MuscleSlug; name: string; region: 'FRONT' | 'BACK'; exerciseCount: number; }

export interface ExerciseSummary {
  id: number; slug: string; name: string; movement: string; equipment: Equipment; primaryMuscle: MuscleRef;
}

export interface Exercise extends ExerciseSummary {
  secondaryMuscles: MuscleRef[];
  difficulty: Difficulty;
  description: string;
  instructions: string[];
  favorite: boolean;
}

export interface SetSnapshot { setNumber: number; weightKg: number; reps: number; }

export interface WorkoutExercise {
  id: number;
  exercise: ExerciseSummary;
  position: number;
  sets: number;
  reps: number;
  restSeconds: number;
  notes?: string;
  lastSets: SetSnapshot[];
  lastPerformedAt?: string;
}

export interface Workout {
  id: number;
  name: string;
  description?: string;
  letter?: string;
  position: number;
  muscleGroups: string[];
  estimatedMinutes: number;
  exercises: WorkoutExercise[];
  updatedAt: string;
  lastPerformedAt?: string;
}

export interface WorkoutExerciseRequest { exerciseId: number; sets: number; reps: number; restSeconds: number; notes?: string | null; }
export interface WorkoutRequest { name: string; description?: string | null; letter?: string | null; exercises: WorkoutExerciseRequest[]; }

export interface SetDto { setNumber: number; weightKg: number; reps: number; completed: boolean; completedAt?: string; }

export interface SessionExercise {
  exercise: ExerciseSummary;
  order: number;
  plannedReps: number;
  restSeconds: number;
  skipped: boolean;
  sets: SetDto[];
  previous: SetSnapshot[];
  previousDate?: string;
}

export interface Comparison {
  previousSessionId: number;
  previousDate: string;
  previousVolume: number;
  volumeDelta: number;
  previousDurationSeconds: number;
  previousCompletedSets: number;
}

export interface Session {
  id?: number;
  clientId: string;
  workoutId?: number;
  workoutName: string;
  status: SessionStatus;
  startedAt: string;
  finishedAt?: string;
  durationSeconds: number;
  totalVolume: number;
  totalReps: number;
  completedSets: number;
  notes?: string;
  exercises: SessionExercise[];
  comparison?: Comparison;
}

export interface SetPayload { setNumber: number; weightKg: number; reps: number; completed: boolean; completedAt?: string | null; }
export interface SessionExercisePayload {
  exerciseId: number; order: number; plannedReps: number; restSeconds: number; skipped: boolean; sets: SetPayload[];
}
export interface SessionPayload {
  clientId: string; workoutId?: number | null; workoutName: string; startedAt: string; finishedAt?: string | null;
  notes?: string | null; exercises: SessionExercisePayload[];
}

export interface RecordDto {
  id: number; exercise: ExerciseSummary; type: RecordType; value: number; weightKg: number; reps: number;
  achievedAt: string; sessionId?: number;
}

export interface FinishResponse { session: Session; newRecords: RecordDto[]; }

export interface SessionSummary {
  id: number; workoutId?: number; workoutName: string; startedAt: string; finishedAt: string; durationSeconds: number;
  totalVolume: number; totalReps: number; completedSets: number; exerciseNames: string[];
}

export interface Page<T> { content: T[]; page: { size: number; number: number; totalElements: number; totalPages: number; }; }

export interface DayPoint { date: string; volume: number; sessions: number; durationSeconds: number; }
export interface WeekPoint { weekStart: string; sessions: number; volume: number; }

export interface NextWorkout { id: number; name: string; letter?: string; exerciseCount: number; estimatedMinutes: number; muscleGroups: string[]; }

export interface Dashboard {
  userName: string; weeklyGoal: number; weekSessions: number; weekDurationSeconds: number; weekVolume: number;
  weekSets: number; streakWeeks: number; totalSessions: number; lastSession?: SessionSummary;
  nextWorkout?: NextWorkout; week: DayPoint[]; hasActiveSession: boolean;
}

export type RangeCode = '7d' | '30d' | '3m' | '6m' | 'all';

export interface Overview {
  range: RangeCode; sessions: number; durationSeconds: number; volume: number; reps: number; sets: number;
  avgVolumePerSession: number; avgDurationSeconds: number; sessionsPerWeek: number; weekly: WeekPoint[];
  sessionsSeries: { sessionId: number; date: string; workoutName: string; volume: number; durationSeconds: number; sets: number }[];
  muscleShare: { slug: MuscleSlug; name: string; sets: number; volume: number }[];
}

export interface ProgressPoint { sessionId: number; date: string; maxWeight: number; estimated1Rm: number; volume: number; bestReps: number; sets: number; }

export interface ExerciseProgress {
  exercise: ExerciseSummary; range: RangeCode; points: ProgressPoint[]; bestWeight: number; bestEstimated1Rm: number;
  weightChange: number; records: RecordDto[];
}

export interface TrainedExercise { id: number; name: string; muscle: string; sessions: number; lastPerformedAt: string; }
export interface Calendar { from: string; to: string; days: DayPoint[]; }

export interface Achievement {
  code: string; title: string; description: string; icon: string; unlocked: boolean; progress: number; progressLabel: string;
}

export interface ApiError { status: number; detail: string; errors?: Record<string, string>; }
