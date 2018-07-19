export class Step {
  name: string;
  progress: number;
  progressDates: string[];
  dates: {
    start: string;
    end: string;
  };
  steps: Step[];
  expanded: boolean; // status of expanded
}
