import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { ICellRendererAngularComp } from 'ag-grid-angular';

interface SportRendererParams extends ICellRendererParams {
  value: string;
}

@Component({
  selector: 'app-sport-renderer',
  template: `
    <div>
      <i class="fa-solid fa-person-{{ getIcon() }}"></i>
      <span style="margin-left: 5px;">{{ getValueToDisplay() }}</span>
    </div>
  `,
  standalone: true
})
export class SportRenderer implements ICellRendererAngularComp {
  private params!: SportRendererParams;
  
  private sportIconMap: Record<string, string> = {
    Swimming: 'swimming',
    Gymnastics: 'running',
    Cycling: 'biking',
    'Ski Jumping': 'skiing',
  };

  agInit(params: SportRendererParams): void {
    this.params = params;
  }

  refresh(): boolean {
    return false;
  }

  getIcon(): string {
    return this.sportIconMap[this.params.value] || '';
  }

  getValueToDisplay(): string {
    return this.params.valueFormatted || this.params.value;
  }
}