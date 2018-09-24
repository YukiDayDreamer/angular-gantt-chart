import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as Moment from 'moment';
import { Step } from '../models/step';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  moment = Moment;
  search = '';
  charts: Array<Step>;
  storageKey = 'charts';

  constructor(private router: Router) { }

  ngOnInit() {
    const store = localStorage.getItem('charts');
    this.charts = store === undefined ? [] : JSON.parse(store);
    // format dates
    this.charts.forEach((chart) => {
      chart.dates.start = this.moment(chart.dates.start).format('MM/DD');
      chart.dates.end = this.moment(chart.dates.end).format('MM/DD');
    });
  }

  createChart() {
    const start = this.moment().format('YYYY-MM-DD');
    const end = this.moment().add(7, 'days').format('YYYY-MM-DD');
    const chart = {
      'name': 'New Project',
      'progress': 0,
      'dates': {
        'start': start,
        'end': end,
      },
      'steps': []
    } as Step;
    this.charts.push(chart);
    this.router.navigate(['charts', this.charts.indexOf(chart)]); // navigate to new chart
  }

  deleteChart(i: number) {
    if (confirm('Delete this chart?')) {
      const charts = JSON.parse(localStorage.getItem(this.storageKey));
      charts.splice(i, 1); // remove specific chart from array
      localStorage.setItem(this.storageKey, JSON.stringify(charts)); // save to storage
      this.charts.splice(i, 1); // udpate chart display
    }
  }

}
