import { Component, output } from "@angular/core";
import { MatButton } from "@angular/material/button";

@Component({
  selector: "dash-delete-widget",
  templateUrl: "./delete-widget.component.html",
  styleUrl: "./delete-widget.component.scss",
  imports: [MatButton]
})
export class DeleteWidgetComponent {
  public readonly validateWidgetDeletion = output();
  public readonly cancelWidgetDeletion = output();
}
