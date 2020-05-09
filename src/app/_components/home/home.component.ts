import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OBS } from '../../_helpers/obs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  obs: OBS;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.obs = new OBS();
   }

}
