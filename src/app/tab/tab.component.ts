import { ITab } from './../model/Tab';
import { Component, Input, OnInit } from '@angular/core';
import { IWidgetConfig } from '../model/IWidgetConfig';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss']
})
export class TabComponent implements OnInit {
  private widgets: IWidgetConfig[] = [];
  @Input() public tab: ITab | undefined = undefined;
  ERROR_MESSAGE_GET_WIDGETS = 'Erreur lors de la récupération des widgets.';
  ERROR_MESSAGE_DELETE_WIDGET = "Erreur lors de la suppression d'un widget.";

  constructor() {}

  ngOnInit(): void {}
}
