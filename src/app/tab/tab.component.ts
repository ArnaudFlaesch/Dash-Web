import { Component, Input } from '@angular/core';
import { ITab } from '../model/Tab';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss']
})
export class TabComponent {
  // private widgets: IWidgetConfig[] = [];
  @Input() public tab: ITab | undefined = undefined;
  private ERROR_MESSAGE_GET_WIDGETS = 'Erreur lors de la récupération des widgets.';
  private ERROR_MESSAGE_DELETE_WIDGET = "Erreur lors de la suppression d'un widget.";
}
