import { Component, output } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: "dash-delete-widget",
  templateUrl: "./delete-widget.component.html",
  styleUrl: "./delete-widget.component.scss",
  imports: [MatButton, MatIcon]
})
export class DeleteWidgetComponent {
  public readonly validateWidgetDeletion = output();
  public readonly cancelWidgetDeletion = output();
}
