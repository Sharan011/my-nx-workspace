import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';

interface Task {
  id?: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdBy?: any;
  assignedTo?: any;
  createdAt?: string;
}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  showCreateForm = false;
  currentUser: any = null;
  
  newTask: Partial<Task> = {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium'
  };

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
      }
    });
  }

  createTask() {
    if (this.newTask.title && this.newTask.description) {
      this.taskService.createTask(this.newTask).subscribe({
        next: () => {
          this.loadTasks();
          this.showCreateForm = false;
          this.newTask = { title: '', description: '', status: 'todo', priority: 'medium' };
        },
        error: (err) => {
          console.error('Error creating task:', err);
        }
      });
    }
  }

  updateStatus(task: Task, newStatus: string) {
    if (task.id) {
      this.taskService.updateTask(task.id, { status: newStatus as any }).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (err) => {
          console.error('Error updating task:', err);
        }
      });
    }
  }

  deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (err) => {
          console.error('Error deleting task:', err);
        }
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  canDelete(): boolean {
    return this.currentUser?.role === 'super_admin' || this.currentUser?.role === 'org_admin';
  }

  canEdit(): boolean {
    return this.currentUser?.role !== 'member';
  }
}