import { Component } from '@angular/core';

@Component({
  selector: 'app-abstract-widget',
  template: '<div></div>',
  styleUrls: ['./abstract-widget.component.scss']
})
export abstract class AbstractWidgetComponent {
  constructor() {}
}
