import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Task {
  id?: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedToId?: string;
  createdBy?: any;
  assignedTo?: any;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:3333/api/tasks';

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  createTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(id: string, task: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}