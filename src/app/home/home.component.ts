import { Component, OnInit, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ResizeEvent } from 'angular-resizable-element';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { BehaviorSubject, Observable, of } from 'rxjs';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
const moment = extendMoment(Moment);

import { Step } from '../models/step';

import * as Utils from '../utils';

/** Flat node with expandable and level information */
export class StepFlatNode {
  constructor(
    public expandable: boolean, public level: number,
    public name: string, public progress: number,
    public progressDates: string[],
    public dates: {
      start: string;
      end: string;
    }) { }
}

@Injectable()
export class ChartDatabase {
  moment = moment;
  dataChange = new BehaviorSubject<Step>(null);

  constructor(private http: HttpClient) {
    this.initialize();
  }

  initialize() {
    // Parse the string to json object.
    this.http.get('../../assets/data/tree.json').subscribe((root: Step) => {
      const tree = this.buildTree(root.steps, 0); // build tree
      root.steps = tree;
      this.dataChange.next(root);
    });
  }

  buildTree(steps: Array<any>, level: number): Step[] {
    return steps.map((step: Step) => {
      const node = new Step();
      node.name = step.name;
      node.progress = step.progress;
      node.dates = step.dates;
      // build progress dates
      const start = this.moment(step.dates.start);
      const end = this.moment(step.dates.end);
      const range = moment.range(start, end);

      const numDays = Math.round(range.diff('days') * node.progress / 100); // estimated completed days
      const totalDays = Array.from(range.by('days')).map(d => d.format('YYYY-MM-DD')); // all days in string array
      node.progressDates = totalDays.splice(0, numDays); // start from 0, get the first len days

      if (step.steps.length) {
        node.steps = this.buildTree(step.steps, level + 1);
      } else {
        node.steps = [];
      }
      return node;
    });
  }

}

/**
 * @title Tree with nested nodes
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [ChartDatabase]
})
export class HomeComponent implements OnInit {
  moment = moment;
  dates: string[] = []; // all days in chart

  utils = Utils;

  treeControl: FlatTreeControl<StepFlatNode>;
  treeFlattener: MatTreeFlattener<Step, StepFlatNode>;
  dataSource: MatTreeFlatDataSource<Step, StepFlatNode>;

  chartData;

  sidebarStyle = {};

  constructor(database: ChartDatabase) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this._getLevel,
      this._isExpandable, this._getChildren);
    this.treeControl = new FlatTreeControl<StepFlatNode>(this._getLevel, this._isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    database.dataChange.subscribe((root: Step) => {
      if (root) {
        this.chartData = root;
        this.dataSource.data = root.steps;
        this.dates = this.buildCalendar(root);
        console.log(root);
      }
    });
  }

  /** utils of building tree */
  transformer = (node: Step, level: number) => {
    return new StepFlatNode(!!node.steps.length, level, node.name, node.progress, node.progressDates, node.dates);
  }

  private _getLevel = (node: StepFlatNode) => node.level;

  private _isExpandable = (node: StepFlatNode) => node.expandable;

  private _getChildren = (node: Step): Observable<Step[]> => of(node.steps);

  hasChild = (_: number, _nodeData: StepFlatNode) => _nodeData.expandable;
  /** end of utils of building tree */

  ngOnInit() {
  }

  /** resize and validate */
  validate(event: ResizeEvent): boolean {
    const MIN_DIMENSIONS_PX = 200;
    if (
      event.rectangle.width &&
      (event.rectangle.width < MIN_DIMENSIONS_PX)
    ) {
      return false;
    }
    return true;
  }

  onResizeEnd(event: ResizeEvent): void {
    this.sidebarStyle = {
      'width': `${event.rectangle.width}px`
    };
  }

  buildCalendar(step: Step) {
    const start = this.moment(step.dates.start);
    const end = this.moment(step.dates.end);
    const range = this.moment.range(start, end);

    const days = Array.from(range.by('days'));
    return days.map(d => d.format('YYYY-MM-DD'));
  }

}
