import { inject } from "@angular/core";
import { Routes } from "@angular/router";
import { AuthService } from "./services/auth.service/auth.service";

export const routes: Routes = [
  {
    path: "login",
    loadComponent: () => import("./login/login.component").then((m) => m.LoginComponent)
  },
  {
    path: "home",
    loadComponent: () => import("./home/home.component").then((m) => m.HomeComponent),
    canActivate: [() => inject(AuthService).userHasValidToken()]
  },
  { path: "**", redirectTo: "home" }
];
