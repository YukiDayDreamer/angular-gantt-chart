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
    },
    public expanded: boolean) { }
}

@Injectable()
export class ChartDatabase {
  moment = moment;
  dataChange = new BehaviorSubject<Step>(null);
  storageKey = 'ChartDate';

  get data(): Step { return this.dataChange.value; }

  constructor(private http: HttpClient) {
    this.initialize();
    this.dataChange.asObservable().subscribe(val => {
      this.saveStorage(val);
    });
  }

  // load local data
  loadStorage() {
    const store = localStorage.getItem(this.storageKey);
    return JSON.parse(store);
  }

  // save local data
  saveStorage(val) {
    localStorage.setItem(this.storageKey, JSON.stringify(val));
  }

  initialize() {
    // Parse the string to json object.
    const store = this.loadStorage();
    if (store) {
      const tree = this.buildTree([store], 0); // build tree
      this.dataChange.next(tree[0]);
    } else {
      this.http.get('../../assets/data/tree.json').subscribe((root: Step) => {
        const tree = this.buildTree([root], 0); // build tree
        this.dataChange.next(tree[0]);
      });
    }
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

      node.expanded = step.expanded !== undefined ? step.expanded : true;

      if (step.steps.length) {
        node.steps = this.buildTree(step.steps, level + 1);
      } else {
        node.steps = [];
      }
      return node;
    });
  }

  /** step manipulations */
  // update step name
  updateStepName(node: Step, name: string) {
    node.name = name;
    // do not update tree, otherwise will interupt the typing
    this.saveStorage(this.data);
    console.log('data updated');
  }

  // add child step
  addChildStep(parent: Step) {
    const child = new Step();
    child.name = 'new step';
    child.progress = 0;
    child.progressDates = [];
    child.dates = parent.dates;
    child.steps = [];
    parent.steps.push(child);
    this.dataChange.next(this.data);
    console.log('data updated');
  }

  // delete step
  deleteStep(parent: Step, child: Step) {
    const childIndex = parent.steps.indexOf(child);
    parent.steps.splice(childIndex, 1);
    this.dataChange.next(this.data);
    console.log('data updated');
  }

  // toggle expanded
  toggleExpaned(node: Step) {
    node.expanded = !node.expanded;
    this.saveStorage(this.data);
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

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap: Map<StepFlatNode, Step> = new Map<StepFlatNode, Step>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap: Map<Step, StepFlatNode> = new Map<Step, StepFlatNode>();

  treeControl: FlatTreeControl<StepFlatNode>;
  treeFlattener: MatTreeFlattener<Step, StepFlatNode>;
  dataSource: MatTreeFlatDataSource<Step, StepFlatNode>;

  chartData;

  sidebarStyle = {};

  constructor(private database: ChartDatabase) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this._getLevel,
      this._isExpandable, this._getChildren);
    this.treeControl = new FlatTreeControl<StepFlatNode>(this._getLevel, this._isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    database.dataChange.subscribe((tree: Step) => {
      if (tree) {
        this.chartData = tree;
        this.dataSource.data = [tree];
        this.dates = this.buildCalendar(tree);

        /** expand tree based on status */
        this.treeControl.dataNodes.forEach(node => {
          if (node.expanded) {
            this.treeControl.expand(node);
          } else {
            this.treeControl.collapse(node);
          }
        });

        console.log(tree);
      }
    });
  }

  /** utils of building tree */
  transformer = (node: Step, level: number) => {
    const flatNode = new StepFlatNode(!!node.steps.length, level, node.name, node.progress, node.progressDates, node.dates, node.expanded);
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  }

  private _getLevel = (node: StepFlatNode) => node.level;

  private _isExpandable = (node: StepFlatNode) => node.expandable;

  private _getChildren = (node: Step): Observable<Step[]> => of(node.steps);

  hasChild = (_: number, _nodeData: StepFlatNode) => _nodeData.expandable;
  /** end of utils of building tree */

  ngOnInit() {
  }

  /** tree nodes manipulations */
  updateStepName(node: StepFlatNode, name: string) {
    const nestedNode = this.flatNodeMap.get(node);
    this.database.updateStepName(nestedNode, name);
  }

  addChildStep(node: StepFlatNode) {
    const nestedNode = this.flatNodeMap.get(node);
    this.database.addChildStep(nestedNode);
  }

  deleteStep(node: StepFlatNode) {
    // if root, ignore
    if (this.treeControl.getLevel(node) < 1) {
      return null;
    }

    const parentFlatNode = this.getParentStep(node);
    const parentNode = this.flatNodeMap.get(parentFlatNode);
    const childNode = this.flatNodeMap.get(node);
    this.database.deleteStep(parentNode, childNode);
  }

  getParentStep(node: StepFlatNode) {
    const { treeControl } = this;
    const currentLevel = treeControl.getLevel(node);
    // if root, ignore
    if (currentLevel < 1) {
      return null;
    }
    const startIndex = treeControl.dataNodes.indexOf(node) - 1;
    // loop back to find the nearest upper node
    for (let i = startIndex; i >= 0; i--) {
      const currentNode = treeControl.dataNodes[i];
      if (treeControl.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
  }

  toggleExpanded(node: StepFlatNode) {
    const nestedNode = this.flatNodeMap.get(node);
    this.database.toggleExpaned(nestedNode);
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
