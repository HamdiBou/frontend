import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoading = false;
  activeTab = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  switchTab(index: number): void {
    this.activeTab = index;
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const credentials = this.loginForm.value;

    console.log('Attempting login with:', { username: credentials.username }); // Updated to log username

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login response:', response); // Log the response
        localStorage.setItem('token', response.token); // Store the token in local storage
        this.authService.setCurrentUser(response.user); // Set the current user in the auth service
        this.isLoading = false;
        this.router.navigate(['/dashboard']).catch(err => console.error('Navigation error:', err));
        this.snackBar.open('Login successful!', 'Close', {
          duration: 5000
        });
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.message || 'Login failed';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000
        });
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    const registerData = this.registerForm.value;

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.snackBar.open('Registration successful! Please login.', 'Close', {
          duration: 5000
        });
        this.activeTab = 0; // Switch to login tab
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.message || 'Registration failed';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000
        });
      }
    });
  }
}
