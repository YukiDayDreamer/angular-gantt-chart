import { Routes } from '@angular/router';
import { HomeComponent } from '../home/home.component';
import { ChartComponent } from '../chart/chart.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' }, // default path
  { path: 'home', component: HomeComponent },
  { path: 'charts/:id', component: ChartComponent }
];
