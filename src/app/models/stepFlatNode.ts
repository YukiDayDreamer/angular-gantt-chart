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
