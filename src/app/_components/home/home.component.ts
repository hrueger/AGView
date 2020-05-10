import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { remote, ipcRenderer, ipcMain, app } from "electron";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
    remote.ipcMain.emit("obs-action", "initialize", "test", "cool");
    /*.on("performanceStatistics", (d) => {
      console.log(d);
    })*/
  }

}
