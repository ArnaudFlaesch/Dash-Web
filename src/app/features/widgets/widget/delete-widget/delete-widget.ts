import { Component, output } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: "dash-delete-widget",
  templateUrl: "./delete-widget.html",
  styleUrl: "./delete-widget.scss",
  imports: [MatButton, MatIcon]
})
export class DeleteWidget {
  protected readonly labels = {
    confirmDeletion: "Êtes-vous sûr de vouloir supprimer ce widget ?",
    cancel: "Annuler",
    delete: "Supprimer"
  };

  public readonly validateWidgetDeletion = output();
  public readonly cancelWidgetDeletion = output();
}
