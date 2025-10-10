import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = 'admin@turbovets.com';
  password = 'admin123';
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/tasks']);
      },
      error: (err) => {
        this.error = 'Invalid email or password';
        this.loading = false;
      }
    });
  }
}