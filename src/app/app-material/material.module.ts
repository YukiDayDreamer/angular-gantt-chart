import { NgModule } from '@angular/core';

import {
  MatButtonModule,
  MatDatepickerModule,
  MatIconModule,
  MatInputModule,
  MatSliderModule,
  MatToolbarModule,
  MatTreeModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

@NgModule({
  exports: [
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    MatInputModule,
    MatSliderModule,
    MatToolbarModule,
    MatTreeModule,
    MatMomentDateModule
  ]
})
export class MaterialModule { }
